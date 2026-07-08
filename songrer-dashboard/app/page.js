"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "./lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    authService.getCurrentUser().then((user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="animate-fade-in">
        <div style={styles.logoContainer}>
          <div style={styles.logoBadge}>⚡</div>
          <h1 style={styles.title}>SONGRER</h1>
          <p style={styles.subtitle}>Portail Administration VBG</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@songrer.org"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            💡 Mode Démo : Utilisez <strong>admin@songrer.org</strong> et le mot de passe <strong>admin123</strong> pour vous connecter.
          </p>
        </div>

        <p style={styles.footerText}>Plateforme SONGRER &copy; 2026 - Sécurisé et Confidentiel</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fce4ec 0%, #f8f9fa 50%, #fce4ec 100%)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "var(--card-bg, #ffffff)",
    borderRadius: "20px",
    padding: "40px 30px",
    boxShadow: "0 15px 35px rgba(216, 27, 96, 0.08), 0 5px 15px rgba(0, 0, 0, 0.03)",
    border: "1px solid rgba(216, 27, 96, 0.05)",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logoBadge: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "var(--primary-gradient)",
    color: "#ffffff",
    fontSize: "28px",
    marginBottom: "15px",
    boxShadow: "0 8px 16px rgba(216, 27, 96, 0.3)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "var(--primary)",
    letterSpacing: "1px",
    marginBottom: "5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-muted)",
    fontWeight: "500",
  },
  errorAlert: {
    background: "#fff5f5",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "20px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--foreground)",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border-color)",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    background: "var(--background)",
    color: "var(--foreground)",
  },
  button: {
    background: "var(--primary-gradient)",
    color: "#ffffff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(216, 27, 96, 0.25)",
    transition: "transform 0.2s, opacity 0.2s",
    marginTop: "10px",
  },
  infoBox: {
    marginTop: "25px",
    background: "rgba(216, 27, 96, 0.04)",
    border: "1px dashed rgba(216, 27, 96, 0.2)",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "12px",
    color: "var(--foreground)",
    lineHeight: "1.5",
  },
  infoText: {
    margin: 0,
  },
  footerText: {
    textAlign: "center",
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "30px",
  },
};
