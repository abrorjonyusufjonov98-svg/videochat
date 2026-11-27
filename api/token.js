const { AccessToken } = require("livekit-server-sdk");

const ALLOWED_OWNER_IDS = ["9152309447", "8259169140"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { room, name, tgUserId } = body;

    if (!room || !name) {
      return res.status(400).json({ error: "Xona nomi va ism-familiya majburiy" });
    }

    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "LIVEKIT muhit o'zgaruvchilari sozlanmagan" });
    }

    const cleanName = String(name).trim();
    const randSuffix = Math.random().toString(36).slice(2, 7);
    const cleanTgId = tgUserId ? String(tgUserId).trim() : "";

    const identity =
      cleanTgId && ALLOWED_OWNER_IDS.includes(cleanTgId)
        ? `${cleanTgId}_${randSuffix}`
        : `${cleanName}-${randSuffix}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: cleanName,
    });

    at.addGrant({
      roomJoin: true,
      room: String(room).trim(),
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.status(200).json({ token, url });
  } catch (err) {
    console.error("Token error:", err);
    return res.status(500).json({ error: err.message || "Token yaratishda xato" });
  }
};
