#!/bin/sh
# AXLE: compile the Java backend and start the server on http://localhost:8080
set -e
cd "$(dirname "$0")"

if [ ! -f web/index.html ]; then
  echo "Building the website once..."
  (cd frontend && npm install && npm run build)
fi

javac -encoding UTF-8 -d backend/out backend/src/*.java
java -cp backend/out Main web
