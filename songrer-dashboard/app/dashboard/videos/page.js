"use client";

import { useState, useEffect } from "react";
import { dbService } from "../../lib/api";

export default function VideosManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    author: "",
    location: "Burkina Faso",
    duration: "2min",
    url: "",
    description: "",
    thumbnailUrl: "",
    views: "0",
    likes: 0,
    commentsCount: 0,
    sharesCount: 0
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = dbService.subscribe("videos", (data) => {
      setVideos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.url) {
      alert("Veuillez remplir le titre, l'auteur et l'URL");
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        likes: Number(formData.likes) || 0,
        commentsCount: Number(formData.commentsCount) || 0,
        sharesCount: Number(formData.sharesCount) || 0
      };

      if (!dataToSave.thumbnailUrl) {
        dataToSave.thumbnailUrl = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=640&auto=format&fit=crop";
      }

      await dbService.saveItem("videos", dataToSave);
      alert(editing ? "Vidéo mise à jour." : "Nouvelle vidéo ajoutée avec succès.");
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (video) => {
    setFormData(video);
    setEditing(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
      try {
        await dbService.deleteItem("videos", id);
        alert("Vidéo supprimée de l'application.");
        if (formData.id === id) resetForm();
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      author: "",
      location: "Burkina Faso",
      duration: "2min",
      url: "",
      description: "",
      thumbnailUrl: "",
      views: "0",
      likes: 0,
      commentsCount: 0,
      sharesCount: 0
    });
    setEditing(false);
  };

  if (loading) {
    return <div style={styles.loading}>Chargement des vidéos de sensibilisation...</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.row}>
        {/* Videos Grid */}
        <div style={styles.listCard}>
          <h4 style={styles.sectionTitle}>Vidéos Applicatives ({videos.length})</h4>
          <div style={styles.videoGrid}>
            {videos.map((vid) => (
              <div key={vid.id} style={styles.videoCard}>
                <div style={styles.thumbnailContainer}>
                  {vid.url ? (
                    <video
                      src={vid.url}
                      style={{ ...styles.thumbnail, objectFit: "cover", width: "100%", height: "100%" }}
                      muted
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      style={styles.thumbnail}
                    />
                  )}
                  <div style={styles.durationBadge}>{vid.duration}</div>
                  <div style={styles.playOverlay}>▶️</div>
                </div>
                <div style={styles.videoInfo}>
                  <h5 style={styles.videoTitle}>{vid.title}</h5>
                  <p style={styles.videoAuthor}>{vid.author} • {vid.location}</p>
                  <p style={styles.videoDesc}>{vid.description}</p>
                  
                  <div style={styles.videoMetrics}>
                    <span>👁️ {vid.views}</span>
                    <span>❤️ {vid.likes}</span>
                    <span>💬 {vid.commentsCount}</span>
                  </div>

                  <div style={styles.actions}>
                    <button onClick={() => handleEdit(vid)} style={styles.editBtn}>✏️ Modifier</button>
                    <button onClick={() => handleDelete(vid.id)} style={styles.deleteBtn}>🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div style={styles.noData}>Aucune vidéo disponible pour le moment.</div>
            )}
          </div>
        </div>

        {/* Form Video */}
        <div style={styles.formCard}>
          <h4 style={styles.sectionTitle}>{editing ? "Modifier la vidéo" : "Ajouter une vidéo de sensibilisation"}</h4>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Titre de la vidéo</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Violence basée sur le genre : briser le silence"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Auteur / Institution</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Ex: @onu_femmes_afrique"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Localisation / Pays</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ex: Burkina Faso, Côte d'Ivoire"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Durée du média</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Ex: 2min, 4:15"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Lien direct du fichier vidéo (.mp4 requis)</label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="Ex: https://songrer-media.s3.amazonaws.com/videos/witness1.mp4"
                required
                style={styles.input}
              />
              <span style={{ fontSize: '10px', color: '#e91e63', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                ⚠️ Direct .mp4 requis pour le mobile (les liens YouTube standard afficheront un écran noir).
              </span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>URL Miniatures / Image de couverture</label>
              <input
                type="text"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleInputChange}
                placeholder="Lien HTTP vers une image d'illustration"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description textuelle</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Quelques lignes sur le message de la vidéo..."
                rows="3"
                style={styles.textarea}
              />
            </div>

            <div style={styles.metricsRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Vues</label>
                <input
                  type="text"
                  name="views"
                  value={formData.views}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Likes</label>
                <input
                  type="number"
                  name="likes"
                  value={formData.likes}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn}>
                {editing ? "Enregistrer les modifications" : "Publier la vidéo"}
              </button>
              {editing && (
                <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    color: "var(--text-muted)",
    fontSize: "16px",
    fontWeight: "600",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1.2fr",
    gap: "24px",
    alignItems: "start",
  },
  listCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
  },
  formCard: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    boxShadow: "var(--shadow-md)",
    position: "sticky",
    top: "30px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    marginBottom: "20px",
  },
  videoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  videoCard: {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  thumbnailContainer: {
    height: "160px",
    position: "relative",
    backgroundColor: "#000",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.8,
  },
  durationBadge: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "700",
  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "32px",
    color: "#fff",
    opacity: 0.9,
    cursor: "pointer",
  },
  videoInfo: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  videoTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "var(--foreground)",
    lineHeight: "1.4",
  },
  videoAuthor: {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  videoDesc: {
    fontSize: "12px",
    color: "var(--foreground)",
    opacity: 0.8,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.4",
  },
  videoMetrics: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "var(--text-muted)",
    fontWeight: "600",
    marginTop: "4px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  editBtn: {
    flex: 1,
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--card-bg)",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },
  deleteBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    backgroundColor: "var(--danger-light)",
    color: "var(--danger)",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  noData: {
    gridColumn: "1 / -1",
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "40px",
    fontSize: "13px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--foreground)",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    outline: "none",
    fontSize: "14px",
  },
  textarea: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    outline: "none",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  formActions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  submitBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--primary)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "12px 18px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
};
