// Authentication Routes (관계형 DB 버전)

import { Hono } from "npm:hono";
import * as bcrypt from "npm:bcryptjs";
import { db } from "../db.tsx";
import { 
  LoginRequest, 
  SignupRequest, 
  KakaoLoginRequest,
} from "../types/index.tsx";

const auth = new Hono();

// Sign up
auth.post("/signup", async (c) => {
  try {
    const { email, password, name, studentId }: SignupRequest = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // 이메일 중복 체크 (관계형 DB)
    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', email)
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
        email,
        password_hash: passwordHash,
        name,
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

    console.log("✅ User signed up:", { id: user.id, email, name });

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
    return c.json({ success: false, error: "Signup failed: " + error.message }, 500);
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
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

    const { error: tokenError } = await db
      .from('auth_tokens')
      .insert({
        user_id: user.id,
        token,
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
    return c.json({ success: false, error: "Login failed: " + error.message }, 500);
  }
});

// Kakao OAuth login
auth.post("/kakao", async (c) => {
  try {
    const { kakaoId, email, name, profileImage }: KakaoLoginRequest = await c.req.json();

    if (!kakaoId) {
      return c.json({ success: false, error: "Missing kakaoId" }, 400);
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
          name: name || "Kakao User",
          provider: 'kakao',
          provider_id: kakaoId,
          profile_image: profileImage || null,
          role: 'user',
        })
        .select('id, email, name, profile_image, student_id, role, provider')
        .single();

      if (insertError || !newUser) {
        console.error("Kakao user creation error:", insertError);
        return c.json({ success: false, error: "Failed to create user" }, 500);
      }

      user = newUser;
      console.log("✅ Created new kakao user:", { userId: user.id, kakaoId, email });
    } else {
      console.log("✅ Existing kakao user logged in:", { userId: user.id, kakaoId });
    }

    // 토큰 생성
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

    const { error: tokenError } = await db
      .from('auth_tokens')
      .insert({
        user_id: user.id,
        token,
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
    return c.json({ success: false, error: "Kakao login failed: " + error.message }, 500);
  }
});

// Logout
auth.post("/logout", async (c) => {
  try {
    const token = c.req.header('X-Auth-Token');
    
    if (token) {
      // 토큰 삭제 (관계형 DB)
      await db
        .from('auth_tokens')
        .delete()
        .eq('token', token);
    }

    console.log("✅ User logged out");

    return c.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("❌ Logout error:", error);
    return c.json({ success: false, error: "Logout failed: " + error.message }, 500);
  }
});

export default auth;
