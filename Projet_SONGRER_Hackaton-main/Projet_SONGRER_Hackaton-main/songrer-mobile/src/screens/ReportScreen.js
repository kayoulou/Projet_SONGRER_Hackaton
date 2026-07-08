import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { dbService } from "../config/api";

export default function ReportScreen({ onNavigate }) {
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "assistant",
      text: "Bonjour. Je suis ton conseiller et ami solidaire. Je suis là pour t'écouter, te soutenir et t'accompagner en toute sécurité et confidentialité. Tu peux tout me dire, tu n'es plus seule. Comment te sens-tu aujourd'hui ?",
      time: "12:30"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingObject, setRecordingObject] = useState(null);
  const [activeReportId, setActiveReportId] = useState(null);
  const [anonymousCode, setAnonymousCode] = useState("");
  
  // Chatbot and voice states
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [playingSoundId, setPlayingSoundId] = useState(null);

  const scrollViewRef = useRef();
  const timerRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

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

  const startRecording = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== "granted") {
          Alert.alert(
            "Permission refusée",
            "SONGRER a besoin de l'accès au microphone pour enregistrer des messages vocaux."
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

  const cancelRecording = async () => {
    setIsRecording(false);
    try {
      if (recordingObject) {
        await recordingObject.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    } catch (err) {
      console.log("Failed to cancel recording:", err);
    }
    setRecordingObject(null);
  };

  const stopAndSendVoice = async () => {
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

    const finalSecs = recordingSeconds || 4;
    const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const newMsg = {
      id: Math.random().toString(),
      sender: "user",
      text: `🎙️ Message vocal (${finalSecs}s)`,
      duration: finalSecs,
      audioUri: uri,
      time: timeStr
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    saveReportToDb(updatedMessages);
    setRecordingObject(null);

    // Trigger AI automatic response
    triggerAssistantReply(updatedMessages, "voice");
  };

  const handleSendText = () => {
    if (!inputVal.trim()) return;

    const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const newMsg = {
      id: Math.random().toString(),
      sender: "user",
      text: inputVal,
      time: timeStr
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputVal("");
    saveReportToDb(updatedMessages);

    // Trigger AI automatic response
    triggerAssistantReply(updatedMessages, "text");
  };

  const triggerAssistantReply = async (currentMsgs, type = "text") => {
    setIsTyping(true);
    setTypingText(type === "voice" ? "Analyse du message vocal..." : "Ami Solidaire reflechit...");

    try {
      const aiResponse = await dbService.sendChat({
        anonymousId: anonymousCode || undefined,
        messages: currentMsgs.map((message) => ({
          sender: message.sender,
          text: message.text,
          time: message.time
        }))
      });

      const replyText = aiResponse?.reply?.text || "Je suis la avec toi. Peux-tu me dire si tu es en securite en ce moment ?";
      setIsTyping(false);
      const replyMsg = {
        id: Math.random().toString(),
        sender: "assistant",
        text: replyText,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };
      const nextMessages = [...currentMsgs, replyMsg];
      setMessages(nextMessages);
      saveReportToDb(nextMessages, aiResponse?.safety);
      speakText(replyText);
      return;
    } catch (error) {
      console.log("AI chat error:", error);
      setIsTyping(false);
      const replyText = "Je n'arrive pas a joindre le service IA pour le moment. Si tu es en danger immediat, contacte les secours, la police ou une personne de confiance maintenant. Peux-tu reessayer dans quelques instants ?";
      const replyMsg = {
        id: Math.random().toString(),
        sender: "assistant",
        text: replyText,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };
      const nextMessages = [...currentMsgs, replyMsg];
      setMessages(nextMessages);
      saveReportToDb(nextMessages);
      return;
    }
  };

  const saveReportToDb = async (allMsgs, safety = null) => {
    try {
      const lastUserMsg = allMsgs.filter((m) => m.sender === "user").pop();
      const reportData = {
        status: safety?.recommendedStatus || "pending",
        statusText: safety?.isEmergency ? "URGENT - Evaluation IA" : "Discussion de soutien en cours",
        assignedTo: "",
        createdAt: new Date().toISOString(),
        dateString: new Date().toLocaleDateString("fr-FR"),
        description: lastUserMsg ? lastUserMsg.text : "Discussion de soutien amical.",
        messages: allMsgs
      };

      if (activeReportId) {
        reportData.id = activeReportId;
      }

      const saved = await dbService.saveItem("reports", reportData);
      if (!activeReportId && saved && saved.id) {
        setActiveReportId(saved.id);
      }
      if (saved?.anonymousId) {
        setAnonymousCode(saved.anonymousId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const playSound = async (msgId, uri) => {
    try {
      if (playingSoundId === msgId) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        }
        setPlayingSoundId(null);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      setPlayingSoundId(msgId);

      if (uri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingSoundId(null);
          }
        });
      } else {
        setTimeout(() => {
          setPlayingSoundId(null);
        }, 4000);
      }
    } catch (error) {
      console.log("Audio playback error:", error);
      setPlayingSoundId(null);
    }
  };

  const speakText = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*🚨🎙️⚠️]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "fr-FR";
      window.speechSynthesis.speak(utterance);
    } else {
      console.log("SpeechSynthesis not supported.");
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Premium WhatsApp Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate("ACCUEIL")}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerAvatar}>
            <Ionicons name="heart" size={18} color="#e91e63" />
          </View>

          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Ami Solidaire</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                {isTyping ? typingText : "Espace Confidentiel"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.avoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      >
        {/* Messages Scroll list */}
        <ScrollView
          style={styles.messageArea}
          contentContainerStyle={styles.messageContent}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isAssistant = msg.sender === "assistant";
            const isVoice = msg.audioUri || msg.text.startsWith("🎙️");

            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleRow,
                  isAssistant ? styles.leftRow : styles.rightRow
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isAssistant ? styles.assistantBubble : styles.userBubble
                  ]}
                >
                  {/* Speaker play icon for AI text */}
                  {isAssistant && !isVoice && (
                    <TouchableOpacity
                      style={styles.speakerLink}
                      activeOpacity={0.7}
                      onPress={() => speakText(msg.text)}
                    >
                      <Ionicons name="volume-medium" size={14} color="#e91e63" />
                      <Text style={styles.speakerLabel}>Réécouter</Text>
                    </TouchableOpacity>
                  )}

                  {isVoice ? (
                    <View style={styles.voiceBubbleContent}>
                      <TouchableOpacity
                        style={styles.voicePlayBtn}
                        onPress={() => playSound(msg.id, msg.audioUri)}
                      >
                        <Ionicons
                          name={playingSoundId === msg.id ? "pause" : "play"}
                          size={20}
                          color={isAssistant ? "#e91e63" : "#ffffff"}
                        />
                      </TouchableOpacity>

                      <View style={styles.voiceWaveformContainer}>
                        <View
                          style={[
                            styles.voiceWaveBar,
                            {
                              backgroundColor: isAssistant
                                ? "rgba(233, 30, 99, 0.12)"
                                : "rgba(255,255,255,0.3)"
                            }
                          ]}
                        >
                          <View
                            style={[
                              styles.voiceWaveFill,
                              {
                                width: playingSoundId === msg.id ? "100%" : "0%",
                                backgroundColor: isAssistant ? "#e91e63" : "#ffffff"
                              }
                            ]}
                          />
                        </View>
                        <Text style={[styles.voiceDuration, !isAssistant && styles.speakerLabelWhite]}>
                          {msg.duration ? `${msg.duration}s` : "0:05"}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.bubbleText, !isAssistant && styles.bubbleTextWhite]}>
                      {msg.text}
                    </Text>
                  )}

                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, !isAssistant && styles.bubbleTimeWhite]}>
                      {msg.time}
                    </Text>
                    {!isAssistant && (
                      <Ionicons name="checkmark-done" size={14} color="#34b7f1" style={{ marginLeft: 3 }} />
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Dynamic Typing indicator bubble */}
          {isTyping && (
            <View style={[styles.bubbleRow, styles.leftRow]}>
              <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
                <View style={styles.typingDotRow}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { animationDelay: "0.2s" }]} />
                  <View style={[styles.typingDot, { animationDelay: "0.4s" }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* WhatsApp Message Input Bar */}
        <View style={styles.whatsappInputBar}>
          {isRecording ? (
            <View style={styles.recordingWrapper}>
              <TouchableOpacity
                style={styles.cancelRecordingBtn}
                activeOpacity={0.8}
                onPress={cancelRecording}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>

              <View style={styles.recordingTimerRow}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTimerText}>
                  Enregistrement... {formatTimer(recordingSeconds)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.voiceSendBtn}
                activeOpacity={0.8}
                onPress={stopAndSendVoice}
              >
                <Ionicons name="checkmark-circle" size={28} color="#e91e63" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputBubble}>
                <TouchableOpacity style={styles.emojiBtn} activeOpacity={0.7}>
                  <Ionicons name="happy-outline" size={22} color="#8e8e93" />
                </TouchableOpacity>

                <TextInput
                  style={styles.textInput}
                  placeholder="Entrez un message"
                  placeholderTextColor="#8e8e93"
                  value={inputVal}
                  onChangeText={setInputVal}
                  onSubmitEditing={handleSendText}
                />

                <TouchableOpacity style={styles.attachmentBtn} activeOpacity={0.7}>
                  <Ionicons name="attach" size={22} color="#8e8e93" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.floatingActionBtn}
                activeOpacity={0.8}
                onPress={inputVal.trim() !== "" ? handleSendText : startRecording}
              >
                <Ionicons
                  name={inputVal.trim() !== "" ? "send" : "mic"}
                  size={20}
                  color="#ffffff"
                  style={inputVal.trim() !== "" ? { marginLeft: 2 } : null}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  avoidingView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#e91e63",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }
    }),
    zIndex: 10,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    paddingRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 10,
    fontWeight: "700",
  },
  messageArea: {
    flex: 1,
    backgroundColor: "#efeae2", // WhatsApp cream wallpaper background
  },
  messageContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 30,
  },
  bubbleRow: {
    flexDirection: "row",
    width: "100%",
  },
  leftRow: {
    justifyContent: "flex-start",
  },
  rightRow: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    ...Platform.select({
      web: { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.08)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
      }
    }),
  },
  assistantBubble: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: "#e1ffc7", // WhatsApp green user bubble
    borderTopRightRadius: 0,
  },
  speakerLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  speakerLabel: {
    fontSize: 10,
    color: "#e91e63",
    fontWeight: "800",
  },
  speakerLabelWhite: {
    color: "#ffffff",
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#222222",
    fontWeight: "500",
  },
  bubbleTextWhite: {
    color: "#222222",
  },
  bubbleFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
  },
  bubbleTime: {
    fontSize: 8,
    color: "#888888",
    fontWeight: "600",
  },
  bubbleTimeWhite: {
    color: "#666666",
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 15,
  },
  typingDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e91e63",
    opacity: 0.6,
  },
  // Custom Voice Bubble styles
  voiceBubbleContent: {
    flexDirection: "row",
    alignItems: "center",
    width: 170,
    paddingVertical: 4,
    gap: 8,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(233, 30, 99, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceWaveformContainer: {
    flex: 1,
    gap: 4,
  },
  voiceWaveBar: {
    height: 3,
    borderRadius: 1.5,
    width: "100%",
  },
  voiceWaveFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 9,
    color: "#666666",
    fontWeight: "700",
  },
  // WhatsApp Style Message Input Bar
  whatsappInputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#efeae2",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  inputBubble: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 42,
    ...Platform.select({
      web: { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }
    }),
  },
  emojiBtn: {
    paddingRight: 6,
  },
  attachmentBtn: {
    paddingHorizontal: 6,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: "transparent",
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "500",
  },
  floatingActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
      }
    }),
  },
  // Recording Mode Styles
  recordingWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    height: 42,
    alignItems: "center",
    paddingHorizontal: 14,
    justifyContent: "space-between",
    ...Platform.select({
      web: { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }
    }),
  },
  cancelRecordingBtn: {
    padding: 4,
  },
  recordingTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  recordingTimerText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
  },
  voiceSendBtn: {
    padding: 2,
  },
});
