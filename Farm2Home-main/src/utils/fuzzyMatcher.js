/**
 * Fuzzy Matching Utility
 * Implements Levenshtein distance algorithm for fuzzy string matching
 * Handles typos, misspellings, and variations in crop names
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - The edit distance
 */
export const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a 2D array for dynamic programming
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
};

/**
 * Calculate similarity ratio between two strings (0 to 1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity ratio (1 = identical, 0 = completely different)
 */
export const calculateSimilarity = (str1, str2) => {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1.0;
  
  return 1 - distance / maxLength;
};

/**
 * Find the best match from a list of candidates
 * @param {string} query - The search query
 * @param {string[]} candidates - Array of candidate strings to match against
 * @param {number} threshold - Minimum similarity threshold (0-1), default 0.6
 * @returns {Object|null} - Object with {match: string, score: number} or null if no match
 */
export const findBestMatch = (query, candidates, threshold = 0.6) => {
  if (!query || !candidates || candidates.length === 0) return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().trim();
    
    // Exact match
    if (normalizedQuery === normalizedCandidate) {
      return { match: candidate, score: 1.0 };
    }
    
    // Check if query contains candidate or vice versa
    if (normalizedQuery.includes(normalizedCandidate) || 
        normalizedCandidate.includes(normalizedQuery)) {
      const score = 0.9;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
      continue;
    }
    
    // Calculate similarity
    const similarity = calculateSimilarity(normalizedQuery, normalizedCandidate);
    
    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = candidate;
    }
  }
  
  return bestMatch ? { match: bestMatch, score: bestScore } : null;
};

/**
 * Advanced fuzzy search with word-level matching
 * Useful for multi-word crop names like "black grapes"
 * @param {string} query - The search query
 * @param {string[]} candidates - Array of candidate strings
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Object|null} - Best match result
 */
export const fuzzySearchAdvanced = (query, candidates, threshold = 0.6) => {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().trim();
    const candidateWords = normalizedCandidate.split(/\s+/);
    
    // Exact match
    if (normalizedQuery === normalizedCandidate) {
      return { match: candidate, score: 1.0 };
    }
    
    // Word-level matching
    let wordMatchScore = 0;
    let matchedWords = 0;
    
    for (const queryWord of queryWords) {
      let bestWordMatch = 0;
      
      for (const candidateWord of candidateWords) {
        const wordSimilarity = calculateSimilarity(queryWord, candidateWord);
        bestWordMatch = Math.max(bestWordMatch, wordSimilarity);
      }
      
      if (bestWordMatch >= threshold) {
        matchedWords++;
      }
      wordMatchScore += bestWordMatch;
    }
    
    // Average word match score
    const avgWordScore = wordMatchScore / queryWords.length;
    
    // Bonus if all words matched
    const allWordsBonus = matchedWords === queryWords.length ? 0.1 : 0;
    
    const finalScore = Math.min(1.0, avgWordScore + allWordsBonus);
    
    if (finalScore > bestScore && finalScore >= threshold) {
      bestScore = finalScore;
      bestMatch = candidate;
    }
  }
  
  // Fallback to simple matching if advanced didn't work
  if (!bestMatch) {
    return findBestMatch(query, candidates, threshold);
  }
  
  return bestMatch ? { match: bestMatch, score: bestScore } : null;
};

/**
 * Fuzzy match with common typo handling
 * @param {string} query - The search query
 * @param {string[]} candidates - Array of candidate strings
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Object|null} - Best match result
 */
export const fuzzyMatchWithTypos = (query, candidates, threshold = 0.6) => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Common typo patterns
  const typoVariants = [
    normalizedQuery,
    normalizedQuery.replace(/ee/g, 'e'),  // ricee -> rice
    normalizedQuery.replace(/oo/g, 'o'),  // tomatoo -> tomato
    normalizedQuery + 's',                 // apple -> apples
    normalizedQuery.replace(/s$/, ''),     // apples -> apple
  ];
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const variant of typoVariants) {
    const result = fuzzySearchAdvanced(variant, candidates, threshold);
    if (result && result.score > bestScore) {
      bestScore = result.score;
      bestMatch = result.match;
    }
  }
  
  return bestMatch ? { match: bestMatch, score: bestScore } : null;
};

export default {
  levenshteinDistance,
  calculateSimilarity,
  findBestMatch,
  fuzzySearchAdvanced,
  fuzzyMatchWithTypos
};
