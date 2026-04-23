'use strict';

const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Facebook Login Handler — BruxaBot / ST-BOT
// Supports: email/password login, password encryption, 2FA (TOTP)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_UA = "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36";
const BASE_HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "navigate",
  "sec-fetch-dest": "document",
  "origin": "https://www.facebook.com",
  "referer": "https://www.facebook.com/",
};

// ─── Cookie helpers ───────────────────────────────────────────────────────────
function parseCookies(setCookieHeaders) {
  const now = new Date().toISOString();
  return (setCookieHeaders || []).map(str => {
    const parts = str.split(";");
    const [rawKey, ...valParts] = parts[0].split("=");
    const value = valParts.join("=");
    const domainPart = parts.find(p => p.trim().toLowerCase().startsWith("domain="));
    let domain = "facebook.com";
    if (domainPart) {
      domain = domainPart.split("=")[1].trim().replace(/^\./, "");
    }
    return {
      key: rawKey.trim(),
      value,
      domain,
      path: "/",
      hostOnly: false,
      creation: now,
      lastAccessed: now
    };
  });
}

function cookiesToString(cookies) {
  return (cookies || []).map(c => `${c.key}=${c.value}`).join("; ");
}

function mergeCookies(existing, incoming) {
  const map = new Map(existing.map(c => [c.key, c]));
  for (const c of incoming) map.set(c.key, c);
  return [...map.values()];
}

// ─── Token / public key fetcher ───────────────────────────────────────────────
async function getLoginTokensAndPublicKey(userAgent) {
  const res = await axios.get("https://www.facebook.com/", {
    headers: { "User-Agent": userAgent || DEFAULT_UA, "Accept": BASE_HEADERS.Accept }
  });

  const $ = cheerio.load(res.data);
  let lsd = $("input[name='lsd']").val();
  let jazoest = $("input[name='jazoest']").val();

  // Fallback regex extractions
  if (!lsd) {
    const m = res.data.match(/"LSD"[^{]*"token"\s*:\s*"([^"]+)"/)
      || res.data.match(/\["LSD",\[\],\{"token":"([^"]+)"\}/)
      || res.data.match(/name="lsd"\s+value="([^"]+)"/)
      || res.data.match(/"lsd"\s*:\s*"([^"]+)"/)
      || res.data.match(/,lsd:"([^"]+)"/);
    if (m) lsd = m[1];
  }
  if (!jazoest) {
    const m = res.data.match(/name="jazoest"\s+value="([^"]+)"/);
    if (m) jazoest = m[1];
  }

  // Public key for password encryption
  const keyMatch = res.data.match(/"public_key"\s*:\s*"([^"]+)"/);
  const keyIdMatch = res.data.match(/"key_id"\s*:\s*(\d+)/);

  return {
    lsd: lsd || null,
    jazoest: jazoest || null,
    publicKey: keyMatch ? keyMatch[1] : null,
    keyId: keyIdMatch ? parseInt(keyIdMatch[1]) : null
  };
}

// ─── Password encryption (Facebook's #PWD_BROWSER format) ────────────────────
function encryptPassword(password, publicKeyHex, keyId) {
  const time = Math.floor(Date.now() / 1000);
  const iv = crypto.randomBytes(12);
  const aesKey = crypto.randomBytes(32);

  // Encrypt the AES key with Facebook's RSA public key
  const pubKeyDer = Buffer.from(publicKeyHex, "hex");
  const encryptedAesKey = crypto.publicEncrypt(
    { key: pubKeyDer, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    aesKey
  );

  // Encrypt the password with AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  cipher.setAAD(Buffer.from(time.toString()));
  const encryptedPw = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Build payload: version(1) + keyId(1) + iv(12) + encAesKeyLen(2) + encAesKey + authTag(16) + encPw
  const keyLenBuf = Buffer.alloc(2);
  keyLenBuf.writeUInt16BE(encryptedAesKey.length);

  const payload = Buffer.concat([
    Buffer.from([1, keyId]),
    iv,
    keyLenBuf,
    encryptedAesKey,
    authTag,
    encryptedPw
  ]);

  return `#PWD_BROWSER:5:${time}:${payload.toString("base64")}`;
}

// ─── Main login function ──────────────────────────────────────────────────────
async function getAccountCookies(twoFactorCode = null) {
  const { email, password, encpass, userAgent } = global.BruxaBot.config.facebookAccount;
  const ua = userAgent || DEFAULT_UA;

  // Step 1: Get tokens + public key
  const tokens = await getLoginTokensAndPublicKey(ua);
  if (!tokens.lsd) throw new Error("Failed to fetch login tokens from Facebook");

  // Step 2: Resolve encrypted password
  let loginEncpass;
  if (encpass) {
    loginEncpass = encpass;
  } else if (password) {
    if (!tokens.publicKey || !tokens.keyId) {
      throw new Error("Public key not available — cannot encrypt password");
    }
    loginEncpass = encryptPassword(password, tokens.publicKey, tokens.keyId);
  } else {
    throw new Error("Either encpass or password must be provided in config");
  }

  // Step 3: Build privacy token
  const privacyTime = Math.floor(Date.now() / 1000);
  const privacyToken = Buffer.from(JSON.stringify({
    type: 0,
    creation_time: privacyTime,
    callsite_id: 381229079575946
  })).toString("base64");

  // Step 4: POST login request
  const postData = qs.stringify({
    jazoest: tokens.jazoest,
    lsd: tokens.lsd,
    email,
    login_source: "comet_headerless_login",
    next: "",
    encpass: loginEncpass
  });

  const response = await axios.request({
    method: "POST",
    maxRedirects: 0,
    validateStatus: s => s >= 200 && s < 400,
    url: `https://www.facebook.com/login/?privacy_mutation_token=${encodeURIComponent(privacyToken)}&next=`,
    headers: {
      ...BASE_HEADERS,
      "User-Agent": ua,
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": "datr=soC2aJB91tnTkw-4D2h7y3YR; sb=-iDMaMeopIGoBoK29rP-pm4C; dpr=3"
    },
    data: postData
  });

  const cookies = parseCookies(response.headers["set-cookie"]);
  const checkpointCookie = cookies.find(c => c.key === "checkpoint");

  // ── 2FA required ──
  if (checkpointCookie && checkpointCookie.value !== "deleted") {
    let checkpointData = {};
    try { checkpointData = JSON.parse(decodeURIComponent(checkpointCookie.value)); } catch {}

    const $ = cheerio.load(response.data);
    let lsd = $("input[name='lsd']").val() || tokens.lsd;
    let jazoest = $("input[name='jazoest']").val() || tokens.jazoest;
    let fb_dtsg = checkpointData.n || null;

    const extractMatch = (pattern) => { const m = response.data.match(pattern); return m ? m[1] : null; };
    if (!lsd) lsd = extractMatch(/"LSD"[^{]*"token"\s*:\s*"([^"]+)"/) || extractMatch(/,lsd:"([^"]+)"/);
    if (!fb_dtsg) fb_dtsg = extractMatch(/"fb_dtsg"\s*:\s*\{"token"\s*:\s*"([^"]+)"/);

    const encryptedContext = extractMatch(/encrypted_context=([A-Za-z0-9_-]+)/);
    const rev = extractMatch(/"__rev"\s*:\s*"?(\d+)"?/);
    const hsi = extractMatch(/"__hsi"\s*:\s*"?(\d+)"?/);

    if (!jazoest && fb_dtsg) {
      const sum = fb_dtsg.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      jazoest = "2" + sum;
    }

    const loginState = { cookies, fb_dtsg, lsd, jazoest, encryptedContext, rev, hsi, userAgent: ua };

    // Auto-handle 2FA if code provided
    if (twoFactorCode) {
      try {
        const result = await handle2FAFlow(loginState, twoFactorCode);
        return { requires2FA: false, cookies: result.cookies };
      } catch (err) {
        return { requires2FA: true, ...loginState, error2FA: err.message };
      }
    }

    return { requires2FA: true, ...loginState };
  }

  // ── Login success ──
  if (cookies.length > 0) {
    return { requires2FA: false, cookies };
  }

  throw new Error("No cookies returned — login may have failed");
}

// ─── 2FA Flow ─────────────────────────────────────────────────────────────────
async function handle2FAFlow(loginResult, totpCode) {
  const { cookies, fb_dtsg, lsd, jazoest, encryptedContext, rev, hsi, userAgent } = loginResult;

  if (!fb_dtsg || !lsd) throw new Error("Missing fb_dtsg or lsd for 2FA");
  if (!encryptedContext) throw new Error("Missing encryptedContext for 2FA");

  const cookieStr = cookiesToString(cookies);
  const ua = userAgent || DEFAULT_UA;

  const sessionParams = {
    fb_dtsg, lsd,
    jazoest: jazoest || "21097",
    encryptedContext,
    rev: rev || "1030277950",
    hsi: hsi || "7575637775790753541",
    ua
  };

  // Step 1 — UpdateLoginMutation
  await step1_UpdateLoginMutation(cookieStr, sessionParams, ua);

  // Step 2 — GetChallengeMethods
  const step2 = await step2_GetChallengeMethods(cookieStr, sessionParams, ua);
  const methods = step2.methods || [];
  if (!methods.find(m => m.method === "TOTP")) {
    throw new Error("TOTP method not available for this account");
  }

  // Step 3 — TriggerNonceCreator
  const step3 = await step3_TriggerNonceCreator(cookieStr, sessionParams, ua);
  const securityToken = step3?.two_step_idr_wizard_input?.security_token;
  const externalFlowId = step3?.two_step_idr_wizard_input?.external_flow_id;

  // Step 4 — ValidateTOTP
  const step4 = await step4_ValidateTOTP(cookieStr, sessionParams, totpCode, securityToken, externalFlowId, ua);
  if (!step4.is_code_valid) {
    throw new Error(step4.error_message || "Invalid 2FA code");
  }

  return { success: true, cookies: step4.cookies || cookies };
}

// ─── 2FA Steps (GraphQL calls) ────────────────────────────────────────────────
async function graphqlPost(cookieStr, ua, docId, variables, extra = {}) {
  const res = await axios.post(
    "https://www.facebook.com/api/graphql/",
    qs.stringify({ fb_dtsg: extra.fb_dtsg, lsd: extra.lsd, doc_id: docId, variables: JSON.stringify(variables) }),
    {
      headers: {
        ...BASE_HEADERS,
        "User-Agent": ua,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookieStr,
        "x-fb-lsd": extra.lsd,
        "x-fb-friendly-name": extra.friendlyName || "BruxaBotLogin"
      }
    }
  );
  return res.data;
}

async function step1_UpdateLoginMutation(cookieStr, params, ua) {
  return graphqlPost(cookieStr, ua, "6628247483879577", {
    encrypted_context: params.encryptedContext
  }, { fb_dtsg: params.fb_dtsg, lsd: params.lsd, friendlyName: "UpdateLoginMutation" });
}

async function step2_GetChallengeMethods(cookieStr, params, ua) {
  const data = await graphqlPost(cookieStr, ua, "7892790297399459", {
    encrypted_context: params.encryptedContext
  }, { fb_dtsg: params.fb_dtsg, lsd: params.lsd, friendlyName: "GetChallengeMethods" });

  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const edges = parsed?.data?.xray_get_challenge_methods?.edges || [];
    return { methods: edges.map(e => ({ method: e?.node?.challenge_method_type })) };
  } catch {
    return { methods: [] };
  }
}

async function step3_TriggerNonceCreator(cookieStr, params, ua) {
  const data = await graphqlPost(cookieStr, ua, "6259996264069712", {
    encrypted_context: params.encryptedContext,
    challenge_type: "TOTP"
  }, { fb_dtsg: params.fb_dtsg, lsd: params.lsd, friendlyName: "TriggerNonceCreator" });

  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return parsed?.data?.xray_trigger_nonce_creator;
  } catch {
    return null;
  }
}

async function step4_ValidateTOTP(cookieStr, params, totpCode, securityToken, externalFlowId, ua) {
  const res = await axios.post(
    "https://www.facebook.com/api/graphql/",
    qs.stringify({
      fb_dtsg: params.fb_dtsg,
      lsd: params.lsd,
      doc_id: "6951305804952292",
      variables: JSON.stringify({
        encrypted_context: params.encryptedContext,
        totp_code: totpCode,
        security_token: securityToken,
        external_flow_id: externalFlowId
      })
    }),
    {
      maxRedirects: 0,
      validateStatus: s => s >= 200 && s < 400,
      headers: {
        ...BASE_HEADERS,
        "User-Agent": ua,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookieStr,
        "x-fb-lsd": params.lsd,
        "x-fb-friendly-name": "ValidateTOTP"
      }
    }
  );

  const newCookies = parseCookies(res.headers["set-cookie"] || []);

  try {
    const parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    const result = parsed?.data?.xray_validate_totp;
    return {
      is_code_valid: result?.is_code_valid || false,
      error_message: result?.error_message || null,
      cookies: newCookies.length > 0 ? newCookies : null
    };
  } catch {
    return { is_code_valid: false, error_message: "Failed to parse 2FA response", cookies: null };
  }
}

module.exports = { getAccountCookies, handle2FAFlow };