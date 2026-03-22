import argparse
import re
import os

def scan_file(file_path):
    """Scans a file for common POPIA PII patterns."""
    pii_patterns = {
        "Email Address": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        "South African ID": r'\d{13}',
        "Phone Number": r'(\+27|0)\d{9}',
        "Property Owner Pattern": r'(?i)owner:\s*[a-zA-Z\s]+',
        "Precise Coordinate": r'-?\d{1,2}\.\d{7,},\s*-?\d{1,2}\.\d{7,}' # 7+ decimal places
    }

    found_violations = []
    
    try:
        with open(file_path, 'r', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                for label, pattern in pii_patterns.items():
                    if re.search(pattern, line):
                        found_violations.append(f"[{label}] line {line_num}: {line.strip()}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

    return found_violations

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan for POPIA violations.")
    parser.add_argument("--input", required=True, help="Path to file or directory to scan")
    args = parser.parse_args()

    print(f"🔍 Scanning {args.input} for POPIA violations...")
    
    violations = []
    if os.path.isfile(args.input):
        violations = scan_file(args.input)
    elif os.path.isdir(args.input):
        for root, _, files in os.walk(args.input):
            for file in files:
                violations.extend(scan_file(os.path.join(root, file)))

    if violations:
        print(f"❌ Found {len(violations)} potential violations:")
        for v in violations:
            print(f"  - {v}")
        exit(1)
    else:
        print("✅ No POPIA violations detected.")
        exit(0)
