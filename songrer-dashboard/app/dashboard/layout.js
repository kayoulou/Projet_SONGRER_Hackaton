"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService, dbService } from "../lib/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    // Check authentication
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsMock(dbService.isMock());
      setLoading(false);
      if (!currentUser) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
      await authService.logout();
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Vérification de la session...</p>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { name: "Tableau de Bord", path: "/dashboard", icon: "📊" },
    { name: "Signalements VBG", path: "/dashboard/reports", icon: "🚨" },
    { name: "ONG Partenaires", path: "/dashboard/organizations", icon: "🏢" },
    { name: "Vidéos Applicatives", path: "/dashboard/videos", icon: "🎥" },
    { name: "Compteurs Mobiles", path: "/dashboard/statistics", icon: "⚙️" },
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar - Desktop */}
      <aside style={{ ...styles.sidebar, display: mobileMenuOpen ? "flex" : "none" }} className="mobile-sidebar-override">
        <div style={styles.sidebarHeader}>
          <div style={styles.logoBadge}>⚡</div>
          <div style={styles.logoTextContainer}>
            <span style={styles.logoTitle}>SONGRER</span>
            <span style={styles.logoSubtitle}>Admin Portal</span>
          </div>
        </div>

        {isMock && (
          <div style={styles.mockBadge}>
            🟢 Mode Démo (local)
          </div>
        )}

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setMobileMenuOpen(false);
                }}
                style={{
                  ...styles.navLink,
                  backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--foreground)",
                  fontWeight: isActive ? "700" : "500",
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.name}</span>
                {isActive && <div style={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user.name ? user.name[0] : "A"}</div>
            <div style={styles.userText}>
              <div style={styles.userName}>{user.name || "Administrateur"}</div>
              <div style={styles.userRole}>{user.role || "Admin"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.mainWrapper}>
        {/* Header */}
        <header style={styles.header}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.menuTrigger}
          >
            ☰
          </button>
          
          <div style={styles.headerTitleContainer}>
            <h2 style={styles.headerPageTitle}>
              {menuItems.find(item => item.path === pathname)?.name || "Dashboard"}
            </h2>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.liveIndicator}>
              <span style={styles.pulseDot} />
              <span style={styles.liveText}>{isMock ? "Mode demo local" : "API SONGRER connectee"}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main style={styles.content}>
          {children}
        </main>
      </div>

      {/* CSS CSS Inject for mobile viewports */}
      <style jsx global>{`
        .mobile-sidebar-override {
          display: flex !important;
        }
        @media (max-width: 992px) {
          .mobile-sidebar-override {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 1000;
            width: 280px;
            display: ${mobileMenuOpen ? "flex" : "none"} !important;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
          }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "var(--background)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f7fafc",
  },
  spinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid var(--border-color)",
    borderTopColor: "var(--primary)",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "var(--text-muted)",
    fontWeight: "500",
  },
  sidebar: {
    width: "280px",
    flexShrink: 0,
    backgroundColor: "var(--card-bg)",
    borderRight: "1px solid var(--border-color)",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid var(--border-color)",
    gap: "12px",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "var(--primary-gradient)",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    fontWeight: "800",
    boxShadow: "0 4px 8px rgba(216, 27, 96, 0.2)",
  },
  logoTextContainer: {
    display: "flex",
    flexDirection: "column",
  },
  logoTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "var(--primary)",
    letterSpacing: "0.5px",
  },
  logoSubtitle: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  mockBadge: {
    margin: "12px 20px 0 20px",
    background: "var(--primary-light)",
    color: "var(--primary)",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "700",
    textAlign: "center",
    border: "1px solid rgba(216, 27, 96, 0.15)",
  },
  nav: {
    flex: 1,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    position: "relative",
  },
  navIcon: {
    marginRight: "12px",
    fontSize: "18px",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: "4px",
    backgroundColor: "var(--primary)",
    borderRadius: "0 4px 4px 0",
  },
  sidebarFooter: {
    padding: "20px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "700",
    fontSize: "16px",
  },
  userText: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "13px",
    fontWeight: "700",
  },
  userRole: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  logoutButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "background-color 0.2s",
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  header: {
    height: "70px",
    backgroundColor: "var(--card-bg)",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    flexShrink: 0,
  },
  menuTrigger: {
    display: "none",
    border: "none",
    background: "transparent",
    fontSize: "24px",
    cursor: "pointer",
    color: "var(--foreground)",
  },
  headerTitleContainer: {
    display: "flex",
    alignItems: "center",
  },
  headerPageTitle: {
    fontSize: "20px",
    fontWeight: "800",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--success-light)",
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid rgba(16, 185, 129, 0.15)",
  },
  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--success)",
    animation: "pulse 2s infinite",
  },
  liveText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--success)",
  },
  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
  },
};
