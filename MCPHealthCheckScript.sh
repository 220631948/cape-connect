#!/bin/bash
# MCP Health Check Script
# Run this after activation

PROJECT_DIR="/home/mr/Desktop/Geographical Informations Systems (GIS)"

echo "==================== MCP HEALTH CHECK ===================="

# Test 1: PostGIS Connection
echo "[1/6] Testing PostGIS..."
psql postgresql://postgres:postgres@localhost:5432/capegis \
  -c "SELECT PostGIS_Version();" >/dev/null 2>&1 && \
  echo "✓ PostGIS HEALTHY" || echo "✗ PostGIS UNREACHABLE"

# Test 2: Filesystem MCP
echo "[2/6] Testing Filesystem MCP..."
[ -d "$PROJECT_DIR" ] && echo "✓ Filesystem HEALTHY" || echo "✗ Filesystem UNREACHABLE"

# Test 3: gis-mcp (Python)
echo "[3/6] Testing gis-mcp..."
which uvx >/dev/null 2>&1 && echo "✓ gis-mcp runtime (uvx) FOUND" || echo "✗ uvx NOT FOUND"

# Test 4: Cesium Ion
echo "[4/6] Testing Cesium Ion..."
if [ -n "$CESIUM_ION_TOKEN" ]; then
  curl -s -H "Authorization: Bearer $CESIUM_ION_TOKEN" \
    https://api.cesium.com/v1/me | grep -q '"username"' && \
    echo "✓ Cesium Ion HEALTHY" || echo "✗ Cesium Ion AUTH FAILED"
else
  echo "⚠ Cesium Ion token missing"
fi

# Test 5: Martin Tile Server
echo "[5/6] Testing Martin..."
curl -s http://localhost:3005/health >/dev/null 2>&1 && \
  echo "✓ Martin HEALTHY" || echo "✗ Martin UNREACHABLE"

# Test 6: ArcGIS MCP (if configured)
echo "[6/6] Testing ArcGIS MCP..."
if [ -n "$ARCGIS_CLIENT_ID" ]; then
  echo "⚠ ArcGIS MCP not yet configured (needs implementation)"
else
  echo "✗ ArcGIS credentials missing"
fi

echo "=========================================================="
