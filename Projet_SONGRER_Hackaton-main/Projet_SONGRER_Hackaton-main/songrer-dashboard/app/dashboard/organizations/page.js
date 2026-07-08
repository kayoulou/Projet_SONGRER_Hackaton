"use client";

import { useState, useEffect } from "react";
import { dbService } from "../../lib/api";

export default function OrganizationsManagement() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: "", name: "", distance: "", phone: "", icon: "home" });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = dbService.subscribe("organizations", (data) => {
      setOrgs(data);
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
    if (!formData.name || !formData.phone) {
      alert("Veuillez remplir le nom et le téléphone");
      return;
    }

    try {
      if (editing) {
        await dbService.saveItem("organizations", formData);
        alert("ONG mise à jour avec succès.");
      } else {
        const newOrg = { 
          name: formData.name, 
          distance: formData.distance || "1km", 
          phone: formData.phone, 
          icon: formData.icon || "home" 
        };
        await dbService.saveItem("organizations", newOrg);
        alert("Nouvelle ONG ajoutée avec succès.");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (org) => {
    setFormData(org);
    setEditing(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Voulez-vous vraiment supprimer cette organisation ?")) {
      try {
        await dbService.deleteItem("organizations", id);
        alert("Organisation supprimée.");
        if (formData.id === id) resetForm();
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", distance: "", phone: "", icon: "home" });
    setEditing(false);
  };

  if (loading) {
    return <div style={styles.loading}>Chargement des ONG partenaires...</div>;
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.row}>
        {/* NGO List */}
        <div style={styles.listCard}>
          <h4 style={styles.sectionTitle}>Organisations Enregistrées ({orgs.length})</h4>
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.tableTh}>Logo / Icone</th>
                  <th style={styles.tableTh}>Nom de l'ONG</th>
                  <th style={styles.tableTh}>Distance moyenne</th>
                  <th style={styles.tableTh}>Numéro d'appel</th>
                  <th style={styles.tableTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} style={styles.tableRow}>
                    <td style={styles.tableTd}>
                      <span style={styles.iconPreview}>
                        {org.icon === "shield" ? "🛡️" : org.icon === "heart" ? "❤️" : "🏠"}
                      </span>
                    </td>
                    <td style={{ ...styles.tableTd, fontWeight: "700" }}>{org.name}</td>
                    <td style={styles.tableTd}>{org.distance}</td>
                    <td style={styles.tableTd}>{org.phone}</td>
                    <td style={styles.tableTd}>
                      <div style={styles.actions}>
                        <button onClick={() => handleEdit(org)} style={styles.editBtn}>✏️ Modifier</button>
                        <button onClick={() => handleDelete(org.id)} style={styles.deleteBtn}>🗑️ Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ ...styles.tableTd, textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                      Aucune ONG partenaire configurée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div style={styles.formCard}>
          <h4 style={styles.sectionTitle}>{editing ? "Modifier l'ONG" : "Ajouter une ONG Partenaire"}</h4>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom de l'organisation</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Voix de Femmes, Cellule VBG"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Distance moyenne (visible par rapport à la capitale/utilisateur)</label>
              <input
                type="text"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
                placeholder="Ex: 2km, 12km"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Numéro d'appel d'urgence (Appel direct mobile)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex: +226 25 30 00 00"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Type d'icône d'affichage</label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="home">🏠 Maison d'accueil (Par défaut)</option>
                <option value="shield">🛡️ Cellule de protection / Sécurité</option>
                <option value="heart">❤️ Association d'aide / Soutien</option>
              </select>
            </div>

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn}>
                {editing ? "Enregistrer les modifications" : "Ajouter l'organisation"}
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
  tableResponsive: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeadRow: {
    borderBottom: "2px solid var(--border-color)",
  },
  tableTh: {
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background-color 0.2s",
  },
  tableTd: {
    padding: "16px",
    fontSize: "14px",
  },
  iconPreview: {
    fontSize: "20px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  editBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-color)",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "var(--background)",
    },
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
    transition: "opacity 0.2s",
    ":hover": {
      opacity: 0.8,
    },
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
  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    outline: "none",
    fontSize: "14px",
    cursor: "pointer",
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
    transition: "background-color 0.2s",
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
