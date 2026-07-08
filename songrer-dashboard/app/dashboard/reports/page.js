"use client";

import { useState, useEffect } from "react";
import { dbService } from "../../lib/api";

export default function ReportsManagement() {
  const [reports, setReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [assigningNgo, setAssigningNgo] = useState("");
  const [changingStatus, setChangingStatus] = useState("");

  useEffect(() => {
    // Load reports list
    const unsubscribeReports = dbService.subscribe("reports", (data) => {
      setReports(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    });

    // Load organizations for assign drop-down
    const unsubscribeOrgs = dbService.subscribe("organizations", (data) => {
      setOrganizations(data);
    });

    return () => {
      unsubscribeReports();
      unsubscribeOrgs();
    };
  }, []);

  const handleUpdateReport = async (reportId) => {
    const updates = {};
    if (assigningNgo) {
      updates.assignedTo = assigningNgo;
      // Automatically transition to resolved / active state assigned to NGO
      if (changingStatus === "" || changingStatus === "pending") {
        updates.status = "resolved";
        updates.statusText = `Pris en charge par ONG ${assigningNgo}`;
      }
    }
    if (changingStatus) {
      updates.status = changingStatus;
      if (changingStatus === "urgent") {
        updates.statusText = "URGENT - Intervention en cours";
      } else if (changingStatus === "pending") {
        updates.statusText = "En cours de traitement";
        updates.assignedTo = "";
      } else if (changingStatus === "resolved" && assigningNgo) {
        updates.statusText = `Pris en charge par ONG ${assigningNgo}`;
      } else if (changingStatus === "resolved") {
        updates.statusText = "Pris en charge";
      }
    }

    try {
      await dbService.updateItem("reports", reportId, updates);
      
      // Update selected report view
      const updatedReport = await dbService.getItem("reports", reportId);
      setSelectedReport(updatedReport);
      
      // Reset values
      setAssigningNgo("");
      setChangingStatus("");
      alert("Signalement mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus === "all") return true;
    return report.status === filterStatus;
  });

  if (loading) {
    return <div style={styles.loading}>Chargement des signalements VBG...</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div style={styles.filters}>
          <button
            onClick={() => setFilterStatus("all")}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === "all" ? "var(--primary)" : "var(--card-bg)", color: filterStatus === "all" ? "#fff" : "var(--foreground)" }}
          >
            Tous ({reports.length})
          </button>
          <button
            onClick={() => setFilterStatus("urgent")}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === "urgent" ? "var(--danger)" : "var(--card-bg)", color: filterStatus === "urgent" ? "#fff" : "var(--foreground)" }}
          >
            🚨 Urgents ({reports.filter(r => r.status === "urgent").length})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === "pending" ? "var(--warning)" : "var(--card-bg)", color: filterStatus === "pending" ? "#fff" : "var(--foreground)" }}
          >
            ⏳ En cours de traitement ({reports.filter(r => r.status === "pending").length})
          </button>
          <button
            onClick={() => setFilterStatus("resolved")}
            style={{ ...styles.filterBtn, backgroundColor: filterStatus === "resolved" ? "var(--success)" : "var(--card-bg)", color: filterStatus === "resolved" ? "#fff" : "var(--foreground)" }}
          >
            🟢 Pris en charge ({reports.filter(r => r.status === "resolved").length})
          </button>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* Reports list */}
        <div style={styles.listSection}>
          <h4 style={styles.listTitle}>Dossiers anonymes ({filteredReports.length})</h4>
          <div style={styles.cardsScroll}>
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => {
                  setSelectedReport(report);
                  setAssigningNgo(report.assignedTo || "");
                  setChangingStatus(report.status || "");
                }}
                style={{
                  ...styles.reportItemCard,
                  borderColor: selectedReport?.id === report.id ? "var(--primary)" : "var(--border-color)",
                  boxShadow: selectedReport?.id === report.id ? "var(--shadow-premium)" : "var(--shadow-sm)"
                }}
              >
                <div style={styles.itemHeader}>
                  <span style={styles.itemId}>{report.anonymousId}</span>
                  <span style={styles.itemDate}>{report.dateString}</span>
                </div>
                
                <p style={styles.itemDesc}>{report.description}</p>
                
                <div style={styles.itemFooter}>
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
                    {report.status === "urgent" ? "URGENT" : report.status === "pending" ? "TRAITEMENT" : "PRIS EN CHARGE"}
                  </span>
                  {report.assignedTo && <span style={styles.assignedNgoBadge}>🏢 {report.assignedTo}</span>}
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div style={styles.noData}>Aucun dossier correspondant à cette catégorie.</div>
            )}
          </div>
        </div>

        {/* Selected report detail view */}
        <div style={styles.detailSection}>
          {selectedReport ? (
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <div>
                  <h3 style={styles.detailTitle}>Détails du Signalement</h3>
                  <span style={styles.detailIdText}>{selectedReport.anonymousId}</span>
                </div>
                <div style={styles.dateLabel}>Reçu le : {selectedReport.dateString}</div>
              </div>

              {/* Status Banner */}
              <div style={{
                ...styles.statusBanner,
                backgroundColor:
                  selectedReport.status === "urgent"
                    ? "var(--danger-light)"
                    : selectedReport.status === "pending"
                    ? "var(--warning-light)"
                    : "var(--success-light)",
                color:
                  selectedReport.status === "urgent"
                    ? "var(--danger)"
                    : selectedReport.status === "pending"
                    ? "var(--warning)"
                    : "var(--success)",
              }}>
                📢 Statut actuel : <strong>{selectedReport.statusText || selectedReport.status}</strong>
              </div>

              {/* Chat Transcript / Assistant Shield conversation history */}
              <div style={styles.chatSection}>
                <h4 style={styles.subTitle}>Transcription de la discussion (Assistant Shield)</h4>
                <div style={styles.chatHistory}>
                  {selectedReport.messages && selectedReport.messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        ...styles.chatBubble,
                        alignSelf: msg.sender === "assistant" ? "flex-start" : "flex-end",
                        backgroundColor: msg.sender === "assistant" ? "#f1f3f5" : "var(--primary-light)",
                        color: msg.sender === "assistant" ? "#333" : "var(--primary)",
                        borderBottomLeftRadius: msg.sender === "assistant" ? "2px" : "12px",
                        borderBottomRightRadius: msg.sender === "assistant" ? "12px" : "2px"
                      }}
                    >
                      <div style={styles.bubbleSender}>{msg.sender === "assistant" ? "🛡️ Shield (AI)" : "👤 Témoin"}</div>
                      <div style={styles.bubbleText}>{msg.text}</div>
                      <div style={styles.bubbleTime}>{msg.time}</div>
                    </div>
                  ))}
                  {(!selectedReport.messages || selectedReport.messages.length === 0) && (
                    <div style={styles.noData}>Pas d'échange de messages enregistré (signalement par appel direct ou formulaire).</div>
                  )}
                </div>
              </div>

              {/* Description summary */}
              <div style={styles.infoGroup}>
                <h4 style={styles.subTitle}>Résumé de l'alerte</h4>
                <div style={styles.descriptionBox}>{selectedReport.description}</div>
              </div>

              {/* Action Form */}
              <div style={styles.actionsPanel}>
                <h4 style={styles.subTitle}>Prendre des mesures d'aide</h4>
                <div style={styles.actionsGrid}>
                  <div style={styles.actionField}>
                    <label style={styles.fieldLabel}>Assigner à une ONG</label>
                    <select
                      value={assigningNgo}
                      onChange={(e) => setAssigningNgo(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Aucune (Non assigné)</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.name}>
                          {org.name} ({org.distance})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.actionField}>
                    <label style={styles.fieldLabel}>Changer le statut du dossier</label>
                    <select
                      value={changingStatus}
                      onChange={(e) => setChangingStatus(e.target.value)}
                      style={styles.select}
                    >
                      <option value="pending">⏳ En attente de traitement</option>
                      <option value="resolved">🟢 Pris en charge / Résolu</option>
                      <option value="urgent">🚨 Urgent (Intervention terrain)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleUpdateReport(selectedReport.id)}
                  style={styles.saveBtn}
                >
                  Confirmer et Enregistrer les modifications
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.emptyDetail}>
              <span style={styles.emptyIcon}>🚨</span>
              <p>Sélectionnez un signalement dans la liste pour voir les détails et assigner des secours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "calc(100vh - 130px)",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    color: "var(--text-muted)",
    fontSize: "16px",
    fontWeight: "600",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid var(--border-color)",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "24px",
    flex: 1,
    minHeight: 0, // critical for scroll container
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  listTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "var(--text-muted)",
  },
  cardsScroll: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
    paddingRight: "6px",
    flex: 1,
  },
  reportItemCard: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  itemId: {
    fontWeight: "800",
    color: "var(--primary)",
    fontSize: "14px",
  },
  itemDate: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  itemDesc: {
    fontSize: "13px",
    color: "var(--foreground)",
    lineHeight: "1.4",
    marginBottom: "12px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "800",
  },
  assignedNgoBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--secondary)",
  },
  noData: {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "30px",
    fontSize: "13px",
    fontWeight: "600",
  },
  detailSection: {
    overflow: "hidden",
    height: "100%",
  },
  detailCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-md)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    overflowY: "auto",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "16px",
  },
  detailTitle: {
    fontSize: "18px",
    fontWeight: "800",
  },
  detailIdText: {
    fontSize: "13px",
    color: "var(--primary)",
    fontWeight: "700",
  },
  dateLabel: {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  statusBanner: {
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "var(--secondary)",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  chatSection: {
    marginBottom: "20px",
  },
  chatHistory: {
    maxHeight: "220px",
    overflowY: "auto",
    padding: "16px",
    backgroundColor: "var(--background)",
    borderRadius: "var(--radius-sm)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    border: "1px solid var(--border-color)",
  },
  chatBubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    lineHeight: "1.4",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  bubbleSender: {
    fontSize: "9px",
    fontWeight: "800",
    textTransform: "uppercase",
    opacity: 0.8,
  },
  bubbleText: {
    fontWeight: "500",
  },
  bubbleTime: {
    fontSize: "8px",
    alignSelf: "flex-end",
    opacity: 0.6,
  },
  infoGroup: {
    marginBottom: "20px",
  },
  descriptionBox: {
    padding: "14px",
    backgroundColor: "var(--background)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)",
    fontSize: "13px",
    lineHeight: "1.5",
    color: "var(--foreground)",
  },
  actionsPanel: {
    marginTop: "auto",
    paddingTop: "20px",
    borderTop: "1px solid var(--border-color)",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  actionField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    outline: "none",
    fontSize: "13px",
    cursor: "pointer",
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--primary)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "var(--primary-hover)",
    },
  },
  emptyDetail: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    border: "1px dashed var(--border-color)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    textAlign: "center",
    color: "var(--text-muted)",
    gap: "16px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
};
