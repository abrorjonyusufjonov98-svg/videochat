import { AccessToken } from "livekit-server-sdk";

const clean = (v) => (v || "").trim().replace(/^['"]|['"]$/g, "").trim();

function normalizeUrl(raw) {
  let url = clean(raw);
  if (!url) return "";
  if (/^https:\/\//i.test(url)) url = "wss://" + url.slice(8);
  else if (/^http:\/\//i.test(url)) url = "ws://" + url.slice(7);
  else if (!/^wss?:\/\//i.test(url)) url = "wss://" + url;
  return url.replace(/\/+$/, "");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();

  const apiKey = clean(process.env.LIVEKIT_API_KEY);
  const apiSecret = clean(process.env.LIVEKIT_API_SECRET);
  const url = normalizeUrl(process.env.LIVEKIT_URL);

  const missing = [
    !url && "LIVEKIT_URL",
    !apiKey && "LIVEKIT_API_KEY",
    !apiSecret && "LIVEKIT_API_SECRET",
  ].filter(Boolean);

  if (missing.length) {
    return res.status(500).json({ error: "Server sozlanmagan: " + missing.join(", ") + " yo'q" });
  }

  let input = {};
  try {
    input = req.method === "GET" ? req.query || {} : typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "Noto'g'ri so'rov (JSON)" });
  }

  const room = String(input.room || "").trim().slice(0, 128);
  const name = String(input.name || "").trim().slice(0, 64);
  if (!room || !name) return res.status(400).json({ error: "room va name kerak" });

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
    return res.status(200).json({ token, url });
  } catch (e) {
    return res.status(500).json({ error: "Token yaratib bo'lmadi: " + e.message });
  }
}
