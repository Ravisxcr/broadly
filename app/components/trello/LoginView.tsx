"use client";

import { useState } from "react";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { authClient } from "../../lib/auth-client";
import { FaGithub, FaMicrosoft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function LoginView() {
  const { login, roster } = useAuth();
  const [email, setEmail] = useState("ari@studio.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = roster.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setError("");
      login(user.id);
    } else {
      setError("User not found.");
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF9" }}>
      <div style={{ width: 380, padding: "40px 36px", background: "#FFFFFF", border: "1px solid #E8E6E1", borderRadius: 16, boxShadow: "0 20px 60px rgba(20,20,30,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#4F46E5", flexShrink: 0 }} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Boardly</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 14, color: "#726F68", marginBottom: 28 }}>Log in with your demo account.</div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#726F68", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E6E1", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#FAFAF9", color: "#1F2430" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#726F68", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E6E1", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#FAFAF9", color: "#1F2430" }}
            />
          </div>
          {error && <div style={{ fontSize: 12, color: "#EF4444" }}>{error}</div>}
          <button
            type="submit"
            style={{ marginTop: 8, width: "100%", padding: 11, background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Log in
          </button>
        </form>

        <div style={{ marginTop: 24, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#E8E6E1" }} />
          <div style={{ fontSize: 12, color: "#726F68", fontWeight: 600 }}>OR</div>
          <div style={{ flex: 1, height: 1, background: "#E8E6E1" }} />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => authClient.signIn.social({ provider: "github" })}
            title="Log in with GitHub"
            style={{ width: 44, height: 44, background: "#24292e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FaGithub size={20} />
          </button>
          <button
            onClick={() => authClient.signIn.social({ provider: "google" })}
            title="Log in with Google"
            style={{ width: 44, height: 44, background: "#fff", border: "1px solid #E8E6E1", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FcGoogle size={20} />
          </button>
          <button
            onClick={() => authClient.signIn.social({ provider: "microsoft" })}
            title="Log in with Microsoft"
            style={{ width: 44, height: 44, background: "#fff", border: "1px solid #E8E6E1", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#00a4ef" }}
          >
            <FaMicrosoft size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
