cd "/home/mr/Desktop/Geographical Informations Systems (GIS)"

# Task 1: Add ARCGIS_CLIENT_SECRET to .env.example
echo "ARCGIS_CLIENT_SECRET=" >> .env.example

# Task 2: Fix Cesium token in settings.json
sed -i 's/COPILOT_MCP_CESIUM_ION_TOKEN/CESIUM_ION_TOKEN/g' .claude/settings.json

echo "✓ Phase 1 Tasks 1-2 complete"
echo "✓ Now manually edit .claude/settings.json line 174 to add:"
echo '      "ARCGIS_CLIENT_SECRET": "${ARCGIS_CLIENT_SECRET}"'