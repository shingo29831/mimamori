import "@/../css/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "@/App";
import LoginPage from "@/pages/login";
import StaffDashboard from "@/pages/staff";
import FamilyDashboard from "@/pages/family";
import FamilyLinks from "@/pages/family-links";
import SystemManagement from "@/pages/system-management";
import Layout from "@/layout/layout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicOnlyRoute from "@/routes/PublicOnlyRoute";

const RootComponent = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<App />} />

        {/* 未ログイン時のみ表示。ログイン済なら自動で各ダッシュボードへ */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* ログイン必須 + ロール制限 */}
        <Route
          path="/dashboard/staff"
          element={
            <ProtectedRoute roles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/family"
          element={
            <ProtectedRoute roles={["family"]}>
              <FamilyDashboard />
            </ProtectedRoute>
          }
        />

        {/* 管理系: 例として職員のみ */}
        <Route
          path="/management/family-links"
          element={
            <ProtectedRoute roles={["staff"]}>
              <FamilyLinks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management/system-management"
          element={
            <ProtectedRoute roles={["staff"]}>
              <SystemManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
