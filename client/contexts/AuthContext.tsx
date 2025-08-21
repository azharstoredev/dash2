import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  updateEmail: (email: string) => Promise<boolean>;
  adminInfo: { id: string; email: string } | null;
  fetchAdminInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    id: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("adminAuth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      fetchAdminInfo();
    }
  }, []);

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch("/api/admin/info");
      const result = await response.json();

      if (result.success) {
        setAdminInfo({
          id: result.data.id,
          email: result.data.email,
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin info:", error);
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        localStorage.setItem("adminAuth", "true");
        await fetchAdminInfo();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Change password error:", error);
      return false;
    }
  };

  const updateEmail = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchAdminInfo(); // Refresh admin info
      }

      return result.success;
    } catch (error) {
      console.error("Update email error:", error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminInfo(null);
    localStorage.removeItem("adminAuth");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        changePassword,
        updateEmail,
        adminInfo,
        fetchAdminInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
