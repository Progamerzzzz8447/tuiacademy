import React, { useEffect, useState } from "react";
import Button from "./components/Button";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
fetch("https://tuiacademy-production.up.railway.app/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.discordId) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>TUI Crew Portal</h1>
      {loading ? (
        <p>Checking login status...</p>
      ) : user ? (
        <>
          <p>Welcome, {user.username} ✅</p>
          <Button onClick={() => alert("Course list coming soon!")}>View Courses</Button>
        </>
      ) : (
        <>
          <p>You are not logged in.</p>
          <a href="https://your-railway-backend.up.railway.app/login">
            <Button>Login with Discord</Button>
          </a>
        </>
      )}
    </div>
  );
}

export default App;
