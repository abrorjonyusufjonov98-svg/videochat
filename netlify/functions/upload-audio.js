export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Netlify'da BOT_TOKEN o'rnatilmagan" })
    };
  }

  try {
    const { audioBase64, fileName, chatId, roomName, duration } = JSON.parse(event.body || "{}");

    if (!audioBase64 || !chatId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Audio yoki chatId topilmadi (ilovaning o'zini Telegram bot ichidan oching)" })
      };
    }

    const buffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });

    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("audio", blob, fileName || "videochat-ovoz.webm");
    formData.append(
      "caption",
      `🎙 Videochat ovozli yozuvi\n📌 Xona: ${roomName || "Noma'lum"}\n⏱ Davomiyligi: ${duration || "00:00"}`
    );

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
      method: "POST",
      body: formData
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      throw new Error(tgData.description || "Telegram API xatosi");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server xatosi" })
    };
  }
}
