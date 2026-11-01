// PayPal sandbox webhook helper. Usage (from repo root):
//   node tools/paypal-webhook.mjs create https://<host>/api/paypal/webhook   (writes PAYPAL_WEBHOOK_ID to .env, prints no secrets)
//   node tools/paypal-webhook.mjs list
//   node tools/paypal-webhook.mjs delete [url-prefix]   (default: temporary trycloudflare.com hooks)
import { readFileSync, writeFileSync } from "node:fs";
const [,, mode, url] = process.argv;
const raw = readFileSync(".env","utf8");
const env = Object.fromEntries(raw.split("\n").filter(l=>/^[A-Z_]+=/.test(l)).map(l=>[l.split("=")[0], l.slice(l.indexOf("=")+1)]));
const B="https://api-m.sandbox.paypal.com";
const t=(await (await fetch(B+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(env.PAYPAL_CLIENT_ID+":"+env.PAYPAL_CLIENT_SECRET).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"})).json()).access_token;
const H={Authorization:"Bearer "+t,"Content-Type":"application/json"};
const setEnv=(k,v)=>{ const s=readFileSync(".env","utf8"); writeFileSync(".env", s.split("\n").map(l=>l.startsWith(k+"=")?k+"="+v:l).join("\n")); };
if (mode==="create") {
  const r=await fetch(B+"/v1/notifications/webhooks",{method:"POST",headers:H,body:JSON.stringify({url,event_types:[{name:"PAYMENT.CAPTURE.COMPLETED"},{name:"CHECKOUT.ORDER.APPROVED"}]})});
  const j=await r.json(); if(!r.ok){console.log("create failed",r.status,j.name,j.message);process.exit(1);}
  setEnv("PAYPAL_WEBHOOK_ID", j.id); console.log("webhook created, id set in .env, url host", new URL(j.url).host);
} else if (mode==="list") {
  const j=await (await fetch(B+"/v1/notifications/webhooks",{headers:H})).json();
  console.log("webhooks:", (j.webhooks||[]).map(w=>new URL(w.url).host).join(", ")||"none");
} else if (mode==="delete") {
  const j=await (await fetch(B+"/v1/notifications/webhooks",{headers:H})).json();
  for (const w of j.webhooks||[]) if (url ? w.url.startsWith(url) : w.url.includes("trycloudflare.com")) { const r=await fetch(B+"/v1/notifications/webhooks/"+w.id,{method:"DELETE",headers:H}); console.log("deleted", new URL(w.url).host, r.status); }
  setEnv("PAYPAL_WEBHOOK_ID","");
}
