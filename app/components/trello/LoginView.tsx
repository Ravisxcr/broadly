"use client";

interface LoginViewProps {
  onLoginAdmin: () => void;
  onLoginMember: () => void;
}

export default function LoginView({ onLoginAdmin, onLoginMember }: LoginViewProps) {
  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF9" }}>
      <div style={{ width: 380, padding: "40px 36px", background: "#FFFFFF", border: "1px solid #E8E6E1", borderRadius: 16, boxShadow: "0 20px 60px rgba(20,20,30,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#4F46E5", flexShrink: 0 }} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Boardly</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 14, color: "#726F68", marginBottom: 28 }}>Choose a demo account to log in with.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#726F68", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value="ari@studio.com"
              readOnly
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E6E1", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#FAFAF9", color: "#1F2430" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#726F68", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value="••••••••"
              readOnly
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E6E1", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#FAFAF9", color: "#1F2430" }}
            />
          </div>
          <button
            onClick={onLoginAdmin}
            style={{ marginTop: 8, width: "100%", padding: 11, background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Log in as Admin (Ari)
          </button>
          <button
            onClick={onLoginMember}
            style={{ width: "100%", padding: 11, background: "transparent", color: "#4F46E5", border: "1px solid #E8E6E1", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
          >
            Log in as Member (Jess)
          </button>
        </div>
      </div>
    </div>
  );
}
