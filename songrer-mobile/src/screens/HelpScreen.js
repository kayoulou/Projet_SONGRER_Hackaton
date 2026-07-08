import React, { useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { dbService } from "../config/api";

export default function HelpScreen({ onNavigate }) {
  const scrollViewRef = useRef(null);
  
  const logEmergencyCall = async (number, label) => {
    try {
      const anonymousCode = `SG-${Math.floor(1000 + Math.random() * 9000)}-4F-XL2`;
      const reportData = {
        anonymousId: anonymousCode,
        status: "urgent",
        statusText: "🚨 APPEL D'URGENCE",
        priority: "N3",
        channel: "voice",
        description: `Appel d'urgence direct initié par l'utilisateur vers le numéro ${label} (${number}).`,
        dateString: new Date().toLocaleDateString("fr-FR"),
        createdAt: new Date().toISOString(),
        messages: [
          {
            sender: "user",
            text: `📞 Lancement de l'appel d'urgence vers ${label} (${number}).`,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          }
        ]
      };
      await dbService.saveItem("reports", reportData);
    } catch (err) {
      console.warn("Failed to log call:", err);
    }
  };

  const handleCallNumber = (num, label) => {
    Alert.alert(
      "Appel d'urgence",
      `Voulez-vous lancer un appel au ${label} (${num}) ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Appeler", onPress: () => {
          logEmergencyCall(num, label);
          Linking.openURL(`tel:${num}`).catch(() => {
            Alert.alert("Erreur", "La fonctionnalité d'appel n'est pas disponible sur cet appareil.");
          });
        } }
      ]
    );
  };

  const handleOpenItinerary = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
    });

    Alert.alert(
      "Calcul de l'itinéraire",
      `Ouvrir l'application de navigation pour aller à : ${address} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Y aller", onPress: () => Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
        }) }
      ]
    );
  };

  const scrollToCenters = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const hotlines = [
    { name: "Ligne VBG", desc: "Gratuit 24/7", number: "116" },
    { name: "Écoute psychologique", desc: "Lun-Dim 8h-20h", number: "1011" },
    { name: "Police secours", desc: "Urgences", number: "17" }
  ];

  const centers = [
    { name: "Centre VBG Nord", address: "123 Rue de la Paix, Dakar", distance: "2.3 km", phone: "+221 33 800 00 01", status: "Ouvert" },
    { name: "Clinique Solidarité VBG", address: "Avenue Cheikh Anta Diop, Dakar", distance: "4.5 km", phone: "+221 33 800 00 02", status: "Ouvert" }
  ];

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      ref={scrollViewRef}
    >
      {/* Pink Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate("ACCUEIL")}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centre d'Aide</Text>
        </View>
        <Text style={styles.headerSubtitle}>Ressources et support disponibles</Text>
      </View>

      {/* Fast Action Grid */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionLabel}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          {/* Urgent Call */}
          <TouchableOpacity 
            style={styles.actionBtnPink} 
            activeOpacity={0.8}
            onPress={() => handleCallNumber("116", "Urgence VBG")}
          >
            <Ionicons name="call" size={24} color="#ffffff" />
            <Text style={styles.actionBtnLabelPink}>Appel d'urgence</Text>
          </TouchableOpacity>

          {/* Near centers */}
          <TouchableOpacity 
            style={styles.actionBtnWhite} 
            activeOpacity={0.8}
            onPress={scrollToCenters}
          >
            <Ionicons name="location" size={24} color="#e91e63" />
            <Text style={styles.actionBtnLabelWhite}>Centres proches</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Crisis Phone Numbers */}
      <View style={styles.numbersSection}>
        <Text style={styles.sectionLabel}>Numéros d'urgence</Text>
        <View style={styles.numbersList}>
          {hotlines.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.numberCard} 
              activeOpacity={0.8}
              onPress={() => handleCallNumber(item.number, item.name)}
            >
              <View style={styles.numberLeft}>
                <View style={styles.numberIconContainer}>
                  <Ionicons name="call-outline" size={16} color="#e91e63" />
                </View>
                <View style={styles.numberInfo}>
                  <Text style={styles.numberName}>{item.name}</Text>
                  <Text style={styles.numberDesc}>{item.desc}</Text>
                </View>
              </View>

              <View style={styles.greenBadge}>
                <Text style={styles.greenBadgeText}>{item.number}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nearest VBG Care Centers */}
      <View style={styles.centersSection}>
        <Text style={styles.sectionLabel}>Centres VBG proches</Text>
        
        <View style={styles.centersList}>
          {centers.map((c, index) => (
            <View key={index} style={styles.centerCard}>
              <View style={styles.centerHeader}>
                <Text style={styles.centerName}>{c.name}</Text>
                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>🟢 {c.status}</Text>
                </View>
              </View>
              
              <Text style={styles.centerAddress}>📍 {c.address}</Text>
              
              <View style={styles.centerFooter}>
                <Text style={styles.centerDistance}>{c.distance}</Text>
                <View style={styles.centerActionsRow}>
                  <TouchableOpacity 
                    style={styles.centerCallBtn}
                    onPress={() => handleCallNumber(c.phone, c.name)}
                  >
                    <Ionicons name="call" size={13} color="#e91e63" style={{ marginRight: 4 }} />
                    <Text style={styles.centerCallBtnText}>Appeler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.routeBtn}
                    onPress={() => handleOpenItinerary(c.address)}
                  >
                    <Text style={styles.routeBtnText}>Itinéraire ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Spacing for relative tab bar */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafc",
  },
  header: {
    backgroundColor: "#e91e63",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 32, // Offset for back btn align
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  actionsSection: {
    padding: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 15,
  },
  actionBtnPink: {
    flex: 1,
    backgroundColor: "#e91e63",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  actionBtnLabelPink: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  actionBtnWhite: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(233, 30, 99, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  actionBtnLabelWhite: {
    color: "#e91e63",
    fontSize: 12,
    fontWeight: "800",
  },
  numbersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  numbersList: {
    gap: 12,
  },
  numberCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.02)",
  },
  numberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(233, 30, 99, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  numberInfo: {
    justifyContent: "center",
  },
  numberName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },
  numberDesc: {
    fontSize: 10,
    color: "#888888",
    fontWeight: "500",
    marginTop: 2,
  },
  greenBadge: {
    backgroundColor: "#10b981",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  greenBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  centersSection: {
    paddingHorizontal: 20,
  },
  centersList: {
    gap: 12,
  },
  centerCard: {
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
  centerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  centerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  openBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10b981",
  },
  centerAddress: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 12,
  },
  centerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f5f5f7",
    paddingTop: 12,
  },
  centerDistance: {
    fontSize: 12,
    color: "#e91e63",
    fontWeight: "800",
  },
  centerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  centerCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(233, 30, 99, 0.02)",
  },
  centerCallBtnText: {
    fontSize: 11,
    color: "#e91e63",
    fontWeight: "700",
  },
  routeBtn: {
    paddingVertical: 6,
  },
  routeBtnText: {
    fontSize: 11,
    color: "#e91e63",
    fontWeight: "800",
  },
});
