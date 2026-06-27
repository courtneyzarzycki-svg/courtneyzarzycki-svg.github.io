// Family Hub Notification Worker
const FIREBASE_URL = "https://family-hub-2-4a707-default-rtdb.firebaseio.com";
const FCM_URL = "https://fcm.googleapis.com/v1/projects/family-hub-2-4a707/messages:send";
const SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@family-hub-2-4a707.iam.gserviceaccount.com";
const TIMEZONE = "America/Vancouver";

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDUdtDy9m23nAmn
xAtFGIHU/kxe8ZUh/yR1DQYuj20t6kQ4HQMspK1eDZUuyQet9Tdl3X7dcSdhT6d1
tRO8eiM67UHQiH++sOkJKaSeScy/8zbxLELpX2fTVtjpk+P9E47og7s6nF68Lo9k
TNmo+FPXzW0pK5PXvejuc7LbTElVglwc78FSo2dD779PAgJ1lwWwQ/0aob12PPY+
l1DS44jnlTsJ1US3JTqc24dLRfZ7BpUp0ZlfWSVwhxZsrNCFKRONDGJcoEQiBPEZ
YobhzxDnzbMDrOftvVTCFI6aewjeAv+sTetVHVHNQYDlHkYFJF1Mmpe9nLK7L8/c
CcGHuLkhAgMBAAECggEAHA4sfUjJKCu0orCihFc+HbAOyaLA/KJCYCp+HHvYAO4k
X/yExMpiEj9c6bamCvSMgikDbZ5ZguIPzN1CY+sE5+0Yeb7sj3Ow8gLLuBMqtFYb
dTFRDJwKi7+2GPHscyi4AEAU4yJu6A6F5Mq5GzTfbWm09nDIrv5m2cXxYj/qlx3H
/Ly6LEs5zdY2tOtal8Q9J5x5Q6WRuB8GLCIAFF8n+hWcCMtVRIJtkCVoNgYca5b1
67rBu0/af5b/0dBWyqud6VF8YjReGOGYWjrQS+C/hxL4pKRXbwK48SEI2xAX15qP
ltjnQp1sItTQ1cM4SH3Tj4OgVW3iIHlchIQmDjDLGQKBgQD1Iq9+9bRg0BHujUzG
HlrPeDDsZHgxf6B+xuiG/YGFcx96+Cgmgov/JGAAaK3a+nPXsZXz4FN2XrYA040I
1gQYyspg54DBqU+qzR+RC821uEKsLRn3JqobdCfgV+6VKgBesTmY2tKXuxlGUAND
jOXp05LNb8gvFSzE0iqpHtAPewKBgQDd4XC/DJuK8nnBC3uf/3imR2imGHeaHM8K
7XjTOsCa/q2Jr5of7QUVxD38hM+Hx7S24dHRsG+Xif4Q5nItPONKe8C+FF5kM7uR
jxTqZZ+EfK1otLQR3n/KQlRGuJxXE7mG2Rri2cLstRCh7Hz7nYN+QpCjweb8gjux
O25A/GDJEwKBgQDsr5bfcQG+0Gff+1J7oGdyFsy2ErPypxYiEpAFdtQOM//bTawG
stnVehuviWMEIfqj8nWkyZ4MlpoI5jowo+PExFjvg9dQJdgkRHYMKGdw4/6MG+gM
OKraYyb1eDGGmM1OoLPKIM5hbmeS+kKMgIilYoFGFn4k578YMwy5ymR97QKBgDSo
xptxIJFPjvn0AbktZrMAC6Qv9mLLJ5BOX/ix3vhqLUGaPZgKJsTNuHBwDNkK2qb0
3VlI6JMsmvHj34FBDCinSk1ShDx/0qpvLOWcjMli1b0d9gavqeCU8W9/bQt1kPii
GjFwwURwjKwBdoA5F/YlUjKrWGjhd81Ob5JY05elAoGAQhWI+uVIBZ8FYdSsAYY8
VwIW+RxQ7M2uqexsmqQqSCErE2o9ZNBrleZUIQ4Dtgj1OUk1jfWdYi+LtzLfmgzQ
gDVHsnNm1Tz0COTzrzy8EKGeURVtxzKBgkrASviRAZKTQb7ZCGtyatrF7KsaezKM
0Mb8CbgdskzI+kftMyt0sPU=
-----END PRIVATE KEY-----`;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };
  const encode = obj => btoa(JSON.stringify(obj)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const sigInput = `${headerB64}.${payloadB64}`;
  const pemContents = PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/,"").replace(/-----END PRIVATE KEY-----/,"").replace(/\s/g,"");
  const keyBytes = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", keyBytes.buffer, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(sigInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const jwt = `${sigInput}.${sigB64}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type":"application/x-www-form-urlencoded"},
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function sendFCM(accessToken, fcmToken, title, body) {
  const res = await fetch(FCM_URL, {
    method: "POST",
    headers: {"Authorization":`Bearer ${accessToken}`,"Content-Type":"application/json"},
    body: JSON.stringify({message:{token:fcmToken,notification:{title,body}}})
  });
  const data = await res.json();
  return {ok: res.ok, data};
}

function toMins(h, m, ap) {
  let hh = +h;
  if (ap === "PM" && hh !== 12) hh += 12;
  if (ap === "AM" && hh === 12) hh = 0;
  return hh * 60 + (+m);
}

async function checkAndNotify() {
  // Get current local time
  const nowUTC = new Date();
  const localStr = nowUTC.toLocaleString("en-US", {timeZone: TIMEZONE});
  const localDate = new Date(localStr);
  const todayStr = localDate.getFullYear() + "-" +
    String(localDate.getMonth()+1).padStart(2,"0") + "-" +
    String(localDate.getDate()).padStart(2,"0");
  const nowMins = localDate.getHours() * 60 + localDate.getMinutes();

  // Get Firebase state
  const res = await fetch(FIREBASE_URL + "/familyhub.json");
  if (!res.ok) return "Firebase fetch failed: " + res.status;
  const state = await res.json();
  if (!state) return "No state in Firebase";

  // Get FCM tokens - stored as {token, user}
  const tokensRes = await fetch(FIREBASE_URL + "/fcmTokens.json");
  if (!tokensRes.ok) return "Token fetch failed";
  const tokensData = await tokensRes.json();
  if (!tokensData) return "No tokens registered";

  // Build map of user -> [tokens]
  // Tokens without a user field are legacy - store under special "all" key
  const userTokens = {};
  const allTokens = []; // legacy tokens with no user
  Object.values(tokensData).forEach(t => {
    if (!t.token) return;
    if (!t.user) {
      allTokens.push(t.token); // legacy - no user info
    } else {
      if (!userTokens[t.user]) userTokens[t.user] = [];
      userTokens[t.user].push(t.token);
    }
  });

  function shouldNotify(item, notifMins) {
    if (!item.date || item.date !== todayStr) return false;
    const h = item.startH || item.h || 12;
    const m = item.startM || item.m || 0;
    const ap = item.startAP || item.ampm || "AM";
    const itemMins = toMins(h, m, ap);
    const fireMins = itemMins - notifMins;
    return fireMins === nowMins;
  }

  // notifications = [{title, body, users: []}]
  const notifications = [];

  // Events - notify all members attending
  (state.events || []).forEach(e => {
    (e.notifications || []).forEach(nb => {
      if (shouldNotify(e, nb)) {
        const label = nb === 0 ? "Now" : nb < 60 ? `${nb} min` : "1 hour";
        const members = [...(e.members || [])]; // copy to avoid mutation
        // Also include parent if assigned
        if (e.parent === "mike" || e.parent === "both") members.push("mike");
        if (e.parent === "courtney" || e.parent === "both") members.push("courtney");
        const users = [...new Set(members)]; // deduplicate
        results.push(`DEBUG: Event "${e.title}" members=${JSON.stringify(e.members)} parent=${e.parent} -> notify: ${users.join(",")}`);
        notifications.push({title:"Family Hub", body:`${label}: ${e.title}`, users});
      }
    });
  });

  // Reminders - notify only the owner
  (state.reminders || []).forEach(r => {
    if (r.completed) return;
    (r.notifications || []).forEach(nb => {
      if (shouldNotify(r, nb)) {
        const label = nb === 0 ? "Now" : nb < 60 ? `${nb} min` : "1 hour";
        const users = [r.owner];
        // Also notify partner if shared
        if (r.sharedWithPartner) {
          if (r.owner === "mike") users.push("courtney");
          if (r.owner === "courtney") users.push("mike");
        }
        notifications.push({title:"Family Hub", body:`${label}: ${r.title}`, users});
      }
    });
  });

  if (!notifications.length) return `No notifications due at ${todayStr} ${nowMins} mins`;

  const accessToken = await getAccessToken();
  const results = [];

  for (const notif of notifications) {
    results.push(`Notif: ${notif.body} for users: ${notif.users.join(",")}`);
    // Use specific user tokens if available, otherwise fall back to all legacy tokens
    let anyUserTokens = false;
    for (const user of notif.users) {
      const tokens = userTokens[user] || [];
      anyUserTokens = anyUserTokens || tokens.length > 0;
      for (const token of tokens) {
        const result = await sendFCM(accessToken, token, notif.title, notif.body);
        results.push(`  -> ${user}: ${result.ok ? "sent" : JSON.stringify(result.data)}`);
      }
    }
    // If no user-specific tokens found, use legacy tokens
    if (!anyUserTokens) {
      results.push(`  -> fallback to ${allTokens.length} legacy tokens`);
      for (const token of allTokens) {
        const result = await sendFCM(accessToken, token, notif.title, notif.body);
        results.push(`  -> legacy: ${result.ok ? "sent" : JSON.stringify(result.data)}`);
      }
    }
  }

  return results.join("\n") || "No tokens for assigned users";
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkAndNotify());
  },
  async fetch(request, env, ctx) {
    const result = await checkAndNotify();
    return new Response(result);
  }
};
