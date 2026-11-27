const MY_TELEGRAM_ID = "9152309447";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { audioBase64, fileName, chatId, roomName, duration } = body;

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ ok: false, error: "BOT_TOKEN sozlanmagan" });
    }

    if (!audioBase64) {
      return res.status(400).json({ ok: false, error: "audioBase64 yuborilmagan" });
    }

    const recipientId = String(MY_TELEGRAM_ID || chatId || "").trim();
    if (!recipientId) {
      return res.status(400).json({ ok: false, error: "Qabul qiluvchi ID topilmadi" });
    }

    const buffer = Buffer.from(audioBase64, "base64");
    if (!buffer.length) {
      return res.status(400).json({ ok: false, error: "Audio fayl bo'sh" });
    }

    const safeName = String(fileName || "dars-audio.webm").replace(/[^a-zA-Z0-9._-]/g, "_");
    const caption = [
      "🎙️ Dars ovozli yozuvi",
      roomName ? `📚 Xona: ${roomName}` : null,
      duration ? `⏱ Davomiyligi: ${duration}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const formData = new FormData();
    formData.append("chat_id", recipientId);
    formData.append("caption", caption);

    const blob = new Blob([buffer], { type: "audio/webm" });
    formData.append("audio", blob, safeName);

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
      method: "POST",
      body: formData,
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      return res.status(500).json({
        ok: false,
        error: tgData.description || "Telegram botga yuborishda xato",
      });
    }

    return res.status(200).json({ ok: true, sentTo: recipientId });
  } catch (err) {
    console.error("Upload audio error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server xatosi" });
  }
};
