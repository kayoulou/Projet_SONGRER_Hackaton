"use client";

import { useState, useEffect } from "react";
import { dbService } from "../../lib/api";

export default function StatisticsManagement() {
  const [stats, setStats] = useState({ id: "global", callsToday: 0, activeCases: 0, womenHelped: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = dbService.subscribe("statistics", (data) => {
      if (data && data.length > 0) {
        setStats(data[0]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStats({ ...stats, [name]: Number(value) || 0 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.saveItem("statistics", stats);
      alert("Compteurs mis à jour avec succès. Les modifications s'afficheront instantanément sur l'application mobile.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour des statistiques");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Chargement de la configuration des compteurs...</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.card}>
        <h4 style={styles.sectionTitle}>⚙️ Gestion des Compteurs de l'Application Mobile</h4>
        <p style={styles.description}>
          Les valeurs ci-dessous sont synchronisées en temps réel et s'affichent directement sur l'écran d'accueil de l'application mobile citoyenne **SONGRER**.
        </p>

        <form onSubmit={handleSave} style={styles.form}>
          <div style={styles.grid}>
            {/* Field 1 */}
            <div style={styles.fieldCard}>
              <div style={styles.fieldHeader}>
                <span style={styles.icon}>📞</span>
                <label style={styles.label}>Appels aujourd'hui</label>
              </div>
              <input
                type="number"
                name="callsToday"
                value={stats.callsToday}
                onChange={handleInputChange}
                min="0"
                required
                style={styles.input}
              />
              <p style={styles.fieldHelp}>Nombre total d'appels à l'aide reçus aujourd'hui (Vocal, Assistant Shield, Téléphone).</p>
            </div>

            {/* Field 2 */}
            <div style={styles.fieldCard}>
              <div style={styles.fieldHeader}>
                <span style={styles.icon}>📂</span>
                <label style={styles.label}>Dossiers en cours de traitement</label>
              </div>
              <input
                type="number"
                name="activeCases"
                value={stats.activeCases}
                onChange={handleInputChange}
                min="0"
                required
                style={styles.input}
              />
              <p style={styles.fieldHelp}>Cas actuellement suivis par nos services ou redirigés vers les ONG partenaires.</p>
            </div>

            {/* Field 3 */}
            <div style={styles.fieldCard}>
              <div style={styles.iconContainer}>
                <div style={styles.fieldHeader}>
                  <span style={styles.icon}>❤️</span>
                  <label style={styles.label}>Femmes aidées (Total)</label>
                </div>
              </div>
              <input
                type="number"
                name="womenHelped"
                value={stats.womenHelped}
                onChange={handleInputChange}
                min="0"
                required
                style={styles.input}
              />
              <p style={styles.fieldHelp}>Nombre total de personnes prises en charge et sécurisées avec succès par la plateforme.</p>
            </div>
          </div>

          <button type="submit" disabled={saving} style={styles.saveBtn}>
            {saving ? "Synchronisation en cours..." : "Enregistrer et Synchroniser sur Mobile"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    color: "var(--text-muted)",
    fontSize: "16px",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-lg)",
    padding: "30px",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--border-color)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  description: {
    fontSize: "14px",
    color: "var(--text-muted)",
    marginBottom: "30px",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  fieldCard: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "var(--background)",
  },
  fieldHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  icon: {
    fontSize: "20px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--foreground)",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid var(--border-color)",
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--primary)",
    outline: "none",
    width: "100%",
    textAlign: "center",
    transition: "border-color 0.2s",
    ":focus": {
      borderColor: "var(--primary)",
    },
  },
  fieldHelp: {
    fontSize: "11px",
    color: "var(--text-muted)",
    lineHeight: "1.4",
  },
  saveBtn: {
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "var(--primary)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(216, 27, 96, 0.2)",
    alignSelf: "flex-end",
    minWidth: "250px",
    transition: "background-color 0.2s",
  },
};
