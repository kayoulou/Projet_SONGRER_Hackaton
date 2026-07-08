"use client";

import { useState, useEffect } from "react";
import { dbService } from "../lib/api";

export default function DashboardHome() {
  const [stats, setStats] = useState({ callsToday: 0, activeCases: 0, womenHelped: 0 });
  const [reports, setReports] = useState([]);
  const [ngosCount, setNgosCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load general statistics
    const unsubscribeStats = dbService.subscribe("statistics", (data) => {
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    });

    // Load reports for overview
    const unsubscribeReports = dbService.subscribe("reports", (data) => {
      setReports(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    // Load NGOs
    const unsubscribeNgos = dbService.subscribe("organizations", (data) => {
      setNgosCount(data.length);
    });

    // Load Videos
    const unsubscribeVideos = dbService.subscribe("videos", (data) => {
      setVideosCount(data.length);
    });

    setLoading(false);

    return () => {
      unsubscribeStats();
      unsubscribeReports();
      unsubscribeNgos();
      unsubscribeVideos();
    };
  }, []);

  if (loading) {
    return <div style={styles.loading}>Chargement des statistiques...</div>;
  }

  // Count reports based on status
  const pendingCount = reports.filter(r => r.status === "pending").length;
  const inProgressCount = reports.filter(r => r.status === "in_progress" || r.status === "resolved").length;
  const urgentCount = reports.filter(r => r.status === "urgent").length;

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Welcome banner */}
      <div style={styles.welcomeBanner}>
        <div style={styles.welcomeLeft}>
          <h3 style={styles.welcomeTitle}>Tableau de bord SONGRER</h3>
          <p style={styles.welcomeSubtitle}>
            Suivi en temps réel des signalements VBG et coordination de l'aide humanitaire.
          </p>
        </div>
        <div style={styles.welcomeRight}>
          <span style={styles.welcomeDate}>Mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={styles.grid}>
        <div style={{ ...styles.card, borderLeft: "4px solid var(--primary)" }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Appels aujourd'hui</span>
            <span style={styles.cardIcon}>📞</span>
          </div>
          <h2 style={styles.cardValue}>{stats.callsToday}</h2>
          <div style={styles.cardFooter}>
            <span style={styles.footerTrend}>Mise à jour en direct</span>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid var(--warning)" }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Dossiers en cours</span>
            <span style={styles.cardIcon}>📂</span>
          </div>
          <h2 style={styles.cardValue}>{stats.activeCases}</h2>
          <div style={styles.cardFooter}>
            <span style={styles.footerTrend}>{inProgressCount} assignés aux ONG</span>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid var(--success)" }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Femmes aidées</span>
            <span style={styles.cardIcon}>❤️</span>
          </div>
          <h2 style={styles.cardValue}>{stats.womenHelped}</h2>
          <div style={styles.cardFooter}>
            <span style={styles.footerTrend}>Objectifs mensuels +20%</span>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid var(--danger)" }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Signalements URGENTS</span>
            <span style={styles.cardIcon}>🚨</span>
          </div>
          <h2 style={{ ...styles.cardValue, color: "var(--danger)" }}>{urgentCount}</h2>
          <div style={styles.cardFooter}>
            <span style={{ ...styles.footerTrend, color: "var(--danger)", fontWeight: "bold" }}>Interventions requises</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Overview Section */}
      <div style={styles.row}>
        {/* Graphical statistics via simulated SVG charts */}
        <div style={styles.chartCard}>
          <h4 style={styles.sectionTitle}>Volume de signalements hebdomadaire</h4>
          <div style={styles.chartContainer}>
            {/* Simple vector representation for an outstanding dashboard aesthetic */}
            <svg viewBox="0 0 500 200" width="100%" height="100%">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#e0e0e0" strokeWidth="2" />

              {/* Grid Labels */}
              <text x="15" y="25" fill="#a0aec0" fontSize="10">80</text>
              <text x="15" y="75" fill="#a0aec0" fontSize="10">40</text>
              <text x="15" y="125" fill="#a0aec0" fontSize="10">20</text>
              <text x="15" y="175" fill="#a0aec0" fontSize="10">0</text>

              {/* Area path */}
              <path
                d="M 40 170 C 80 140, 120 130, 160 110 C 200 90, 240 85, 280 60 C 320 35, 360 45, 400 30 C 440 15, 480 10, 480 10 L 480 170 Z"
                fill="url(#pink-gradient)"
                opacity="0.15"
              />

              {/* Curve Line */}
              <path
                d="M 40 170 C 80 140, 120 130, 160 110 C 200 90, 240 85, 280 60 C 320 35, 360 45, 400 30 C 440 15, 480 10, 480 10"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="160" cy="110" r="5" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
              <circle cx="280" cy="60" r="5" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
              <circle cx="400" cy="30" r="5" fill="var(--primary)" stroke="#fff" strokeWidth="2" />

              {/* Gradients */}
              <defs>
                <linearGradient id="pink-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* X Labels */}
              <text x="40" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Lun</text>
              <text x="113" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Mar</text>
              <text x="186" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Mer</text>
              <text x="259" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Jeu</text>
              <text x="332" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Ven</text>
              <text x="405" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Sam</text>
              <text x="480" y="190" fill="#a0aec0" fontSize="11" textAnchor="middle">Dim</text>
            </svg>
          </div>
        </div>

        {/* Dynamic App Status */}
        <div style={styles.donutCard}>
          <h4 style={styles.sectionTitle}>Répartition des cas VBG</h4>
          <div style={styles.statusBreakdown}>
            <div style={styles.statusItem}>
              <div style={styles.statusInfo}>
                <span style={{ ...styles.statusDot, backgroundColor: "var(--danger)" }} />
                <span style={styles.statusLabel}>Cas Urgents</span>
              </div>
              <span style={styles.statusVal}>{urgentCount}</span>
            </div>
            <div style={styles.statusItem}>
              <div style={styles.statusInfo}>
                <span style={{ ...styles.statusDot, backgroundColor: "var(--warning)" }} />
                <span style={styles.statusLabel}>En attente</span>
              </div>
              <span style={styles.statusVal}>{pendingCount}</span>
            </div>
            <div style={styles.statusItem}>
              <div style={styles.statusInfo}>
                <span style={{ ...styles.statusDot, backgroundColor: "var(--success)" }} />
                <span style={styles.statusLabel}>Pris en charge</span>
              </div>
              <span style={styles.statusVal}>{inProgressCount}</span>
            </div>

            <div style={styles.systemStatsBox}>
              <div style={styles.systemStatItem}>
                <span style={styles.systemStatLabel}>ONG Partenaires</span>
                <span style={styles.systemStatVal}>{ngosCount}</span>
              </div>
              <div style={styles.systemStatItem}>
                <span style={styles.systemStatLabel}>Vidéos applicatives</span>
                <span style={styles.systemStatVal}>{videosCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h4 style={styles.tableTitle}>Derniers Signalements Reçus</h4>
        </div>
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.tableTh}>ID Anonyme</th>
                <th style={styles.tableTh}>Date de réception</th>
                <th style={styles.tableTh}>Statut</th>
                <th style={styles.tableTh}>ONG Assignée</th>
                <th style={styles.tableTh}>Message d'alerte</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 5).map((report) => (
                <tr key={report.id} style={styles.tableRow}>
                  <td style={{ ...styles.tableTd, fontWeight: "700", color: "var(--primary)" }}>
                    {report.anonymousId}
                  </td>
                  <td style={styles.tableTd}>{report.dateString}</td>
                  <td style={styles.tableTd}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          report.status === "urgent"
                            ? "var(--danger-light)"
                            : report.status === "pending"
                            ? "var(--warning-light)"
                            : "var(--success-light)",
                        color:
                          report.status === "urgent"
                            ? "var(--danger)"
                            : report.status === "pending"
                            ? "var(--warning)"
                            : "var(--success)",
                      }}
                    >
                      {report.status === "urgent"
                        ? "🚨 Urgent"
                        : report.status === "pending"
                        ? "⏳ En attente"
                        : "🟢 Pris en charge"}
                    </span>
                  </td>
                  <td style={styles.tableTd}>{report.assignedTo || "Aucune"}</td>
                  <td style={{ ...styles.tableTd, maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {report.description}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ ...styles.tableTd, textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    Aucun signalement en base de données.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    color: "var(--text-muted)",
    fontSize: "16px",
    fontWeight: "600",
  },
  welcomeBanner: {
    background: "var(--primary-gradient)",
    borderRadius: "var(--radius-lg)",
    padding: "24px 30px",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(216, 27, 96, 0.15)",
  },
  welcomeTitle: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "6px",
  },
  welcomeSubtitle: {
    fontSize: "14px",
    opacity: 0.9,
    fontWeight: "500",
  },
  welcomeDate: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardIcon: {
    fontSize: "20px",
  },
  cardValue: {
    fontSize: "32px",
    fontWeight: "800",
  },
  cardFooter: {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: "500",
    marginTop: "4px",
  },
  footerTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
  },
  chartCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
    minHeight: "300px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    marginBottom: "20px",
  },
  chartContainer: {
    height: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
  },
  statusBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
  },
  statusItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-color)",
  },
  statusInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  statusLabel: {
    fontSize: "14px",
    fontWeight: "600",
  },
  statusVal: {
    fontSize: "16px",
    fontWeight: "800",
  },
  systemStatsBox: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "var(--background)",
    borderRadius: "var(--radius-sm)",
    display: "flex",
    justifyContent: "space-around",
    gap: "12px",
  },
  systemStatItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  systemStatLabel: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  systemStatVal: {
    fontSize: "18px",
    fontWeight: "800",
    color: "var(--primary)",
  },
  tableCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  tableTitle: {
    fontSize: "16px",
    fontWeight: "800",
  },
  tableResponsive: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeadRow: {
    borderBottom: "2px solid var(--border-color)",
  },
  tableTh: {
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "rgba(0,0,0,0.02)",
    },
  },
  tableTd: {
    padding: "16px",
    fontSize: "14px",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
};
