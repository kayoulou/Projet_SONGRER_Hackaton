import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Share, Clipboard, Alert, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { dbService } from "../config/api";

export default function TrackingScreen({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Subscribe to reports list in real time
    const unsubscribe = dbService.subscribe("reports", (data) => {
      // Sort reports by date (newest first)
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(sorted);
      if (sorted.length > 0) {
        setLatestReport(sorted[0]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCopyCode = (code) => {
    Clipboard.setString(code);
    Alert.alert("Succès", "Identifiant de suivi copié dans le presse-papier.");
  };

  const handleShareCode = async (code) => {
    try {
      await Share.share({
        message: `Mon code anonyme de suivi SONGRER est : ${code}. Gardez-le secret et utilisez-le pour suivre l'état de l'intervention.`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleCaseDetails = (report) => {
    setSelectedCase(report);
    setModalVisible(true);
  };

  const trackingCodeToDisplay = latestReport ? latestReport.anonymousId : "SG-8392-4F-XL2";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => onNavigate("ACCUEIL")}>
          <Text style={styles.backBtnIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MES SIGNALEMENTS</Text>
        <TouchableOpacity style={styles.headerAction} activeOpacity={0.8} onPress={() => onNavigate("ACCUEIL")}>
          <Text style={styles.headerActionIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Top Tracking Code Card */}
      <View style={styles.trackingCard}>
        <Text style={styles.trackingCode}>{trackingCodeToDisplay}</Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => handleCopyCode(trackingCodeToDisplay)}>
            <Text style={styles.actionBtnIcon}>📋</Text>
            <Text style={styles.actionBtnLabel}>Copier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => handleShareCode(trackingCodeToDisplay)}>
            <Text style={styles.actionBtnIcon}>✈️</Text>
            <Text style={styles.actionBtnLabel}>Partager</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reports List Section */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderIcon}>🛡️</Text>
          <Text style={styles.sectionHeaderTitle}>MES SIGNALEMENTS</Text>
        </View>

        <View style={styles.caseList}>
          {reports.map((report, idx) => {
            // Get color indicator based on status
            let dotColor = "#e5c158"; // pending: yellow
            if (report.status === "urgent") dotColor = "#ef4444"; // urgent: red
            if (report.status === "resolved" || report.status === "in_progress") dotColor = "#10b981"; // resolved: green

            return (
              <View key={report.id || idx} style={styles.caseCard}>
                <View style={styles.caseHeader}>
                  <View style={styles.caseTitleRow}>
                    <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.caseTitle}>DOSSIER #{2400 - idx}</Text>
                  </View>
                  <Text style={styles.caseDate}>{report.dateString}</Text>
                </View>

                <Text style={styles.caseStatus}>{report.statusText || "En cours de traitement"}</Text>

                <TouchableOpacity 
                  style={styles.followLink} 
                  activeOpacity={0.7}
                  onPress={() => handleCaseDetails(report)}
                >
                  <Text style={styles.followLinkLabel}>
                    {report.status === "resolved" ? "Voir ➔" : "Suivre ➔"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Bottom spacer padding */}
      <View style={{ height: 100 }} />
    </ScrollView>

      {/* High-Fidelity Details Modal Popup */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible && !!selectedCase}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedCase && (
          <View style={styles.modalOverlay}>
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
                  <Text style={styles.detailValueText}>{selectedCase.dateString || "Date inconnue"}</Text>
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
      </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  header: {
    backgroundColor: "#e91e63",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#d81b60",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnIcon: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "300",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.8,
    flex: 1,
    textAlign: "center",
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionIcon: {
    fontSize: 18,
    color: "#ffffff",
  },
  trackingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    margin: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#e91e63",
  },
  trackingCode: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e91e63",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 30,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnIcon: {
    fontSize: 16,
    color: "#e91e63",
  },
  actionBtnLabel: {
    fontSize: 12,
    color: "#e91e63",
    fontWeight: "700",
  },
  listSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 6,
  },
  sectionHeaderIcon: {
    fontSize: 16,
    color: "#e91e63",
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  caseList: {
    gap: 15,
  },
  caseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.03)",
  },
  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  caseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  caseTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  caseDate: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "600",
  },
  caseStatus: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
    marginBottom: 12,
  },
  followLink: {
    alignSelf: "flex-start",
  },
  followLinkLabel: {
    fontSize: 12,
    color: "#e91e63",
    fontWeight: "800",
  },
  // Modal & Status Styles
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
    flex: 1,
    marginBottom: 20,
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
});
