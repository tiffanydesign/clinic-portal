@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Phenome Portal - iPad 原型

echo ============================================
echo   Phenome Portal - iPad 原型启动器
echo ============================================
echo.

REM 1) 首次运行时安装依赖
if not exist "node_modules" (
  echo [1/3] 首次运行，正在安装依赖 (npm install)...
  call npm install
  if errorlevel 1 (
    echo.
    echo 依赖安装失败，请检查是否已安装 Node.js。
    pause
    exit /b 1
  )
) else (
  echo [1/3] 依赖已就绪，跳过安装。
)

REM 2) 在新窗口启动本地开发服务器 (固定端口 5173)
echo [2/3] 正在启动本地服务器 http://localhost:5173 ...
start "Phenome Portal dev server" cmd /k "npm run dev -- --port 5173 --strictPort"

REM 3) 等待服务器就绪后自动打开 iPad 视角
echo [3/3] 等待服务器就绪...
powershell -NoProfile -Command "for($i=0;$i -lt 60;$i++){try{(New-Object Net.Sockets.TcpClient('localhost',5173)).Close();exit 0}catch{Start-Sleep -Milliseconds 500}}; exit 1"

start "" "http://localhost:5173/ipad.html"

echo.
echo 已在浏览器打开 iPad 原型。开发服务器在另一个窗口运行，
echo 关闭那个窗口即可停止服务。此窗口可以关闭。
echo.
pause
