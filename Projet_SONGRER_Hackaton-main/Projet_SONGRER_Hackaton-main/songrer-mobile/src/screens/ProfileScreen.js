import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { dbService } from "../config/api";

export default function ProfileScreen({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = dbService.subscribe("reports", (data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleShowDetails = async (report) => {
    try {
      const latestReport = await dbService.getReportByAnonymousId(report.anonymousId);
      setSelectedCase(latestReport);
    } catch (err) {
      console.warn("Failed to get latest report status:", err);
      setSelectedCase(report);
    }
    setModalVisible(true);
  };

  const totalReports = reports.length;
  const pendingCount = reports.filter(r => r.status === "pending" || r.status === "urgent").length;
  const resolvedCount = reports.filter(r => r.status === "resolved" || r.status === "in_progress").length;

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Pink Header with Profile Details & Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtnAbsolute}
            activeOpacity={0.8}
            onPress={() => onNavigate("ACCUEIL")}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.shieldCircle}>
            <Ionicons name="shield-checkmark" size={32} color="#ffffff" />
          </View>
          <Text style={styles.profileTitle}>Profil anonyme</Text>
          <Text style={styles.profileCode}>Code utilisateur : SG-8392</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Compte protégé et confidentiel</Text>
          </View>
        </View>

        {/* Grid of Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#e91e63" }]}>{totalReports}</Text>
            <Text style={styles.statLabel}>Signalements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#f59e0b" }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#10b981" }]}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Résolus</Text>
          </View>
        </View>

        {/* Case History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionLabel}>Historique des dossiers</Text>
          
          <View style={styles.historyList}>
            {reports.map((item, idx) => {
              const isResolved = item.status === "resolved";
              return (
                <View key={item.id || idx} style={styles.caseCard}>
                  <View style={styles.caseHeader}>
                    <Text style={styles.caseTitle}>Dossier {item.anonymousId}</Text>
                    <View style={[
                      styles.caseStatusBadge,
                      isResolved ? styles.resolvedBadge : styles.pendingBadge
                    ]}>
                      <Text style={[
                        styles.caseStatusText,
                        isResolved ? styles.resolvedBadgeText : styles.pendingBadgeText
                      ]}>
                        {isResolved ? "✓ Résolu" : "⏳ En cours"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.caseSubtitle}>
                    {item.dateString}  •  {item.priority || "Priorité N3"}
                  </Text>

                  <TouchableOpacity 
                    style={styles.detailsBtn} 
                    activeOpacity={0.8}
                    onPress={() => handleShowDetails(item)}
                  >
                    <Text style={styles.detailsBtnText}>📄 Voir les détails</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            {reports.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={42} color="#e91e63" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyText}>Aucun dossier enregistré</Text>
                <Text style={styles.emptySubText}>
                  Vos signalements et discussions de soutien apparaîtront ici de manière sécurisée et anonyme.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Spacing for relative tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* High-Fidelity Details Modal Popup */}
      {/* High-Fidelity Details Modal Popup (using absolute View for 100% cross-platform reliability) */}
      {modalVisible && selectedCase && (
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="folder-open" size={20} color="#e91e63" />
                <Text style={styles.modalTitle}>Détails du Dossier</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              
              {/* Code Anonyme Badge */}
              <View style={styles.modalDetailRow}>
                <Text style={styles.detailTitleLabel}>ID Anonyme :</Text>
                <Text style={styles.detailValueCode}>{selectedCase.anonymousId}</Text>
              </View>

              {/* Date & Priority */}
              <View style={styles.modalDetailRow}>
                <Text style={styles.detailTitleLabel}>Enregistré le :</Text>
                <Text style={styles.detailValueText}>{selectedCase.dateString}</Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.detailTitleLabel}>Niveau de priorité :</Text>
                <Text style={styles.detailValueText}>{selectedCase.priority || "Priorité N3"}</Text>
              </View>

              {/* Status Indicator */}
              <View style={styles.modalDetailRow}>
                <Text style={styles.detailTitleLabel}>État actuel :</Text>
                <View style={[
                  styles.caseStatusBadge,
                  selectedCase.status === "resolved" ? styles.resolvedBadge : styles.pendingBadge,
                  { alignSelf: "flex-start", marginTop: 4 }
                ]}>
                  <Text style={[
                    styles.caseStatusText,
                    selectedCase.status === "resolved" ? styles.resolvedBadgeText : styles.pendingBadgeText
                  ]}>
                    {selectedCase.statusText || (selectedCase.status === "resolved" ? "Résolu" : "En cours")}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionHeader}>Résumé de l'alerte :</Text>
                <Text style={styles.descriptionContent}>{selectedCase.description}</Text>
              </View>

              {/* Conversation History transcript if available */}
              {selectedCase.messages && selectedCase.messages.length > 0 && (
                <View style={styles.transcriptSection}>
                  <Text style={styles.descriptionHeader}>Transcription des échanges :</Text>
                  <View style={styles.transcriptBox}>
                    {selectedCase.messages.map((m, idx) => (
                      <View key={idx} style={styles.transcriptLine}>
                        <Text style={styles.transcriptSender}>
                          {m.sender === "assistant" ? "Ami Solidaire" : "👤 Témoin"} :
                        </Text>
                        <Text style={styles.transcriptText}>{m.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.modalActionBtn}
              activeOpacity={0.8}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalActionBtnText}>Fermer</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#fafafc",
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#e91e63",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 35,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  backBtnAbsolute: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 32,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  shieldCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  profileCode: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -20, // Overlap header
    gap: 12,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.04)",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#666666",
    fontWeight: "700",
  },
  historySection: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  historyList: {
    gap: 15,
  },
  caseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.02)",
  },
  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  caseTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222222",
  },
  caseStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolvedBadge: {
    backgroundColor: "#e6fcf5",
  },
  pendingBadge: {
    backgroundColor: "#fff9db",
  },
  caseStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  resolvedBadgeText: {
    color: "#10b981",
  },
  pendingBadgeText: {
    color: "#f59e0b",
  },
  caseSubtitle: {
    fontSize: 11,
    color: "#888888",
    fontWeight: "500",
    marginBottom: 16,
  },
  detailsBtn: {
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.15)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233, 30, 99, 0.02)",
  },
  detailsBtnText: {
    color: "#e91e63",
    fontSize: 12,
    fontWeight: "800",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    marginVertical: 10,
  },
  modalDetailRow: {
    marginBottom: 12,
  },
  detailTitleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888888",
    textTransform: "uppercase",
  },
  detailValueCode: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e91e63",
    marginTop: 2,
  },
  detailValueText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    marginTop: 2,
  },
  descriptionSection: {
    marginTop: 12,
    backgroundColor: "#fafafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  descriptionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    marginBottom: 6,
  },
  descriptionContent: {
    fontSize: 13,
    lineHeight: 18,
    color: "#333333",
    fontWeight: "500",
  },
  transcriptSection: {
    marginTop: 16,
  },
  transcriptBox: {
    backgroundColor: "#fcf6f8",
    borderWidth: 1,
    borderColor: "#fbe3eb",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  transcriptLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  transcriptSender: {
    fontSize: 12,
    fontWeight: "800",
    color: "#e91e63",
  },
  transcriptText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  modalActionBtn: {
    backgroundColor: "#e91e63",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  modalActionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.05)",
    width: "100%",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  emptySubText: {
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 4,
    lineHeight: 15,
    fontWeight: "500",
  },
});
