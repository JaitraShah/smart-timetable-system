-- Smart Timetable System — MySQL schema (local academic project)
-- Run after: CREATE DATABASE smart_timetable CHARACTER SET utf8mb4;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS uploaded_files;
DROP TABLE IF EXISTS timetable_change_requests;
DROP TABLE IF EXISTS booking_requests;
DROP TABLE IF EXISTS timetable_entries;
DROP TABLE IF EXISTS faculty_subjects;
DROP TABLE IF EXISTS student_enrollments;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS divisions;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS academic_terms;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO roles (name) VALUES
  ('admin'),
  ('faculty'),
  ('student'),
  ('event_organiser');

CREATE TABLE departments (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE academic_terms (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  start_month TINYINT NOT NULL COMMENT '1-12',
  end_month TINYINT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE semesters (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  academic_year SMALLINT NOT NULL,
  academic_term_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id),
  UNIQUE KEY uq_sem (name, academic_year)
) ENGINE=InnoDB;

CREATE TABLE divisions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  code VARCHAR(30) NOT NULL,
  semester_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (semester_id) REFERENCES semesters(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  -- INSECURE: plain-text password for local demo/academic use only — never do this in production.
  password_plain VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  registration_status ENUM('pending','active','rejected') NOT NULL DEFAULT 'active',
  department_id INT UNSIGNED NULL,
  division_id INT UNSIGNED NULL COMMENT 'Primary division for students',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id)
) ENGINE=InnoDB;

CREATE TABLE subjects (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(40) NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  default_duration_slots TINYINT NOT NULL DEFAULT 1 COMMENT '1 = 1 hour, 2 = 2 hours',
  requires_lab TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE faculty_subjects (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  division_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_fs (user_id, subject_id, division_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_enrollments (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  division_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_enroll (user_id, division_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rooms (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE,
  room_type ENUM('classroom','lab','event_room','multipurpose') NOT NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 40,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  department_id INT UNSIGNED NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE timetable_entries (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  semester_id INT UNSIGNED NOT NULL,
  division_id INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  faculty_user_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Monday .. 6=Saturday',
  start_time TIME NOT NULL,
  duration_slots TINYINT NOT NULL DEFAULT 1,
  entry_type ENUM('lecture','lab') NOT NULL DEFAULT 'lecture',
  review_status ENUM('none','pending_review','resolved') NOT NULL DEFAULT 'none',
  admin_notes VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (semester_id) REFERENCES semesters(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (faculty_user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
) ENGINE=InnoDB;

CREATE TABLE booking_requests (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  event_title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours DECIMAL(4,1) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  submitted_anyway TINYINT(1) NOT NULL DEFAULT 0,
  conflict_summary TEXT NULL,
  suggestions_json JSON NULL COMMENT 'Last computed alternatives shown to user/admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
) ENGINE=InnoDB;

CREATE TABLE timetable_change_requests (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  subject_hint VARCHAR(200) NULL,
  reason TEXT NOT NULL,
  preferred_day TINYINT NULL,
  preferred_start_time TIME NULL,
  status ENUM('pending','approved','rejected','resolved') NOT NULL DEFAULT 'pending',
  admin_response TEXT NULL,
  suggestions_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE uploaded_files (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  uploaded_by INT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id INT UNSIGNED NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
