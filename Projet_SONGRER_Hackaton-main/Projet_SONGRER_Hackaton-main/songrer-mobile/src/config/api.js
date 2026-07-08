import { Platform } from "react-native";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:4000";

let apiAvailable = false;
let localReports = [];
const listeners = {};

const MOCK_DATA = {
  statistics: [
    { id: "global", callsToday: 142, activeCases: 34, womenHelped: 12 }
  ],
  organizations: [
    { id: "ong1", name: "Voix de Femmes", distance: "2km", phone: "+226 25 30 00 00", icon: "home" },
    { id: "ong2", name: "Cellule VBG", distance: "5km", phone: "+226 70 20 20 20", icon: "shield" },
    { id: "ong3", name: "Association Clin d'Oeil", distance: "7km", phone: "+226 76 00 11 22", icon: "heart" }
  ],
  videos: [
    {
      id: "vid1",
      title: "Temoignage : survivre aux violences conjugales",
      author: "@association_espoir",
      location: "Afrique",
      duration: "1:57",
      videoUrl: require("../../assets/video_witness1.mp4"),
      views: "1.2k",
      likes: 1200,
      subscribers: "4,5 M d'abonnes",
      commentsCount: 342,
      sharesCount: 56,
      description: "Temoignage de resilience d'une survivante de violences conjugales."
    },
    {
      id: "vid2",
      title: "VBG : les voix des survivantes s'unissent",
      author: "@alliance_vbg",
      location: "Senegal",
      duration: "3:24",
      videoUrl: require("../../assets/video_witness2.mp4"),
      views: "850",
      likes: 412,
      subscribers: "120k abonnes",
      commentsCount: 98,
      sharesCount: 19,
      description: "Temoignages de femmes victimes de violences basees sur le genre."
    },
    {
      id: "vid3",
      title: "Reconstruction : le temoignage de Grace",
      author: "@grace_temoignage",
      location: "Burkina Faso",
      duration: "8:45",
      videoUrl: require("../../assets/video_witness3.mp4"),
      views: "2.1k",
      likes: 1840,
      subscribers: "85k abonnes",
      commentsCount: 520,
      sharesCount: 110,
      description: "Parcours de reconstruction apres des violences conjugales."
    },
    {
      id: "vid4",
      title: "Sensibilisation : briser le silence des VBG",
      author: "@sensibilisation_vbg",
      location: "Burkina Faso",
      duration: "3:38",
      videoUrl: require("../../assets/video_witness4.mp4"),
      views: "1.5k",
      likes: 980,
      subscribers: "60k abonnes",
      commentsCount: 230,
      sharesCount: 45,
      description: "Conseils pour reagir et trouver de l'aide en securite."
    }
  ],
  reports: []
};

const endpointMap = {
  organizations: "/organizations",
  videos: "/videos",
  statistics: "/statistics",
  reports: "/reports"
};

function generateAnonymousId() {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.randomUUID) {
    return `SG-${cryptoApi.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  }

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoApi.getRandomValues(bytes);
    return `SG-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  }

  return `SG-${Date.now().toString(36).toUpperCase()}`;
}

function saveLocalReports(reports) {
  localReports = reports;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("songrer_local_reports", JSON.stringify(reports));
    } catch (e) {}
  }
}

// Load initial local reports from localStorage
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const saved = window.localStorage.getItem("songrer_local_reports");
    if (saved) {
      localReports = JSON.parse(saved);
    }
  } catch (e) {}
}

async function triggerListeners(colName) {
  const data = colName === "reports" 
    ? await dbService.getItems("reports") 
    : MOCK_DATA[colName] || [];
  (listeners[colName] || []).forEach((callback) => callback(data));
}

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || "Erreur API SONGRER.");
    }

    apiAvailable = true;
    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function normalizeVideo(video) {
  let videoUrl = video.videoUrl || video.url;

  if (Platform.OS === "web") {
    // On Web, stream working public video files since Metro web does not support video range requests for required assets
    if (video.id === "vid_demo_1" || video.id === "vid1") {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    } else if (video.id === "vid_demo_2" || video.id === "vid2") {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    } else if (video.id === "vid_demo_3" || video.id === "vid3") {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
    } else if (video.id === "vid_demo_4" || video.id === "vid4") {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
    }
  } else {
    // On Native (phone), use local high-quality files
    if (video.id === "vid_demo_1" || video.id === "vid1") {
      videoUrl = require("../../assets/video_witness1.mp4");
    } else if (video.id === "vid_demo_2" || video.id === "vid2") {
      videoUrl = require("../../assets/video_witness2.mp4");
    } else if (video.id === "vid_demo_3" || video.id === "vid3") {
      videoUrl = require("../../assets/video_witness3.mp4");
    } else if (video.id === "vid_demo_4" || video.id === "vid4") {
      videoUrl = require("../../assets/video_witness4.mp4");
    }
  }

  return {
    ...video,
    videoUrl: videoUrl || MOCK_DATA.videos[0]?.videoUrl,
    subscribers: video.subscribers || "SONGRER"
  };
}

export const dbService = {
  isMock: () => !apiAvailable,

  async sendChat({ anonymousId, messages }) {
    try {
      return await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ anonymousId, messages })
      });
    } catch (error) {
      apiAvailable = false;
      throw error;
    }
  },

  async getItems(colName) {
    if (colName === "reports") {
      try {
        const updatedReports = await Promise.all(
          localReports.map(async (report) => {
            try {
              return await apiFetch(`/reports/track/${report.anonymousId}`);
            } catch (e) {
              return report;
            }
          })
        );
        return updatedReports;
      } catch (error) {
        return localReports;
      }
    }

    try {
      const data = await apiFetch(endpointMap[colName]);
      return colName === "videos" ? data.map(normalizeVideo) : data;
    } catch (error) {
      console.warn("API mobile indisponible, fallback local:", error.message);
      apiAvailable = false;
      return MOCK_DATA[colName] || [];
    }
  },

  async getReportByAnonymousId(anonymousId) {
    return await apiFetch(`/reports/track/${anonymousId}`);
  },

  async saveItem(colName, data) {
    if (colName !== "reports") {
      return data;
    }

    const payload = {
      ...data,
      channel: data.channel || (data.messages?.some((message) => message.audioUri || message.audioUrl) ? "mixed" : "text")
    };

    try {
      const saved = await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const updatedList = [saved, ...localReports.filter((report) => report.anonymousId !== saved.anonymousId)];
      saveLocalReports(updatedList);
      await triggerListeners("reports");
      return saved;
    } catch (error) {
      console.warn("Signalement sauvegarde localement:", error.message);
      const anonymousId = payload.anonymousId || generateAnonymousId();
      const saved = {
        ...payload,
        anonymousId,
        id: payload.id || anonymousId,
        createdAt: payload.createdAt || new Date().toISOString()
      };
      const updatedList = [saved, ...localReports.filter((report) => report.anonymousId !== saved.anonymousId)];
      saveLocalReports(updatedList);
      await triggerListeners("reports");
      return saved;
    }
  },

  subscribe(colName, callback) {
    let cancelled = false;
    let timer;

    if (!listeners[colName]) listeners[colName] = [];
    listeners[colName].push(callback);

    const load = async () => {
      const data = await this.getItems(colName);
      if (!cancelled) callback(data);
    };

    load();
    timer = setInterval(load, colName === "reports" ? 3000 : 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      listeners[colName] = (listeners[colName] || []).filter((item) => item !== callback);
    };
  }
};
