export const ROUND_MS = 180_000;
export const DEMO_WALLETS = ["7xKp…q2Lm","9aDv…x4Nk","F3mR…8cJw","4bQz…t7Hp","J8nT…5dVs","2uWk…r9Aa","Bc6Y…3eMd","H5sL…u8Px"];
export const DEMO_WEIGHTS = [250,4000,1000,750,1800,600,900,700];
// The optional demo wallet represents sample holder 0 (2.5% of eligible holdings).
export function demoViewerOutcome(winnerIndex:number, demoWalletConnected:boolean, indices:readonly number[]=[0]) {
 if(!demoWalletConnected)return "spectator" as const;
 return indices.includes(winnerIndex) ? "winner" as const : "miss" as const;
}
// Exact integer weighting. The caller must supply an unbiased random ticket.
export function selectWeightedIndex(weights: readonly bigint[], ticket: bigint): number {
 if (!weights.length || weights.some(w=>w<0n)) throw new Error("Invalid weights");
 const total=weights.reduce((sum,w)=>sum+w,0n);
 if(total<=0n || ticket<0n || ticket>=total) throw new Error("Ticket out of range");
 let end=0n;
 for(let i=0;i<weights.length;i++){end+=weights[i];if(ticket<end)return i;}
 throw new Error("No eligible holder");
}
// Rejection sampling avoids modulo bias. Entropy must come from a verified source in production.
export function unbiasedTicket(total: bigint, bytes: Uint8Array): bigint | null {
 if(total<=0n || !bytes.length) throw new Error("Invalid entropy range");
 const range=1n<<BigInt(bytes.length*8);
 if(total>range) throw new Error("Insufficient entropy");
 let value=0n;for(const byte of bytes)value=(value<<8n)|BigInt(byte);
 return value<range-range%total ? value%total : null;
}
export function demoResult(round: number) {
 // Deliberately reproducible sample data; never use this generator for real prizes.
 let seed=(round^0x61c88647)>>>0;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
 const index=selectWeightedIndex(DEMO_WEIGHTS.map(BigInt),BigInt((seed>>>0)%10000));
 return {round,index,wallet:DEMO_WALLETS[index],amount:Number((7+(seed>>>0)%11000/1000).toFixed(3)),at:(round+1)*ROUND_MS,simulated:true as const};
}
export function demoState(now = Date.now()) {
 const round=Math.floor(now/ROUND_MS);
 const elapsed=now-round*ROUND_MS;
 const final=demoResult(round).amount;
 return {mode:"demo" as const,serverTime:now,round,startAt:round*ROUND_MS,endAt:(round+1)*ROUND_MS,pool: Number((final*(.42+.58*elapsed/ROUND_MS)).toFixed(3)),history:[1,2,3].map(n=>demoResult(round-n)),payoutsEnabled:false};
}
export type DrawState = ReturnType<typeof demoState>;
export type DrawResult = ReturnType<typeof demoResult>;
