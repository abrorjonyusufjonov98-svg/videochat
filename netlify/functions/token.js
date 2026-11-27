const { AccessToken } = require("livekit-server-sdk");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

// Strip whitespace and accidental surrounding quotes from env values.
const clean = (v) => (v || "").trim().replace(/^['"]|['"]$/g, "").trim();

// LiveKit clients must connect over WebSocket: accept https://, http:// or a
// bare host and turn it into wss:// (ws:// only for local servers).
function normalizeUrl(raw) {
  let url = clean(raw);
  if (!url) return "";
  if (/^https:\/\//i.test(url)) url = "wss://" + url.slice(8);
  else if (/^http:\/\//i.test(url)) url = "ws://" + url.slice(7);
  else if (!/^wss?:\/\//i.test(url)) url = "wss://" + url;
  return url.replace(/\/+$/, "");
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };

  const apiKey = clean(process.env.LIVEKIT_API_KEY);
  const apiSecret = clean(process.env.LIVEKIT_API_SECRET);
  const url = normalizeUrl(process.env.LIVEKIT_URL);

  const missing = [
    !url && "LIVEKIT_URL",
    !apiKey && "LIVEKIT_API_KEY",
    !apiSecret && "LIVEKIT_API_SECRET",
  ].filter(Boolean);
  if (missing.length) {
    return reply(500, { error: "Server sozlanmagan: " + missing.join(", ") + " yo'q" });
  }

  let input = {};
  try {
    input =
      event.httpMethod === "GET"
        ? event.queryStringParameters || {}
        : JSON.parse(event.body || "{}");
  } catch {
    return reply(400, { error: "Noto'g'ri so'rov (JSON)" });
  }

  const room = String(input.room || "").trim().slice(0, 128);
  const name = String(input.name || "").trim().slice(0, 64);
  if (!room || !name) return reply(400, { error: "room va name kerak" });

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: name + "-" + Math.random().toString(36).slice(2, 7),
      name,
      ttl: "6h",
    });
    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return reply(200, { token, url });
  } catch (e) {
    return reply(500, { error: "Token yaratib bo'lmadi: " + e.message });
  }
};
