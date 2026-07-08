import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Platform, Text, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import VideosScreen from "./src/screens/VideosScreen";
import DiscussionScreen from "./src/screens/ReportScreen";
import VocalReportScreen from "./src/screens/VocalReportScreen";
import HelpScreen from "./src/screens/HelpScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

export default function App() {
  const [currentTab, setCurrentTab] = useState("ACCUEIL");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case "ACCUEIL":
        return <VideosScreen onNavigate={setCurrentTab} />;
      case "DISCUSSION":
        return <DiscussionScreen onNavigate={setCurrentTab} />;
      case "VOCAL_REPORT":
        return <VocalReportScreen onNavigate={setCurrentTab} />;
      case "AIDE":
        return <HelpScreen onNavigate={setCurrentTab} />;
      case "PROFIL":
        return <ProfileScreen onNavigate={setCurrentTab} />;
      default:
        return <VideosScreen onNavigate={setCurrentTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* App Content Viewport */}
      <View style={styles.screenContainer}>
        {renderContent()}
      </View>

      {/* Premium Uniform Bottom Navigation Bar (Hidden when keyboard is active) */}
      {!isKeyboardVisible && (
        <View style={styles.tabBar}>
          {/* Tab 1: ACCUEIL (Videos) */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setCurrentTab("ACCUEIL")}
          >
            <Ionicons 
              name={currentTab === "ACCUEIL" ? "home" : "home-outline"} 
              size={22} 
              color={currentTab === "ACCUEIL" ? "#e91e63" : "#8e8e93"} 
            />
            <Text style={[styles.tabLabel, currentTab === "ACCUEIL" && styles.tabLabelActive]}>
              Accueil
            </Text>
          </TouchableOpacity>

          {/* Tab 2: DISCUSSION (AI Chat Counselor Friend) */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setCurrentTab("DISCUSSION")}
          >
            <Ionicons 
              name={currentTab === "DISCUSSION" ? "chatbubbles" : "chatbubbles-outline"} 
              size={22} 
              color={currentTab === "DISCUSSION" ? "#e91e63" : "#8e8e93"} 
            />
            <Text style={[styles.tabLabel, currentTab === "DISCUSSION" && styles.tabLabelActive]}>
              Discussion
            </Text>
          </TouchableOpacity>

          {/* Tab 3: VOCAL (Dedicated Voice Report Portal) */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setCurrentTab("VOCAL_REPORT")}
          >
            <Ionicons 
              name="mic" 
              size={22} 
              color={currentTab === "VOCAL_REPORT" ? "#e91e63" : "#8e8e93"} 
            />
            <Text style={[styles.tabLabel, currentTab === "VOCAL_REPORT" && styles.tabLabelActive]}>
              Vocal
            </Text>
          </TouchableOpacity>

          {/* Tab 4: CENTRE D'AIDE */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setCurrentTab("AIDE")}
          >
            <Ionicons 
              name={currentTab === "AIDE" ? "help-circle" : "help-circle-outline"} 
              size={22} 
              color={currentTab === "AIDE" ? "#e91e63" : "#8e8e93"} 
            />
            <Text style={[styles.tabLabel, currentTab === "AIDE" && styles.tabLabelActive]}>
              Aide
            </Text>
          </TouchableOpacity>

          {/* Tab 5: PROFIL */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setCurrentTab("PROFIL")}
          >
            <Ionicons 
              name={currentTab === "PROFIL" ? "person" : "person-outline"} 
              size={22} 
              color={currentTab === "PROFIL" ? "#e91e63" : "#8e8e93"} 
            />
            <Text style={[styles.tabLabel, currentTab === "PROFIL" && styles.tabLabelActive]}>
              Profil
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e91e63", // Match header background
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  tabBar: {
    height: Platform.OS === "ios" ? 85 : 110, // Increased height on Android to prevent overlap with translucent navigation keys
    backgroundColor: "#ffffff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(233, 30, 99, 0.08)",
    paddingBottom: Platform.OS === "ios" ? 18 : 50, // Large bottom padding on Android to push icons above system keys
    paddingTop: 10,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
  },
  tabLabelActive: {
    color: "#e91e63",
  },
});
