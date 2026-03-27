/**
 * Setup Script for Smart Image Mapping System
 * Run this to check and initialize the image mapping system
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Image categories and their expected locations
const imageCategories = {
  fruits: 'public/images/fruits',
  vegetables: 'public/images/vegetables',
  grains: 'public/images/crops',
  dry_fruits: 'public/images/dryfruits',
  spices: 'public/images',
};

// Expected images per category (samples)
const expectedImages = {
  fruits: ['Apple.jpg', 'Banana.jpg', 'Mango.jpg', 'orange.jpg', 'Pineapple.jpg'],
  vegetables: ['tomato.jpg', 'onion.jpg', 'potato.jpg', 'carrot.jpg', 'cabbage.jpg'],
  grains: ['rice.jpg', 'wheat.jpg', 'chana.jpg', 'maize.jpg'],
  dry_fruits: ['badam.jpg', 'cashews.jpg', 'dates.jpg', 'raisins.jpg'],
  spices: ['turmeric.jpg', 'ginger.jpg', 'Garlic.jpg'],
};

async function checkDirectory(dirPath) {
  try {
    await fs.promises.access(dirPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkDefaultImage() {
  const defaultImagePath = 'public/images/default_crop.jpg';
  const exists = await checkDirectory(defaultImagePath);
  
  if (exists) {
    log('✓ Default crop image found', 'green');
    return true;
  } else {
    log('✗ Default crop image missing!', 'red');
    log('  Create: public/images/default_crop.jpg', 'yellow');
    log('  Suggestion: Use a generic crop/farm icon (400x400px)', 'cyan');
    return false;
  }
}

async function checkCategoryFolders() {
  log('\n=== Checking Category Folders ===\n', 'blue');
  
  let allOk = true;
  
  for (const [category, folderPath] of Object.entries(imageCategories)) {
    const exists = await checkDirectory(folderPath);
    
    if (exists) {
      // Count images in folder
      const files = await fs.promises.readdir(folderPath);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      );
      
      log(`✓ ${category.padEnd(15)} → ${folderPath.padEnd(30)} (${imageFiles.length} images)`, 'green');
      
      // Check for expected images
      if (expectedImages[category]) {
        const missing = expectedImages[category].filter(img => 
          !imageFiles.includes(img)
        );
        
        if (missing.length > 0) {
          log(`  ⚠ Missing: ${missing.join(', ')}`, 'yellow');
        }
      }
    } else {
      log(`✗ ${category.padEnd(15)} → ${folderPath} (NOT FOUND)`, 'red');
      allOk = false;
    }
  }
  
  return allOk;
}

async function checkUtilityFiles() {
  log('\n=== Checking Utility Files ===\n', 'blue');
  
  const utilityFiles = [
    'src/utils/translationDict.js',
    'src/utils/fuzzyMatcher.js',
    'src/utils/smartImageMapper.js',
  ];
  
  let allOk = true;
  
  for (const file of utilityFiles) {
    const exists = await checkDirectory(file);
    
    if (exists) {
      log(`✓ ${file}`, 'green');
    } else {
      log(`✗ ${file} (NOT FOUND)`, 'red');
      allOk = false;
    }
  }
  
  return allOk;
}

async function generateImageReport() {
  log('\n=== Image Inventory Report ===\n', 'blue');
  
  const report = {};
  
  for (const [category, folderPath] of Object.entries(imageCategories)) {
    try {
      const files = await fs.promises.readdir(folderPath);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      );
      
      report[category] = imageFiles;
      
      log(`${category}:`, 'cyan');
      imageFiles.slice(0, 5).forEach(img => {
        log(`  - ${img}`, 'reset');
      });
      
      if (imageFiles.length > 5) {
        log(`  ... and ${imageFiles.length - 5} more`, 'yellow');
      }
      log('');
    } catch (error) {
      log(`${category}: Unable to read folder`, 'red');
    }
  }
  
  return report;
}

async function createDefaultImagePlaceholder() {
  const defaultImagePath = 'public/images/default_crop.jpg';
  const logoPath = 'public/images/logo/logo.png';
  
  try {
    // Check if logo exists
    const logoExists = await checkDirectory(logoPath);
    
    if (logoExists) {
      log('\nCreating default image from logo...', 'cyan');
      await fs.promises.copyFile(logoPath, defaultImagePath);
      log('✓ Default image created successfully!', 'green');
      return true;
    } else {
      log('\n⚠ Cannot create default image: logo not found', 'yellow');
      log('  Please manually create: public/images/default_crop.jpg', 'cyan');
      return false;
    }
  } catch (error) {
    log(`\n✗ Error creating default image: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔══════════════════════════════════════════════════╗', 'cyan');
  log('║   Smart Image Mapping System - Setup Check      ║', 'cyan');
  log('╚══════════════════════════════════════════════════╝\n', 'cyan');
  
  // Check utility files
  const utilsOk = await checkUtilityFiles();
  
  // Check default image
  const defaultImageExists = await checkDefaultImage();
  
  // Check category folders
  const foldersOk = await checkCategoryFolders();
  
  // Generate image report
  await generateImageReport();
  
  // Summary
  log('\n=== Setup Summary ===\n', 'blue');
  
  if (utilsOk && defaultImageExists && foldersOk) {
    log('✓ All checks passed! System is ready to use.', 'green');
  } else {
    log('⚠ Some issues found. Please review above.', 'yellow');
    
    if (!defaultImageExists) {
      log('\n📝 Action Required:', 'cyan');
      log('Create default_crop.jpg or run this script with --create-default flag', 'yellow');
    }
  }
  
  log('\n' + '='.repeat(50) + '\n', 'cyan');
  
  // Offer to create default image
  if (!defaultImageExists && process.argv.includes('--create-default')) {
    await createDefaultImagePlaceholder();
  } else if (!defaultImageExists) {
    log('💡 Tip: Run with --create-default flag to auto-create from logo', 'cyan');
    log('   Example: node setup.js --create-default\n', 'cyan');
  }
}

// Run the script
main().catch(error => {
  log(`\n✗ Script failed: ${error.message}`, 'red');
  process.exit(1);
});
