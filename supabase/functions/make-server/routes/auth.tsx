// Authentication Routes (관계형 DB 버전)

import { Hono } from "npm:hono";
import * as bcrypt from "npm:bcryptjs";
import { db } from "../db.tsx";
import { 
  LoginRequest, 
  SignupRequest, 
  KakaoLoginRequest,
} from "../types/index.tsx";
import { createSessionToken, deleteTokenRecord, hashSessionToken } from "../security/tokens.ts";

const auth = new Hono();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

// Sign up
auth.post("/signup", async (c) => {
  try {
    const { email, password, name, studentId }: SignupRequest = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return c.json({ success: false, error: "Invalid email format" }, 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return c.json({
        success: false,
        error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`,
      }, 400);
    }

    // 이메일 중복 체크 (관계형 DB)
    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    
    if (existingUser) {
      return c.json({ success: false, error: "User already exists" }, 400);
    }

    // 비밀번호 해싱 (bcrypt)
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성 (관계형 DB)
    const { data: user, error: insertError } = await db
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        name: trimmedName,
        student_id: studentId || null,
        role: 'user',
        provider: 'local',
      })
      .select('id, email, name, student_id, role')
      .single();

    if (insertError || !user) {
      console.error("User creation error:", insertError);
      return c.json({ success: false, error: "Failed to create user" }, 500);
    }

    console.log("✅ User signed up:", { id: user.id, email: normalizedEmail, name: trimmedName });

    return c.json({ 
      success: true, 
      data: { 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          studentId: user.student_id, 
          role: user.role 
        } 
      }
    });
  } catch (error: any) {
    console.error("❌ Signup error:", error);
    return c.json({ success: false, error: "Signup failed" }, 500);
  }
});

// Login
auth.post("/login", async (c) => {
  try {
    const { email, password }: LoginRequest = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: "Missing email or password" }, 400);
    }

    // 사용자 조회 (관계형 DB)
    const { data: user, error } = await db
      .from('users')
      .select('id, email, password_hash, name, student_id, role, provider')
      .eq('email', email)
      .single();

    if (error || !user) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    // 로컬 계정이 아닌 경우
    if (user.provider !== 'local') {
      return c.json({ 
        success: false, 
        error: `Please login with ${user.provider}` 
      }, 401);
    }

    // 비밀번호 검증 (bcrypt)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    
    if (!isPasswordValid) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    // 토큰 생성 (관계형 DB)
    const token = createSessionToken();
    const tokenHash = await hashSessionToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

    const { error: tokenError } = await db
      .from('auth_tokens')
      .insert({
        user_id: user.id,
        token: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      return c.json({ success: false, error: "Failed to create token" }, 500);
    }

    console.log("✅ User logged in:", { email, userId: user.id });

    return c.json({ 
      success: true, 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        studentId: user.student_id, 
        role: user.role 
      }
    });
  } catch (error: any) {
    console.error("❌ Login error:", error);
    return c.json({ success: false, error: "Login failed" }, 500);
  }
});

// Kakao OAuth login
auth.post("/kakao", async (c) => {
  try {
    const { accessToken }: KakaoLoginRequest = await c.req.json();

    if (!accessToken) {
      return c.json({ success: false, error: "Missing Kakao access token" }, 400);
    }

    const kakaoResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!kakaoResponse.ok) {
      return c.json({ success: false, error: "Invalid Kakao token" }, 401);
    }

    const kakaoProfile = await kakaoResponse.json();
    const kakaoId = String(kakaoProfile.id || "");
    const kakaoAccount = kakaoProfile.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    const email = kakaoAccount.email || undefined;
    const name = profile.nickname || "Kakao User";
    const profileImage = profile.profile_image_url || null;

    if (!kakaoId) {
      return c.json({ success: false, error: "Invalid Kakao profile" }, 401);
    }

    // 카카오 ID로 사용자 조회 (관계형 DB)
    const { data: existingUser } = await db
      .from('users')
      .select('id, email, name, profile_image, student_id, role, provider')
      .eq('provider', 'kakao')
      .eq('provider_id', kakaoId)
      .single();
    
    let user = existingUser;

    if (!user) {
      // 새로운 카카오 사용자 생성
      const { data: newUser, error: insertError } = await db
        .from('users')
        .insert({
          email: email || `kakao_${kakaoId}@kakao.local`,
          name,
          provider: 'kakao',
          provider_id: kakaoId,
          profile_image: profileImage,
          role: 'user',
        })
        .select('id, email, name, profile_image, student_id, role, provider')
        .single();

      if (insertError || !newUser) {
        console.error("Kakao user creation error:", insertError);
        return c.json({ success: false, error: "Failed to create user" }, 500);
      }

      user = newUser;
      console.log("✅ Created new kakao user:", { userId: user.id, kakaoId });
    } else {
      console.log("✅ Existing kakao user logged in:", { userId: user.id, kakaoId });
    }

    // 토큰 생성
    const token = createSessionToken();
    const tokenHash = await hashSessionToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

    const { error: tokenError } = await db
      .from('auth_tokens')
      .insert({
        user_id: user.id,
        token: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      return c.json({ success: false, error: "Failed to create token" }, 500);
    }

    return c.json({ 
      success: true, 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        profileImage: user.profile_image,
        studentId: user.student_id, 
        role: user.role,
        provider: user.provider
      }
    });
  } catch (error: any) {
    console.error("❌ Kakao login error:", error);
    return c.json({ success: false, error: "Kakao login failed" }, 500);
  }
});

// Logout
auth.post("/logout", async (c) => {
  try {
    const token = c.req.header('X-Auth-Token');
    
    if (token) {
      await deleteTokenRecord(token);
    }

    console.log("✅ User logged out");

    return c.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("❌ Logout error:", error);
    return c.json({ success: false, error: "Logout failed" }, 500);
  }
});

export default auth;
