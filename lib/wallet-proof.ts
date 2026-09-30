import {validAddress} from "./solana";
export function decodeAddress(address:string):Uint8Array<ArrayBuffer>{
 if(!validAddress(address))throw new Error("Invalid wallet address");
 const alphabet="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
 let value=0n;for(const char of address)value=value*58n+BigInt(alphabet.indexOf(char));
 const result=new Uint8Array(32);for(let i=31;i>=0;i--){result[i]=Number(value&255n);value>>=8n;}return result;
}
export async function verifyWalletProof(address:string,message:string,encoded:string){
 try{
  if(typeof encoded!=="string"||encoded.length>128)return false;
  const signature=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));if(signature.length!==64)return false;
  const key=await crypto.subtle.importKey("raw",decodeAddress(address),{name:"Ed25519"},false,["verify"]);
  return await crypto.subtle.verify("Ed25519",key,signature,new TextEncoder().encode(message));
 }catch{return false;}
}
