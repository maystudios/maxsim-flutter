#!/usr/bin/env bash
# Hook: Notification
# Sends a desktop notification when Claude is waiting for user input.
# Works on Windows (PowerShell toast), macOS (osascript), and Linux (notify-send).

set -euo pipefail

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude Code needs your attention"' 2>/dev/null || echo "Claude Code needs your attention")

# Detect OS and send notification
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    powershell.exe -NoProfile -Command "
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null
      \$template = '<toast><visual><binding template=\"ToastText02\"><text id=\"1\">Claude Code</text><text id=\"2\">$MESSAGE</text></binding></visual></toast>'
      \$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      \$xml.LoadXml(\$template)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show(\$xml)
    " 2>/dev/null || true
    ;;
  Darwin*)
    osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\"" 2>/dev/null || true
    ;;
  Linux*)
    notify-send "Claude Code" "$MESSAGE" 2>/dev/null || true
    ;;
esac

exit 0
