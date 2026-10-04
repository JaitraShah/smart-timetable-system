# First-time setup (Windows PowerShell). Run from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\first-run.ps1

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

Write-Host "== Smart Timetable — first run ==" -ForegroundColor Cyan

if (-not (Test-Path "backend\.env")) {
  Copy-Item "backend\.env.example" "backend\.env"
  Write-Host "Created backend\.env from .env.example — edit DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET" -ForegroundColor Yellow
} else {
  Write-Host "backend\.env already exists (skipped copy)" -ForegroundColor Gray
}

Write-Host "Installing root dev tools (concurrently)..." -ForegroundColor Cyan
npm install

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm install --prefix backend

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm install --prefix frontend

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1) In MySQL, run sql/create_database.sql (or create a DB matching DB_NAME in backend/.env)"
Write-Host "  2) Edit backend/.env with your MySQL credentials"
Write-Host "  3) npm run db:setup"
Write-Host "  4) npm run dev   (starts API :4000 + Vite :5173)"
Write-Host ""
