/**
 * @hook pre-commit
 * @description Validates out-db raster syntax in migration scripts to ensure bucket compliance.
 */
const fs = require('fs');
const path = require('path');

function verifyRasterWiring(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern for ST_AddBand with out-db references
  const stAddBandPattern = /ST_AddBand\(.*'\/vsicurl\/https:\/\/storage\.googleapis\.com\/([a-zA-Z0-9_-]+)\/.*'\)/gi;
  let match;

  while ((match = stAddBandPattern.exec(content)) !== null) {
    const bucketName = match[1];
    const expectedBucket = 'capegis-rasters';

    if (bucketName !== expectedBucket) {
      console.error(`❌ ERROR: Invalid GCS bucket '${bucketName}' in ${filePath}`);
      console.error(`   Expected bucket: '${expectedBucket}'`);
      process.exit(1);
    }
  }
}

// Scanned directories
const targets = ['supabase/migrations', 'scripts'];

targets.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isFile() && (file.endsWith('.sql') || file.endsWith('.sh'))) {
        verifyRasterWiring(fullPath);
      }
    });
  }
});

console.log('✅ out-db-raster-enforcer: All raster wiring is compliant.');
