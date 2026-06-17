#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${CODESPACE_VSCODE_FOLDER:-$PWD}"
SKILLS_DIR="$WORKSPACE/.opencode/skills"

echo "=== opencode-codespaces setup ==="

# Install opencode if not present
if ! command -v opencode &>/dev/null; then
    echo "Installing opencode..."
    curl -fsSL https://opencode.ai/install | bash
fi

echo "opencode $(opencode --version) ready"

# Install Hermes CLI if not present
if ! command -v hermes &>/dev/null; then
    echo "Installing Hermes CLI..."
    npm install -g hermes@latest 2>/dev/null || echo "Warning: Hermes installation failed"
fi

# Extract bundled skills into project .opencode/skills/
if [ -f "$WORKSPACE/.opencode-skills.tar.gz" ]; then
    echo "Extracting skills to $SKILLS_DIR ..."
    mkdir -p "$SKILLS_DIR"
    tar -xzf "$WORKSPACE/.opencode-skills.tar.gz" -C "$SKILLS_DIR"
    echo "Skills extracted: $(find "$SKILLS_DIR" -maxdepth 1 -type d | wc -l) folders"
fi

# Init opencode project config if not present
if [ ! -f "$WORKSPACE/opencode.json" ]; then
    opencode init 2>/dev/null || true
fi

# Install project dependencies
echo "Installing project dependencies..."
cd "$WORKSPACE"
npm install 2>/dev/null || echo "No root dependencies"
cd "$WORKSPACE/backend"
npm install 2>/dev/null || echo "No backend dependencies"

echo "=== Setup complete ==="
echo "Run 'opencode' to start the agent."
