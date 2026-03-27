# Quick Start Guide - Smart Image Mapping System

## 🚀 What's New?

Your Consumer Dashboard now has **intelligent crop name and image handling** with:

✅ **Multi-Language Support** - Works with Telugu, Hindi, Tamil, Malayalam, and Kannada  
✅ **Fuzzy Matching** - Handles typos like 'ricee' → 'rice'  
✅ **Smart Translation** - Automatically translates 'వరి' → 'rice'  
✅ **Category-Based Mapping** - Organized by fruits, vegetables, grains, etc.  
✅ **Automatic Fallback** - Shows default image for unknown crops  

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Run Setup Check
```bash
node setup-smart-images.js
```

This will:
- Check if all utility files are present
- Verify image folders exist
- Generate an inventory report
- Identify missing images

### Step 2: Create Default Image
```bash
node setup-smart-images.js --create-default
```

Or manually create `public/images/default_crop.jpg` (recommended size: 400x400px)

### Step 3: Test the System

Add this route to your `App.js` (for testing only):

```javascript
import SmartImageTest from './components/SmartImageTest';

// Add to routes
<Route path="/test-smart-images" element={<SmartImageTest />} />
```

Then visit: `http://localhost:3000/test-smart-images`

---

## 📁 Files Added

```
src/utils/
├── translationDict.js      # Multi-language translations
├── fuzzyMatcher.js          # Typo handling and matching
└── smartImageMapper.js      # Main image resolver

src/components/
├── SmartImageTest.js        # Test component
└── SmartImageTest.css       # Test component styles

setup-smart-images.js        # Setup & verification script
SMART_IMAGE_MAPPING_GUIDE.md # Full documentation
```

---

## 🎯 How It Works

### Before:
```javascript
// Farmer uploads product with name "వరి" (rice in Telugu)
// Dashboard shows: ❌ Broken image or wrong image
```

### After:
```javascript
// Farmer uploads product with name "వరి"
// System automatically:
// 1. Translates "వరi" → "rice"
// 2. Maps to correct image: /images/crops/rice.jpg
// 3. Dashboard shows: ✅ Correct rice image!
```

---

## 📝 Usage Examples

### Example 1: English with Typo
```javascript
// Farmer types: "tomatoo"
// System resolves to: /images/vegetables/tomato.jpg ✓
```

### Example 2: Telugu Name
```javascript
// Farmer types: "టమాటో"
// System translates to: "tomato"
// System resolves to: /images/vegetables/tomato.jpg ✓
```

### Example 3: Hindi with Typo
```javascript
// Farmer types: "चावाल" (should be "चावल")
// System fuzzy matches to: "चावल" → "rice"
// System resolves to: /images/crops/rice.jpg ✓
```

### Example 4: Unknown Crop
```javascript
// Farmer types: "xyz_unknown_crop"
// System resolves to: /images/default_crop.jpg ⚠
```

---

## 🔧 Configuration

### Adjust Fuzzy Matching Threshold

Edit `src/utils/smartImageMapper.js`:

```javascript
// Line ~180
matchResult = fuzzyMatchWithTypos(normalizedName, allNames, 0.7);
                                                            // ^^^
                                                            // 0.7 = 70% similarity required
                                                            // Lower = more lenient (0.6)
                                                            // Higher = more strict (0.85)
```

### Add New Translation

Edit `src/utils/translationDict.js`:

```javascript
export const translationDict = {
  // Add your translation
  'మీ_పంట_పేరు': 'your_crop_name',  // Telugu
  'आपकी फसल': 'your_crop_name',      // Hindi
  // ... etc
};
```

### Add New Crop Image

1. Add image to appropriate folder: `public/images/fruits/new_crop.jpg`

2. Add mapping in `src/utils/smartImageMapper.js`:
```javascript
const imageMap = {
  fruits: {
    // ... existing mappings
    'new crop': '/images/fruits/new_crop.jpg',
    'new crops': '/images/fruits/new_crop.jpg', // plural
  },
};
```

3. Add translations in `translationDict.js` for all languages

---

## 🧪 Testing

### Quick Test (Browser Console)

```javascript
// Test English
getSmartCropImage('apple', 'fruits')
// Expected: '/images/fruits/Apple.jpg'

// Test Telugu
getSmartCropImage('టమాటో', 'vegetables')
// Expected: '/images/vegetables/tomato.jpg'

// Test Typo
getSmartCropImage('ricee', 'grains')
// Expected: '/images/crops/rice.jpg'

// Test Unknown
getSmartCropImage('unknown_xyz')
// Expected: '/images/default_crop.jpg'
```

### Full Test Page

Visit: `http://localhost:3000/test-smart-images`

---

## 🐛 Troubleshooting

### Issue: Images not showing

**Check:**
1. Run `node setup-smart-images.js` to verify setup
2. Check browser console for 404 errors
3. Verify image exists: `ls public/images/[category]/[file]`
4. Clear browser cache

### Issue: Translation not working

**Check:**
1. Verify crop name is in `translationDict.js`
2. Check spelling and language script
3. Test: `translateToEnglish('your_crop_name')`

### Issue: Fuzzy matching too strict/loose

**Solution:**
Adjust threshold in `smartImageMapper.js` (line ~180):
- Current: `0.7` (70% similarity)
- More lenient: `0.6` (60%)
- More strict: `0.85` (85%)

---

## 📖 Full Documentation

For complete details, see: **[SMART_IMAGE_MAPPING_GUIDE.md](./SMART_IMAGE_MAPPING_GUIDE.md)**

Topics covered:
- Architecture and design
- API reference
- Performance optimization
- Adding new crops
- Batch processing
- Advanced configuration

---

## 🎉 Benefits

1. **Better UX**: Farmers can type in their native language
2. **Error Tolerance**: System handles typos automatically
3. **Consistency**: All crops show correct images
4. **Scalability**: Easy to add new crops and languages
5. **Maintenance**: Centralized image mapping

---

## 💡 Next Steps

1. ✅ Run setup: `node setup-smart-images.js --create-default`
2. ✅ Test system: Visit `/test-smart-images`
3. ✅ Add your translations to `translationDict.js`
4. ✅ Add crop images to appropriate folders
5. ✅ Deploy and test with real farmer data

---

## 🤝 Support

Having issues? 

1. Check **[SMART_IMAGE_MAPPING_GUIDE.md](./SMART_IMAGE_MAPPING_GUIDE.md)**
2. Run `node setup-smart-images.js` for diagnostic info
3. Check browser console for errors
4. Verify image paths and translations

---

## 📊 System Status

After setup, you can check system status anytime:

```bash
node setup-smart-images.js
```

Output shows:
- ✓ Utility files present
- ✓ Default image exists
- ✓ Category folders found
- ✓ Image inventory count

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Status:** ✅ Production Ready  

---

Happy farming! 🌾🚜
