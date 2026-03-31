// Authentication Middleware

import { Context } from "npm:hono";
import { db } from "../db.tsx";

export async function requireAuth(c: Context, next: () => Promise<void>) {
  const authToken = c.req.header('X-Auth-Token');
  
  if (!authToken) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  // 토큰 조회 (관계형 DB)
  const { data: tokenData, error } = await db
    .from('auth_tokens')
    .select('user_id, expires_at')
    .eq('token', authToken)
    .single();
  
  if (error || !tokenData) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  // 토큰 만료 체크
  if (new Date(tokenData.expires_at) < new Date()) {
    return c.json({ error: 'Unauthorized: Token expired' }, 401);
  }

  // Attach user info to context
  c.set('userId', tokenData.user_id);
  
  await next();
}

export async function requireDriver(c: Context, next: () => Promise<void>) {
  const authToken = c.req.header('X-Auth-Token');

  if (!authToken) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const { data: tokenData, error: tokenError } = await db
    .from('auth_tokens')
    .select('user_id, expires_at')
    .eq('token', authToken)
    .single();

  if (tokenError || !tokenData) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return c.json({ error: 'Unauthorized: Token expired' }, 401);
  }

  const { data: user, error: userError } = await db
    .from('users')
    .select('id, email, role')
    .eq('id', tokenData.user_id)
    .single();

  if (userError || !user || (user.role !== 'driver' && user.role !== 'admin')) {
    return c.json({ error: 'Forbidden: Driver access required' }, 403);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email);
  c.set('userRole', user.role);

  await next();
}

export async function requireAdmin(c: Context, next: () => Promise<void>) {
  const authToken = c.req.header('X-Auth-Token');
  
  if (!authToken) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  // 토큰 조회 (관계형 DB)
  const { data: tokenData, error: tokenError } = await db
    .from('auth_tokens')
    .select('user_id, expires_at')
    .eq('token', authToken)
    .single();
  
  if (tokenError || !tokenData) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  // 토큰 만료 체크
  if (new Date(tokenData.expires_at) < new Date()) {
    return c.json({ error: 'Unauthorized: Token expired' }, 401);
  }

  // 사용자 정보 조회 (관계형 DB)
  const { data: user, error: userError } = await db
    .from('users')
    .select('id, email, role')
    .eq('id', tokenData.user_id)
    .single();
  
  if (userError || !user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }

  // Attach user info to context
  c.set('userId', user.id);
  c.set('userEmail', user.email);
  c.set('userRole', user.role);
  
  await next();
}