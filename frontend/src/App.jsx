import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Mint from "./pages/Mint";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
