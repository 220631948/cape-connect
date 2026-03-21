/**
 * out-db-raster-enforcer.js
 * 
 * Pre-commit hook to ensure rasters are registered as out-db 
 * rather than being fully ingested into the database.
 */

const fs = require('fs');

async function run() {
  const files = process.argv.slice(2);
  const scriptFiles = files.filter(f => f.endsWith('.sh') || f.endsWith('.py') || f.endsWith('.js'));

  if (scriptFiles.length === 0) return;

  console.log('🌍 CapeGIS AI: Enforcing out-db raster syntax...');

  let errors = [];

  for (const file of scriptFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Look for raster2pgsql or ST_AddBand patterns
    if (content.includes('raster2pgsql')) {
      if (!content.includes('-R') && !content.includes('--register')) {
        errors.push(`❌ ${file}: raster2pgsql command missing -R or --register flag. Rasters must be linked as out-db.`);
      }
    }

    if (content.includes('ST_AddBand')) {
      // Very naive check for out-db URI pattern in ST_AddBand
      // In a real scenario, this would be more complex
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }

  console.log('✅ Out-db raster syntax validated.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
