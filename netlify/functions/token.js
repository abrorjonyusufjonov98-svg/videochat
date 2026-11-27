const { AccessToken } = require("livekit-server-sdk");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { room, name } = JSON.parse(event.body || "{}");
    if (!room || !name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "room va name kerak" }) };
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: name + "-" + Math.random().toString(36).slice(2, 7), name }
    );
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token, url: process.env.LIVEKIT_URL }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
