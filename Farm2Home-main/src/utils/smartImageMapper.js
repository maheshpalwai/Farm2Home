/**
 * Smart Image Mapper
 * Intelligently maps crop names to images with multi-language support and fuzzy matching
 * Features:
 * - Category-based folder structure
 * - Multi-language translation (Telugu, Hindi, Tamil, Malayalam, Kannada)
 * - Fuzzy matching for typos and variations
 * - Smart fallback to default image
 */

import { translateToEnglish } from './translationDict';
import { fuzzyMatchWithTypos } from './fuzzyMatcher';

/**
 * Image Mapping organized by categories
 * Maps English crop names to their image paths in respective category folders
 */
const imageMap = {
  fruits: {
    'apple': '/images/fruits/Apple.jpg',
    'red apple': '/images/fruits/Apple.jpg',
    'red apples': '/images/fruits/Apple.jpg',
    'green apple': '/images/fruits/green apple.jpg',
    'green apples': '/images/fruits/green apple.jpg',
    'banana': '/images/fruits/Banana.jpg',
    'bananas': '/images/fruits/Banana.jpg',
    'grapes': '/images/fruits/green grape.jpg',
    'grape': '/images/fruits/green grape.jpg',
    'black grapes': '/images/fruits/black grapes.jpg',
    'black grape': '/images/fruits/black grapes.jpg',
    'green grapes': '/images/fruits/green grape.jpg',
    'green grape': '/images/fruits/green grape.jpg',
    'lemon': '/images/fruits/Lemon.jpg',
    'lemons': '/images/fruits/Lemon.jpg',
    'orange': '/images/fruits/orange.jpg',
    'oranges': '/images/fruits/orange.jpg',
    'pineapple': '/images/fruits/Pineapple.jpg',
    'pineapples': '/images/fruits/Pineapple.jpg',
    'mango': '/images/fruits/Mango.jpg',
    'mangoes': '/images/fruits/Mango.jpg',
    'papaya': '/images/fruits/papaya.jpg',
    'papayas': '/images/fruits/papaya.jpg',
    'watermelon': '/images/fruits/water melon.jpg',
    'watermelons': '/images/fruits/water melon.jpg',
    'pomegranate': '/images/fruits/Promoganates.jpg',
    'pomegranates': '/images/fruits/Promoganates.jpg',
    'custard apple': '/images/fruits/Custard apple.jpg',
    'custard apples': '/images/fruits/Custard apple.jpg',
    'strawberry': '/images/fruits/strawberries.jpg',
    'strawberries': '/images/fruits/strawberries.jpg',
    'blueberry': '/images/fruits/blueberry.jpg',
    'blueberries': '/images/fruits/blueberries.jpg',
    'blackberry': '/images/fruits/blackberries.jpg',
    'blackberries': '/images/fruits/blackberries.jpg',
    'raspberry': '/images/fruits/Raspberries.jpg',
    'raspberries': '/images/fruits/Raspberries.jpg',
    'guava': '/images/fruits/guva.jpg',
    'guavas': '/images/fruits/guva.jpg',
    'cherry': '/images/fruits/cherry.jpg',
    'cherries': '/images/fruits/cherry.jpg',
    'pear': '/images/fruits/pear.jpg',
    'pears': '/images/fruits/pear.jpg',
    'peach': '/images/fruits/Peach.jpg',
    'peaches': '/images/fruits/Peach.jpg',
    'amla': '/images/fruits/Amla.jpg',
    'kiwi': '/images/fruits/kiwi.jpg',
    'kiwis': '/images/fruits/kiwi.jpg',
    'avocado': '/images/fruits/avacado.jpg',
    'avocados': '/images/fruits/avacado.jpg',
    'dragon fruit': '/images/fruits/dragonfruit.jpg',
    'dragonfruit': '/images/fruits/dragonfruit.jpg',
    'figs': '/images/fruits/figs.jpg',
    'fig': '/images/fruits/figs.jpg',
    'jackfruit': '/images/fruits/jack fruit.jpg',
    'jack fruit': '/images/fruits/jack fruit.jpg',
    'musk melon': '/images/fruits/musk melon.jpg',
    'muskmelon': '/images/fruits/musk melon.jpg',
    'sapota': '/images/fruits/sapota.jpg',
    'sweet lime': '/images/fruits/Sweet Lime.jpg',
    'water apple': '/images/fruits/water apple.jpg',
  },
  
  vegetables: {
    'tomato': '/images/vegetables/tomato.jpg',
    'tomatoes': '/images/vegetables/tomato.jpg',
    'onion': '/images/vegetables/onion.jpg',
    'onions': '/images/vegetables/onion.jpg',
    'potato': '/images/vegetables/potato.jpg',
    'potatoes': '/images/vegetables/potato.jpg',
    'carrot': '/images/vegetables/carrot.jpg',
    'carrots': '/images/vegetables/carrot.jpg',
    'capsicum': '/images/vegetables/capsicum.jpg',
    'bell pepper': '/images/vegetables/capsicum.jpg',
    'bell peppers': '/images/vegetables/capsicum.jpg',
    'cabbage': '/images/vegetables/cabbage.jpg',
    'cabbages': '/images/vegetables/cabbage.jpg',
    'beetroot': '/images/vegetables/Beetroot.jpg',
    'beet': '/images/vegetables/Beetroot.jpg',
    'brinjal': '/images/vegetables/brinjal.jpg',
    'eggplant': '/images/vegetables/brinjal.jpg',
    'eggplants': '/images/vegetables/brinjal.jpg',
    'okra': '/images/vegetables/okra.jpg',
    'lady finger': '/images/vegetables/okra.jpg',
    'ladyfinger': '/images/vegetables/okra.jpg',
    'bitter gourd': '/images/vegetables/Bitter gaurd.jpg',
    'bitter melon': '/images/vegetables/Bitter gaurd.jpg',
    'green chilli': '/images/vegetables/Green Chillies.jpg',
    'green chillies': '/images/vegetables/Green Chillies.jpg',
    'green pepper': '/images/vegetables/Green Chillies.jpg',
    'spinach': '/images/vegetables/spinach.jpg',
    'cucumber': '/images/vegetables/keera cucumber.jpg',
    'cucumbers': '/images/vegetables/keera cucumber.jpg',
    'radish': '/images/vegetables/radish.jpg',
    'radishes': '/images/vegetables/radish.jpg',
    'mushroom': '/images/vegetables/Mushroom.jpg',
    'mushrooms': '/images/vegetables/Mushroom.jpg',
    'cauliflower': '/images/vegetables/cauli flower.jpg',
    'gongura': '/images/vegetables/gongura.jpg',
    'fenugreek leaves': '/images/vegetables/fenugreek leaves.jpg',
    'amaranthus': '/images/vegetables/amaranthus.jpg',
    'ridge gourd': '/images/vegetables/ridge gaurd.jpg',
    'snake gourd': '/images/vegetables/snake gaurd.jpg',
    'spring onion': '/images/vegetables/spring onion.jpg',
    'dasheen root': '/images/vegetables/Dasheenroot.jpg',
  },
  
  grains: {
    'rice': '/images/crops/rice.jpg',
    'wheat': '/images/crops/wheat.jpg',
    'chana': '/images/crops/chana.jpg',
    'chickpea': '/images/crops/chana.jpg',
    'chickpeas': '/images/crops/chana.jpg',
    'toor dal': '/images/crops/toor dal.jpg',
    'toor': '/images/crops/toor dal.jpg',
    'black gram': '/images/crops/Black Gram.jpg',
    'urad dal': '/images/crops/Black Gram.jpg',
    'green gram': '/images/crops/Green Gram.jpg',
    'moong dal': '/images/crops/Green Gram.jpg',
    'jowar': '/images/crops/jowar.jpg',
    'sorghum': '/images/crops/jowar.jpg',
    'maize': '/images/crops/maize.jpg',
    'corn': '/images/crops/maize.jpg',
    'ragi': '/images/crops/ragi.jpg',
    'finger millet': '/images/crops/ragi.jpg',
    'masoor dal': '/images/crops/masoor dal.jpg',
    'lentils': '/images/crops/lentils.jpg',
    'lentil': '/images/crops/lentils.jpg',
    'flax seeds': '/images/crops/flax seeds.jpg',
    'flaxseed': '/images/crops/flax seeds.jpg',
    'lotus seed': '/images/crops/lotus seed.jpg',
    'lotus seeds': '/images/crops/lotus seed.jpg',
    'pumpkin seeds': '/images/crops/pumpkin seeds.jpg',
    'saffron': '/images/crops/saffron.jpg',
  },
  
  dry_fruits: {
    'almond': '/images/dryfruits/badam.jpg',
    'almonds': '/images/dryfruits/badam.jpg',
    'badam': '/images/dryfruits/badam.jpg',
    'cashew': '/images/dryfruits/cashews.jpg',
    'cashews': '/images/dryfruits/cashews.jpg',
    'dates': '/images/dryfruits/dates.jpg',
    'date': '/images/dryfruits/dates.jpg',
    'raisins': '/images/dryfruits/raisins.jpg',
    'raisin': '/images/dryfruits/raisins.jpg',
    'pista': '/images/dryfruits/Pista.jpg',
    'pistachio': '/images/dryfruits/Pista.jpg',
    'pistachios': '/images/dryfruits/Pista.jpg',
    'walnut': '/images/dryfruits/waltnuts.jpg',
    'walnuts': '/images/dryfruits/waltnuts.jpg',
    'peanut': '/images/dryfruits/Peanut.jpg',
    'peanuts': '/images/dryfruits/Peanut.jpg',
    'groundnut': '/images/dryfruits/Peanut.jpg',
    'groundnuts': '/images/dryfruits/Peanut.jpg',
  },
  
  spices: {
    'turmeric': '/images/turmeric.jpg',
    'garlic': '/images/Garlic.jpg',
    'ginger': '/images/ginger.jpg',
    'tamarind': '/images/Tamarind.jpg',
  }
};

/**
 * Default fallback image for unrecognized crops
 */
const DEFAULT_IMAGE = '/images/default_crop.jpg';

/**
 * Create a flat list of all crop names for fuzzy matching
 */
const getAllCropNames = () => {
  const allNames = [];
  Object.values(imageMap).forEach(category => {
    allNames.push(...Object.keys(category));
  });
  return allNames;
};

/**
 * Get crop names for a specific category
 */
const getCategoryNames = (category) => {
  return Object.keys(imageMap[category] || {});
};

/**
 * Smart Image Resolver
 * Main function that resolves crop name to image path
 * 
 * @param {string} cropName - Crop name in any supported language
 * @param {string} category - Optional category hint ('fruits', 'vegetables', 'grains', 'dry_fruits', 'spices')
 * @returns {string} - Image path
 */
export const getSmartCropImage = (cropName, category = null) => {
  if (!cropName) return DEFAULT_IMAGE;
  
  // Step 1: Translate to English if in non-English script
  let englishName = translateToEnglish(cropName);
  
  // Step 2: Normalize the name
  const normalizedName = englishName.toLowerCase().trim();
  
  // Step 3: Try direct lookup if category is provided
  if (category && imageMap[category]) {
    const directMatch = imageMap[category][normalizedName];
    if (directMatch) {
      return directMatch;
    }
  }
  
  // Step 4: Try direct lookup across all categories
  for (const cat of Object.keys(imageMap)) {
    const directMatch = imageMap[cat][normalizedName];
    if (directMatch) {
      return directMatch;
    }
  }
  
  // Step 5: Fuzzy matching
  let matchResult;
  
  if (category && imageMap[category]) {
    // Fuzzy match within specific category
    const categoryNames = getCategoryNames(category);
    matchResult = fuzzyMatchWithTypos(normalizedName, categoryNames, 0.7);
    
    if (matchResult) {
      return imageMap[category][matchResult.match];
    }
  }
  
  // Step 6: Fuzzy match across all categories
  const allNames = getAllCropNames();
  matchResult = fuzzyMatchWithTypos(normalizedName, allNames, 0.7);
  
  if (matchResult) {
    // Find which category this match belongs to
    for (const cat of Object.keys(imageMap)) {
      if (imageMap[cat][matchResult.match]) {
        return imageMap[cat][matchResult.match];
      }
    }
  }
  
  // Step 7: Fallback to default image
  console.warn(`No image found for crop: "${cropName}" (translated: "${englishName}"). Using default.`);
  return DEFAULT_IMAGE;
};

/**
 * Batch process multiple crop names
 * Useful for processing product lists
 * 
 * @param {Array} products - Array of product objects with name and category
 * @returns {Array} - Products with resolved image paths
 */
export const processCropImages = (products) => {
  return products.map(product => ({
    ...product,
    image: getSmartCropImage(product.name, product.category)
  }));
};

/**
 * Get category for a crop name (useful for categorization)
 * 
 * @param {string} cropName - Crop name
 * @returns {string|null} - Category name or null
 */
export const getCropCategory = (cropName) => {
  const englishName = translateToEnglish(cropName).toLowerCase().trim();
  
  // Direct lookup
  for (const [category, items] of Object.entries(imageMap)) {
    if (items[englishName]) {
      return category;
    }
  }
  
  // Fuzzy lookup
  const allNames = getAllCropNames();
  const matchResult = fuzzyMatchWithTypos(englishName, allNames, 0.7);
  
  if (matchResult) {
    for (const [category, items] of Object.entries(imageMap)) {
      if (items[matchResult.match]) {
        return category;
      }
    }
  }
  
  return null;
};

/**
 * Validate if a crop name is recognized
 * 
 * @param {string} cropName - Crop name
 * @returns {boolean} - True if recognized
 */
export const isRecognizedCrop = (cropName) => {
  const image = getSmartCropImage(cropName);
  return image !== DEFAULT_IMAGE;
};

export default {
  getSmartCropImage,
  processCropImages,
  getCropCategory,
  isRecognizedCrop,
  imageMap
};
