/**
 * @hook pre-commit
 * @description Prevents hardcoded GCP JSON keys and ensures WIF is used in Terraform.
 */
const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern for GCP Service Account JSON keys
  const gcpKeyPattern = /"type":\s*"service_account"/;
  const privateKeyPattern = /"private_key":\s*"-----BEGIN PRIVATE KEY-----/;

  if (gcpKeyPattern.test(content) || privateKeyPattern.test(content)) {
    console.error(`❌ ERROR: Hardcoded GCP Service Account key found in ${filePath}`);
    console.error('   Please use Workload Identity Federation (WIF) instead of JSON keys.');
    process.exit(1);
  }
}

// Scanned directories
const targets = ['infra/gcp', '.github/workflows'];

targets.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isFile()) {
        checkFile(fullPath);
      }
    });
  }
});

console.log('✅ terraform-security-guardian: No hardcoded keys detected.');
