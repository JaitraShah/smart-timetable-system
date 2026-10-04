@echo off
setlocal
cd /d "%~dp0.."

echo == Smart Timetable - first run ==

if not exist "backend\.env" (
  copy /Y "backend\.env.example" "backend\.env"
  echo Created backend\.env - edit DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
) else (
  echo backend\.env already exists - skipped copy
)

call npm install
call npm install --prefix backend
call npm install --prefix frontend

echo.
echo Next steps:
echo   1) In MySQL, run sql\create_database.sql (or create DB matching DB_NAME in backend\.env)
echo   2) Edit backend\.env with your MySQL credentials
echo   3) npm run db:setup
echo   4) npm run dev
echo.
pause
