import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Linking, Platform, Alert } from "react-native";
import { dbService } from "../config/api";

export default function HomeScreen({ onNavigate }) {
  const [stats, setStats] = useState({ callsToday: 142, activeCases: 34, womenHelped: 12 });
  const [ngos, setNgos] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);

  useEffect(() => {
    // Subscribe to statistics
    const unsubscribeStats = dbService.subscribe("statistics", (data) => {
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    });

    // Subscribe to NGOs
    const unsubscribeOrgs = dbService.subscribe("organizations", (data) => {
      setNgos(data);
    });

    // Subscribe to Videos to grab first video as featured
    const unsubscribeVideos = dbService.subscribe("videos", (data) => {
      if (data && data.length > 0) {
        setFeaturedVideo(data[0]);
      }
    });

    return () => {
      unsubscribeStats();
      unsubscribeOrgs();
      unsubscribeVideos();
    };
  }, []);

  const handleCall = (orgName, phone) => {
    Alert.alert(
      "Appel d'urgence",
      `Voulez-vous appeler ${orgName} au ${phone} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Appeler", onPress: () => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`).catch(() => {
          Alert.alert("Erreur", "La fonctionnalité d'appel n'est pas disponible sur cet appareil.");
        }) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header pink gradient styling */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>SONGRER</Text>
          <Text style={styles.headerSubtitle}>Plateforme de soutien et signalement VBG</Text>
        </View>
        <TouchableOpacity style={styles.headerAction} activeOpacity={0.8} onPress={() => onNavigate("DÉNONCER")}>
          <Text style={styles.headerActionIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Video Card */}
      {featuredVideo && (
        <View style={styles.videoCard}>
          <View style={styles.thumbnailContainer}>
            {featuredVideo.thumbnailUrl ? (
              <Image
                source={typeof featuredVideo.thumbnailUrl === "number" ? featuredVideo.thumbnailUrl : { uri: featuredVideo.thumbnailUrl }}
                style={styles.thumbnail}
              />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Text style={styles.placeholderTitle}>SONGRER TV</Text>
                <Text style={styles.placeholderSubtitle}>Sensibilisation & Témoignages</Text>
              </View>
            )}
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NOUVEAU</Text>
            </View>
            <TouchableOpacity style={styles.playButton} activeOpacity={0.9} onPress={() => onNavigate("VIDÉOS")}>
              <View style={styles.playIconContainer}>
                <Text style={styles.playIconText}>▶️</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.videoDetails}>
            <Text style={styles.videoTitle}>{featuredVideo.title}</Text>
            <View style={styles.videoFooter}>
              <TouchableOpacity style={styles.watchBtn} activeOpacity={0.8} onPress={() => onNavigate("VIDÉOS")}>
                <Text style={styles.watchBtnIcon}>▶️</Text>
                <Text style={styles.watchBtnText}>Regarder</Text>
              </TouchableOpacity>
              <Text style={styles.viewsCount}>👁️ {featuredVideo.views} vues</Text>
            </View>
          </View>
        </View>
      )}

      {/* Statistics Counter Boxes */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.callsToday}</Text>
          <Text style={styles.statLabel}>Appels{"\n"}aujourd'hui</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.activeCases}</Text>
          <Text style={styles.statLabel}>Dossiers{"\n"}en cours</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.womenHelped}</Text>
          <Text style={styles.statLabel}>Femmes{"\n"}aidées</Text>
        </View>
      </View>

      {/* NGO List */}
      <View style={styles.ngoSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📍</Text>
          <Text style={styles.sectionTitle}>ONG PROCHES</Text>
        </View>

        <View style={styles.ngoList}>
          {ngos.map((ngo) => (
            <View key={ngo.id} style={styles.ngoCard}>
              <View style={styles.ngoLeft}>
                <View style={styles.ngoIconContainer}>
                  <Text style={styles.ngoIcon}>
                    {ngo.icon === "shield" ? "🛡️" : ngo.icon === "heart" ? "❤️" : "🏠"}
                  </Text>
                </View>
                <View style={styles.ngoInfo}>
                  <Text style={styles.ngoName}>{ngo.name}</Text>
                  <Text style={styles.ngoDistance}>📍 {ngo.distance}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.callBtn} 
                activeOpacity={0.8}
                onPress={() => handleCall(ngo.name, ngo.phone)}
              >
                <Text style={styles.callBtnIcon}>📞</Text>
                <Text style={styles.callBtnText}>Appeler</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      
      {/* Padding space to prevent overlap with bottom navigation */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  header: {
    backgroundGradient: "linear-gradient(90deg, #d81b60 0%, #ff4081 100%)", // Simulated gradient
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
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
  videoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    margin: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  thumbnailContainer: {
    height: 180,
    position: "relative",
    backgroundColor: "#eaeaea",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#ff007f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  playIconText: {
    fontSize: 18,
    marginLeft: 2,
  },
  videoDetails: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    lineHeight: 20,
  },
  videoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  watchBtn: {
    backgroundColor: "#e91e63",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  watchBtnIcon: {
    color: "#ffffff",
    fontSize: 10,
    marginRight: 6,
  },
  watchBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  viewsCount: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.05)",
  },
  statNumber: {
    color: "#e91e63",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },
  ngoSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionIcon: {
    fontSize: 14,
    color: "#e91e63",
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  ngoList: {
    gap: 12,
  },
  ngoCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.03)",
  },
  ngoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ngoIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(233, 30, 99, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ngoIcon: {
    fontSize: 18,
  },
  ngoInfo: {
    flex: 1,
  },
  ngoName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  ngoDistance: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: "#e91e63",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  callBtnIcon: {
    color: "#ffffff",
    fontSize: 12,
    marginRight: 6,
  },
  callBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  placeholderThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e1e2d",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderTitle: {
    color: "#e91e63",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  placeholderSubtitle: {
    color: "#8e8e93",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
