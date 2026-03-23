/**
 * @hook pre-commit
 * @description Ensures Row Level Security (RLS) is enabled on spatial tables in migrations.
 */
const fs = require('fs');
const path = require('path');

function verifyMigration(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for table creation with spatial columns
  const spatialTablePattern = /CREATE\s+TABLE\s+([a-zA-Z0-9_.]+)\s+\(\s*.*(?:geom|geography).*\)/is;
  const match = spatialTablePattern.exec(content);

  if (match) {
    const tableName = match[1];
    const rlsPattern = new RegExp(`ALTER\s+TABLE\s+${tableName}\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY`, 'i');
    
    if (!rlsPattern.test(content)) {
      console.error(`❌ ERROR: Table '${tableName}' in ${filePath} contains spatial data but lacks RLS.`);
      console.error(`   Please add: ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
      process.exit(1);
    }
  }
}

// Scanned directory
const migrationDir = 'supabase/migrations';

if (fs.existsSync(migrationDir)) {
  const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
  migrations.forEach(file => {
    verifyMigration(path.join(migrationDir, file));
  });
}

console.log('✅ rls-multi-tenant-verifier: All spatial migrations have RLS.');
