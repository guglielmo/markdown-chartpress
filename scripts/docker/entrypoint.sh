#!/bin/sh
set -e

# Default command: render charts from manifest
if [ "$1" = "render" ]; then
  shift
  exec node /app/render-chart.js "$@"
else
  exec "$@"
fi
