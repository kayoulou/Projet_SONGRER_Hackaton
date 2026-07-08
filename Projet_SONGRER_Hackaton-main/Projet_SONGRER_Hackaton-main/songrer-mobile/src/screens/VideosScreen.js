import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  Share,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { dbService } from "../config/api";

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

// Helper to format large numbers like 1200 into 1.2k
const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num;
};

export default function VideosScreen({ onNavigate }) {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(windowHeight);
  
  // Comments state
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentsMap, setCommentsMap] = useState({
    vid1: [
      { id: "c1", user: "@marie_d", text: "Ce message est tellement important ! Merci de libérer la parole.", time: "2h", likes: 24, liked: false },
      { id: "c2", user: "@jean_k", text: "Le courage de témoigner. Respect ✊", time: "5h", likes: 12, liked: false },
      { id: "c3", user: "@assiatou_b", text: "L'application SONGRER va vraiment aider beaucoup de personnes.", time: "1j", likes: 45, liked: false }
    ],
    vid2: [
      { id: "c4", user: "@ong_aide", text: "N'hésitez pas à utiliser le mode vocal pour dénoncer en toute discrétion.", time: "1h", likes: 8, liked: false },
      { id: "c5", user: "@fatou_y", text: "L'explication est très claire, merci !", time: "1j", likes: 15, liked: false }
    ],
    vid3: [
      { id: "c6", user: "@secours_vbg", text: "Le numéro 116 est gratuit et disponible 24/7. Courage !", time: "30m", likes: 52, liked: false },
      { id: "c7", user: "@kadidia", text: "Merci à l'alliance VBG pour ce rappel indispensable.", time: "3h", likes: 9, liked: false }
    ],
    vid4: [
      { id: "c8", user: "@amina_t", text: "Merci pour cette vidéo. Il ne faut plus se taire.", time: "4h", likes: 19, liked: false },
      { id: "c9", user: "@briser_silence", text: "La violence n'est jamais la solution. Bravo pour cette initiative !", time: "1j", likes: 31, liked: false }
    ]
  });

  useEffect(() => {
    // Subscribe to database video updates
    const unsubscribe = dbService.subscribe("videos", (data) => {
      setVideos(data);
    });
    return () => unsubscribe();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleContainerLayout = (e) => {
    const { height } = e.nativeEvent.layout;
    setContainerHeight(height);
  };

  const openComments = (video) => {
    setSelectedVideo(video);
    setCommentsModalVisible(true);
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !selectedVideo) return;
    const vidId = selectedVideo.id;
    const newComment = {
      id: Math.random().toString(),
      user: "@utilisateur_anonyme",
      text: commentInput,
      time: "Maintenant",
      likes: 0,
      liked: false
    };

    setCommentsMap(prev => ({
      ...prev,
      [vidId]: [newComment, ...(prev[vidId] || [])]
    }));
    setCommentInput("");
  };

  const handleLikeComment = (commentId) => {
    if (!selectedVideo) return;
    const vidId = selectedVideo.id;
    setCommentsMap(prev => ({
      ...prev,
      [vidId]: prev[vidId].map(c => 
        c.id === commentId 
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    }));
  };

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={false}
        decelerationRate="fast"
        snapToInterval={containerHeight}
        snapToAlignment="start"
        renderItem={({ item, index }) => (
          <VideoItem
            item={item}
            isActive={index === currentIndex}
            height={containerHeight}
            onOpenComments={() => openComments(item)}
            onNavigate={onNavigate}
          />
        )}
      />

      {/* Slide up Comments Modal */}
      {selectedVideo && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={commentsModalVisible}
          onRequestClose={() => setCommentsModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity 
              style={styles.modalDismissArea} 
              activeOpacity={1} 
              onPress={() => setCommentsModalVisible(false)} 
            />
            
            <View style={styles.commentsContainer}>
              {/* Header drag indicator */}
              <View style={styles.dragIndicator} />
              
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                  Commentaires ({commentsMap[selectedVideo.id]?.length || 0})
                </Text>
                <TouchableOpacity onPress={() => setCommentsModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              {/* Scrollable list of comments */}
              <FlatList
                data={commentsMap[selectedVideo.id] || []}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.commentsScroll}
                contentContainerStyle={styles.commentsScrollContent}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {item.user.substring(1, 3).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentUserRow}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.commentTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.commentLikeBtn}
                      onPress={() => handleLikeComment(item.id)}
                    >
                      <Ionicons 
                        name={item.liked ? "heart" : "heart-outline"} 
                        size={14} 
                        color={item.liked ? "#e91e63" : "#8e8e93"} 
                      />
                      <Text style={[styles.commentLikeCount, item.liked && { color: "#e91e63" }]}>
                        {item.likes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noCommentsText}>Aucun commentaire. Soyez le premier à commenter !</Text>
                }
              />

              {/* Input section */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Ajouter un commentaire..."
                  placeholderTextColor="#8e8e93"
                  value={commentInput}
                  onChangeText={setCommentInput}
                />
                <TouchableOpacity 
                  style={[styles.sendCommentBtn, !commentInput.trim() && styles.sendCommentBtnDisabled]} 
                  onPress={handleAddComment}
                  disabled={!commentInput.trim()}
                >
                  <Ionicons name="arrow-up" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// Child Component for single TikTok Video viewport
function VideoItem({ item, isActive, height, onOpenComments, onNavigate }) {
  const videoRef = useRef(null);
  const webVideoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 1200);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [doubleTapHearts, setDoubleTapHearts] = useState([]); // Coordinate heart taps
  const [progress, setProgress] = useState(0);

  // Muted state by default for autoplay policy bypass
  const [isMuted, setIsMuted] = useState(true);

  // Animations
  const discRotation = useRef(new Animated.Value(0)).current;
  const musicTicker = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  // Sync play state with activity
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isActive]);

  // Handle play/pause commands on the Web video element
  useEffect(() => {
    if (Platform.OS === "web" && webVideoRef.current) {
      if (isPlaying) {
        webVideoRef.current.play().catch(err => {
          console.log("Web play error:", err);
        });
      } else {
        webVideoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Disc Spin Rotation loop
  useEffect(() => {
    let animation;
    if (isActive && isPlaying) {
      animation = Animated.loop(
        Animated.timing(discRotation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        })
      );
      animation.start();
    } else {
      discRotation.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isActive, isPlaying]);

  // Music Ticker sliding loop
  useEffect(() => {
    let animation;
    if (isActive) {
      musicTicker.setValue(0);
      animation = Animated.loop(
        Animated.timing(musicTicker, {
          toValue: -150,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        })
      );
      animation.start();
    } else {
      musicTicker.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isActive]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  // Double-tap to Like detection
  const handleTap = (event) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double Tap detected!
      if (!isLiked) {
        handleLike();
      }
      // Add a double tap heart pop-up coordinates
      const { locationX, locationY } = event.nativeEvent;
      const heartId = Math.random().toString();
      
      setDoubleTapHearts(prev => [...prev, { id: heartId, x: locationX, y: locationY }]);
    } else {
      // Single Tap to Play/Pause
      togglePlay();
    }
    lastTap.current = now;
  };

  // Clean up hearts after they fade out
  const removeHeart = (id) => {
    setDoubleTapHearts(prev => prev.filter(h => h.id !== id));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Regardez la vidéo de sensibilisation de SONGRER : "${item.title}". Brisons le silence contre le VBG !`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const rotateInterpolate = discRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const tickerInterpolate = musicTicker.interpolate({
    inputRange: [-150, 0],
    outputRange: [-150, 0],
  });

  return (
    <View style={[styles.videoContainer, { height }]}>
      
      {/* Cross-Platform Video Renderer */}
      {Platform.OS === "web" ? (
        <video
          ref={webVideoRef}
          src={typeof item.videoUrl === "number" ? Image.resolveAssetSource(item.videoUrl).uri : item.videoUrl}
          style={styles.webVideo}
          loop
          muted={isMuted}
          playsInline
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onTimeUpdate={(e) => {
            const video = e.target;
            if (video.duration > 0) {
              setProgress((video.currentTime / video.duration) * 100);
            }
          }}
          onClick={togglePlay}
        />
      ) : (
        isActive && (
          <Video
            ref={videoRef}
            source={typeof item.videoUrl === "number" ? item.videoUrl : { uri: item.videoUrl }}
            rate={1.0}
            volume={1.0}
            isMuted={isMuted}
            resizeMode="contain"
            shouldPlay={isPlaying}
            isLooping
            style={StyleSheet.absoluteFill}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => {
              setIsLoading(false);
            }}
            onError={(err) => {
              console.log("Video loading error:", err);
              setIsLoading(false);
            }}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.durationMillis > 0) {
                setProgress((status.positionMillis / status.durationMillis) * 100);
              }
            }}
          />
        )
      )}



      {/* Tap gesture capture overlay (mainly for mobile to avoid native conflict) */}
      {Platform.OS !== "web" && (
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleTap} 
        />
      )}

      {/* Floating loading spinner */}
      {isLoading && (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      )}

      {/* Pause button overlay indicator */}
      {!isPlaying && !isLoading && (
        <TouchableOpacity style={styles.centerPlayBtn} onPress={togglePlay}>
          <Ionicons name="play" size={60} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      {/* Floating double tap hearts */}
      {doubleTapHearts.map((heart) => (
        <DoubleTapHeart 
          key={heart.id} 
          x={heart.x} 
          y={heart.y} 
          onAnimEnd={() => removeHeart(heart.id)} 
        />
      ))}

      {/* Right Action Sidebar (TikTok style) */}
      <View style={styles.sidebar}>
        {/* Creator profile picture */}
        <View style={styles.avatarWrapper}>
          <View style={styles.sidebarAvatar}>
            <Text style={styles.avatarIconText}>👤</Text>
          </View>
          {!isSubscribed && (
            <TouchableOpacity 
              style={styles.subscribeBtnPlus} 
              activeOpacity={0.8}
              onPress={() => setIsSubscribed(true)}
            >
              <Ionicons name="add" size={12} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Like action */}
        <TouchableOpacity style={styles.sidebarBtn} onPress={handleLike}>
          <View style={[styles.sidebarIconBg, isLiked && styles.sidebarIconActive]}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={26} 
              color={isLiked ? "#ff2d55" : "#ffffff"} 
            />
          </View>
          <Text style={styles.sidebarLabel}>{formatNumber(likeCount)}</Text>
        </TouchableOpacity>

        {/* Comments action */}
        <TouchableOpacity style={styles.sidebarBtn} onPress={onOpenComments}>
          <View style={styles.sidebarIconBg}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
          </View>
          <Text style={styles.sidebarLabel}>{formatNumber(item.commentsCount || 120)}</Text>
        </TouchableOpacity>

        {/* Share action */}
        <TouchableOpacity style={styles.sidebarBtn} onPress={handleShare}>
          <View style={styles.sidebarIconBg}>
            <Ionicons name="share-social" size={24} color="#ffffff" />
          </View>
          <Text style={styles.sidebarLabel}>{item.sharesCount || 12}</Text>
        </TouchableOpacity>

        {/* Interactive Mute / Unmute Button (bypasses browser autoplay policy blocks) */}
        <TouchableOpacity style={styles.sidebarBtn} onPress={() => setIsMuted(!isMuted)}>
          <View style={[styles.sidebarIconBg, !isMuted && { borderColor: "#e91e63", borderWidth: 1 }]}>
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={22} 
              color={isMuted ? "#ffffff" : "#e91e63"} 
            />
          </View>
          <Text style={styles.sidebarLabel}>{isMuted ? "Muet" : "Son"}</Text>
        </TouchableOpacity>

        {/* Floating Rotating Disc */}
        <Animated.View style={[styles.musicDisc, { transform: [{ rotate: rotateInterpolate }] }]}>
          <View style={styles.discInner}>
            <View style={styles.discCenterDot} />
          </View>
        </Animated.View>
      </View>

      {/* Bottom-left information cards (TikTok style) */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.creatorName}>{item.author}</Text>
        <Text style={styles.videoDesc} numberOfLines={3}>{item.description}</Text>
        
        {/* Animated scrolling music track */}
        <View style={styles.musicRow}>
          <Ionicons name="musical-notes" size={14} color="#ffffff" />
          <View style={styles.tickerFrame}>
            <Animated.View style={[styles.tickerTextContainer, { transform: [{ translateX: tickerInterpolate }] }]}>
              <Text style={styles.musicTickerText}>
                Son original - {item.author} • Activisme VBG • Songrer
              </Text>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Interactive Bottom Progress Indicator */}
      <View style={styles.progressBar}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

// Subcomponent to animate double-tap heart
function DoubleTapHeart({ x, y, onAnimEnd }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(`${(Math.random() - 0.5) * 40}deg`).current;

  useEffect(() => {
    // Pop up animation
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          friction: 4,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ]).start(() => {
      onAnimEnd();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.doubleTapHeart,
        {
          left: x - 40,
          top: y - 40,
          transform: [{ scale }, { rotate }],
          opacity,
        },
      ]}
    >
      <Ionicons name="heart" size={80} color="#ff2d55" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoContainer: {
    width: windowWidth,
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: "#000000",
  },
  webVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backgroundColor: "#000000",
    zIndex: 0,
    cursor: "pointer",
  },
  centerLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    zIndex: 1,
  },
  centerPlayBtn: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  doubleTapHeart: {
    position: "absolute",
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  // Sidebar Styling
  sidebar: {
    position: "absolute",
    right: 12,
    bottom: Platform.OS === "ios" ? 60 : 45, // Positioned safely above the video bottom
    alignItems: "center",
    gap: 16,
    zIndex: 5,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  sidebarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarIconText: {
    fontSize: 20,
  },
  subscribeBtnPlus: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: "#ff2d55",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  sidebarBtn: {
    alignItems: "center",
  },
  sidebarIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarIconActive: {
    backgroundColor: "rgba(255, 45, 85, 0.15)",
  },
  sidebarLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    ...Platform.select({
      web: { textShadow: "1px 1px 3px rgba(0,0,0,0.8)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
      }
    })
  },
  musicDisc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1a1a1a",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  discInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
  },
  discCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  // Bottom info overlay styling
  bottomOverlay: {
    position: "absolute",
    left: 16,
    right: 70,
    bottom: 15, // Positioned near the bottom of the video viewport
    gap: 8,
    zIndex: 5,
  },
  creatorName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    ...Platform.select({
      web: { textShadow: "0px 1px 3px rgba(0,0,0,0.5)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      }
    })
  },
  videoDesc: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    ...Platform.select({
      web: { textShadow: "0px 1px 3px rgba(0,0,0,0.5)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      }
    })
  },
  musicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tickerFrame: {
    width: 180,
    overflow: "hidden",
  },
  tickerTextContainer: {
    flexDirection: "row",
    width: 350,
  },
  musicTickerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    ...Platform.select({
      web: { textShadow: "0px 1px 2px rgba(0,0,0,0.5)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }
    })
  },
  // Bottom tiny timeline progress
  progressBar: {
    position: "absolute",
    bottom: 0, // Sits exactly at the bottom of the video viewport
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    zIndex: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#e91e63",
  },
  // Modal layout
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    flex: 1,
  },
  commentsContainer: {
    height: windowHeight * 0.6,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginBottom: 8,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  closeModalBtn: {
    padding: 4,
  },
  commentsScroll: {
    flex: 1,
  },
  commentsScrollContent: {
    padding: 16,
    gap: 16,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(233, 30, 99, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    color: "#e91e63",
    fontSize: 10,
    fontWeight: "800",
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666666",
  },
  commentTime: {
    fontSize: 10,
    color: "#8e8e93",
  },
  commentText: {
    fontSize: 13,
    color: "#1a1a1a",
    lineHeight: 18,
    fontWeight: "500",
  },
  commentLikeBtn: {
    alignItems: "center",
    gap: 2,
    paddingTop: 4,
  },
  commentLikeCount: {
    fontSize: 10,
    color: "#8e8e93",
    fontWeight: "600",
  },
  noCommentsText: {
    textAlign: "center",
    color: "#8e8e93",
    marginTop: 40,
    fontSize: 13,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f2f2f7",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  sendCommentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
  },
  sendCommentBtnDisabled: {
    backgroundColor: "#e0e0e0",
  },
});
