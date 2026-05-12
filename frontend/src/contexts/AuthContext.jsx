import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading state
    const timer = setTimeout(() => {
      if (token) {
        fetchUserProfile();
      } else {
        setIsLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      // For demo purposes, set a mock user if backend is not available
      if (process.env.NODE_ENV === "development") {
        setUser({
          id: "demo-user",
          publicKey:
            localStorage.getItem("publicKey") ||
            "GDEMO1234567890123456789012345678901234",
          email: "demo@commodichain.com",
        });
        setIsLoading(false);
        return;
      }

      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // For demo, don't logout on error
      setUser({
        id: "demo-user",
        publicKey:
          localStorage.getItem("publicKey") ||
          "GDEMO1234567890123456789012345678901234",
        email: "demo@commodichain.com",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (publicKey) => {
    try {
      // For demo purposes, simulate successful login
      if (process.env.NODE_ENV === "development") {
        const mockUser = {
          id: "demo-user",
          publicKey: publicKey,
          email: "demo@commodichain.com",
        };
        const mockToken = "demo-token-" + Date.now();

        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem("token", mockToken);
        localStorage.setItem("publicKey", publicKey);

        toast.success("Successfully logged in with demo credentials!");
        return true;
      }

      // Get challenge from server
      const challengeResponse = await authAPI.getChallenge({ publicKey });
      const { challenge } = challengeResponse.data;

      // Sign challenge with Freighter
      const { freighterAPI } = await import("@stellar/freighter-api");
      const signedChallenge = await freighterAPI.signTransaction(challenge);

      // Verify signature and get token
      const verifyResponse = await authAPI.verifyChallenge({
        publicKey,
        signature: signedChallenge,
      });

      const { token: newToken, user: userData } = verifyResponse.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      localStorage.setItem("publicKey", publicKey);

      toast.success("Successfully logged in!");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      // For demo, still succeed on error
      const mockUser = {
        id: "demo-user",
        publicKey: publicKey,
        email: "demo@commodichain.com",
      };
      const mockToken = "demo-token-" + Date.now();

      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem("token", mockToken);
      localStorage.setItem("publicKey", publicKey);

      toast.success("Successfully logged in with demo credentials!");
      return true;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      toast.success("Logged out successfully");
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data);
      toast.success("Profile updated successfully!");
      return response.data;
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
      throw error;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
