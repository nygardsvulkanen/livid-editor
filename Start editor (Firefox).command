#!/bin/bash
# Starts a small web server for the Livid editor on this computer and opens it in Firefox.
# Firefox only allows MIDI for pages served from http://localhost, not for files opened directly.
# Keep this window open while you use the editor; close it (or press Ctrl+C) to stop.

cd "$(dirname "$0")" || exit 1
PORT=8642
URL="http://localhost:$PORT/Livid%20Editor.html"

open_browser() {
  sleep 1
  open -a "Firefox" "$URL" 2>/dev/null || open "$URL"
}

echo "Livid editor: $URL"
echo "Keep this window open while you use the editor. Press Ctrl+C to stop."

if command -v python3 >/dev/null 2>&1 && python3 -c "import http.server" >/dev/null 2>&1; then
  open_browser &
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v ruby >/dev/null 2>&1; then
  open_browser &
  exec ruby -run -e httpd . -p "$PORT" -b 127.0.0.1
else
  echo
  echo "No Python 3 found. macOS will offer to install the 'Command Line Developer Tools' -"
  echo "accept that, then double-click this file again."
  python3 --version
  read -r -p "Press Enter to close."
fi
