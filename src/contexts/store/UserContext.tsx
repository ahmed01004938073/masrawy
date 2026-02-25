import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { getMarketerById, getMarketers, updateMarketer, signUpMarketer, Marketer, updateMarketerProfile } from "@/services/marketerService";

export interface User extends Partial<Marketer> {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  status: 'active' | 'inactive';
  pages?: string[];
  userType?: 'marketer' | 'employee';
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (userData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
  getAllUsers: () => Promise<User[]>;
  removeUserPage: (pageIndex: number) => Promise<void>;
  addPage: (pageName: string) => Promise<void>;
  updateUserPassword: (email: string, newPassword: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = sessionStorage.getItem("marketer_auth_token") || localStorage.getItem("marketer_auth_token");
      if (token) {
        try {
          const res = await fetch('/api/auth/session/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // Clear invalid session
            setUser(null);
            sessionStorage.removeItem("current_store_user");
            sessionStorage.removeItem("marketer_auth_token");
            localStorage.removeItem("current_store_user");
            localStorage.removeItem("marketer_auth_token");
          }
        } catch (error) {
          console.error("Token validation error", error);
        }
      } else {
        // Safe check for local user data
        const savedUser = sessionStorage.getItem("current_store_user") || localStorage.getItem("current_store_user");
        if (savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch (e) { /* ignore */ }
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/marketer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "خطأ في تسجيل الدخول");
        return false;
      }

      const data = await response.json();
      const { user: foundUser, token } = data;

      if (foundUser && token) {
        setUser(foundUser);

        // Store Token and User with isolated keys
        sessionStorage.setItem("marketer_auth_token", token);
        sessionStorage.setItem("current_store_user", JSON.stringify(foundUser));

        if (rememberMe) {
          localStorage.setItem("marketer_auth_token", token);
          localStorage.setItem("current_store_user", JSON.stringify(foundUser));
        } else {
          localStorage.removeItem("marketer_auth_token");
          localStorage.removeItem("current_store_user");
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error", error);
      toast.error("حدث خطأ في الاتصال");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      await signUpMarketer({
        ...userData,
        status: 'active',
        pages: []
      });
      toast.success("تم إنشاء الحساب بنجاح");
      return true;
    } catch (error: any) {
      console.error("Registration error", error);
      toast.error(error.message || "فشل إنشاء الحساب");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("current_store_user");
    sessionStorage.removeItem("marketer_auth_token");
    localStorage.removeItem("current_store_user");
    localStorage.removeItem("marketer_auth_token");
    localStorage.removeItem("user");
    toast.success("تم تسجيل الخروج");
  };

  const updateUserInfo = async (userData: Partial<User>): Promise<boolean> => {
    if (user) {
      try {
        const updatedUser = await updateMarketerProfile(userData);
        if (updatedUser) {
          setUser(updatedUser);
          sessionStorage.setItem("current_store_user", JSON.stringify(updatedUser));
          if (localStorage.getItem("current_store_user")) {
            localStorage.setItem("current_store_user", JSON.stringify(updatedUser));
          }
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("Failed to update user info", error);
        toast.error(error.message || "فشل تحديث البيانات");
        return false;
      }
    }
    return false;
  };

  const removeUserPage = async (pageIndex: number) => {
    if (user && user.pages) {
      const updatedPages = user.pages.filter((_, index) => index !== pageIndex);
      await updateUserInfo({ pages: updatedPages });
    }
  };

  const addPage = async (pageName: string) => {
    if (user) {
      const updatedPages = [...(user.pages || []), pageName];
      await updateUserInfo({ pages: updatedPages });
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const result = await getMarketers();
    return Array.isArray(result) ? (result as any) : (result as any).data;
  };

  const updateUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
    // If it's the current user, use the secure profile update
    if (user && user.email === email) {
      try {
        await updateMarketerProfile({ password: newPassword });
        return true;
      } catch (error) {
        console.error("Failed to update own password:", error);
        return false;
      }
    }

    // Fallback for admin use (requires permissions)
    try {
      const result = await getMarketers();
      const marketers = Array.isArray(result) ? result : (result as any).data;
      const targetUser = (marketers as any[]).find(m => m.email === email);
      if (targetUser) {
        await updateMarketer({
          ...targetUser,
          password: newPassword
        });
        return true;
      }
    } catch (e) {
      console.error("Admin password update failed:", e);
    }
    return false;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        updateUserInfo,
        isLoading,
        getAllUsers,
        removeUserPage,
        addPage,
        updateUserPassword
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
