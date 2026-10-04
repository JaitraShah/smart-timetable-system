import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { useAuth, dashboardPathForUiRole, type UiRole } from "../context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TimetableManagement from "./pages/admin/TimetableManagement";
import RoomManagement from "./pages/admin/RoomManagement";
import BookingApproval from "./pages/admin/BookingApproval";
import DataUpload from "./pages/admin/DataUpload";
import Reports from "./pages/admin/Reports";
import EventOrganiserDashboard from "./pages/organiser/EventOrganiserDashboard";
import BookingRequestForm from "./pages/organiser/BookingRequestForm";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import TimetableView from "./pages/shared/TimetableView";
import Notifications from "./pages/shared/Notifications";
import ProfilePage from "./pages/shared/ProfilePage";
import UserManagement from "./pages/admin/UserManagement";
import AcademicData from "./pages/admin/AcademicData";

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9ff" }}>
        <p style={{ color: "#64748b" }}>Loading…</p>
      </div>
    );
  }
  if (user) return <Navigate to={dashboardPathForUiRole(user.uiRole)} replace />;
  return <>{children}</>;
}

function ProtectedRoute({ roles, children }: { roles: UiRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9ff" }}>
        <p style={{ color: "#64748b" }}>Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.uiRole)) return <Navigate to={dashboardPathForUiRole(user.uiRole)} replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  {
    path: "/login",
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: "/signup",
    element: (
      <GuestOnly>
        <SignUpPage />
      </GuestOnly>
    ),
  },
  { path: "/login/:role", element: <GuestOnly><LoginPage /></GuestOnly> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/timetable",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <TimetableManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/rooms",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <RoomManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/bookings",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <BookingApproval />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/upload",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <DataUpload />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/reports",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/academic",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AcademicData />
      </ProtectedRoute>
    ),
  },
  {
    path: "/organiser",
    element: (
      <ProtectedRoute roles={["organiser"]}>
        <EventOrganiserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/organiser/booking-request",
    element: (
      <ProtectedRoute roles={["organiser"]}>
        <BookingRequestForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/faculty",
    element: (
      <ProtectedRoute roles={["faculty"]}>
        <FacultyDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student",
    element: (
      <ProtectedRoute roles={["student"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/timetable",
    element: (
      <ProtectedRoute roles={["faculty", "student", "admin"]}>
        <TimetableView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/notifications",
    element: (
      <ProtectedRoute roles={["admin", "faculty", "student", "organiser"]}>
        <Notifications />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute roles={["admin", "faculty", "student", "organiser"]}>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
]);
