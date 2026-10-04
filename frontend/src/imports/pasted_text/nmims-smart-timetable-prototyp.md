Design a complete, high-fidelity, fully interactive website prototype for a college project titled:

"Smart Timetable and Event Booking System for NMIMS"

This is a role-based system that manages semester-wise academic timetables and event room bookings with AUTOMATIC conflict detection and resolution handled entirely by the system (not by admin).

The prototype must look like a real SaaS/university portal and be fully clickable with realistic workflows.

--------------------------------------------------

🔷 CORE SYSTEM CONCEPT

- Single college system (NMIMS)
- Web-based platform
- Role-based access
- System automatically detects conflicts, blocks invalid actions, and suggests alternatives
- Admin does NOT manually validate conflicts

--------------------------------------------------

🔷 ROLES (STRICTLY INCLUDE ALL)

1. Admin (full control)
2. Event Organiser (booking requester)
3. Faculty (view-only)
4. Student (view-only)

Each role must have:
- Separate dashboard
- Separate navigation
- Role-specific features

--------------------------------------------------

🔷 GLOBAL DESIGN STYLE

- Modern SaaS dashboard UI
- Clean, minimal, professional
- Light theme (white + soft blue + grey)
- Sidebar navigation + top navbar
- Use cards, tables, tags, and badges
- Consistent spacing, typography, and layout
- University-style professional interface

--------------------------------------------------

🔷 GLOBAL COMPONENTS (REUSE ACROSS SCREENS)

- Sidebar menu (role-specific)
- Top navbar (profile, notifications)
- Tables (timetable, bookings)
- Forms (input fields)
- Alert banners (error/success)
- Suggestion cards (alternative slots/rooms)
- Status badges (Approved, Rejected, Pending)
- Modal popups (confirmations)
- Notification panel

--------------------------------------------------

🔷 COMPLETE SCREENS TO GENERATE

-------------------------
1. LANDING PAGE
-------------------------
- Title: Smart Timetable System
- Subtitle: Conflict-Free Scheduling for NMIMS
- Short project description
- Role selection buttons:
  - Admin
  - Event Organiser
  - Faculty
  - Student

-------------------------
2. LOGIN PAGE
-------------------------
- Role-based login UI
- Email + password fields
- Login button
- Clean UI

-------------------------
3. ADMIN DASHBOARD
-------------------------
- KPI cards:
  - Total Classes
  - Total Rooms
  - Total Bookings
  - Conflicts Prevented
- Sidebar:
  - Dashboard
  - Manage Timetable
  - Manage Rooms
  - Booking Requests
  - Upload Data
  - Reports

-------------------------
4. TIMETABLE MANAGEMENT (ADMIN)
-------------------------
- Weekly timetable grid (Mon–Fri)
- Color-coded slots
- Add/Edit timetable form:
  - Subject
  - Faculty
  - Room
  - Day
  - Time (1 hr / 2 hr)

-------------------------
5. CONFLICT DETECTION UI (CRITICAL SCREEN)
-------------------------
When admin enters conflicting data:

- Red alert banner:
  "Conflict detected: Room already occupied at this time"

- Show blocked action (cannot proceed)

- Show suggestions section:
  - Alternative rooms available
  - Alternative time slots available

- Suggestion cards with “Select” button

IMPORTANT: Clearly show system-driven behavior

-------------------------
6. ROOM MANAGEMENT PAGE
-------------------------
- Table of rooms:
  - Room name
  - Type (classroom/lab/hall)
  - Capacity
- Add/Edit room form

-------------------------
7. EVENT ORGANISER DASHBOARD
-------------------------
- Button: “Request New Booking”
- Booking history table:
  - Event name
  - Date
  - Status

-------------------------
8. BOOKING REQUEST FORM
-------------------------
- Fields:
  - Event name
  - Date
  - Time
  - Duration
  - Room type (dropdown)
  - Description

-------------------------
9. BOOKING CONFLICT SCREEN
-------------------------
When booking clashes:

- Error message:
  "Booking cannot be processed due to conflict"

- Show alternatives:
  - Available rooms
  - Available time slots

- Clear UI showing system blocking action

-------------------------
10. ADMIN BOOKING APPROVAL PAGE
-------------------------
- Table:
  - Event name
  - Requested room
  - Time
  - Status
- Buttons:
  - Approve
  - Reject

NOTE:
Only conflict-free requests reach here

-------------------------
11. FACULTY DASHBOARD
-------------------------
- Personal timetable view
- Clean table/grid
- Notification panel

-------------------------
12. STUDENT DASHBOARD
-------------------------
- Class timetable view
- Same layout as faculty
- Notification panel

-------------------------
13. TIMETABLE VIEW PAGE
-------------------------
- Full weekly timetable
- Clear grid layout
- Color-coded entries

-------------------------
14. NOTIFICATIONS PANEL
-------------------------
Pre-defined notifications:
- "Timetable updated"
- "Room changed"
- "Booking approved"
- "Booking rejected"

Displayed as cards/list

-------------------------
15. DATA UPLOAD (ADMIN)
-------------------------
- Upload Excel file UI
- Simple upload box
- Confirmation message

-------------------------
16. BASIC REPORT PAGE
-------------------------
- Simple tables:
  - Timetable overview
  - Booking summary

--------------------------------------------------

🔷 WORKFLOWS TO VISUALLY REPRESENT

1. Admin creates timetable:
   Input → system checks → conflict → block → suggest → save

2. Event booking:
   Request → system checks → block if conflict → suggest → valid request → admin approval

3. Final output:
   Faculty & student view published timetable

--------------------------------------------------

🔷 CRITICAL SYSTEM BEHAVIOR (MUST BE CLEARLY SHOWN)

- Conflict detection is AUTOMATIC
- System BLOCKS invalid entries
- System SUGGESTS alternatives
- Admin does NOT manually check conflicts

--------------------------------------------------

🔷 INTERACTIVITY REQUIREMENTS

- Fully clickable prototype
- Navigation between all pages
- Buttons trigger transitions:
  - Add timetable
  - Submit booking
  - Approve/reject
- Simulate error states (conflict screens)
- Simulate success states

--------------------------------------------------

🔷 FINAL OUTPUT EXPECTATION

- Complete UI system (not just screens)
- Logical user flow across roles
- Realistic SaaS feel
- Presentation-ready prototype

--------------------------------------------------

Ensure nothing is missing and all roles, flows, and system logic are clearly represented.