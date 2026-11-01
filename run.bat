@echo off
REM AXLE: compile the Java backend and start the server on http://localhost:8080
cd /d "%~dp0"

if not exist web\index.html (
  echo Building the website once...
  pushd frontend
  call npm install || exit /b 1
  call npm run build || exit /b 1
  popd
)

javac -encoding UTF-8 -d backend\out backend\src\*.java || exit /b 1
java -cp backend\out Main web
