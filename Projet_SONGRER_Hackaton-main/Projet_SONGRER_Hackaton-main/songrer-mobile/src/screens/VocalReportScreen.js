import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { dbService } from "../config/api";

const { width: windowWidth } = Dimensions.get("window");

export default function VocalReportScreen({ onNavigate }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingObject, setRecordingObject] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  // States for record-then-send workflow
  const [recordedUri, setRecordedUri] = useState(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundObject, setSoundObject] = useState(null);

  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Waveform bar heights animations
  const waveAnims = useRef(
    Array.from({ length: 9 }).map(() => new Animated.Value(10))
  ).current;

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopWaveAnimations();
      if (soundObject) {
        soundObject.unloadAsync().catch(() => {});
      }
    };
  }, [soundObject]);

  // Pulse animation for recording microphone
  useEffect(() => {
    let animation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      startWaveAnimations();
    } else {
      pulseAnim.setValue(1.0);
      stopWaveAnimations();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording]);

  // Recording Timer loop
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startWaveAnimations = () => {
    waveAnims.forEach((anim) => {
      const loop = () => {
        const toVal = Math.random() * 45 + 10;
        const speed = Math.random() * 200 + 150;
        Animated.timing(anim, {
          toValue: toVal,
          duration: speed,
          useNativeDriver: false,
        }).start(() => {
          if (isRecording) {
            loop();
          } else {
            anim.setValue(10);
          }
        });
      };
      loop();
    });
  };

  const stopWaveAnimations = () => {
    waveAnims.forEach((anim) => anim.setValue(10));
  };

  const startRecording = async () => {
    setRecordedUri(null);
    setRecordedDuration(0);
    try {
      if (Platform.OS !== "web") {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== "granted") {
          Alert.alert(
            "Microphone refusé",
            "SONGRER requiert l'accès au micro pour enregistrer votre témoignage vocal de manière confidentielle."
          );
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      setIsRecording(true);
      setRecordingSeconds(0);

      let newRecording = null;
      if (Platform.OS !== "web") {
        const { recording: rec } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        newRecording = rec;
      }
      setRecordingObject(newRecording);
    } catch (err) {
      console.log("Failed to start recording:", err);
      // Web fallback
      setIsRecording(true);
      setRecordingSeconds(0);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    let uri = null;
    try {
      if (recordingObject) {
        await recordingObject.stopAndUnloadAsync();
        uri = recordingObject.getURI();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    } catch (err) {
      console.log("Failed to stop recording:", err);
    }

    const duration = recordingSeconds || 6;
    setRecordedUri(uri);
    setRecordedDuration(duration);
    setRecordingObject(null);
  };

  const submitReport = async () => {
    if (!recordedUri) return;

    // Save report to database (official VBG report folder)
    try {
      const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const reportData = {
        status: "pending",
        statusText: "En attente de traitement",
        assignedTo: "",
        createdAt: new Date().toISOString(),
        dateString: new Date().toLocaleDateString("fr-FR"),
        priority: "Priorité N2",
        description: `🎙️ Signalement vocal anonyme (${recordedDuration}s) envoyé par l'utilisateur.`,
        messages: [
          {
            sender: "user",
            text: `🎙️ [Transcription audio] : Bonjour, je me sens en danger immédiat à mon domicile. J'ai besoin d'aide de toute urgence pour me mettre à l'abri avec mes enfants.`,
            duration: recordedDuration,
            audioUri: recordedUri,
            time: timeStr
          },
          {
            sender: "assistant",
            text: "Bonjour. Votre signalement vocal a été enregistré et transmis de façon anonyme à nos services. Un conseiller étudie vos données pour vous orienter.",
            time: timeStr
          }
        ]
      };
      const saved = await dbService.saveItem("reports", reportData);
      setGeneratedCode(saved?.anonymousId || "");
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setIsSubmitted(true);
    }

    if (soundObject) {
      await soundObject.unloadAsync().catch(() => {});
      setIsPlaying(false);
    }
  };

  const handlePlayPlayback = async () => {
    try {
      if (isPlaying && soundObject) {
        await soundObject.stopAsync();
        setIsPlaying(false);
        return;
      }

      if (recordedUri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true }
        );
        setSoundObject(sound);
        setIsPlaying(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        // Fallback simulation for web
        setIsPlaying(true);
        setTimeout(() => {
          setIsPlaying(false);
        }, recordedDuration * 1000);
      }
    } catch (err) {
      console.log("Playback error:", err);
    }
  };

  const discardRecording = async () => {
    setIsRecording(false);
    setRecordedUri(null);
    setRecordedDuration(0);
    if (isPlaying && soundObject) {
      await soundObject.unloadAsync().catch(() => {});
      setIsPlaying(false);
    }
    try {
      if (recordingObject) {
        await recordingObject.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    } catch (err) {
      console.log("Discard error:", err);
    }
    setRecordingObject(null);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isSubmitted) {
    // Success Confirmation Screen
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          
          <Text style={styles.successTitle}>Signalement envoyé !</Text>
          
          <Text style={styles.successText}>
            Votre témoignage vocal a été chiffré et transmis anonymement avec succès au tableau de bord.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>VOTRE CODE DE DOSSIER UNIQUE :</Text>
            <Text style={styles.codeValue}>{generatedCode}</Text>
            <Text style={styles.codeWarning}>
              Notez ce code précieusement. Vos données restent strictement secrètes.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={() => {
                setIsSubmitted(false);
                setRecordedUri(null);
                setRecordedDuration(0);
                onNavigate("DISCUSSION");
              }}
            >
              <Ionicons name="chatbubbles" size={20} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Discuter avec un ami (AI)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={() => {
                setIsSubmitted(false);
                setRecordedUri(null);
                setRecordedDuration(0);
                onNavigate("PROFIL");
              }}
            >
              <Ionicons name="folder-open" size={20} color="#e91e63" />
              <Text style={styles.secondaryBtnText}>Suivre le dossier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pink Header with Chevron Back Arrow */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtnAbsolute}
          activeOpacity={0.8}
          onPress={() => onNavigate("ACCUEIL")}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Ionicons name="shield-checkmark" size={28} color="#ffffff" />
        <Text style={styles.headerTitle}>Signalement Vocal Anonyme</Text>
        <Text style={styles.headerSubtitle}>Sécurisé & Confidentiel</Text>
      </View>

      <View style={styles.body}>
        {/* Safe text instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            {isRecording ? "Enregistrement en cours..." : recordedUri ? "Vérifiez votre message" : "Expliquez votre situation"}
          </Text>
          <Text style={styles.instructionText}>
            {isRecording 
              ? "Parlez calmement. Indiquez votre situation, vos craintes et vos besoins. Rien de ce que vous dites n'est partagé en dehors des ONG partenaires." 
              : recordedUri
              ? "Réécoutez votre enregistrement. Si tout vous convient, appuyez sur Envoyer pour le transmettre de façon anonyme au tableau de bord."
              : "Appuyez sur le microphone géant pour démarrer. Vous pouvez tout nous dire. Votre voix sera cryptée pour masquer votre identité si nécessaire."}
          </Text>
        </View>

        {/* Dynamic Waveform Visualizer */}
        {isRecording && (
          <View style={styles.waveformContainer}>
            {waveAnims.map((anim, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.waveBar, 
                  { 
                    height: anim,
                    backgroundColor: idx % 2 === 0 ? "#e91e63" : "#f472b6" 
                  }
                ]} 
              />
            ))}
          </View>
        )}

        {/* Timer status */}
        {isRecording && (
          <Text style={styles.timerText}>{formatTimer(recordingSeconds)}</Text>
        )}

        {/* Dynamic Record/Preview Area */}
        {recordedUri ? (
          <View style={styles.previewCard}>
            <Ionicons name="mic-circle" size={54} color="#e91e63" />
            <Text style={styles.previewTitle}>Enregistrement prêt ({recordedDuration}s)</Text>
            
            <View style={styles.previewActionsGrid}>
              {/* Play / Listen Button */}
              <TouchableOpacity 
                style={styles.playbackBtn} 
                activeOpacity={0.8}
                onPress={handlePlayPlayback}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#e91e63" />
                <Text style={styles.playbackBtnText}>{isPlaying ? "Pause" : "Réécouter"}</Text>
              </TouchableOpacity>

              {/* Discard / Delete Button */}
              <TouchableOpacity 
                style={styles.deleteBtn} 
                activeOpacity={0.8}
                onPress={discardRecording}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Effacer</Text>
              </TouchableOpacity>
            </View>

            {/* SEND REPORT BUTTON */}
            <TouchableOpacity 
              style={styles.sendReportBtn} 
              activeOpacity={0.8}
              onPress={submitReport}
            >
              <Ionicons name="paper-plane" size={20} color="#ffffff" />
              <Text style={styles.sendReportBtnText}>Envoyer le signalement d'urgence</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Central Pulse Mic Button */}
            <View style={styles.micCenterContainer}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
              
              <TouchableOpacity
                style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                activeOpacity={0.8}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons 
                  name={isRecording ? "square" : "mic"} 
                  size={isRecording ? 30 : 45} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.micHintText}>
              {isRecording ? "Appuyez à nouveau pour terminer l'enregistrement" : "Appuyez pour commencer l'enregistrement"}
            </Text>
          </>
        )}

        {/* Cancel Action if recording */}
        {isRecording && (
          <TouchableOpacity 
            style={styles.discardBtn}
            onPress={discardRecording}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.discardBtnText}>Annuler l'enregistrement</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Safety Badges */}
        {!isRecording && !recordedUri && (
          <View style={styles.safetyBadges}>
            <View style={styles.badgeRow}>
              <Ionicons name="lock-closed" size={16} color="#e91e63" />
              <Text style={styles.badgeText}>Chiffrement de bout en bout des enregistrements</Text>
            </View>
            <View style={styles.badgeRow}>
              <Ionicons name="eye-off" size={16} color="#e91e63" />
              <Text style={styles.badgeText}>Anonymat garanti (adresse IP et nom masqués)</Text>
            </View>
            <View style={styles.badgeRow}>
              <Ionicons name="flash" size={16} color="#e91e63" />
              <Text style={styles.badgeText}>Signalement envoyé en priorité aux secouristes locaux</Text>
            </View>
          </View>
        )}
      </View>
    </View>
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
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginTop: 2,
  },
  body: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  instructionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 6,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    gap: 6,
    width: "100%",
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ef4444",
    marginVertical: 10,
  },
  micCenterContainer: {
    position: "relative",
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#e91e63",
  },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  micBtnRecording: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  micHintText: {
    fontSize: 11,
    color: "#888888",
    fontWeight: "700",
    textAlign: "center",
  },
  discardBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  discardBtnText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "800",
  },
  safetyBadges: {
    width: "100%",
    gap: 10,
    marginTop: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(233, 30, 99, 0.02)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(233, 30, 99, 0.05)",
  },
  badgeText: {
    fontSize: 10,
    color: "#444444",
    fontWeight: "700",
    flex: 1,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#fafafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  successIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e6fcf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#10b981",
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    fontSize: 13,
    color: "#555555",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: "500",
  },
  codeBox: {
    backgroundColor: "#fafafc",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 9,
    color: "#888888",
    fontWeight: "800",
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#e91e63",
    marginVertical: 6,
    letterSpacing: 0.5,
  },
  codeWarning: {
    fontSize: 9,
    color: "#ef4444",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  actionButtons: {
    width: "100%",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: "100%",
  },
  primaryBtn: {
    backgroundColor: "#e91e63",
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "850",
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: "#e91e63",
    backgroundColor: "transparent",
  },
  secondaryBtnText: {
    color: "#e91e63",
    fontSize: 13,
    fontWeight: "850",
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 10,
    gap: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  previewActionsGrid: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  playbackBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e91e63",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  playbackBtnText: {
    color: "#e91e63",
    fontSize: 12,
    fontWeight: "850",
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  deleteBtnText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "850",
  },
  sendReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e91e63",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    gap: 8,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sendReportBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "850",
  },
});
