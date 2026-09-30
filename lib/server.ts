import { env } from "cloudflare:workers";
export function database(): D1Database {
 if (!env.DB) throw new Error("Chat storage is unavailable");
 return env.DB;
}
export function json(value: unknown, status = 200, extra: Record<string,string> = {}) {
 return Response.json(value, {status, headers:{"Cache-Control":"no-store",...extra}});
}
export function sameOrigin(request: Request) {
 const origin = request.headers.get("origin");
 return !!origin && origin === new URL(request.url).origin;
}
