export async function walletIdentity(request:Request){
 const existing=request.headers.get("cookie")?.match(/(?:^|;\s*)lucky_viewer=([a-f0-9-]{36})(?:;|$)/i)?.[1];
 const session=existing??crypto.randomUUID();
 const user=request.headers.get("oai-authenticated-user-id");
 // Platform identity, or an unguessable HttpOnly browser session. Never group wallets by IP.
 const identity=user?`lucky:user:${user}`:`lucky:session:${session}`;
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(identity));
 const viewerId=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 const headers:Record<string,string>={};
 if(!existing)headers["Set-Cookie"]=`lucky_viewer=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(request.url).protocol==="https:"?"; Secure":""}`;
 return {viewerId,headers};
}
