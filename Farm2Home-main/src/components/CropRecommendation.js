import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaLeaf, FaThermometerHalf, FaCalendarAlt, FaChartLine, FaSeedling, FaWater, FaMapMarkerAlt, FaMoneyBillWave, FaStar, FaDownload, FaBookmark, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './CropRecommendation.css';

const CropRecommendation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    soilType: '',
    climate: '',
    season: '',
    waterAvailability: '',
    landSize: '',
    budget: '',
    experience: '',
    marketPreference: '',
    location: ''
  });

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [savedRecommendations, setSavedRecommendations] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  // Enhanced soil types with more details
  const soilTypes = [
    { value: 'clay', label: t('soil_clay') || 'Clay Soil', description: t('soil_clay_desc') || 'Heavy, retains water well, good for rice and wheat', characteristics: ['High water retention', 'Rich in minerals', 'Good for paddy crops'] },
    { value: 'sandy', label: t('soil_sandy') || 'Sandy Soil', description: t('soil_sandy_desc') || 'Light, well-draining, good for root vegetables', characteristics: ['Fast drainage', 'Warms quickly', 'Good for root crops'] },
    { value: 'loamy', label: t('soil_loamy') || 'Loamy Soil', description: t('soil_loamy_desc') || 'Balanced, ideal for most crops', characteristics: ['Perfect balance', 'High fertility', 'Best for most crops'] },
    { value: 'silt', label: t('soil_silt') || 'Silt Soil', description: t('soil_silt_desc') || 'Fine particles, good for vegetables and fruits', characteristics: ['Smooth texture', 'Good moisture retention', 'Ideal for vegetables'] },
    { value: 'red', label: t('soil_red') || 'Red Soil', description: t('soil_red_desc') || 'Rich in iron, good for pulses and oilseeds', characteristics: ['Iron rich', 'Slightly acidic', 'Good for pulses'] },
    { value: 'black', label: t('soil_black') || 'Black Soil', description: t('soil_black_desc') || 'High fertility, excellent for cotton and sugarcane', characteristics: ['High fertility', 'Rich in minerals', 'Excellent for cash crops'] }
  ];

  // Enhanced climate zones
  const climates = [
    { value: 'tropical', label: t('climate_tropical') || 'Tropical', description: t('climate_tropical_desc') || 'Hot and humid, year-round growing', characteristics: ['High temperature', 'High humidity', 'Year-round growing'] },
    { value: 'subtropical', label: t('climate_subtropical') || 'Subtropical', description: t('climate_subtropical_desc') || 'Warm with distinct seasons', characteristics: ['Moderate temperature', 'Distinct seasons', 'Good for diverse crops'] },
    { value: 'temperate', label: t('climate_temperate') || 'Temperate', description: t('climate_temperate_desc') || 'Moderate temperatures, seasonal changes', characteristics: ['Moderate climate', 'Seasonal changes', 'Good for grains'] },
    { value: 'arid', label: t('climate_arid') || 'Arid', description: t('climate_arid_desc') || 'Hot and dry, limited rainfall', characteristics: ['Low rainfall', 'High temperature', 'Drought-resistant crops'] },
    { value: 'semi_arid', label: t('climate_semi_arid') || 'Semi-Arid', description: t('climate_semi_arid_desc') || 'Moderate rainfall, drought-resistant crops', characteristics: ['Moderate rainfall', 'Drought-resistant', 'Mixed farming'] }
  ];

  // Enhanced seasons
  const seasons = [
    { value: 'kharif', label: t('season_kharif') || 'Kharif (Monsoon)', description: t('season_kharif_desc') || 'June-October, rice, maize, cotton', characteristics: ['Monsoon season', 'High rainfall', 'Rice, maize, cotton'] },
    { value: 'rabi', label: t('season_rabi') || 'Rabi (Winter)', description: t('season_rabi_desc') || 'October-March, wheat, barley, mustard', characteristics: ['Winter season', 'Moderate rainfall', 'Wheat, barley, mustard'] },
    { value: 'zaid', label: t('season_zaid') || 'Zaid (Summer)', description: t('season_zaid_desc') || 'March-June, vegetables, fruits', characteristics: ['Summer season', 'Irrigation needed', 'Vegetables, fruits'] }
  ];

  // Enhanced water availability
  const waterOptions = [
    { value: 'high', label: t('water_high') || 'High (Irrigation available)', description: t('water_high_desc') || 'Can grow water-intensive crops', characteristics: ['Full irrigation', 'Water-intensive crops', 'High yield potential'] },
    { value: 'moderate', label: t('water_moderate') || 'Moderate', description: t('water_moderate_desc') || 'Balanced water usage crops', characteristics: ['Partial irrigation', 'Balanced crops', 'Moderate yield'] },
    { value: 'low', label: t('water_low') || 'Low (Rainfed)', description: t('water_low_desc') || 'Drought-resistant crops recommended', characteristics: ['Rainfed farming', 'Drought-resistant', 'Low water usage'] }
  ];

  // Enhanced experience levels
  const experienceLevels = [
    { value: 'beginner', label: t('exp_beginner') || 'Beginner (0-2 years)', description: t('exp_beginner_desc') || 'Easy to grow crops', characteristics: ['Simple techniques', 'Low risk', 'Easy maintenance'] },
    { value: 'intermediate', label: t('exp_intermediate') || 'Intermediate (3-5 years)', description: t('exp_intermediate_desc') || 'Moderate complexity crops', characteristics: ['Moderate techniques', 'Medium risk', 'Some expertise needed'] },
    { value: 'expert', label: t('exp_expert') || 'Expert (5+ years)', description: t('exp_expert_desc') || 'Advanced farming techniques', characteristics: ['Advanced techniques', 'High risk', 'Expert knowledge'] }
  ];

  // Enhanced market preferences
  const marketPreferences = [
    { value: 'local', label: t('market_local') || 'Local Market', description: t('market_local_desc') || 'Fresh produce for nearby markets', characteristics: ['Nearby markets', 'Fresh produce', 'Quick sales'] },
    { value: 'export', label: t('market_export') || 'Export Market', description: t('market_export_desc') || 'High-value crops for international markets', characteristics: ['International markets', 'High value', 'Quality standards'] },
    { value: 'processing', label: t('market_processing') || 'Processing Industry', description: t('market_processing_desc') || 'Crops for food processing', characteristics: ['Bulk supply', 'Processing units', 'Contract farming'] },
    { value: 'organic', label: t('market_organic') || 'Organic Market', description: t('market_organic_desc') || 'Certified organic produce', characteristics: ['Certified organic', 'Premium pricing', 'Natural methods'] }
  ];


  // Enhanced AI-based crop recommendation algorithm
  const generateRecommendations = (data) => {
    setLoading(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const recommendations = [];
      
      // Enhanced crop database with more details
      const cropDatabase = {
        // Cereals
        rice: {
          name: 'Rice',
          scientificName: 'Oryza sativa',
          soil: ['clay', 'loamy'],
          climate: ['tropical', 'subtropical'],
          season: ['kharif'],
          water: ['high'],
          experience: ['beginner', 'intermediate'],
          market: ['local', 'export'],
          profit: 'High',
          risk: 'Low',
          duration: '120-150 days',
          investment: '₹15,000-25,000 per acre',
          yield: '2-3 tons per acre',
          bestPractices: ['Proper water management', 'Timely transplantation', 'Balanced fertilization'],
          challenges: ['Water requirement', 'Pest management', 'Labor intensive'],
          marketTrends: 'Stable demand, good export potential',
          sustainability: 'High - supports food security'
        },
        wheat: {
          name: 'Wheat',
          scientificName: 'Triticum aestivum',
          soil: ['loamy', 'clay'],
          climate: ['temperate', 'subtropical'],
          season: ['rabi'],
          water: ['moderate'],
          experience: ['beginner', 'intermediate'],
          market: ['local', 'processing'],
          profit: 'Medium',
          risk: 'Low',
          duration: '110-130 days',
          investment: '₹12,000-20,000 per acre',
          yield: '2-2.5 tons per acre',
          bestPractices: ['Timely sowing', 'Proper irrigation', 'Disease management'],
          challenges: ['Market price fluctuations', 'Disease control', 'Storage issues'],
          marketTrends: 'Stable domestic demand',
          sustainability: 'High - staple food crop'
        },
        maize: {
          name: 'Maize',
          scientificName: 'Zea mays',
          soil: ['loamy', 'sandy'],
          climate: ['tropical', 'subtropical'],
          season: ['kharif', 'zaid'],
          water: ['moderate'],
          experience: ['beginner', 'intermediate'],
          market: ['processing', 'local'],
          profit: 'Medium',
          risk: 'Medium',
          duration: '90-110 days',
          investment: '₹10,000-18,000 per acre',
          yield: '2.5-3.5 tons per acre',
          bestPractices: ['Hybrid seeds', 'Proper spacing', 'Timely harvesting'],
          challenges: ['Pest management', 'Market price fluctuations', 'Storage'],
          marketTrends: 'Growing demand for processed products',
          sustainability: 'Medium - versatile crop'
        },
        
        // Pulses
        chickpea: {
          name: 'Chickpea',
          scientificName: 'Cicer arietinum',
          soil: ['loamy', 'sandy'],
          climate: ['temperate', 'subtropical'],
          season: ['rabi'],
          water: ['low', 'moderate'],
          experience: ['beginner'],
          market: ['local', 'export'],
          profit: 'High',
          risk: 'Low',
          duration: '120-140 days',
          investment: '₹8,000-15,000 per acre',
          yield: '1-1.5 tons per acre',
          bestPractices: ['Proper seed treatment', 'Disease management', 'Timely harvesting'],
          challenges: ['Disease susceptibility', 'Market price fluctuations', 'Market access'],
          marketTrends: 'High demand for protein-rich food',
          sustainability: 'High - nitrogen fixing crop'
        },
        
        // Oilseeds
        groundnut: {
          name: 'Groundnut',
          scientificName: 'Arachis hypogaea',
          soil: ['sandy', 'loamy'],
          climate: ['tropical', 'subtropical'],
          season: ['kharif', 'rabi'],
          water: ['moderate'],
          experience: ['intermediate'],
          market: ['processing', 'export'],
          profit: 'High',
          risk: 'Medium',
          duration: '120-140 days',
          investment: '₹12,000-20,000 per acre',
          yield: '1.5-2 tons per acre',
          bestPractices: ['Proper spacing', 'Disease control', 'Timely harvesting'],
          challenges: ['Aflatoxin management', 'Market price fluctuations', 'Storage issues'],
          marketTrends: 'Growing demand for oil and protein',
          sustainability: 'Medium - oil crop'
        },
        
        // Vegetables
        tomato: {
          name: 'Tomato',
          scientificName: 'Solanum lycopersicum',
          soil: ['loamy', 'sandy'],
          climate: ['tropical', 'subtropical'],
          season: ['zaid', 'rabi'],
          water: ['high'],
          experience: ['intermediate'],
          market: ['local', 'processing'],
          profit: 'Very High',
          risk: 'High',
          duration: '90-120 days',
          investment: '₹25,000-40,000 per acre',
          yield: '15-25 tons per acre',
          bestPractices: ['Staking', 'Disease management', 'Regular harvesting'],
          challenges: ['Price fluctuations', 'Disease management', 'Labor intensive'],
          marketTrends: 'Year-round demand',
          sustainability: 'Medium - high input crop'
        },
        
        // Fruits
        mango: {
          name: 'Mango',
          scientificName: 'Mangifera indica',
          soil: ['loamy', 'sandy'],
          climate: ['tropical', 'subtropical'],
          season: ['zaid'],
          water: ['moderate'],
          experience: ['expert'],
          market: ['local', 'export'],
          profit: 'Very High',
          risk: 'Medium',
          duration: '3-5 years (first harvest)',
          investment: '₹50,000-80,000 per acre',
          yield: '8-12 tons per acre (mature trees)',
          bestPractices: ['Proper pruning', 'Disease management', 'Quality maintenance'],
          challenges: ['Long gestation period', 'Disease management', 'Market competition'],
          marketTrends: 'High export potential',
          sustainability: 'High - perennial crop'
        },
        
        // Cash Crops
        cotton: {
          name: 'Cotton',
          scientificName: 'Gossypium hirsutum',
          soil: ['black', 'loamy'],
          climate: ['tropical', 'subtropical'],
          season: ['kharif'],
          water: ['moderate'],
          experience: ['intermediate', 'expert'],
          market: ['processing', 'export'],
          profit: 'High',
          risk: 'Medium',
          duration: '150-180 days',
          investment: '₹15,000-25,000 per acre',
          yield: '2-3 quintals per acre',
          bestPractices: ['Pest management', 'Proper spacing', 'Quality picking'],
          challenges: ['Pest management', 'Price fluctuations', 'Labor intensive'],
          marketTrends: 'Stable textile industry demand',
          sustainability: 'Medium - cash crop'
        }
      };

      // Enhanced AI scoring algorithm
      const calculateScore = (crop, data) => {
        let score = 0;
        
        // Soil compatibility (25 points)
        if (crop.soil.includes(data.soilType)) score += 25;
        
        // Climate compatibility (20 points)
        if (crop.climate.includes(data.climate)) score += 20;
        
        // Season compatibility (15 points)
        if (crop.season.includes(data.season)) score += 15;
        
        // Water availability (15 points)
        if (crop.water.includes(data.waterAvailability)) score += 15;
        
        // Experience level (10 points)
        if (crop.experience.includes(data.experience)) score += 10;
        
        // Market preference bonus (5 points)
        if (crop.market.includes(data.marketPreference)) score += 5;
        
        // Budget consideration (10 points)
        const cropInvestment = parseInt(crop.investment.split('-')[1].replace(/[^\d]/g, ''));
        const userBudget = parseInt(data.budget) || 50000;
        if (cropInvestment <= userBudget) score += 10;
        
        return score;
      };

      // Generate recommendations
      Object.entries(cropDatabase).forEach(([key, crop]) => {
        const score = calculateScore(crop, data);
        if (score >= 50) { // Minimum threshold
          recommendations.push({
            ...crop,
            score,
            key,
            suitability: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair',
            matchPercentage: score
          });
        }
      });

      // Sort by score and take top 5
      recommendations.sort((a, b) => b.score - a.score);
      setRecommendations(recommendations.slice(0, 5));
      setLoading(false);
      setShowForm(false);
    }, 2000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateRecommendations(formData);
  };

  const resetForm = () => {
    setFormData({
      soilType: '',
      climate: '',
      season: '',
      waterAvailability: '',
      landSize: '',
      budget: '',
      experience: '',
      marketPreference: '',
      location: ''
    });
    setRecommendations([]);
    setShowForm(true);
    setSelectedCrop(null);
  };

  const saveRecommendation = (crop) => {
    const savedCrop = {
      ...crop,
      savedAt: new Date().toISOString(),
      formData: formData
    };
    setSavedRecommendations([...savedRecommendations, savedCrop]);
    console.log('Recommendation saved!');
  };

  const downloadReport = (crop) => {
    const report = `
Crop Recommendation Report
=========================

Crop: ${crop.name}
Scientific Name: ${crop.scientificName}
Suitability Score: ${crop.score}/100
Match Percentage: ${crop.matchPercentage}%

Details:
- Profit Potential: ${crop.profit}
- Risk Level: ${crop.risk}
- Duration: ${crop.duration}
- Investment: ${crop.investment}
- Expected Yield: ${crop.yield}

Best Practices:
${crop.bestPractices.map(practice => `• ${practice}`).join('\n')}

Challenges:
${crop.challenges.map(challenge => `• ${challenge}`).join('\n')}

Market Trends: ${crop.marketTrends}
Sustainability: ${crop.sustainability}

Generated on: ${new Date().toLocaleDateString()}
    `;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${crop.name}_recommendation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cr-premium-container">
      <div className="cr-mesh-blob cr-blob-1" />
      <div className="cr-mesh-blob cr-blob-2" />
      <div className="cr-mesh-blob cr-blob-3" />
      <div className="cr-noise-overlay" />
      <div className="cr-content-wrapper">
      {/* Navigation Header */}
      <div style={navHeader}>
        <button onClick={() => navigate(-1)} style={navButton}>
          <FaChevronLeft style={{ marginRight: '8px' }} />
          {t('back') || 'Back'}
        </button>
        <div className="cr-header">
          <h1 className="cr-title">
            <FaSeedling className="cr-title-icon" />
            {t('crop_recommendations') || 'AI Crop Recommendations'}
          </h1>
        </div>
        <button onClick={() => navigate(1)} style={navButton}>
          {t('forward') || 'Forward'}
          <FaChevronRight style={{ marginLeft: '8px' }} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={tabContainer}>
        <button 
          style={!showSaved ? activeTabStyle : tabStyle}
          onClick={() => { setShowSaved(false); setShowForm(true); }}
        >
          {t('new_analysis') || 'New Analysis'}
        </button>
        <button 
          style={showSaved ? activeTabStyle : tabStyle}
          onClick={() => { setShowSaved(true); setShowForm(false); }}
        >
          {t('saved_recommendations') || 'Saved Recommendations'} ({savedRecommendations.length})
        </button>
      </div>

      {showSaved ? (
        <div style={savedContainer}>
          <h2 style={sectionTitle}>Saved Recommendations</h2>
          {savedRecommendations.length === 0 ? (
            <p style={emptyMessage}>No saved recommendations yet.</p>
          ) : (
            <div style={savedGrid}>
              {savedRecommendations.map((crop, index) => (
                <div key={index} style={savedCard}>
                  <h3>{crop.name}</h3>
                  <p>Score: {crop.score}/100</p>
                  <p>Saved: {new Date(crop.savedAt).toLocaleDateString()}</p>
                  <button onClick={() => setSelectedCrop(crop)} style={viewButton}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="cr-glass-panel">
          <div className="cr-form-grid">
            {/* Soil Type */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaLeaf className="cr-label-icon" />
                {t('soil_type') || 'Soil Type'}
              </label>
              <select 
                value={formData.soilType} 
                onChange={(e) => handleInputChange('soilType', e.target.value)}
                className="cr-select"
                required
              >
                <option value="">{t('select_soil_type') || 'Select Soil Type'}</option>
                {soilTypes.map(soil => (
                  <option key={soil.value} value={soil.value}>
                    {soil.label} - {soil.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Climate */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaThermometerHalf className="cr-label-icon" />
                {t('climate') || 'Climate'}
              </label>
              <select 
                value={formData.climate} 
                onChange={(e) => handleInputChange('climate', e.target.value)}
                className="cr-select"
                required
              >
                <option value="">{t('select_climate') || 'Select Climate'}</option>
                {climates.map(climate => (
                  <option key={climate.value} value={climate.value}>
                    {climate.label} - {climate.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Season */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaCalendarAlt className="cr-label-icon" />
                {t('season') || 'Season'}
              </label>
              <select 
                value={formData.season} 
                onChange={(e) => handleInputChange('season', e.target.value)}
                className="cr-select"
                required
              >
                <option value="">{t('select_season') || 'Select Season'}</option>
                {seasons.map(season => (
                  <option key={season.value} value={season.value}>
                    {season.label} - {season.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Water Availability */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaWater className="cr-label-icon" />
                {t('water_availability') || 'Water Availability'}
              </label>
              <select 
                value={formData.waterAvailability} 
                onChange={(e) => handleInputChange('waterAvailability', e.target.value)}
                className="cr-select"
                required
              >
                <option value="">{t('select_water_availability') || 'Select Water Availability'}</option>
                {waterOptions.map(water => (
                  <option key={water.value} value={water.value}>
                    {water.label} - {water.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Land Size */}
            <div className="cr-input-group">
              <label className="cr-label">
                {t('land_size') || 'Land Size (Acres)'}
              </label>
              <input 
                type="number" 
                value={formData.landSize} 
                onChange={(e) => handleInputChange('landSize', e.target.value)}
                className="cr-input"
                placeholder={t('enter_land_size') || 'Enter land size in acres'}
                min="0.1"
                step="0.1"
              />
            </div>

            {/* Budget */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaMoneyBillWave className="cr-label-icon" />
                {t('budget_per_acre') || 'Budget per Acre (₹)'}
              </label>
              <input 
                type="number" 
                value={formData.budget} 
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className="cr-input"
                placeholder={t('enter_budget') || 'Enter budget in ₹'}
                min="1000"
                step="1000"
              />
            </div>

            {/* Experience Level */}
            <div className="cr-input-group">
              <label className="cr-label">
                {t('farming_experience') || 'Farming Experience'}
              </label>
              <select 
                value={formData.experience} 
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="cr-select"
                required
              >
                <option value="">{t('select_experience_level') || 'Select Experience Level'}</option>
                {experienceLevels.map(exp => (
                  <option key={exp.value} value={exp.value}>
                    {exp.label} - {exp.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Market Preference */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaChartLine className="cr-label-icon" />
                {t('market_preference') || 'Market Preference'}
              </label>
              <select 
                value={formData.marketPreference} 
                onChange={(e) => handleInputChange('marketPreference', e.target.value)}
                className="cr-select"
                required
              >
                <option value="">{t('select_market_preference') || 'Select Market Preference'}</option>
                {marketPreferences.map(market => (
                  <option key={market.value} value={market.value}>
                    {market.label} - {market.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="cr-input-group">
              <label className="cr-label">
                <FaMapMarkerAlt className="cr-label-icon" />
                {t('location_optional') || 'Location (Optional)'}
              </label>
              <input 
                type="text" 
                value={formData.location} 
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="cr-input"
                placeholder={t('enter_location') || 'Enter your location for better recommendations'}
              />
            </div>
          </div>

          <button type="submit" className="cr-submit-btn">
            <FaChartLine />
            {t('get_recommendations', 'Get AI Crop Recommendations')}
          </button>
        </form>
      ) : (
        <div style={resultsContainer}>
          {loading ? (
            <div className="cr-ai-scanner">
              <div className="cr-scanner-ring"></div>
              <h3 className="cr-scanner-text">{t('analyzing_data', 'AI Processing Farm Data...')}</h3>
              <p className="cr-scanner-subtext">
                {t('ai_processing', 'Analyzing soil composition, historical climate patterns, and real-time market trends to determine your optimal crop portfolio.')}
              </p>
            </div>
          ) : (
            <>
              <div className="cr-header" style={{ marginTop: '40px' }}>
                <h2 className="cr-title" style={{ fontSize: '2rem' }}>
                  {t('your_recommendations') || 'Optimal Crop Portfolio'}
                </h2>
                <button onClick={resetForm} className="cr-btn-secondary" style={{ width: 'fit-content', margin: '0 auto' }}>
                  {t('new_analysis') || 'Run New Analysis'}
                </button>
              </div>

              <div className="cr-results-grid">
                {recommendations.map((crop, index) => (
                  <div key={crop.key} className="cr-result-card">
                    <div className="cr-card-header">
                      <div>
                        <h3 className="cr-crop-name">{t(`crop_${crop.name.toLowerCase().replace(' ', '_')}`, crop.name)}</h3>
                        <p className="cr-crop-sci">{crop.scientificName}</p>
                      </div>
                      <div className="cr-ring-container">
                        <svg viewBox="0 0 36 36" className="cr-circular-chart">
                          <path className="cr-circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path className="cr-circle"
                            strokeDasharray={`${crop.score}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{ stroke: crop.score >= 80 ? '#10b981' : crop.score >= 60 ? '#f59e0b' : '#ef4444' }}
                          />
                          <text x="18" y="20.35" className="cr-percentage">{crop.score}%</text>
                        </svg>
                      </div>
                    </div>

                    <div className="cr-bento-stats">
                      <div className="cr-bento-box">
                        <div className="cr-bento-label">{t('profit') || 'Profit'}</div>
                        <div className={`cr-bento-value ${crop.profit.includes('High') ? 'val-high' : 'val-medium'}`}>
                          {t(`profit_${crop.profit.toLowerCase().replace(' ', '_')}`) || crop.profit}
                        </div>
                      </div>
                      <div className="cr-bento-box">
                        <div className="cr-bento-label">{t('risk') || 'Risk'}</div>
                        <div className={`cr-bento-value ${crop.risk === 'Low' ? 'val-high' : crop.risk === 'Medium' ? 'val-medium' : 'val-low'}`}>
                          {t(`risk_${crop.risk.toLowerCase().replace(' ', '_')}`) || crop.risk}
                        </div>
                      </div>
                      <div className="cr-bento-box">
                        <div className="cr-bento-label">{t('duration') || 'Duration'}</div>
                        <div className="cr-bento-value" style={{ color: '#f8fafc' }}>
                          {crop.duration.split(' ')[0]} {t(crop.duration.split(' ')[1]) || crop.duration.split(' ')[1]}
                        </div>
                      </div>
                      <div className="cr-bento-box">
                        <div className="cr-bento-label">{t('yield') || 'Yield'}</div>
                        <div className="cr-bento-value" style={{ color: '#f8fafc' }}>
                          {crop.yield.split(' ')[0]} {t(crop.yield.split(' ')[1]) || crop.yield.split(' ')[1]} {crop.yield.split(' ').slice(2).join(' ')}
                        </div>
                      </div>
                    </div>

                    <div className="cr-card-actions">
                      <button onClick={() => saveRecommendation(crop)} className="cr-btn-primary">
                        <FaBookmark /> {t('save') || 'Save'}
                      </button>
                      <button onClick={() => setSelectedCrop(crop)} className="cr-btn-secondary">
                        <FaStar /> {t('details') || 'Details'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Crop Detail Modal */}
      {selectedCrop && (
        <div style={modalOverlay} onClick={() => setSelectedCrop(null)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2>{selectedCrop.name}</h2>
              <button onClick={() => setSelectedCrop(null)} style={closeModalButton}>×</button>
            </div>
            <div style={modalBody}>
              <div style={modalSection}>
                <h3>Basic Information</h3>
                <p><strong>Scientific Name:</strong> {selectedCrop.scientificName}</p>
                <p><strong>Suitability Score:</strong> {selectedCrop.score}/100</p>
                <p><strong>Match Percentage:</strong> {selectedCrop.matchPercentage}%</p>
              </div>
              
              <div style={modalSection}>
                <h3>Economic Details</h3>
                <p><strong>Profit Potential:</strong> {selectedCrop.profit}</p>
                <p><strong>Risk Level:</strong> {selectedCrop.risk}</p>
                <p><strong>Investment:</strong> {selectedCrop.investment}</p>
                <p><strong>Expected Yield:</strong> {selectedCrop.yield}</p>
                <p><strong>Duration:</strong> {selectedCrop.duration}</p>
              </div>
              
              <div style={modalSection}>
                <h3>Best Practices</h3>
                <ul>
                  {selectedCrop.bestPractices.map((practice, index) => (
                    <li key={index}>{practice}</li>
                  ))}
                </ul>
              </div>
              
              <div style={modalSection}>
                <h3>Challenges</h3>
                <ul>
                  {selectedCrop.challenges.map((challenge, index) => (
                    <li key={index}>{challenge}</li>
                  ))}
                </ul>
              </div>
              
              <div style={modalSection}>
                <h3>Market & Sustainability</h3>
                <p><strong>Market Trends:</strong> {selectedCrop.marketTrends}</p>
                <p><strong>Sustainability:</strong> {selectedCrop.sustainability}</p>
              </div>
            </div>
            <div style={modalFooter}>
              <button onClick={() => saveRecommendation(selectedCrop)} style={saveButton}>
                <FaBookmark style={{ marginRight: '4px' }} />
                Save Recommendation
              </button>
              <button onClick={() => downloadReport(selectedCrop)} style={downloadButton}>
                <FaDownload style={{ marginRight: '4px' }} />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// Enhanced Styles
const container = {
  width: '100%',
  minHeight: '100vh',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  backgroundImage: 'url(https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  position: 'relative'
};

const navHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  padding: '10px 0'
};

const navButton = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.3s'
};

const header = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  flex: 1
};

const title = {
  fontSize: '2.5em',
  color: '#fff',
  margin: 0,
  textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
};

const description = {
  textAlign: 'center',
  fontSize: '16px',
  color: '#fff',
  marginBottom: '30px',
  lineHeight: '1.6',
  textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
  maxWidth: '1200px',
  margin: '0 auto 30px'
};

const tabContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  marginBottom: '30px'
};

const tabStyle = {
  padding: '12px 24px',
  border: '2px solid #28a745',
  backgroundColor: 'transparent',
  color: '#28a745',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'all 0.3s'
};

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: '#28a745',
  color: '#fff'
};

const formStyle = {
  background: 'transparent',
  padding: '30px',
  borderRadius: '12px',
  marginBottom: '30px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const inputGroup = {
  display: 'flex',
  flexDirection: 'column'
};

const label = {
  fontWeight: '600',
  marginBottom: '8px',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
  fontSize: '14px'
};

const input = {
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '16px'
};

const select = {
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '16px',
  backgroundColor: '#fff'
};

const characteristicsBox = {
  marginTop: '10px',
  padding: '10px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  fontSize: '14px'
};

const submitButton = {
  background: '#28a745',
  color: '#fff',
  padding: '15px 30px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '18px',
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%',
  transition: 'background 0.3s'
};

const resultsContainer = {
  background: '#fff',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '60px 20px'
};

const spinner = {
  width: '50px',
  height: '50px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #28a745',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 20px'
};

const resultsHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px'
};

const headerActions = {
  display: 'flex',
  gap: '10px'
};

const resetButton = {
  background: '#6c757d',
  color: '#fff',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const recommendationsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const cropCard = {
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  padding: '20px',
  background: '#fff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s',
  cursor: 'pointer'
};

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const cropName = {
  margin: 0,
  fontSize: '1.5em',
  color: '#22543d'
};

const scoreBadge = (suitability) => ({
  background: suitability === 'Excellent' ? '#28a745' : suitability === 'Good' ? '#ffc107' : '#dc3545',
  color: '#fff',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: '600'
});

const suitabilityBadge = (suitability) => ({
  background: suitability === 'Excellent' ? '#d4edda' : suitability === 'Good' ? '#fff3cd' : '#f8d7da',
  color: suitability === 'Excellent' ? '#155724' : suitability === 'Good' ? '#856404' : '#721c24',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '15px',
  display: 'inline-block'
});

const cropDetails = {
  marginBottom: '20px'
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
  padding: '4px 0'
};

const detailLabel = {
  fontWeight: '600',
  color: '#666'
};

const profitBadge = (profit) => ({
  background: profit === 'Very High' ? '#28a745' : profit === 'High' ? '#20c997' : '#ffc107',
  color: '#fff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600'
});

const riskBadge = (risk) => ({
  background: risk === 'Low' ? '#28a745' : risk === 'Medium' ? '#ffc107' : '#dc3545',
  color: '#fff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600'
});

const cardActions = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap'
};

const primaryButton = {
  background: '#007bff',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px'
};

const secondaryButton = {
  background: '#6c757d',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px'
};

const downloadButton = {
  background: '#28a745',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px'
};

const insightsSection = {
  marginTop: '40px',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '8px'
};

const insightsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginTop: '20px'
};

const insightCard = {
  background: '#fff',
  padding: '15px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0'
};

const savedContainer = {
  background: '#fff',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
};

const sectionTitle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '30px',
  color: '#333'
};

const emptyMessage = {
  textAlign: 'center',
  color: '#666',
  fontSize: '16px'
};

const savedGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const savedCard = {
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '15px',
  background: '#f8f9fa'
};

const viewButton = {
  background: '#007bff',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  marginTop: '10px'
};

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContent = {
  background: '#fff',
  borderRadius: '12px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto'
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid #eee'
};

const closeModalButton = {
  background: 'transparent',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666'
};

const modalBody = {
  padding: '20px'
};

const modalSection = {
  marginBottom: '20px'
};

const modalFooter = {
  padding: '20px',
  borderTop: '1px solid #eee',
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end'
};

const saveButton = {
  background: '#28a745',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center'
};

export default CropRecommendation; 