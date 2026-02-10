import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = () => {
    return user?.role === 'admin' && user?.user_role === 'super_admin';
  };

  const isCompanyAdmin = () => {
    return user?.user_role === 'company_admin' && user?.company_id;
  };

  const canAccessCompany = (companyId) => {
    if (isSuperAdmin()) return true;
    return user?.company_id === companyId;
  };

  const getUserCompanyId = () => {
    return user?.company_id || null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isSuperAdmin, 
      isCompanyAdmin, 
      canAccessCompany,
      getUserCompanyId,
      refreshUser: loadUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}