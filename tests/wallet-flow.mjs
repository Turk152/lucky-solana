import assert from 'node:assert/strict';
const root=process.env.TEST_ORIGIN??'http://127.0.0.1:5173';
const cookie=`lucky_viewer=${crypto.randomUUID()}`,otherCookie=`lucky_viewer=${crypto.randomUUID()}`;
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58(bytes){let value=0n;for(const b of bytes)value=(value<<8n)|BigInt(b);let out='';while(value){out=alphabet[Number(value%58n)]+out;value/=58n;}for(const b of bytes){if(b!==0)break;out='1'+out;}return out;}
async function newWallet(){const keys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);return {...keys,address:base58(new Uint8Array(await crypto.subtle.exportKey('raw',keys.publicKey)))};}
async function call(path,method='GET',body,session=cookie){return fetch(root+path,{method,headers:{origin:root,cookie:session,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
async function proof(wallet){const response=await call('/api/wallets/challenge','POST',{address:wallet.address});assert.equal(response.status,200);const challenge=await response.json();const signature=Buffer.from(await crypto.subtle.sign('Ed25519',wallet.privateKey,new TextEncoder().encode(challenge.message))).toString('base64');return {address:wallet.address,challengeId:challenge.challengeId,signature};}
const a=await newWallet(),b=await newWallet();
const aProof=await proof(a);
const spoofed=await call('/api/wallets','POST',{...aProof,signature:Buffer.alloc(64).toString('base64')});assert.equal(spoofed.status,401);
const crossSession=await call('/api/wallets','POST',aProof,otherCookie);assert.equal(crossSession.status,409);
const linked=await call('/api/wallets','POST',aProof);assert.equal(linked.status,201,await linked.text());
assert.equal((await call('/api/wallets','POST',aProof)).status,409);
await new Promise(r=>setTimeout(r,2100));
const bProof=await proof(b);assert.equal((await call('/api/wallets','POST',bProof)).status,201);
const own=await (await call('/api/wallets')).json();assert.deepEqual(own.wallets.map(w=>w.address).sort(),[a.address,b.address].sort());
assert.deepEqual((await (await call('/api/wallets','GET',undefined,otherCookie)).json()).wallets,[]);
await call('/api/wallets?address='+a.address,'DELETE',undefined,otherCookie);assert.equal((await (await call('/api/wallets')).json()).wallets.length,2);
await call('/api/wallets?address='+a.address,'DELETE');await call('/api/wallets?address='+b.address,'DELETE');assert.equal((await (await call('/api/wallets')).json()).wallets.length,0);
console.log('PASS: two-wallet ownership signatures, forged proof rejection, replay protection, persistence, session isolation, and unlink authorization.');
