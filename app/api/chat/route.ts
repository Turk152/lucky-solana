import { database, json, sameOrigin } from "@/lib/server";
async function identity(request: Request) {
 const match=request.headers.get("cookie")?.match(/(?:^|;\s*)lucky_guest=([a-f0-9-]{36})(?:;|$)/i);
 const session=match?.[1]??crypto.randomUUID();
 const user=request.headers.get("oai-authenticated-user-id");
 const key=user?`user:${user}`:`ip:${request.headers.get("cf-connecting-ip")??session}`;
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key));
 const actor=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 return {actor,nickname:`Guest ${actor.slice(0,4)}`,cookie:match?{} as Record<string,string>:{"Set-Cookie":`lucky_guest=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${new URL(request.url).protocol==="https:"?"; Secure":""}`}};
}
export async function GET(request:Request) {
 try{const who=await identity(request);const {results}=await database().prepare("SELECT id,nickname,body,created_at AS createdAt FROM messages ORDER BY id DESC LIMIT 80").all();return json({messages:results.reverse(),nickname:who.nickname},200,who.cookie);}
 catch(e){console.error("Chat read failed",e);return json({error:"The lounge is reconnecting. Please try again shortly."},503);}
}
export async function POST(request:Request) {
 if(!sameOrigin(request))return json({error:"Please send messages from this site."},403);
 if(Number(request.headers.get("content-length")??0)>4096)return json({error:"Message too long."},413);
 try{
  const raw=await request.text();if(raw.length>4096)return json({error:"Message too long."},413);
  let data;try{data=JSON.parse(raw);}catch{return json({error:"Invalid message."},400);}
  const body=typeof data.body==="string"?data.body.trim():"";
  if(!body || body.length>280)return json({error:"Use 1–280 characters."},400);
  const who=await identity(request),now=Date.now();
  const result=await database().prepare("INSERT INTO messages(actor,nickname,body,created_at) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM messages WHERE actor=? AND created_at>?)").bind(who.actor,who.nickname,body,now,who.actor,now-4000).run();
  if(!result.meta.changes)return json({error:"Give the lounge a moment. Try again in 4 seconds."},429,who.cookie);
  return json({ok:true},201,who.cookie);
 }catch(e){console.error("Chat send failed",e);return json({error:"Your message was not sent. Please try again."},503);}
}

