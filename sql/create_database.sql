-- Run once in MySQL as a user that can create databases (e.g. root).
-- Database name must match DB_NAME in backend/.env (default: smart_timetable).

CREATE DATABASE IF NOT EXISTS smart_timetable
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Optional: dedicated app user (uncomment and set password)
-- CREATE USER IF NOT EXISTS 'timetable'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON smart_timetable.* TO 'timetable'@'localhost';
-- FLUSH PRIVILEGES;
