import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/dashboard";
import Assets from "./pages/Assets";
import Assignments from "./pages/Assignments";
import Repair from "./pages/Repair";
import ReturnPage from "./pages/ReturnPage";
import Auction from "./pages/Auction";
import Reports from "./pages/Reports";
import AdminProfile from "./pages/AdminProfile";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/return" element={<ReturnPage />} />
          <Route path="/auction" element={<Auction />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
