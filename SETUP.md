# Setup & Run Instructions
## Smart Timetable & Event Conflict Management System

---

## Step 1 — Install Required Software

Install the following before anything else:

1. **Node.js (v18 or higher)**
   - Download from: https://nodejs.org
   - Choose the "LTS" version
   - After install, verify by running in terminal:
     ```
     node -v
     npm -v
     ```

2. **MySQL (v8.x)**
   - Download from: https://dev.mysql.com/downloads/installer/
   - During setup, set a root password (you will need it in Step 3)
   - Make sure MySQL is running after installation

---

## Step 2 — Copy the Project

Copy the entire `tt system` folder to the new PC.

Place it anywhere, for example:
```
C:\Projects\tt system
```

---

## Step 3 — Configure MySQL Password

1. `backend\.env` is not included in the repo. Create it from the example
   (or run `scripts\first-run.bat`, which does this for you):
   ```
   copy backend\.env.example backend\.env
   ```

2. Open `backend\.env` and set your MySQL root password:
   ```
   DB_PASSWORD=your_mysql_password
   ```

3. Set `JWT_SECRET` to any long random string, then save the file.

> If your MySQL username is not `root`, also update the `DB_USER=root` line.

> The database will be created automatically — you do NOT need to create it manually.

---

## Step 4 — Install Dependencies

Open a terminal (Command Prompt or PowerShell), navigate to the project folder, and run these commands one by one:

```bash
cd "C:\Projects\tt system"
```

```bash
npm install
```

```bash
npm install --prefix backend
```

```bash
npm install --prefix frontend
```

Wait for each command to finish before running the next.

---

## Step 5 — Run the Project

In the same terminal, run:

```bash
npm run dev
```

This starts both the backend and frontend together.

You should see output like:
```
[backend]  MySQL ready: smart_timetable @ localhost:3306
[backend]  Smart Timetable API → http://127.0.0.1:4000
[frontend] VITE v6.x  ready in 1100 ms
[frontend] ➜  Local: http://localhost:5173/
```

---

## Step 6 — Open in Browser

Open your browser and go to:

```
http://localhost:5173
```

---

## Demo Login Accounts

| Role            | Email                  | Password  |
|-----------------|------------------------|-----------|
| Admin           | admin@nmims.edu        | admin123  |
| Faculty         | dr.sharma@nmims.edu | demo123   |
| Faculty         | dr.patel@nmims.edu | demo123   |
| Student         | rahul@nmims.edu | demo123   |
| Student         | priya@nmims.edu | demo123   |
| Event Organiser | events@nmims.edu | demo123   |

> Tip: The login page has a **"Demo accounts"** button that fills in credentials automatically.

---

## Troubleshooting

**"Cannot connect to MySQL"**
- Make sure MySQL is running (check Services on Windows or run `mysqladmin ping`)
- Double-check the password in `backend/.env`

**"npm is not recognized"**
- Node.js is not installed or not added to PATH — reinstall Node.js

**"Port 5173 already in use"**
- Another process is using that port — close it or restart your PC

**"Port 4000 already in use"**
- Run: `npx kill-port 4000` in terminal, then try again

**Frontend loads but shows errors**
- Make sure the backend started successfully (check the terminal for any red errors)
- Confirm you see "Smart Timetable API → http://127.0.0.1:4000" in the terminal output

---

## Stopping the Project

Press `Ctrl + C` in the terminal where `npm run dev` is running.
