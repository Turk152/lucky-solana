import { env } from "cloudflare:workers";
import { json } from "@/lib/server";
import { validAddress, formatUnits } from "@/lib/solana";
export async function GET(request:Request){
 const address=new URL(request.url).searchParams.get("wallet")??"";
 if(!validAddress(address))return json({error:"Invalid Solana wallet address."},400);
 const config=env as unknown as {SOLANA_RPC_URL?:string;TOKEN_MINT?:string;TOKEN_SYMBOL?:string};
 if(config.TOKEN_MINT&&!validAddress(config.TOKEN_MINT))return json({configured:false,error:"Token configuration is invalid."},503);
 async function rpc(method:string,params:unknown[]) {
  const response=await fetch(config.SOLANA_RPC_URL??"https://api.mainnet-beta.solana.com",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error("RPC unavailable");const data=await response.json() as {error?:unknown;result?:any};if(data.error||!data.result)throw new Error("RPC returned an error");return data.result;
 }
 try{
  const solPromise=rpc("getBalance",[address,{commitment:"finalized"}]);
  if(!config.TOKEN_MINT){const sol=await solPromise;return json({configured:false,symbol:config.TOKEN_SYMBOL??"LUCKY",solBalance:formatUnits(BigInt(sol.value),9),message:"Project token not configured yet."});}
  const [accounts,supply,sol]=await Promise.all([rpc("getTokenAccountsByOwner",[address,{mint:config.TOKEN_MINT},{encoding:"jsonParsed",commitment:"finalized"}]),rpc("getTokenSupply",[config.TOKEN_MINT,{commitment:"finalized"}]),solPromise]);
  let total=0n;for(const item of accounts.value){const token=item.account.data.parsed.info;if(token.mint===config.TOKEN_MINT&&token.owner===address)total+=BigInt(token.tokenAmount.amount);}
  const rawSupply=BigInt(supply.value.amount);const share=rawSupply>0n?Number(total*1000000n/rawSupply)/10000:0;
  return json({configured:true,wallet:address,mint:config.TOKEN_MINT,symbol:config.TOKEN_SYMBOL??"LUCKY",amount:formatUnits(total,supply.value.decimals),rawAmount:total.toString(),decimals:supply.value.decimals,supplyRaw:rawSupply.toString(),supplyShare:share,solBalance:formatUnits(BigInt(sol.value),9),slot:accounts.context.slot,odds:null,payoutsEnabled:false});
 }catch(e){console.error("Holdings RPC failed",e);return json({configured:false,error:"Solana balances are temporarily unavailable. Please refresh."},503);}
}
