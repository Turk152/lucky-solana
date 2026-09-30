import {database,json,sameOrigin} from "@/lib/server";
import {walletIdentity} from "@/lib/wallet-identity";
import {validAddress} from "@/lib/solana";
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:"Use this site's wallet connection."},403);
 try{const raw=await request.text();if(raw.length>256)return json({error:"Invalid wallet address."},400);let data;try{data=JSON.parse(raw);}catch{return json({error:"Invalid wallet address."},400);}
 if(!data||typeof data.address!=="string"||!validAddress(data.address))return json({error:"Invalid wallet address."},400);
 const who=await walletIdentity(request),db=database(),now=Date.now();
 const recent=await db.prepare("SELECT issued_at FROM wallet_challenges WHERE viewer_id=? ORDER BY issued_at DESC LIMIT 1").bind(who.viewerId).first<{issued_at:number}>();if(recent&&recent.issued_at>now-2000)return json({error:"Wait a moment before linking another wallet."},429,who.headers);
 const id=crypto.randomUUID(),expiresAt=now+300000;
 const message=`Link this Solana wallet to your LUCKY position.\n\nSite: ${new URL(request.url).origin}\nWallet: ${data.address}\nRequest: ${id}\nIssued: ${new Date(now).toISOString()}\nExpires: ${new Date(expiresAt).toISOString()}\n\nThis only proves wallet ownership. It does not authorize a transaction, transfer, token approval, or payment.`;
 await db.prepare("INSERT INTO wallet_challenges(id,viewer_id,address,message,issued_at,expires_at,consumed_at) VALUES(?,?,?,?,?,?,NULL) ON CONFLICT(viewer_id,address) DO UPDATE SET id=excluded.id,message=excluded.message,issued_at=excluded.issued_at,expires_at=excluded.expires_at,consumed_at=NULL").bind(id,who.viewerId,data.address,message,now,expiresAt).run();
 return json({challengeId:id,message,expiresAt},200,who.headers);
 }catch(e){console.error("Wallet challenge failed",e);return json({error:"Could not start wallet verification. Please retry."},503);}
}
