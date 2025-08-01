const axios = require('axios');

app.get('/api/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided.");

  try {
    // Exchange code for access token
    const params = new URLSearchParams({
      client_id: "1336420935565185065",
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://tuiacademy-production.up.railway.app/api/auth/discord/callback",
      scope: "identify guilds email"
    });

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info from Discord
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const user = userResponse.data;
    console.log("✅ Discord user info:", user);

    // Redirect user to your frontend after login
    res.redirect(`https://progamerzzzz8447.github.io/tui-frontend/?id=${user.id}`);
  } catch (err) {
    console.error("❌ Discord OAuth error:", err.message);
    res.status(500).send("OAuth failed");
  }
});
