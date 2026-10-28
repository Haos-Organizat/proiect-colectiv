FROM mcr.microsoft.com/devcontainers/python:1-3.12-bookworm

# Install Node.js 20
RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && nvm install 20 && nvm alias default 20" 2>&1

# Install Neovim and terminal multiplexer tools
RUN rm -f /etc/apt/sources.list.d/yarn.list \
    && apt-get update && apt-get install -y \
    neovim tmux ripgrep fd-find build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install 'just' (Task Runner)
RUN curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

# Install 'uv' (Python package manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="/usr/local/bin" sh

# Install Supabase CLI
RUN ARCH=$(dpkg --print-architecture) \
    && VERSION=$(curl -s "https://api.github.com/repos/supabase/cli/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/') \
    && curl -fsSL -o /tmp/supabase.deb "https://github.com/supabase/cli/releases/download/v${VERSION}/supabase_${VERSION}_linux_${ARCH}.deb" \
    && dpkg -i /tmp/supabase.deb \
    && rm -f /tmp/supabase.deb
