// Authentication Middleware

import { Context } from "npm:hono";
import { db } from "../db.tsx";
import { findTokenRecord } from "../security/tokens.ts";

export async function getOptionalUser(c: Context) {
  const authToken = c.req.header('X-Auth-Token');
  if (!authToken) return null;

  const { data: tokenData, error: tokenError } = await findTokenRecord(authToken);
  if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) return null;

  const { data: user, error: userError } = await db
    .from('users')
    .select('id, email, role')
    .eq('id', tokenData.user_id)
    .maybeSingle();

  return userError ? null : user;
}

export async function requireAuth(c: Context, next: () => Promise<void>) {
  const authToken = c.req.header('X-Auth-Token');
  
  if (!authToken) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const { data: tokenData, error } = await findTokenRecord(authToken);
  
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

  const { data: tokenData, error: tokenError } = await findTokenRecord(authToken);

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

  if (userError || !user || !['driver', 'admin'].includes(user.role)) {
    return c.json({ error: 'Forbidden: Driver or Admin access required' }, 403);
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

  const { data: tokenData, error: tokenError } = await findTokenRecord(authToken);
  
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
