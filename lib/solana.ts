export function validAddress(address:string) {
 const alphabet="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
 if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))return false;
 let n=0n;for(const char of address){n=n*58n+BigInt(alphabet.indexOf(char));}
 let size=0;while(n){size++;n>>=8n;}let zeros=0;while(address[zeros]==="1")zeros++;
 return size+zeros===32;
}
export function formatUnits(raw:bigint,decimals:number) {
 if(!Number.isInteger(decimals)||decimals<0||decimals>30)throw new Error("Invalid token decimals");
 const scale=10n**BigInt(decimals),whole=raw/scale;
 const fraction=(raw%scale).toString().padStart(decimals,"0").replace(/0+$/,"");
 return decimals&&fraction?`${whole}.${fraction}`:whole.toString();
}
