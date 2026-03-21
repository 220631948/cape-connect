/**
 * rls-multi-tenant-verifier.js
 * 
 * Pre-push hook to ensure RLS policies exist for new spatial tables
 * and enforce multi-tenant isolation by tenant_id.
 */

const fs = require('fs');

async function run() {
  const files = process.argv.slice(2);
  const migrationFiles = files.filter(f => f.endsWith('.sql') && f.includes('supabase/migrations/'));

  if (migrationFiles.length === 0) return;

  console.log('🔒 CapeGIS AI: Verifying RLS for spatial tables...');

  let errors = [];

  for (const file of migrationFiles) {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();

    // Find table creations
    const createTableMatches = content.match(/create table\s+([\w\.]+)/g);
    if (!createTableMatches) continue;

    for (const match of createTableMatches) {
      const tableName = match.split(/\s+/)[2];
      
      // Check if table contains spatial data
      const tableSection = content.split(match)[1].split(';')[0];
      const isSpatial = tableSection.includes('geometry') || tableSection.includes('geography') || tableSection.includes('raster');

      if (isSpatial) {
        // Verify RLS is enabled
        if (!content.includes(`alter table ${tableName} enable row level security`)) {
          errors.push(`❌ ${file}: Spatial table '${tableName}' created but RLS is not enabled.`);
        }

        // Verify tenant_id policy
        if (!content.includes('tenant_id') || !content.includes('using') || !content.includes('auth.uid()')) {
          errors.push(`❌ ${file}: Spatial table '${tableName}' missing multi-tenant RLS policy filtering by 'tenant_id'.`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }

  console.log('✅ RLS multi-tenant verification passed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
