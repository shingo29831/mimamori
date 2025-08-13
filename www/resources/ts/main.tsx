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

const RootComponent = () => (
    <BrowserRouter>
        <Layout>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard/staff" element={<StaffDashboard />} />
                <Route path="/dashboard/family" element={<FamilyDashboard />} />
                <Route
                    path="/management/family-links"
                    element={<FamilyLinks />}
                />
                <Route
                    path="/management/system-management"
                    element={<SystemManagement />}
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
