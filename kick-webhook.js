import crypto from "node:crypto";

const PUBLIC_KEY_URL="https://api.kick.com/public/v1/public-key";
const KEY_TTL=6*60*60*1000,RETRY_DELAY=60*1000;

// Only trust keys fetched from Kick. Refresh periodically and after a failed
// signature so a key rotation cannot silently disconnect chat again.
export function createKickWebhookVerifier({fetchImpl=fetch,now=Date.now}={}){
  let key=null,loadedAt=0,lastAttempt=-Infinity,pending=null;
  function refresh(){
    if(pending)return pending;
    if(now()-lastAttempt<RETRY_DELAY)return Promise.resolve(false);
    lastAttempt=now();
    pending=(async()=>{
      try{
        const response=await fetchImpl(PUBLIC_KEY_URL,{signal:AbortSignal.timeout(10000),redirect:"error"});
        if(!response.ok)throw Error(`Kick public key request failed (${response.status})`);
        const data=await response.json(),fresh=crypto.createPublicKey(data?.data?.public_key);
        if(fresh.asymmetricKeyType!=="rsa")throw Error("Unexpected Kick public key type");
        key=fresh;loadedAt=now();return true;
      }catch(error){console.error("Kick webhook key refresh failed:",error.message);return false}
      finally{pending=null}
    })();
    return pending;
  }
  function matches(body,signature){try{return !!key&&crypto.verify("RSA-SHA256",body,key,signature)}catch{return false}}
  async function verify({id,timestamp,signature,raw}){
    if(!id||!timestamp||!signature)return false;
    const body=Buffer.concat([Buffer.from(`${id}.${timestamp}.`),Buffer.isBuffer(raw)?raw:Buffer.from(raw)]),sig=Buffer.from(signature,"base64");
    if(!key||now()-loadedAt>=KEY_TTL)await refresh();
    if(!key)throw Error("Kick webhook verification key unavailable");
    if(matches(body,sig))return true;
    await refresh();
    return matches(body,sig);
  }
  return{refresh,verify};
}
