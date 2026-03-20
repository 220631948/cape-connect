cd "/home/mr/Desktop/Geographical Informations Systems (GIS)"

# Create the validation script
cat > scripts/validate-foundation.sh << 'SCRIPT_EOF'
#!/bin/bash
# Foundation Layer Health Check for CapeTown GIS Hub

PROJECT_DIR="/home/mr/Desktop/Geographical Informations Systems (GIS)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "==========================================="
echo "FOUNDATION LAYER VALIDATION"
echo "==========================================="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

test_result() {
  local test_name=$1
  local status=$2
  local message=$3
  
  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $test_name: HEALTHY"
    [ -n "$message" ] && echo "  → $message"
    ((TESTS_PASSED++))
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $test_name: DEGRADED"
    echo "  → $message"
    ((WARNINGS++))
  else
    echo -e "${RED}✗${NC} $test_name: UNREACHABLE"
    echo "  → $message"
    ((TESTS_FAILED++))
  fi
  echo ""
}

# TEST 1: PostgreSQL / PostGIS
echo "[1/4] Testing PostgreSQL + PostGIS..."
if command -v psql >/dev/null 2>&1; then
  if psql postgresql://postgres:postgres@localhost:5432/capegis -c "SELECT PostGIS_Version();" >/dev/null 2>&1; then
    POSTGIS_VERSION=$(psql postgresql://postgres:postgres@localhost:5432/capegis -t -c "SELECT PostGIS_Version();" 2>/dev/null | xargs)
    test_result "postgres" "PASS" "PostGIS: $POSTGIS_VERSION"
  else
    test_result "postgres" "FAIL" "Cannot connect (run: docker compose up -d)"
  fi
else
  test_result "postgres" "WARN" "psql not found (install postgresql-client)"
fi

# TEST 2: Filesystem
echo "[2/4] Testing Filesystem..."
if [ -d "$PROJECT_DIR" ] && [ -r "$PROJECT_DIR/.claude/settings.json" ]; then
  test_result "filesystem" "PASS" "Project directory accessible"
else
  test_result "filesystem" "FAIL" "Cannot access project directory"
fi

# TEST 3: gis-mcp
echo "[3/4] Testing gis-mcp (uvx)..."
if command -v uvx >/dev/null 2>&1; then
  test_result "gis-mcp" "PASS" "uvx runtime available"
else
  test_result "gis-mcp" "FAIL" "uvx not found (run: pip install uv)"
fi

# TEST 4: ArcGIS credentials
echo "[4/4] Testing ArcGIS credentials..."
if [ -f ".env.local" ]; then
  source .env.local 2>/dev/null || true
fi

if [ -n "$ARCGIS_CLIENT_ID" ] && [ -n "$ARCGIS_CLIENT_SECRET" ]; then
  test_result "arcgis" "PASS" "Credentials configured"
elif [ -n "$ARCGIS_CLIENT_ID" ]; then
  test_result "arcgis" "WARN" "CLIENT_ID set, CLIENT_SECRET missing"
else
  test_result "arcgis" "WARN" "Credentials not configured in .env.local"
fi

# BONUS: Cesium Ion
echo "[BONUS] Checking Cesium Ion..."
if [ -n "$CESIUM_ION_TOKEN" ]; then
  if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CESIUM_ION_TOKEN" https://api.cesium.com/v1/me 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      test_result "cesium-ion" "PASS" "Token valid"
    else
      test_result "cesium-ion" "WARN" "Token invalid or unreachable (HTTP $HTTP_CODE)"
    fi
  else
    test_result "cesium-ion" "PASS" "Token configured"
  fi
else
  test_result "cesium-ion" "WARN" "Token not set"
fi

# SUMMARY
echo "==========================================="
echo "VALIDATION SUMMARY"
echo "==========================================="
echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ FOUNDATION LAYER: HEALTHY${NC}"
  echo "Ready for Phase 2: MCP Gateway"
  exit 0
elif [ $TESTS_FAILED -le 2 ]; then
  echo -e "${YELLOW}⚠ FOUNDATION LAYER: DEGRADED${NC}"
  echo "Fix failing tests before Phase 2"
  exit 1
else
  echo -e "${RED}✗ FOUNDATION LAYER: CRITICAL${NC}"
  exit 2
fi
SCRIPT_EOF

chmod +x scripts/validate-foundation.sh
./scripts/validate-foundation.sh