"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { authClient } from "../../lib/auth-client";
import { fetchAuthProviders } from "../../lib/trello/api";
import { FaGithub, FaMicrosoft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function LoginView() {
  const { login, roster } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEV_EMAIL ?? "");
  const [password, setPassword] = useState(process.env.NEXT_PUBLIC_DEV_PASSWORD ?? "");
  const [error, setError] = useState("");

  const { data: authProviders } = useQuery({ queryKey: ["auth-providers"], queryFn: fetchAuthProviders });
  const providers = authProviders?.providers ?? [];

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
    <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bgApp }}>
      <div style={{ width: 380, padding: "40px 36px", background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(20,20,30,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: theme.accent, flexShrink: 0 }} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: theme.text }}>Boardly</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: theme.text }}>Welcome back</div>
        <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 28 }}>Log in with your demo account.</div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
            />
          </div>
          {error && <div style={{ fontSize: 12, color: "#EF4444" }}>{error}</div>}
          <button
            type="submit"
            style={{ marginTop: 8, width: "100%", padding: 11, background: theme.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Log in
          </button>
        </form>

        {providers.length > 0 && (
          <>
            <div style={{ marginTop: 24, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
              <div style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>OR</div>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {providers.includes("github") && (
                <button
                  onClick={() => authClient.signIn.social({ provider: "github" })}
                  title="Log in with GitHub"
                  style={{ width: 44, height: 44, background: "#24292e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <FaGithub size={20} />
                </button>
              )}
              {providers.includes("google") && (
                <button
                  onClick={() => authClient.signIn.social({ provider: "google" })}
                  title="Log in with Google"
                  style={{ width: 44, height: 44, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <FcGoogle size={20} />
                </button>
              )}
              {providers.includes("microsoft") && (
                <button
                  onClick={() => authClient.signIn.social({ provider: "microsoft" })}
                  title="Log in with Microsoft"
                  style={{ width: 44, height: 44, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#00a4ef" }}
                >
                  <FaMicrosoft size={20} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
