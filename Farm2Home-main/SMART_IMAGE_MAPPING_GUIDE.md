# Smart Crop Image Mapping System

## Overview

This system provides intelligent crop name and image handling with the following features:

### Key Features:
1. **Multi-Language Support**: Translates crop names from Telugu, Hindi, Tamil, Malayalam, and Kannada to English
2. **Fuzzy Matching**: Handles typos and variations (e.g., 'ric', 'ricee' → 'rice')
3. **Category-Based Mapping**: Organizes images by category (fruits, vegetables, grains, dry fruits, spices)
4. **Smart Fallback**: Uses default image for unrecognized crops
5. **Real-time Processing**: Works with live Firestore data

---

## Architecture

### 1. Translation Dictionary (`src/utils/translationDict.js`)

Maps non-English crop names to English:
```javascript
{
  'వరి': 'rice',      // Telugu
  'चावल': 'rice',     // Hindi
  'அரிசி': 'rice',    // Tamil
  'അരി': 'rice',      // Malayalam
  'ಅಕ್ಕಿ': 'rice'      // Kannada
}
```

**Supported Languages:**
- Telugu (తెలుగు)
- Hindi (हिन्दी)
- Tamil (தமிழ்)
- Malayalam (മലയാളം)
- Kannada (ಕನ್ನಡ)

---

### 2. Fuzzy Matcher (`src/utils/fuzzyMatcher.js`)

Implements **Levenshtein Distance Algorithm** for intelligent matching:

**Features:**
- Handles typos: `ricee` → `rice`
- Handles variations: `tomatoo` → `tomato`
- Handles plurals: `apples` ↔ `apple`
- Word-level matching: `black grapes`
- Configurable threshold (default: 0.7)

**Example:**
```javascript
fuzzyMatchWithTypos('tomat', ['tomato', 'potato', 'onion'], 0.7)
// Returns: { match: 'tomato', score: 0.83 }
```

---

### 3. Smart Image Mapper (`src/utils/smartImageMapper.js`)

Main utility that combines translation and fuzzy matching:

**Image Categories:**
- `fruits/` - Apples, bananas, mangoes, etc.
- `vegetables/` - Tomatoes, onions, carrots, etc.
- `grains/` - Rice, wheat, pulses (stored in `crops/`)
- `dry_fruits/` - Almonds, cashews, dates, etc.
- `spices/` - Turmeric, garlic, ginger, etc.

**Resolution Process:**
1. Translate crop name to English
2. Normalize (lowercase, trim)
3. Try direct lookup in specified category
4. Try direct lookup across all categories
5. Fuzzy match within category
6. Fuzzy match across all categories
7. Return default image if no match

---

## Usage

### Basic Usage

```javascript
import { getSmartCropImage } from '../utils/smartImageMapper';

// English name
const image = getSmartCropImage('apple', 'fruits');
// Returns: '/images/fruits/Apple.jpg'

// Telugu name
const image = getSmartCropImage('టమాటో', 'vegetables');
// Returns: '/images/vegetables/tomato.jpg'

// With typo
const image = getSmartCropImage('tomatoo', 'vegetables');
// Returns: '/images/vegetables/tomato.jpg'

// Unrecognized crop
const image = getSmartCropImage('unknown', null);
// Returns: '/images/default_crop.jpg'
```

### Batch Processing

```javascript
import { processCropImages } from '../utils/smartImageMapper';

const products = [
  { name: 'టమాటో', category: 'vegetables' },
  { name: 'వరి', category: 'grains' },
  { name: 'ఆపిల్', category: 'fruits' }
];

const processedProducts = processCropImages(products);
// Each product now has the correct image path
```

### In Components

The system is automatically integrated in:

**1. useProducts Hook** (`src/features/consumer/hooks/useProducts.js`)
```javascript
const { products, loading } = useProducts({ realtime: true });
// Products automatically have smart image mapping applied
```

**2. ProductCard Component** (`src/features/consumer/components/ProductCard/ProductCard.js`)
- Displays smart-mapped images
- Falls back to default image on error

---

## Folder Structure

```
public/images/
├── fruits/
│   ├── Apple.jpg
│   ├── Banana.jpg
│   ├── Mango.jpg
│   └── ...
├── vegetables/
│   ├── tomato.jpg
│   ├── onion.jpg
│   ├── potato.jpg
│   └── ...
├── crops/              # Grains & Pulses
│   ├── rice.jpg
│   ├── wheat.jpg
│   ├── chana.jpg
│   └── ...
├── dryfruits/
│   ├── badam.jpg
│   ├── cashews.jpg
│   ├── dates.jpg
│   └── ...
├── spices/
│   ├── (spice images)
├── turmeric.jpg        # Root level spices
├── ginger.jpg
├── Garlic.jpg
└── default_crop.jpg    # Fallback image (needs to be created)
```

---

## Setup Instructions

### Step 1: Create Default Crop Image

Create a default fallback image for unrecognized crops:

**Option A: Use Placeholder**
1. Download a generic crop/farm icon from:
   - https://unsplash.com/s/photos/agriculture
   - https://www.flaticon.com/search?word=agriculture
2. Save as: `public/images/default_crop.jpg`
3. Recommended size: 400x400px

**Option B: Use Logo**
```bash
# Copy existing logo as default (temporary)
cp public/images/logo/logo.png public/images/default_crop.jpg
```

### Step 2: Verify Image Paths

Ensure all crop images exist in correct folders:
```bash
# Check fruits
ls public/images/fruits/

# Check vegetables
ls public/images/vegetables/

# Check grains
ls public/images/crops/

# Check dry fruits
ls public/images/dryfruits/
```

### Step 3: Test the System

```javascript
// Test in browser console
import { getSmartCropImage } from './utils/smartImageMapper';

// Test English
console.log(getSmartCropImage('apple', 'fruits'));

// Test Telugu
console.log(getSmartCropImage('టమాటో', 'vegetables'));

// Test typo
console.log(getSmartCropImage('ricee', 'grains'));

// Test unrecognized
console.log(getSmartCropImage('xyz123', null));
```

---

## Adding New Crops

### 1. Add Translation

Edit `src/utils/translationDict.js`:
```javascript
export const translationDict = {
  // ... existing translations ...
  
  // Add new crop in all languages
  'కొత్త పంట': 'new crop',      // Telugu
  'नया फसल': 'new crop',          // Hindi
  'புதிய பயிர்': 'new crop',      // Tamil
  // ... etc
};
```

### 2. Add Image Mapping

Edit `src/utils/smartImageMapper.js`:
```javascript
const imageMap = {
  fruits: {
    // ... existing mappings ...
    'new crop': '/images/fruits/new_crop.jpg',
    'new crops': '/images/fruits/new_crop.jpg',
  },
  // ... other categories ...
};
```

### 3. Add Image File

Add the actual image to the appropriate folder:
```
public/images/fruits/new_crop.jpg
```

---

## API Reference

### `translateToEnglish(name: string): string`
Translates crop name from any supported language to English.

### `getSmartCropImage(cropName: string, category?: string): string`
Returns image path for crop. Uses translation and fuzzy matching.

**Parameters:**
- `cropName`: Crop name in any supported language
- `category`: Optional category hint ('fruits', 'vegetables', 'grains', 'dry_fruits', 'spices')

**Returns:** Image path or default image

### `processCropImages(products: Array): Array`
Batch processes product array and adds image paths.

### `getCropCategory(cropName: string): string|null`
Determines category for a crop name.

### `isRecognizedCrop(cropName: string): boolean`
Checks if crop is recognized (not using default image).

---

## Performance Considerations

1. **Caching**: Translation results are not cached by default
2. **Fuzzy Matching**: Has O(n*m) complexity (use category hints when possible)
3. **Image Loading**: Uses lazy loading in ProductCard
4. **Real-time Updates**: Smart mapping applies to real-time Firestore updates

---

## Testing Examples

### Test Cases

```javascript
// Test 1: English Name
expect(getSmartCropImage('rice', 'grains'))
  .toBe('/images/crops/rice.jpg');

// Test 2: Telugu Name
expect(getSmartCropImage('వరి', 'grains'))
  .toBe('/images/crops/rice.jpg');

// Test 3: Typo
expect(getSmartCropImage('ricee', 'grains'))
  .toBe('/images/crops/rice.jpg');

// Test 4: Hindi Name with Typo
expect(getSmartCropImage('चावाल', 'grains'))  // Should match चावल
  .toBe('/images/crops/rice.jpg');

// Test 5: Unknown Crop
expect(getSmartCropImage('xyz123'))
  .toBe('/images/default_crop.jpg');
```

---

## Troubleshooting

### Issue: Images not loading

**Solution:**
1. Check image file exists: `ls public/images/[category]/[file]`
2. Verify image path in `imageMap`
3. Check browser console for 404 errors
4. Ensure `default_crop.jpg` exists

### Issue: Translation not working

**Solution:**
1. Verify crop name in `translationDict.js`
2. Check language script is correct
3. Test with: `translateToEnglish('your_crop_name')`

### Issue: Fuzzy matching too loose/strict

**Solution:**
Adjust threshold in `smartImageMapper.js`:
```javascript
// More strict (fewer matches)
matchResult = fuzzyMatchWithTypos(normalizedName, allNames, 0.85);

// More loose (more matches)
matchResult = fuzzyMatchWithTypos(normalizedName, allNames, 0.6);
```

---

## Future Enhancements

1. **Caching**: Add Redis/localStorage cache for translations
2. **Machine Learning**: Use ML for better crop recognition
3. **Image Compression**: Optimize images for faster loading
4. **OCR Integration**: Extract crop names from farmer photos
5. **Regional Dialects**: Support more regional variations

---

## Credits

- **Translation Dictionary**: Community-sourced translations
- **Fuzzy Matching**: Levenshtein Distance Algorithm
- **Images**: Sourced from farmer uploads and stock photos

---

## License

This system is part of the Agriculture Portal project.

---

## Support

For issues or questions:
1. Check this documentation
2. Check console logs for errors
3. Verify image paths and translations
4. Contact development team

---

**Last Updated:** February 2026
**Version:** 1.0.0
