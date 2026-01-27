@echo off
echo Git Upload Commands for Your Project
echo =====================================
echo.

echo Step 1: Remove existing git configuration
rmdir /s /q .git 2>nul

echo Step 2: Initialize fresh git repository
git init

echo Step 3: Add your GitHub repository URL
echo Replace YOUR_USERNAME with your actual GitHub username:
echo git remote add origin https://github.com/YOUR_USERNAME/Inventory_Management.git
echo.
set /p username="Enter your GitHub username: "
git remote add origin https://github.com/%username%/Inventory_Management.git

echo Step 4: Add all files
git add .

echo Step 5: Commit files
git commit -m "Initial commit: Complete IT Asset Management System - Full-stack React + Flask application with optimized codebase"

echo Step 6: Push to GitHub
git push -u origin main

echo.
echo ✅ Upload completed!
echo Your project should now be visible on GitHub.
echo.
pause