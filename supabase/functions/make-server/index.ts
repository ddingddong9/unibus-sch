// @ts-nocheck: Deno types are global in Supabase Edge Functions
/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import auth from "./routes/auth.tsx";
import buses from "./routes/buses.tsx";
import notices from "./routes/notices.tsx";
import routes from "./routes/routes.tsx";
import driver from "./routes/driver.tsx";
import users from "./routes/users.tsx";
import campus from "./routes/campus.tsx";
import notifications from "./routes/notifications.tsx";
import reports from "./routes/reports.tsx";
import demo from "./routes/demo.tsx";

const app = new Hono();

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/unibus-sch(?:-[a-z0-9-]+)?\.vercel\.app$/,
  /^https:\/\/unibus-sch-git-[a-z0-9-]+-ddingddong9s-projects\.vercel\.app$/,
];

const resolveAllowedOrigin = (origin: string) => {
  if (!origin) return "";
  if (configuredOrigins.includes(origin)) return origin;
  if (allowedOriginPatterns.some((pattern) => pattern.test(origin))) return origin;
  return "";
};

app.use('*', cors({
  origin: resolveAllowedOrigin,
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-auth-token'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Production: Kong strips the /functions/v1/make-server prefix before forwarding
app.route('/auth', auth);
app.route('/buses', buses);
app.route('/notices', notices);
app.route('/routes', routes);
app.route('/driver', driver);
app.route('/users', users);
app.route('/campus', campus);
app.route('/notifications', notifications);
app.route('/reports', reports);
app.route('/demo', demo);

// Local dev: Kong strips /functions/v1 but keeps /make-server, so Hono
// receives paths like /make-server/auth/signup instead of just /auth/signup
const DEV_PREFIX = '/make-server';
app.route(`${DEV_PREFIX}/auth`, auth);
app.route(`${DEV_PREFIX}/buses`, buses);
app.route(`${DEV_PREFIX}/notices`, notices);
app.route(`${DEV_PREFIX}/routes`, routes);
app.route(`${DEV_PREFIX}/driver`, driver);
app.route(`${DEV_PREFIX}/users`, users);
app.route(`${DEV_PREFIX}/campus`, campus);
app.route(`${DEV_PREFIX}/notifications`, notifications);
app.route(`${DEV_PREFIX}/reports`, reports);
app.route(`${DEV_PREFIX}/demo`, demo);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

Deno.serve(app.fetch);
