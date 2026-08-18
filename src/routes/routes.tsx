// routes.tsx
import MainLayout from "../layouts/MainLayout";
import {
  Home, Dashboard, TicketProcessing, Reports, Settings, QuanLyThietBi,
  SlcDashboard, ProjectTimeline, ChangeManagement, BusinessProcessMgmt, SoftwareCatalog, SlcImport,
} from "../pages";
import LoginPage from "../pages/Login/LoginPage";
import NotFound from "../pages/NotFound/NotFound";
import RequireAuth from "./RequireAuth";
import { Navigate } from "react-router-dom";
import RequireRole from "./RequireRole";

export const routes = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <TicketProcessing />
          </RequireAuth>
        ),
      },
      {
        path: "dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "ticket-processing",
        element: (
          <RequireAuth>
            <TicketProcessing />
          </RequireAuth>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <Reports />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <Settings />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "home",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <Home />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "quan-ly-thiet-bi",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <QuanLyThietBi />
            </RequireRole>
          </RequireAuth>
        ),
      },
      // ─── SLC Module ────────────────────────────────────────────
      {
        path: "slc/dashboard",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <SlcDashboard />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "slc/project-timeline",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <ProjectTimeline />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "slc/change-management",
        element: (
          <RequireAuth>
            <ChangeManagement />
          </RequireAuth>
        ),
      },
      {
        path: "slc/business-process",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <BusinessProcessMgmt />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "slc/software-catalog",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <SoftwareCatalog />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "slc/import",
        element: (
          <RequireAuth>
            <RequireRole allowedRoles={["admin"]}>
              <SlcImport />
            </RequireRole>
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/home",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
