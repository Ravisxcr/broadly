"use client";

import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { authClient } from "../../lib/auth-client";
import { fetchAuthProviders } from "../../lib/trello/api";
import { FaGithub, FaMicrosoft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function LoginView() {
  const { theme } = useTheme();

  const { data: authProviders } = useQuery({ queryKey: ["auth-providers"], queryFn: fetchAuthProviders });
  const providers = authProviders?.providers ?? [];

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bgApp }}>
      <div style={{ width: 380, padding: "40px 36px", background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(20,20,30,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: theme.accent, flexShrink: 0 }} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: theme.text }}>Boardly</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: theme.text }}>Welcome back</div>
        <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 28 }}>Continue with one of the providers below.</div>

        {providers.length > 0 ? (
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
        ) : (
          <div style={{ fontSize: 13, color: theme.textSecondary }}>No login providers are configured.</div>
        )}
      </div>
    </div>
  );
}
