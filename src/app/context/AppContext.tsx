import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "Admin" | "Reception" | "Nurse" | "Clinician";

interface AppState {
  isAuthenticated: boolean;
  role: Role;
  pendingAuth: { role: Role; isFirstLogin: boolean } | null;
  setPendingAuth: (data: { role: Role; isFirstLogin: boolean } | null) => void;
  login: (role: Role) => void;
  logout: () => void;
  setRole: (role: Role) => void; // for the demo role switcher in the shell
  isFeedbackModalOpen: boolean;
  setFeedbackModalOpen: (open: boolean) => void;
  // Sidebar expanded/collapsed. Lives here (not local AppShell state, not
  // localStorage) so the choice is "remembered" for the session via a
  // reported callback the whole app can see, without writing a persisted
  // preference to the browser.
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("phenome_auth") === "true";
  });
  
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem("phenome_role") as Role) || "Admin";
  });
  
  const [pendingAuth, setPendingAuth] = useState<{ role: Role; isFirstLogin: boolean } | null>(null);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem("phenome_auth", isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("phenome_role", role);
  }, [role]);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  const login = (newRole: Role) => {
    setRole(newRole);
    setIsAuthenticated(true);
    setPendingAuth(null);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPendingAuth(null);
    localStorage.removeItem("phenome_auth");
  };

  return (
    <AppContext.Provider value={{ 
      isAuthenticated, 
      role, 
      pendingAuth, 
      setPendingAuth, 
      login, 
      logout, 
      setRole,
      isFeedbackModalOpen,
      setFeedbackModalOpen,
      sidebarCollapsed,
      setSidebarCollapsed
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
}
