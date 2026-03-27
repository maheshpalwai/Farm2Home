/**
 * Smart Image Mapping Test Component
 * Use this to test the smart image mapping system
 */

import React, { useState } from 'react';
import { getSmartCropImage, getCropCategory, isRecognizedCrop } from '../utils/smartImageMapper';
import { translateToEnglish } from '../utils/translationDict';
import './SmartImageTest.css';

const SmartImageTest = () => {
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('');
  const [result, setResult] = useState(null);

  const testCases = [
    { name: 'rice', category: 'grains', description: 'English - exact match' },
    { name: 'వరి', category: 'grains', description: 'Telugu - translation' },
    { name: 'ricee', category: 'grains', description: 'English - typo' },
    { name: 'tomat', category: 'vegetables', description: 'English - partial' },
    { name: 'టమాటో', category: 'vegetables', description: 'Telugu - exact' },
    { name: 'ఆపిల్', category: 'fruits', description: 'Telugu - apple' },
    { name: 'बादाम', category: 'dry_fruits', description: 'Hindi - almond' },
    { name: 'unknown_crop_xyz', category: null, description: 'Unknown - fallback' },
  ];

  const handleTest = () => {
    const imagePath = getSmartCropImage(cropName, category || null);
    const translatedName = translateToEnglish(cropName);
    const detectedCategory = getCropCategory(cropName);
    const recognized = isRecognizedCrop(cropName);

    setResult({
      imagePath,
      translatedName,
      detectedCategory,
      recognized,
      originalName: cropName
    });
  };

  const handleTestCase = (testCase) => {
    setCropName(testCase.name);
    setCategory(testCase.category || '');
    
    // Automatically run test
    setTimeout(() => {
      const imagePath = getSmartCropImage(testCase.name, testCase.category);
      const translatedName = translateToEnglish(testCase.name);
      const detectedCategory = getCropCategory(testCase.name);
      const recognized = isRecognizedCrop(testCase.name);

      setResult({
        imagePath,
        translatedName,
        detectedCategory,
        recognized,
        originalName: testCase.name,
        description: testCase.description
      });
    }, 100);
  };

  return (
    <div className="smart-image-test">
      <h1>Smart Image Mapping Test</h1>
      
      <div className="test-form">
        <div className="form-group">
          <label>Crop Name (any language):</label>
          <input
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder="e.g., rice, వరి, चावल, ricee"
          />
        </div>
        
        <div className="form-group">
          <label>Category (optional):</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Auto-detect</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
            <option value="grains">Grains</option>
            <option value="dry_fruits">Dry Fruits</option>
            <option value="spices">Spices</option>
          </select>
        </div>
        
        <button onClick={handleTest} className="test-btn">
          Test Mapping
        </button>
      </div>

      {result && (
        <div className="test-result">
          <h2>Result</h2>
          {result.description && (
            <p className="test-description">{result.description}</p>
          )}
          
          <div className="result-details">
            <div className="result-item">
              <strong>Original Name:</strong>
              <span>{result.originalName}</span>
            </div>
            
            <div className="result-item">
              <strong>Translated Name:</strong>
              <span>{result.translatedName}</span>
            </div>
            
            <div className="result-item">
              <strong>Detected Category:</strong>
              <span>{result.detectedCategory || 'Not detected'}</span>
            </div>
            
            <div className="result-item">
              <strong>Recognized:</strong>
              <span className={result.recognized ? 'recognized-yes' : 'recognized-no'}>
                {result.recognized ? 'Yes ✓' : 'No (using default)'}
              </span>
            </div>
            
            <div className="result-item">
              <strong>Image Path:</strong>
              <code>{result.imagePath}</code>
            </div>
          </div>
          
          <div className="result-image">
            <h3>Resolved Image:</h3>
            <img
              src={result.imagePath}
              alt={result.translatedName}
              onError={(e) => {
                e.target.style.border = '2px solid red';
                e.target.alt = 'Image failed to load';
              }}
            />
          </div>
        </div>
      )}

      <div className="test-cases">
        <h2>Quick Test Cases</h2>
        <p>Click any test case to see the result:</p>
        
        <div className="test-cases-grid">
          {testCases.map((testCase, index) => (
            <button
              key={index}
              onClick={() => handleTestCase(testCase)}
              className="test-case-btn"
            >
              <div className="test-case-name">{testCase.name}</div>
              <div className="test-case-desc">{testCase.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="test-info">
        <h2>How It Works</h2>
        <ol>
          <li>
            <strong>Translation:</strong> Non-English names are translated to English
            (supports Telugu, Hindi, Tamil, Malayalam, Kannada)
          </li>
          <li>
            <strong>Normalization:</strong> Name is converted to lowercase and trimmed
          </li>
          <li>
            <strong>Direct Match:</strong> Tries exact match in image database
          </li>
          <li>
            <strong>Fuzzy Match:</strong> Uses Levenshtein distance to handle typos
          </li>
          <li>
            <strong>Fallback:</strong> Returns default image if no match found
          </li>
        </ol>
      </div>
    </div>
  );
};

export default SmartImageTest;
