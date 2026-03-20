#!/usr/bin/env bash
# validate-crs.sh — Validate GeoJSON coordinates stay within Cape Town bbox
# Cape Town bbox: west:18.0, south:-34.5, east:19.5, north:-33.0
# Usage: bash scripts/validate-crs.sh   (checks staged files)
#        bash scripts/validate-crs.sh path/to/file.geojson  (checks specific file)
set -euo pipefail

WEST=18.0; SOUTH=-34.5; EAST=19.5; NORTH=-33.0
FAIL=0; CHECKED=0

check_geojson() {
  local file="$1"
  local content
  content=$(cat "$file" 2>/dev/null) || { echo "  ✗ Cannot read $file" >&2; return 1; }

  # Extract coordinate pairs [lon,lat] using grep — portable, no jq dependency
  local bad
  bad=$(echo "$content" | grep -oE '\-?[0-9]+\.[0-9]+,\s*\-?[0-9]+\.[0-9]+' | while IFS=',' read -r lon lat; do
    lon=$(echo "$lon" | tr -d ' ')
    lat=$(echo "$lat" | tr -d ' ')
    # Use awk for float comparison (bash can't do floats)
    awk -v lon="$lon" -v lat="$lat" \
        -v w="$WEST" -v s="$SOUTH" -v e="$EAST" -v n="$NORTH" \
      'BEGIN { if (lon+0 < w || lon+0 > e || lat+0 < s || lat+0 > n)
                 print "  out-of-bbox: lon=" lon " lat=" lat }'
  done | head -5)

  if [ -n "$bad" ]; then
    echo "  ✗ $file — coordinates outside Cape Town bbox:" >&2
    echo "$bad" >&2
    return 1
  fi
  echo "  ✓ $file — all sampled coordinates within bbox"
  return 0
}

if [ $# -ge 1 ]; then
  # Direct file mode
  for f in "$@"; do
    CHECKED=$((CHECKED+1))
    check_geojson "$f" || FAIL=$((FAIL+1))
  done
else
  # Staged files mode (for pre-commit use)
  while IFS= read -r f; do
    case "$f" in *.geojson|*.json) ;; *) continue ;; esac
    # Only check files that look like GeoJSON (have "type" and "coordinates")
    if git show ":$f" 2>/dev/null | grep -q '"coordinates"'; then
      CHECKED=$((CHECKED+1))
      TMP=$(mktemp)
      git show ":$f" > "$TMP" 2>/dev/null
      check_geojson "$TMP" || FAIL=$((FAIL+1))
      rm -f "$TMP"
    fi
  done < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)
fi

[ "$CHECKED" -eq 0 ] && echo "  ℹ No GeoJSON files to validate." && exit 0

if [ "$FAIL" -gt 0 ]; then
  echo "  ✗ CRS/bbox validation failed for $FAIL file(s)." >&2
  exit 1
fi
echo "  ✓ All $CHECKED GeoJSON file(s) within Cape Town bbox."
