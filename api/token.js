async function deliverRecordedAudio(blob, fileName, durationStr) {
  triggerLocalDownload(blob, fileName);

  const targetChatId = (user && user.id) ? user.id : (ADMIN_CHAT_ID || null);
  $("recBanner").classList.remove("info-banner");
  $("recBanner").classList.add("active");
  $("recDot").style.display = "none";
  $("recStatusText").textContent = "Ovoz botga yuborilmoqda...";

  try {
    const audioBase64 = await blobToBase64(blob);
    const res = await fetch("/api/upload-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioBase64,
        fileName,
        chatId: targetChatId,
        roomName: currentRoomName,
        duration: durationStr
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Bot javob bermadi");
    }
    $("recStatusText").textContent = "✅ Ovoz botga yuborildi va fayl tayyor!";
  } catch (err) {
    $("recStatusText").textContent = "⚠️ Botga yuborilmadi (" + err.message + "), fayl yuklandi";
  }
}
