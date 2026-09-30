import {database,json,sameOrigin} from "@/lib/server";
import {walletIdentity} from "@/lib/wallet-identity";
import {validAddress} from "@/lib/solana";
import {verifyWalletProof} from "@/lib/wallet-proof";
export async function GET(request:Request){try{const who=await walletIdentity(request);const {results}=await database().prepare("SELECT address,created_at AS createdAt FROM linked_wallets WHERE viewer_id=? ORDER BY created_at").bind(who.viewerId).all();return json({wallets:results},200,who.headers);}catch(e){console.error("Wallet list failed",e);return json({error:"Your wallet list is temporarily unavailable."},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:"Use this site's wallet connection."},403);
 try{
  const raw=await request.text();if(raw.length>2048)return json({error:"Invalid wallet proof."},400);
  let data;try{data=JSON.parse(raw);}catch{return json({error:"Invalid wallet proof."},400);}
  if(!data||typeof data.address!=="string"||!validAddress(data.address)||typeof data.challengeId!=="string"||typeof data.signature!=="string")return json({error:"Invalid wallet proof."},400);
  const who=await walletIdentity(request);const db=database();
  const challenge=await db.prepare("SELECT message,expires_at,consumed_at FROM wallet_challenges WHERE id=? AND viewer_id=? AND address=?").bind(data.challengeId,who.viewerId,data.address).first<{message:string;expires_at:number;consumed_at:number|null}>();
  if(!challenge||challenge.expires_at<Date.now()||challenge.consumed_at!==null)return json({error:"That link request expired or was already used. Try again."},409,who.headers);
  if(!await verifyWalletProof(data.address,challenge.message,data.signature))return json({error:"The signature does not match this wallet."},401,who.headers);
  const now=Date.now();
  const results=await db.batch([
   db.prepare("INSERT OR IGNORE INTO linked_wallets(viewer_id,address,created_at) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM wallet_challenges WHERE id=? AND viewer_id=? AND address=? AND consumed_at IS NULL AND expires_at>=?) AND (SELECT count(*) FROM linked_wallets WHERE viewer_id=?)<50").bind(who.viewerId,data.address,now,data.challengeId,who.viewerId,data.address,now,who.viewerId),
   db.prepare("UPDATE wallet_challenges SET consumed_at=? WHERE id=? AND viewer_id=? AND consumed_at IS NULL").bind(now,data.challengeId,who.viewerId),
  ]);
  if(!results[0].meta.changes)return json({error:"This wallet is already linked, the request was used, or the 50-wallet limit was reached."},409,who.headers);
  return json({linked:true,address:data.address},201,who.headers);
 }catch(e){console.error("Wallet linking failed",e);return json({error:"Wallet linking is unavailable. Please retry."},503);}
}
export async function DELETE(request:Request){
 if(!sameOrigin(request))return json({error:"Use this site to unlink a wallet."},403);
 const address=new URL(request.url).searchParams.get("address")??"";if(!validAddress(address))return json({error:"Invalid wallet address."},400);
 try{const who=await walletIdentity(request);await database().prepare("DELETE FROM linked_wallets WHERE viewer_id=? AND address=?").bind(who.viewerId,address).run();return json({unlinked:true},200,who.headers);}catch(e){console.error("Wallet unlink failed",e);return json({error:"Could not unlink this wallet. Please retry."},503);}
}
