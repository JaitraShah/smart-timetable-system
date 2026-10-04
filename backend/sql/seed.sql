-- Seed data for local testing — passwords are PLAIN TEXT (demo only).

SET NAMES utf8mb4;

INSERT INTO departments (id, name, code) VALUES
  (1, 'Computer Science', 'CS'),
  (2, 'Electronics', 'EC');

INSERT INTO academic_terms (id, name, start_month, end_month) VALUES
  (1, 'Spring Session (Jan–May)', 1, 5),
  (2, 'Monsoon Session (Jul–Dec)', 7, 12);

INSERT INTO semesters (id, name, academic_year, academic_term_id) VALUES
  (1, 'Semester 4', 2026, 1),
  (2, 'Semester 6', 2026, 1);

INSERT INTO divisions (id, name, code, semester_id, department_id) VALUES
  (1, 'CS Div A', 'CS4A', 1, 1),
  (2, 'CS Div B', 'CS4B', 1, 1);

-- INSECURE: password_plain — local academic demo only.
INSERT INTO users (id, email, password_plain, full_name, role_id, registration_status, department_id, division_id) VALUES
  (1, 'admin@nmims.edu', 'admin123', 'Admin User', 1, 'active', NULL, NULL),
  (2, 'dr.sharma@nmims.edu', 'demo123', 'Dr. Sharma', 2, 'active', 1, NULL),
  (3, 'dr.patel@nmims.edu', 'demo123', 'Dr. Patel', 2, 'active', 1, NULL),
  (4, 'prof.kumar@nmims.edu', 'demo123', 'Prof. Kumar', 2, 'active', 1, NULL),
  (5, 'rahul@nmims.edu', 'demo123', 'Rahul Mehta', 3, 'active', NULL, 1),
  (6, 'priya@nmims.edu', 'demo123', 'Priya Shah', 3, 'active', NULL, 1),
  (7, 'events@nmims.edu', 'demo123', 'Events Team', 4, 'active', NULL, NULL),
  (8, 'culture@nmims.edu', 'demo123', 'Cultural Committee', 4, 'active', NULL, NULL),
  (9, 'pending.user@nmims.edu', 'demo123', 'Pending Test User', 3, 'pending', NULL, NULL);

INSERT INTO subjects (id, name, code, department_id, default_duration_slots, requires_lab) VALUES
  (1, 'Data Structures', 'CS201', 1, 1, 0),
  (2, 'Database Systems', 'CS301', 1, 1, 0),
  (3, 'Web Development', 'CS350', 1, 2, 1),
  (4, 'Algorithms', 'CS401', 1, 1, 0),
  (5, 'Computer Networks', 'CS302', 1, 2, 0);

INSERT INTO faculty_subjects (user_id, subject_id, division_id) VALUES
  (2, 1, 1), (2, 4, 1),
  (3, 2, 1),
  (4, 3, 1), (4, 5, 1);

INSERT INTO student_enrollments (user_id, division_id) VALUES
  (5, 1), (6, 1), (9, 1);

INSERT INTO rooms (id, name, room_type, capacity, is_available, department_id) VALUES
  (1, 'CR-101', 'classroom', 60, 1, 1),
  (2, 'CR-102', 'classroom', 60, 1, 1),
  (3, 'CR-103', 'classroom', 50, 1, 1),
  (4, 'CR-104', 'classroom', 50, 1, 1),
  (5, 'LAB-301', 'lab', 35, 1, 1),
  (6, 'LAB-302', 'lab', 35, 1, 1),
  (7, 'LH-201', 'multipurpose', 120, 1, NULL),
  (8, 'Auditorium', 'event_room', 400, 1, NULL),
  (9, 'Hall A', 'event_room', 300, 1, NULL);

-- Monday=1 .. Saturday=6; times within 08:00–18:00
INSERT INTO timetable_entries
(id, semester_id, division_id, subject_id, faculty_user_id, room_id, day_of_week, start_time, duration_slots, entry_type, review_status) VALUES
  (1, 1, 1, 1, 2, 1, 1, '09:00:00', 1, 'lecture', 'none'),
  (2, 1, 1, 2, 3, 2, 1, '11:00:00', 1, 'lecture', 'none'),
  (3, 1, 1, 3, 4, 5, 2, '10:00:00', 2, 'lab', 'none'),
  (4, 1, 1, 4, 2, 3, 3, '09:00:00', 1, 'lecture', 'none'),
  (5, 1, 1, 1, 2, 1, 4, '14:00:00', 1, 'lecture', 'none'),
  (6, 1, 1, 5, 4, 4, 5, '11:00:00', 2, 'lecture', 'none');

INSERT INTO notifications (user_id, title, body, is_read) VALUES
  (2, 'Timetable published', 'Semester 4 timetable is now available.', 0),
  (5, 'Welcome', 'Your class timetable is ready to view.', 1),
  (7, 'Booking received', 'Your workshop request is pending admin approval.', 0),
  (1, 'Pending registration', 'A new student registration awaits your review.', 0);

INSERT INTO booking_requests
(user_id, room_id, event_title, description, event_date, start_time, duration_hours, status, submitted_anyway) VALUES
  (7, 8, 'Tech Workshop', 'Annual tech workshop for students.', '2026-04-20', '14:00:00', 3.0, 'pending', 0),
  (8, 7, 'Guest Lecture', 'Industry talk.', '2026-04-22', '10:00:00', 2.0, 'pending', 0),
  (7, 9, 'Past Event', 'Completed event.', '2026-03-01', '09:00:00', 4.0, 'approved', 0);

INSERT INTO timetable_change_requests (user_id, subject_hint, reason, preferred_day, preferred_start_time, status) VALUES
  (2, 'Data Structures', 'Need morning slot due to research duty.', 3, '08:00:00', 'pending');

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES
  (1, 'timetable_entry_created', 'timetable_entry', 1, NULL),
  (1, 'booking_approved', 'booking_request', 3, NULL),
  (NULL, 'seed_complete', NULL, NULL, 'Database seeded');
