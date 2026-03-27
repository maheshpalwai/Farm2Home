// cropData.js
// Comprehensive crop dictionary for South Indian edible crops
// Includes multilingual keywords and common misspellings for fuzzy matching
// Categories: grains-pulses, vegetables, fruits, spices, leafy-greens, dry-fruits
// All image paths verified against public/images/* folder contents

export const CROP_DICTIONARY = [

  // ─── GRAINS & PULSES ────────────────────────────────────────────────────────
  {
    id: 'rice',
    name: 'Rice',
    category: 'grains-pulses',
    image: '/images/crops/rice.jpg',
    keywords: ['rice', 'paddy', 'vari', 'vadlu', 'biyyam', 'dhan', 'chawal', 'arisi', 'nellu', 'soru', 'akki', 'tandul', 'bhat']
  },
  {
    id: 'wheat',
    name: 'Wheat',
    category: 'grains-pulses',
    image: '/images/crops/wheat.jpg',
    keywords: ['wheat', 'godhumalu', 'godhuma', 'gehun', 'godhumai', 'gehu']
  },
  {
    id: 'maize',
    name: 'Maize',
    category: 'grains-pulses',
    image: '/images/crops/maize.jpg',
    keywords: ['maize', 'corn', 'mokka jonna', 'mokkajonna', 'makka', 'cholam', 'makai', 'makkajonna']
  },
  {
    id: 'jowar',
    name: 'Jowar',
    category: 'grains-pulses',
    image: '/images/crops/jowar.jpg',
    keywords: ['jowar', 'jonna', 'sorghum', 'jola', 'cholam', 'jonnalu', 'jwari']
  },
  {
    id: 'redgram',
    name: 'Red Gram',
    category: 'grains-pulses',
    image: '/images/crops/red gram.jpg',
    keywords: ['redgram', 'red gram', 'pigeon pea', 'kandi', 'kandulu', 'tur', 'arhar', 'thuvarai', 'toor', 'kandi pappu', 'kandipappu', 'togari bele', 'tur dal']
  },
  {
    id: 'greengram',
    name: 'Green Gram',
    category: 'grains-pulses',
    image: '/images/crops/Green Gram.jpg',
    keywords: ['greengram', 'green gram', 'moong', 'pesalu', 'pesara', 'mung', 'payaru', 'pesarapappu', 'paasi payaru']
  },
  {
    id: 'blackgram',
    name: 'Black Gram',
    category: 'grains-pulses',
    image: '/images/crops/Black Gram.jpg',
    keywords: ['blackgram', 'black gram', 'urad', 'minapa', 'minumulu', 'ulundu', 'minapappu', 'ulundhu']
  },
  {
    id: 'bengalgram',
    name: 'Bengal Gram',
    category: 'grains-pulses',
    image: '/images/crops/chana.jpg',
    keywords: ['bengalgram', 'bengal gram', 'chana', 'chickpea', 'senaga', 'sanagalu', 'kadalai', 'channa', 'senagapappu', 'konda kadalai']
  },
  {
    id: 'ragi',
    name: 'Ragi',
    category: 'grains-pulses',
    image: '/images/crops/ragi.jpg',
    keywords: ['ragi', 'finger millet', 'ragulu', 'nachni', 'kelvaragu', 'keppai', 'raagi']
  },
  {
    id: 'lotuseeds',
    name: 'Lotus Seeds',
    category: 'grains-pulses',
    image: '/images/crops/lotus seed.jpg',
    keywords: ['lotus seeds', 'lotus seed', 'makhana', 'phool makhana', 'fox nut', 'gorgon nut']
  },
  {
    id: 'mungdal',
    name: 'Mung Dal',
    category: 'grains-pulses',
    image: '/images/crops/mung dal.jpg',
    keywords: ['mung dal', 'moong dal', 'pesara pappu', 'paasi paruppu', 'yellow moong']
  },
  {
    id: 'pumpkinseeds',
    name: 'Pumpkin Seeds',
    category: 'grains-pulses',
    image: '/images/crops/pumpkin seeds.jpg',
    keywords: ['pumpkin seeds', 'pumpkin seed', 'gummadi ginja', 'kadu beeja']
  },
  {
    id: 'flaxseeds',
    name: 'Flax Seeds',
    category: 'grains-pulses',
    image: '/images/crops/flax seeds.jpg',
    keywords: ['flax seeds', 'flaxseed', 'linseed', 'alasi', 'aviselu', 'ali vidai', 'jawas']
  },
  {
    id: 'sunflowerseeds',
    name: 'Sunflower Seeds',
    category: 'grains-pulses',
    image: '/images/crops/sunflower seeds.jpg',
    keywords: ['sunflower seeds', 'surajmukhi', 'puvvu ginja', 'suryakanthi beeja']
  },

  // ─── VEGETABLES ─────────────────────────────────────────────────────────────
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetables',
    image: '/images/vegetables/tomato.jpg',
    keywords: ['tomato', 'tamata', 'tamatar', 'thakkali', 'tamato']
  },
  {
    id: 'onion',
    name: 'Onion',
    category: 'vegetables',
    image: '/images/vegetables/onion.jpg',
    keywords: ['onion', 'nirulli', 'ulli', 'ullipaya', 'pyaz', 'vengayam', 'ullipayalu', 'pyaaz', 'erulli', 'kanda']
  },
  {
    id: 'potato',
    name: 'Potato',
    category: 'vegetables',
    image: '/images/vegetables/potato.jpg',
    keywords: ['potato', 'bangaladumpa', 'aloo', 'urulaikizhangu', 'alu', 'batata', 'bangala dumpa', 'urulai']
  },
  {
    id: 'brinjal',
    name: 'Brinjal',
    category: 'vegetables',
    image: '/images/vegetables/brinjal.jpg',
    keywords: ['brinjal', 'eggplant', 'vankaya', 'vankayalu', 'baingan', 'kathirikai', 'begun', 'badanekayi', 'vangi']
  },
  {
    id: 'okra',
    name: 'Okra',
    category: 'vegetables',
    image: '/images/vegetables/okra.jpg',
    keywords: ['okra', 'ladyfinger', 'benda', 'bendakaya', 'bhindi', 'vendakkai', 'bendakayalu', 'vendai']
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    category: 'vegetables',
    image: '/images/vegetables/capsicum.jpg',
    keywords: ['capsicum', 'shimla mirch', 'donna menasinakayi', 'bell pepper', 'shimla mirchi']
  },
  {
    id: 'bottlegourd',
    name: 'Bottle Gourd',
    category: 'vegetables',
    image: '/images/vegetables/bottle gaurd.jpg',
    keywords: ['bottle gourd', 'bottlegourd', 'lauki', 'sorakaya', 'sorakayalu', 'suraikai', 'ghiya', 'doodhi']
  },
  {
    id: 'snakegourd',
    name: 'Snake Gourd',
    category: 'vegetables',
    image: '/images/vegetables/snake gaurd.jpg',
    keywords: ['snake gourd', 'snakegourd', 'potlakaya', 'chichinda', 'pudalangai', 'pudal']
  },
  {
    id: 'ridgegourd',
    name: 'Ridge Gourd',
    category: 'vegetables',
    image: '/images/vegetables/ridge gaurd.jpg',
    keywords: ['ridge gourd', 'ridgegourd', 'beerakaya', 'turai', 'peerkangai', 'heerekai', 'dodka']
  },
  {
    id: 'bittergourd',
    name: 'Bitter Gourd',
    category: 'vegetables',
    image: '/images/vegetables/Bitter gaurd.jpg',
    keywords: ['bitter gourd', 'bittergourd', 'karela', 'kakarakaya', 'pavakkai', 'hagalakayi', 'karle']
  },
  {
    id: 'drumstick',
    name: 'Drumstick',
    category: 'vegetables',
    image: '/images/vegetables/drumstick.jpg',
    keywords: ['drumstick', 'moringa', 'munaga', 'munagakaya', 'sahjan', 'murungakkai', 'saijan']
  },
  {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetables',
    image: '/images/vegetables/carrot.jpg',
    keywords: ['carrot', 'gajar', 'gajjara', 'carrot', 'carota', 'gajjar', 'carotte']
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'vegetables',
    image: '/images/vegetables/cabbage.jpg',
    keywords: ['cabbage', 'band gobi', 'muttaikose', 'cabij', 'gobi', 'kosu']
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    category: 'vegetables',
    image: '/images/vegetables/cauli flower.jpg',
    keywords: ['cauliflower', 'phool gobi', 'phoolkobi', 'cauliflour', 'gobi', 'huvikosu']
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: 'vegetables',
    image: '/images/vegetables/broccoli.jpg',
    keywords: ['broccoli', 'hari gobi', 'brokoli', 'brocoli']
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'vegetables',
    image: '/images/vegetables/keera cucumber.jpg',
    keywords: ['cucumber', 'keera', 'kakri', 'dosakaya', 'vellai poosanikai', 'soutekayi', 'kheera']
  },
  {
    id: 'radish',
    name: 'Radish',
    category: 'vegetables',
    image: '/images/vegetables/radish.jpg',
    keywords: ['radish', 'mullangi', 'mooli', 'mullangi', 'mullangi', 'daikon']
  },
  {
    id: 'beetroot',
    name: 'Beetroot',
    category: 'vegetables',
    image: '/images/vegetables/Beet Root.jpg',
    keywords: ['beetroot', 'beet', 'beet root', 'beetru', 'chukandar', 'remolatsiya']
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    category: 'vegetables',
    image: '/images/vegetables/Mushroom.jpg',
    keywords: ['mushroom', 'kumbi', 'kalan', 'champignon', 'dhingri', 'button mushroom']
  },
  {
    id: 'whiteonion',
    name: 'White Onion',
    category: 'vegetables',
    image: '/images/vegetables/white onion.jpg',
    keywords: ['white onion', 'safed pyaz', 'tella ulli', 'vellai vengayam']
  },

  // ─── FRUITS ─────────────────────────────────────────────────────────────────
  {
    id: 'mango',
    name: 'Mango',
    category: 'fruits',
    image: '/images/fruits/Mango.jpg',
    keywords: ['mango', 'mamidi', 'mamidikaya', 'aam', 'mangai', 'manga', 'mavina hannu', 'amba', 'hapus']
  },
  {
    id: 'banana',
    name: 'Banana',
    category: 'fruits',
    image: '/images/fruits/Banana.jpg',
    keywords: ['banana', 'arati', 'aratipandu', 'kela', 'vazhai', 'banan', 'arati pandu', 'vazhai pazham']
  },
  {
    id: 'coconut',
    name: 'Coconut',
    category: 'fruits',
    image: '/images/fruits/coconuts.jpg',
    keywords: ['coconut', 'kobbari', 'kobbarikaya', 'nariyal', 'thengai', 'thenginakayi', 'naral']
  },
  {
    id: 'lemon',
    name: 'Lemon',
    category: 'fruits',
    image: '/images/fruits/Lemon.jpg',
    keywords: ['lemon', 'nimma', 'nimmakaya', 'nimbu', 'elumichai', 'lembu']
  },
  {
    id: 'orange',
    name: 'Orange',
    category: 'fruits',
    image: '/images/fruits/orange.jpg',
    keywords: ['orange', 'santra', 'nagpur orange', 'kithale', 'narangi', 'santhra']
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'fruits',
    image: '/images/fruits/Apple.jpg',
    keywords: ['apple', 'seb', 'sebu', 'sev', 'apple fruit', 'himachal apple']
  },
  {
    id: 'greenapple',
    name: 'Green Apple',
    category: 'fruits',
    image: '/images/fruits/green apple.jpg',
    keywords: ['green apple', 'granny smith', 'hari seb', 'pachcha apple']
  },
  {
    id: 'waterapple',
    name: 'Water Apple',
    category: 'fruits',
    image: '/images/fruits/water apple.jpg',
    keywords: ['water apple', 'java apple', 'rose apple', 'jambu', 'naval pazham']
  },
  {
    id: 'papaya',
    name: 'Papaya',
    category: 'fruits',
    image: '/images/fruits/papaya.jpg',
    keywords: ['papaya', 'boppai', 'papai', 'pappali', 'papaya pandu', 'papita']
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    category: 'fruits',
    image: '/images/fruits/water melon.jpg',
    keywords: ['watermelon', 'water melon', 'puchakaya', 'tarbuj', 'darbuzam', 'kallangadi']
  },
  {
    id: 'muskmelon',
    name: 'Musk Melon',
    category: 'fruits',
    image: '/images/fruits/musk melon.jpg',
    keywords: ['musk melon', 'muskmelon', 'kharbuja', 'karbhuja', 'vellari', 'kharbooja']
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    category: 'fruits',
    image: '/images/fruits/Pineapple.jpg',
    keywords: ['pineapple', 'anasa', 'kaitha chakka', 'ananas', 'annachi pazham', 'ananas']
  },
  {
    id: 'jackfruit',
    name: 'Jackfruit',
    category: 'fruits',
    image: '/images/fruits/jack fruit.jpg',
    keywords: ['jackfruit', 'panasa', 'chakka', 'kathal', 'panasa pandu', 'palaa', 'phanas']
  },
  {
    id: 'grapes',
    name: 'Grapes',
    category: 'fruits',
    image: '/images/fruits/green grape.jpg',
    keywords: ['grapes', 'draksha', 'drakshi', 'angoor', 'grape', 'drakshe']
  },
  {
    id: 'blackgrapes',
    name: 'Black Grapes',
    category: 'fruits',
    image: '/images/fruits/black grapes.jpg',
    keywords: ['black grapes', 'kaala angoor', 'black draksha', 'nalla drakshi']
  },
  {
    id: 'pomegranate',
    name: 'Pomegranate',
    category: 'fruits',
    image: '/images/fruits/Promoganates.jpg',
    keywords: ['pomegranate', 'danimma', 'dalimb', 'anar', 'daalimb', 'anaar']
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    category: 'fruits',
    image: '/images/fruits/strawberries.jpg',
    keywords: ['strawberry', 'mahabaleshwar strawberry', 'strawbery']
  },
  {
    id: 'guava',
    name: 'Guava',
    category: 'fruits',
    image: '/images/fruits/guva.jpg',
    keywords: ['guava', 'jama', 'jamakaya', 'koyya', 'peru', 'amrud', 'perakkai']
  },
  {
    id: 'sapota',
    name: 'Sapota',
    category: 'fruits',
    image: '/images/fruits/sapota.jpg',
    keywords: ['sapota', 'chiku', 'sapodilla', 'ciplakaya', 'sabota', 'chikku', 'sapota pandu']
  },
  {
    id: 'custardapple',
    name: 'Custard Apple',
    category: 'fruits',
    image: '/images/fruits/Custard apple.jpg',
    keywords: ['custard apple', 'sitaphal', 'seetha phal', 'srikaya', 'ata', 'ramphal', 'annona']
  },
  {
    id: 'amla',
    name: 'Amla',
    category: 'fruits',
    image: '/images/fruits/Amla.jpg',
    keywords: ['amla', 'gooseberry', 'usirikaya', 'nellikkai', 'avalo', 'amalaki', 'nellika']
  },
  {
    id: 'sweetlime',
    name: 'Sweet Lime',
    category: 'fruits',
    image: '/images/fruits/Sweet Lime.jpg',
    keywords: ['sweet lime', 'mosambi', 'musambi', 'sathukudi', 'mosumbu']
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    category: 'fruits',
    image: '/images/fruits/kiwi.jpg',
    keywords: ['kiwi', 'kiwifruit', 'kivi', 'chinese gooseberry']
  },
  {
    id: 'avocado',
    name: 'Avocado',
    category: 'fruits',
    image: '/images/fruits/avacado.jpg',
    keywords: ['avocado', 'avacado', 'butter fruit', 'makhanphal', 'venna pandu']
  },
  {
    id: 'lychee',
    name: 'Lychee',
    category: 'fruits',
    image: '/images/fruits/Lychee.jpg',
    keywords: ['lychee', 'litchi', 'lichi', 'lichu', 'leeche']
  },
  {
    id: 'dragonfruit',
    name: 'Dragon Fruit',
    category: 'fruits',
    image: '/images/fruits/dragonfruit.jpg',
    keywords: ['dragon fruit', 'dragonfruit', 'pitaya', 'pitahaya', 'kamalam']
  },
  {
    id: 'peach',
    name: 'Peach',
    category: 'fruits',
    image: '/images/fruits/Peach.jpg',
    keywords: ['peach', 'arddha palam', 'aadu palam', 'adu', 'shaftalu']
  },
  {
    id: 'pear',
    name: 'Pear',
    category: 'fruits',
    image: '/images/fruits/pear.jpg',
    keywords: ['pear', 'nashpati', 'babugosha', 'perashimla', 'piru']
  },
  {
    id: 'cherry',
    name: 'Cherry',
    category: 'fruits',
    image: '/images/fruits/cherry.jpg',
    keywords: ['cherry', 'gilas', 'cherri', 'cheeri']
  },
  {
    id: 'figs',
    name: 'Figs',
    category: 'fruits',
    image: '/images/fruits/figs.jpg',
    keywords: ['figs', 'anjeer', 'athi pazham', 'anjir', 'athi']
  },
  {
    id: 'starfruit',
    name: 'Star Fruit',
    category: 'fruits',
    image: '/images/fruits/star fruits.jpg',
    keywords: ['star fruit', 'starfruit', 'carambola', 'kamrakh', 'tamarillo', 'star apple']
  },
  {
    id: 'raspberries',
    name: 'Raspberries',
    category: 'fruits',
    image: '/images/fruits/Raspberries.jpg',
    keywords: ['raspberries', 'raspberry', 'rasbhari', 'rasberry']
  },
  {
    id: 'blueberry',
    name: 'Blueberry',
    category: 'fruits',
    image: '/images/fruits/blueberry.jpg',
    keywords: ['blueberry', 'blue berry', 'nilam pazham', 'neela berry']
  },
  {
    id: 'blackberries',
    name: 'Blackberries',
    category: 'fruits',
    image: '/images/fruits/blackberries.jpg',
    keywords: ['blackberries', 'blackberry', 'jamun berry', 'black berry']
  },

  // ─── SPICES ─────────────────────────────────────────────────────────────────
  {
    id: 'chilli',
    name: 'Chilli',
    category: 'spices',
    image: '/images/vegetables/Green Chillies.jpg',
    keywords: ['chilli', 'chili', 'mirchi', 'mirapakaya', 'mirapakayalu', 'milagai', 'mirch', 'chilly', 'green chilli']
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    category: 'spices',
    image: '/images/vegetables/turmeric.jpg',
    keywords: ['turmeric', 'pasupu', 'haldi', 'manjal', 'termeric', 'tumeric', 'haldhi']
  },
  {
    id: 'garlic',
    name: 'Garlic',
    category: 'spices',
    image: '/images/vegetables/Garlic.jpg',
    keywords: ['garlic', 'vellulli', 'vellulipaya', 'lahsun', 'poondu', 'lasun']
  },
  {
    id: 'ginger',
    name: 'Ginger',
    category: 'spices',
    image: '/images/vegetables/ginger.jpg',
    keywords: ['ginger', 'allam', 'adrak', 'inji', 'ginjer', 'adarak']
  },
  {
    id: 'tamarind',
    name: 'Tamarind',
    category: 'spices',
    image: '/images/vegetables/Tamarind.jpg',
    keywords: ['tamarind', 'chintapandu', 'imli', 'puli', 'chintha', 'tamrind']
  },
  {
    id: 'cardamom',
    name: 'Cardamom',
    category: 'spices',
    image: '/images/spices/ilachi.jpg',
    keywords: ['cardamom', 'elakkai', 'yelakulu', 'elakka', 'ilaichi', 'elachi', 'elaichi', 'yelakki']
  },
  {
    id: 'clove',
    name: 'Clove',
    category: 'spices',
    image: '/images/spices/cloves.jpg',
    keywords: ['clove', 'lavangam', 'grambu', 'laung', 'lavang', 'grampu']
  },
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    category: 'spices',
    image: '/images/spices/cinnamon.jpg',
    keywords: ['cinnamon', 'dalchina chekka', 'karuvapatta', 'dalchini', 'karuvappatta']
  },
  {
    id: 'saffron',
    name: 'Saffron',
    category: 'spices',
    image: '/images/crops/saffron.jpg',
    keywords: ['saffron', 'kesar', 'zafran', 'kumkuma puvvu', 'kungumam', 'zaafran']
  },
  {
    id: 'reddryChilli',
    name: 'Red Chilli',
    category: 'spices',
    image: '/images/vegetables/Mirchi.jpg',
    keywords: ['red chilli', 'dry chilli', 'karam', 'lal mirch', 'endu mirchi', 'varamilagai']
  },

  // ─── LEAFY GREENS ────────────────────────────────────────────────────────────
  {
    id: 'methi',
    name: 'Methi',
    category: 'leafy-greens',
    image: '/images/vegetables/fenugreek leaves.jpg',
    keywords: ['methi', 'menthya', 'fenugreek', 'menthe soppu', 'venthayam', 'methi leaves']
  },
  {
    id: 'spinach',
    name: 'Spinach',
    category: 'leafy-greens',
    image: '/images/vegetables/spinach.jpg',
    keywords: ['spinach', 'palak', 'palakura', 'keerai', 'paalakoora', 'spinich']
  },
  {
    id: 'gongura',
    name: 'Gongura',
    category: 'leafy-greens',
    image: '/images/vegetables/gongura.jpg',
    keywords: ['gongura', 'sorrel', 'pulichakeerai', 'ambadi', 'red sorrel', 'pitwaa']
  },
  {
    id: 'amaranthus',
    name: 'Amaranthus',
    category: 'leafy-greens',
    image: '/images/vegetables/amaranthus.jpg',
    keywords: ['amaranthus', 'thotakura', 'mulai keerai', 'rajgira', 'chauli', 'harive soppu']
  },
  {
    id: 'springonion',
    name: 'Spring Onion',
    category: 'leafy-greens',
    image: '/images/vegetables/spring onion.jpg',
    keywords: ['spring onion', 'green onion', 'ullipaya chedu', 'hara pyaz', 'vengaya thaal']
  },

  // ─── DRY FRUITS ─────────────────────────────────────────────────────────────
  {
    id: 'almonds',
    name: 'Almonds',
    category: 'dry-fruits',
    image: '/images/dryfruits/badam.jpg',
    keywords: ['almonds', 'badam', 'badamu', 'vatana', 'baadaam', 'vadam']
  },
  {
    id: 'cashews',
    name: 'Cashews',
    category: 'dry-fruits',
    image: '/images/dryfruits/cashews.jpg',
    keywords: ['cashews', 'cashew', 'jeedipappu', 'kaju', 'mundhiri', 'geru']
  },
  {
    id: 'dates',
    name: 'Dates',
    category: 'dry-fruits',
    image: '/images/dryfruits/dates.jpg',
    keywords: ['dates', 'kharjur', 'khajoor', 'kharjoora', 'eenthu pazham', 'kharjura']
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    category: 'dry-fruits',
    image: '/images/dryfruits/Peanut.jpg',
    keywords: ['peanuts', 'groundnut', 'pallilu', 'pallelu', 'verkadalai', 'moongphali', 'shenga']
  },
  {
    id: 'pistachios',
    name: 'Pistachios',
    category: 'dry-fruits',
    image: '/images/dryfruits/Pista.jpg',
    keywords: ['pistachios', 'pista', 'piste', 'pistachio', 'piste dani']
  },
  {
    id: 'raisins',
    name: 'Raisins',
    category: 'dry-fruits',
    image: '/images/dryfruits/raisins.jpg',
    keywords: ['raisins', 'kishmish', 'draksha', 'ular drakshi', 'mundhiri', 'dry grapes']
  },
  {
    id: 'walnuts',
    name: 'Walnuts',
    category: 'dry-fruits',
    image: '/images/dryfruits/waltnuts.jpg',
    keywords: ['walnuts', 'walnut', 'akhrot', 'akhrod', 'akhrota', 'akrot']
  },
];

// Helper function to find crop by keyword (case-insensitive)
export const findCropByKeyword = (keyword) => {
  const lowerKeyword = keyword.toLowerCase().trim();
  return CROP_DICTIONARY.find(crop => 
    crop.keywords.some(kw => kw.toLowerCase() === lowerKeyword)
  );
};

// Get crop category by crop name
export const getCropCategory = (cropName) => {
  if (!cropName) return null;
  const lower = cropName.toLowerCase().trim();
  const match = CROP_DICTIONARY.find(c =>
    c.name.toLowerCase() === lower ||
    c.keywords.some(k => k.toLowerCase() === lower)
  );
  return match ? match.category : null;
};

// Get all crop names for autocomplete
export const getAllCropNames = () => {
  return CROP_DICTIONARY.map(crop => crop.name);
};

// Get all keywords for search
export const getAllKeywords = () => {
  return CROP_DICTIONARY.flatMap(crop => crop.keywords);
};