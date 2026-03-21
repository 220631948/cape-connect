#!/usr/bin/env bash
set -e

echo "Checking tools..."
for cmd in docker jq; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo "WARNING: $cmd not found. Continuing but you may need to install it."
  else
    echo "Found $cmd"
  fi
done

if ! command -v az >/dev/null 2>&1; then
  echo "az (Azure CLI) not found. Attempting automatic installation..."
  if [ -f /etc/debian_version ] || [ -f /etc/os-release ]; then
      echo "Debian-based system detected. Installing Azure CLI..."
      curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
  else
      echo "Non-Debian system detected. Please install az manually: https://aka.ms/InstallAzureCLI"
      exit 1
  fi
else
  echo "Found az"
fi

if ! az account show >/dev/null 2>&1; then
  echo "No active az session — running 'az login' now (interactive)..."
  az login
fi
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Detected subscription: $SUBSCRIPTION_ID"

echo "Creating a service principal for MCP server (recommended for automation)."
echo "If you prefer to reuse an existing identity, skip creation and set env vars AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID."
read -p "Create new service principal named 'mcp-sp-$(basename $(pwd))'? (y/N) " CREATE_SP
if [ "$CREATE_SP" = "y" ] || [ "$CREATE_SP" = "Y" ]; then
  SP_JSON=$(az ad sp create-for-rbac --name "mcp-sp-$(basename $(pwd))" --role "Contributor" --sdk-auth 2>/dev/null)
  echo "Service principal JSON (save securely):"
  echo "$SP_JSON"

  # extract fields for convenience
  AZURE_CLIENT_ID=$(echo "$SP_JSON" | jq -r '.clientId')
  AZURE_CLIENT_SECRET=$(echo "$SP_JSON" | jq -r '.clientSecret')
  AZURE_TENANT_ID=$(echo "$SP_JSON" | jq -r '.tenantId')

  echo "Export these in your shell (example):"
  echo "export AZURE_SUBSCRIPTION_ID=${SUBSCRIPTION_ID}"
  echo "export AZURE_CLIENT_ID=${AZURE_CLIENT_ID}"
  echo "export AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}"
  echo "export AZURE_TENANT_ID=${AZURE_TENANT_ID}"
else
  echo "Skipping service principal creation. Ensure AZURE_* env vars are set for non-interactive auth."
fi

echo "Pulling MCP server container image..."
docker pull mcr.microsoft.com/azure-sdk/azure-mcp:latest

echo "Starting MCP server container on port 8080..."
docker run -d --name azure-mcp \
  -p 8080:8080 \
  -e AZURE_SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-$SUBSCRIPTION_ID}" \
  -e AZURE_CLIENT_ID="${AZURE_CLIENT_ID:-}" \
  -e AZURE_CLIENT_SECRET="${AZURE_CLIENT_SECRET:-}" \
  -e AZURE_TENANT_ID="${AZURE_TENANT_ID:-}" \
  mcr.microsoft.com/azure-sdk/azure-mcp:latest || {
    echo "Docker run failed. If Docker is unavailable, falling back to package manager install instructions."

    if ! docker ps -q -f name=azure-mcp | grep -q . ; then
      echo "Docker MCP container not running. Attempting package manager run (npm/pip)."
      if command -v npx >/dev/null 2>&1; then
        echo "Running MCP via npx @azure/mcp (temporary run)"
        npx @azure/mcp@latest run --port 8080 &
      elif python -c "import sys; import pkgutil; exit(0)" >/dev/null 2>&1; then
        echo "Attempting pip package run (msmcp-azure) - you may need 'pip install msmcp-azure'"
        python -m msmcp_azure --port 8080 &
      else
        echo "No suitable runtime found. Please install Docker or node/python to run the MCP server."
      fi
    fi
}

echo "MCP container started. Wait ~5s then show logs (tail):"
sleep 5
docker logs --tail 50 azure-mcp || true

echo "Verifications:"
echo "- Docker container list:"
docker ps --filter name=azure-mcp --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "- MCP server health endpoint (expect HTTP 200):"
curl -sS http://localhost:8080/health || true
echo "- Project mcp.json created at .mcp/mcp.json"
ls -la .mcp || true

echo "If the /health endpoint returns an error, inspect docker logs: docker logs azure-mcp"

echo "SECURITY NOTICE: The service principal created above has Contributor role in this script by default for convenience. For production hardening, set narrower scopes and grant only required permissions to the MCP server. Rotate secrets and use Key Vault or managed identities when possible."
