#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "Setting up Python virtual environment for Demucs..."

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
  echo "Created virtual environment at .venv/"
else
  echo "Virtual environment already exists at .venv/"
fi

echo "Installing Demucs (this may take a minute)..."
"$VENV_DIR/bin/pip" install --upgrade pip --quiet
"$VENV_DIR/bin/pip" install demucs torchcodec --quiet

echo ""
echo "Done! Demucs is ready. Start the server with: pnpm server"
