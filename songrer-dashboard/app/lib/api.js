"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const AUTH_TOKEN_KEY = "songrer_admin_token";
const AUTH_USER_KEY = "songrer_admin_user";

let apiAvailable = false;

const endpointMap = {
  reports: "/reports",
  organizations: "/organizations",
  videos: "/videos",
  statistics: "/statistics"
};

const DEFAULT_MOCK_DATA = {
  admins: [
    { id: "admin1", email: "admin@songrer.org", name: "Administrateur Principal", role: "SUPER_ADMIN" }
  ],
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
      title: "Violence basee sur le genre : briser le silence",
      author: "@onu_femmes_afrique",
      location: "Burkina Faso",
      duration: "2min",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      views: "1.2k",
      likes: 1200,
      commentsCount: 342,
      sharesCount: 56,
      description: "Ensemble pour proteger les femmes en Afrique de l'Ouest.",
      thumbnailUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=640&auto=format&fit=crop"
    }
  ],
  reports: [
    {
      id: "rep1",
      anonymousId: "SG-8392-4F-XL2",
      status: "in_progress",
      statusText: "En cours de traitement",
      assignedTo: "",
      createdAt: new Date("2026-05-24T10:42:00Z").toISOString(),
      dateString: "02/12/2024",
      description: "Victime de violences conjugales repetees. Besoin de conseils juridiques et d'un abri temporaire.",
      messages: [
        { sender: "assistant", text: "Bonjour. Je suis la pour t'ecouter. Tu es en securite ici.", time: "10:42" },
        { sender: "user", text: "Bonjour, j'ai besoin d'aide. Mon mari est violent.", time: "10:43" }
      ]
    },
    {
      id: "rep2",
      anonymousId: "SG-2375-1A-PM9",
      status: "urgent",
      statusText: "URGENT - Intervention en cours",
      assignedTo: "",
      createdAt: new Date("2026-05-25T23:50:00Z").toISOString(),
      dateString: "15/11/2024",
      description: "Urgence : menaces physiques immediates a domicile.",
      messages: []
    }
  ]
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const getMockDb = () => {
  if (typeof window === "undefined") return DEFAULT_MOCK_DATA;
  const saved = localStorage.getItem("songrer_mock_db");
  if (!saved) {
    localStorage.setItem("songrer_mock_db", JSON.stringify(DEFAULT_MOCK_DATA));
    return DEFAULT_MOCK_DATA;
  }
  return JSON.parse(saved);
};

const saveMockDb = (data) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("songrer_mock_db", JSON.stringify(data));
  }
};

async function apiFetch(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Erreur API SONGRER.");
  }

  apiAvailable = true;
  if (response.status === 204) return null;
  return response.json();
}

function collectionPath(colName) {
  const path = endpointMap[colName];
  if (!path) throw new Error(`Collection inconnue: ${colName}`);
  return path;
}

export const dbService = {
  isMock: () => !apiAvailable,

  async getItems(colName) {
    try {
      return await apiFetch(collectionPath(colName));
    } catch (error) {
      console.warn("API indisponible, fallback dashboard mock:", error.message);
      apiAvailable = false;
      return getMockDb()[colName] || [];
    }
  },

  async getItem(colName, id) {
    try {
      return await apiFetch(`${collectionPath(colName)}/${id}`);
    } catch {
      const items = getMockDb()[colName] || [];
      return items.find((item) => item.id === id) || null;
    }
  },

  async saveItem(colName, data) {
    try {
      const cleanedData = { ...data };
      if (cleanedData.id === "") delete cleanedData.id;
      const path = cleanedData.id ? `${collectionPath(colName)}/${cleanedData.id}` : collectionPath(colName);
      const method = cleanedData.id ? "PATCH" : "POST";
      return await apiFetch(path, { method, body: JSON.stringify(cleanedData) });
    } catch (error) {
      console.warn("Sauvegarde mock dashboard:", error.message);
      const db = getMockDb();
      if (!db[colName]) db[colName] = [];
      if (data.id) {
        db[colName] = db[colName].map((item) => item.id === data.id ? { ...item, ...data } : item);
      } else {
        data.id = Math.random().toString(36).slice(2, 9);
        db[colName].push(data);
      }
      saveMockDb(db);
      return data;
    }
  },

  async updateItem(colName, id, updates) {
    try {
      return await apiFetch(`${collectionPath(colName)}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.warn("Mise a jour mock dashboard:", error.message);
      const db = getMockDb();
      db[colName] = (db[colName] || []).map((item) => item.id === id ? { ...item, ...updates } : item);
      saveMockDb(db);
      return { id, ...updates };
    }
  },

  async deleteItem(colName, id) {
    try {
      await apiFetch(`${collectionPath(colName)}/${id}`, { method: "DELETE" });
      return id;
    } catch (error) {
      console.warn("Suppression mock dashboard:", error.message);
      const db = getMockDb();
      db[colName] = (db[colName] || []).filter((item) => item.id !== id);
      saveMockDb(db);
      return id;
    }
  },

  subscribe(colName, callback) {
    let cancelled = false;
    let timer;

    const load = async () => {
      const data = await this.getItems(colName);
      if (!cancelled) callback(data);
    };

    load();
    timer = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }
};

export const authService = {
  async login(email, password) {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      const admin = DEFAULT_MOCK_DATA.admins.find((item) => item.email === email);
      if (admin && password === "admin123") {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(admin));
        return admin;
      }
      throw error;
    }
  },

  async logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  async getCurrentUser() {
    const saved = typeof window !== "undefined" ? localStorage.getItem(AUTH_USER_KEY) : null;
    return saved ? JSON.parse(saved) : null;
  },

  onAuthStateChanged(callback) {
    const run = async () => callback(await this.getCurrentUser());
    run();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", run);
      return () => window.removeEventListener("storage", run);
    }
    return () => {};
  }
};
