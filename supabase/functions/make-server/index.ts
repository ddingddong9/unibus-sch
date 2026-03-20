// @ts-nocheck: Deno types are global in Supabase Edge Functions
/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import auth from "./routes/auth.tsx";
import buses from "./routes/buses.tsx";
import notices from "./routes/notices.tsx";
import routes from "./routes/routes.tsx";

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-auth-token'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.route('/auth', auth);
app.route('/buses', buses);
app.route('/notices', notices);
app.route('/routes', routes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

Deno.serve(app.fetch);
