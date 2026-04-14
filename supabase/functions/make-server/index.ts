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

const app = new Hono();

app.use('*', cors({
  origin: '*',
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

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

Deno.serve(app.fetch);
