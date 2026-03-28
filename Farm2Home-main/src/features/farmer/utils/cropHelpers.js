import { findCropByKeyword, CROP_DICTIONARY } from '../../../data/cropData';

export const getCropImage = (cropName) => {
  if (!cropName) return null;
  
  const normalized = cropName.toLowerCase().trim();
  
  // Exact match first
  const exact = CROP_DICTIONARY.find(c =>
    c.name.toLowerCase() === normalized ||
    c.keywords.some(k => k.toLowerCase() === normalized)
  );
  if (exact?.image) {
    return exact.image.startsWith('/') ? exact.image : '/' + exact.image;
  }
  
  // Try partial match (first word)
  const firstWord = normalized.split(/\s+/)[0];
  const partial = CROP_DICTIONARY.find(c =>
    c.name.toLowerCase().startsWith(firstWord) ||
    c.keywords.some(k => k.toLowerCase().startsWith(firstWord))
  );
  if (partial?.image) {
    return partial.image.startsWith('/') ? partial.image : '/' + partial.image;
  }
  
  // Fuzzy fallback via findCropByKeyword
  const fuzzy = findCropByKeyword(normalized);
  if (fuzzy?.image) {
    return fuzzy.image.startsWith('/') ? fuzzy.image : '/' + fuzzy.image;
  }
  
  // Try to guess image category from crop name
  const vegImages = ['/images/vegetables/tomato.jpg', '/images/vegetables/onion.jpg', '/images/vegetables/potato.jpg'];
  const fruitImages = ['/images/fruits/apple.jpg', '/images/fruits/banana.jpg', '/images/fruits/mango.jpg'];
  const dryImages = ['/images/dryfruits/cashew.jpg', '/images/dryfruits/almond.jpg'];
  
  if (normalized.includes('tomato') || normalized.includes('onion') || normalized.includes('potato')) {
    return vegImages[Math.floor(Math.random() * vegImages.length)];
  }
  
  return null;
};
