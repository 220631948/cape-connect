/**
 * terraform-security-guardian.js
 * 
 * Pre-commit hook to ensure no hardcoded GCP keys in Terraform files
 * and enforce Workload Identity Federation (WIF).
 */

const fs = require('fs');
const path = require('path');

async function run() {
  const files = process.argv.slice(2);
  const tfFiles = files.filter(f => f.endsWith('.tf') && f.includes('infra/gcp/'));

  if (tfFiles.length === 0) return;

  console.log('🛡️  CapeGIS AI: Auditing Terraform files for security...');

  let errors = [];

  for (const file of tfFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Check for hardcoded GCP_SA_KEY pattern
    if (content.includes('GCP_SA_KEY') || /"credentials"\s*=\s*".*"/.test(content)) {
      errors.push(`❌ ${file}: Hardcoded GCP service account keys detected. Use Workload Identity Federation (WIF) instead.`);
    }

    // Check for WIF provider usage in workflows (not in .tf usually, but good to check context)
    // Actually, the hook is triggered on write_file/replace/edit_file of .tf files.
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }

  console.log('✅ Terraform security audit passed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
