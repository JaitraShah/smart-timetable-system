import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { pool } from "../config/db.js";
import * as auth from "../controllers/authController.js";
import * as users from "../controllers/userController.js";
import * as academic from "../controllers/academicController.js";
import * as timetable from "../controllers/timetableController.js";
import * as bookings from "../controllers/bookingController.js";
import * as requests from "../controllers/requestController.js";
import * as notifications from "../controllers/notificationController.js";
import * as uploads from "../controllers/uploadController.js";
import * as dashboard from "../controllers/dashboardController.js";

const r = Router();

/** Public lists for signup forms (no auth). */
r.get("/public/divisions", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT d.id, d.name, d.code, d.semester_id, sem.name AS semester_name, dep.name AS department_name
     FROM divisions d
     JOIN semesters sem ON sem.id = d.semester_id
     JOIN departments dep ON dep.id = d.department_id
     ORDER BY d.id`
  );
  res.json(rows);
});
r.get("/public/departments", async (_req, res) => {
  const [rows] = await pool.query(`SELECT id, name, code FROM departments ORDER BY name`);
  res.json(rows);
});

r.post("/auth/register", auth.register);
r.post("/auth/login", auth.login);
r.get("/auth/me", authMiddleware, auth.me);

r.get("/users", authMiddleware, requireRoles("admin"), users.listUsers);
r.patch("/users/:id/status", authMiddleware, requireRoles("admin"), users.updateUserStatus);
r.patch("/users/me", authMiddleware, users.updateProfile);
r.get("/users/faculty", authMiddleware, requireRoles("admin"), async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.full_name FROM users u JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'faculty' AND u.registration_status = 'active'`
  );
  res.json(rows);
});

r.get("/departments", authMiddleware, academic.listDepartments);
r.post("/departments", authMiddleware, requireRoles("admin"), academic.createDepartment);
r.patch("/departments/:id", authMiddleware, requireRoles("admin"), academic.updateDepartment);
r.delete("/departments/:id", authMiddleware, requireRoles("admin"), academic.deleteDepartment);
r.get("/terms", authMiddleware, academic.listTerms);
r.post("/terms", authMiddleware, requireRoles("admin"), academic.createTerm);
r.patch("/terms/:id", authMiddleware, requireRoles("admin"), academic.updateTerm);
r.delete("/terms/:id", authMiddleware, requireRoles("admin"), academic.deleteTerm);
r.get("/semesters", authMiddleware, academic.listSemesters);
r.post("/semesters", authMiddleware, requireRoles("admin"), academic.createSemester);
r.patch("/semesters/:id", authMiddleware, requireRoles("admin"), academic.updateSemester);
r.delete("/semesters/:id", authMiddleware, requireRoles("admin"), academic.deleteSemester);
r.get("/divisions", authMiddleware, academic.listDivisions);
r.post("/divisions", authMiddleware, requireRoles("admin"), academic.createDivision);
r.patch("/divisions/:id", authMiddleware, requireRoles("admin"), academic.updateDivision);
r.delete("/divisions/:id", authMiddleware, requireRoles("admin"), academic.deleteDivision);
r.get("/subjects", authMiddleware, academic.listSubjects);
r.post("/subjects", authMiddleware, requireRoles("admin"), academic.createSubject);
r.patch("/subjects/:id", authMiddleware, requireRoles("admin"), academic.updateSubject);
r.delete("/subjects/:id", authMiddleware, requireRoles("admin"), academic.deleteSubject);
r.get("/faculty-subjects", authMiddleware, requireRoles("admin"), academic.listFacultySubjects);
r.post("/faculty-subjects", authMiddleware, requireRoles("admin"), academic.createFacultySubject);
r.delete("/faculty-subjects/:id", authMiddleware, requireRoles("admin"), academic.deleteFacultySubject);
r.get("/rooms", authMiddleware, academic.listRooms);
r.post("/rooms", authMiddleware, requireRoles("admin"), academic.createRoom);
r.patch("/rooms/:id", authMiddleware, requireRoles("admin"), academic.updateRoom);
r.delete("/rooms/:id", authMiddleware, requireRoles("admin"), academic.deleteRoom);

r.post("/timetable/check", authMiddleware, requireRoles("admin"), timetable.checkTimetable);
r.post("/timetable", authMiddleware, requireRoles("admin"), timetable.createEntry);
r.patch("/timetable/:id", authMiddleware, requireRoles("admin"), timetable.updateEntry);
r.delete("/timetable/:id", authMiddleware, requireRoles("admin"), timetable.deleteEntry);
r.get("/timetable", authMiddleware, timetable.listTimetable);
r.post("/timetable/generate", authMiddleware, requireRoles("admin"), timetable.generateTimetable);
r.post("/timetable/import-csv", authMiddleware, requireRoles("admin"), timetable.importCsv);

r.post("/bookings/check", authMiddleware, requireRoles("admin", "event_organiser"), bookings.checkBooking);
r.post("/bookings", authMiddleware, requireRoles("event_organiser"), bookings.createBooking);
r.get("/bookings", authMiddleware, bookings.listBookings);
r.patch("/bookings/:id/decision", authMiddleware, requireRoles("admin"), bookings.decideBooking);
r.patch(
  "/bookings/:id/apply-alternative",
  authMiddleware,
  requireRoles("admin"),
  bookings.applyBookingAlternative
);

r.post("/requests/timetable-change", authMiddleware, requireRoles("faculty"), requests.createChangeRequest);
r.get("/requests/timetable-change", authMiddleware, requests.listChangeRequests);
r.get(
  "/requests/timetable-change/:id/suggestions",
  authMiddleware,
  requireRoles("admin"),
  requests.getChangeRequestSuggestions
);
r.patch(
  "/requests/timetable-change/:id",
  authMiddleware,
  requireRoles("admin"),
  requests.resolveChangeRequest
);

r.get("/notifications/unread-count", authMiddleware, notifications.unreadCount);
r.get("/notifications", authMiddleware, notifications.listNotifications);
r.patch("/notifications/:id/read", authMiddleware, notifications.markRead);
r.post("/notifications/read-all", authMiddleware, notifications.markAllRead);

r.post(
  "/uploads",
  authMiddleware,
  requireRoles("admin"),
  uploads.uploadMiddleware.single("file"),
  uploads.uploadFile
);
r.get("/uploads", authMiddleware, requireRoles("admin"), uploads.listUploads);

r.get("/dashboard/admin", authMiddleware, requireRoles("admin"), dashboard.adminDashboard);
r.get("/dashboard/faculty", authMiddleware, requireRoles("faculty"), dashboard.facultyDashboard);
r.get("/dashboard/student", authMiddleware, requireRoles("student"), dashboard.studentDashboard);
r.get(
  "/dashboard/organiser",
  authMiddleware,
  requireRoles("event_organiser"),
  dashboard.organiserDashboard
);

r.use((_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

export const apiRouter = r;
