import React, { useState, useRef, useEffect } from 'react';
import {
  FaTools, FaPlus, FaSearch, FaMapMarkerAlt, FaRupeeSign, FaUser, FaPhone,
  FaTractor, FaStar, FaCalendarAlt, FaClock, FaFilter, FaImage, FaCheckCircle,
  FaTimesCircle, FaHandshake, FaBell, FaUpload, FaRegImage, FaBoxOpen,
  FaBars, FaTimes, FaPhoneAlt, FaUserTie, FaRegClock, FaAlignLeft,
  FaThumbsUp, FaThumbsDown, FaBan, FaSpinner, FaExclamationTriangle,
  FaMapPin, FaSlidersH, FaEye, FaEyeSlash, FaTachometerAlt, FaTruck,
  FaShieldAlt, FaSortAmountDown, FaStickyNote
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResourceSharePage.css';
import { db, storage } from '../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── category meta ── */
const CATEGORY_META = {
  'Heavy Machinery':    { emoji: '🚜', color: '#7c3aed', fallback: '/Farming Tools Images/Tractor.jpg' },
  'Tillage Equipment':  { emoji: '⚙️', color: '#16a34a', fallback: '/Farming Tools Images/Cultivator.jpg' },
  'Irrigation':         { emoji: '💧', color: '#0284c7', fallback: '/Farming Tools Images/Sprayer.jpg' },
  'Planting Equipment': { emoji: '🌱', color: '#15803d', fallback: '/Farming Tools Images/Super Seeder.jpg' },
  'Harvesting':         { emoji: '🌾', color: '#d97706', fallback: '/Farming Tools Images/Harvester.jpg' },
  'Hand Tools':         { emoji: '🔧', color: '#b45309', fallback: '/Farming Tools Images/hand Cultivators.jpg' },
  'Post-Harvest':       { emoji: '📦', color: '#dc2626', fallback: '/Farming Tools Images/Ground Thresher.jpg' },
  'Transport':          { emoji: '🚛', color: '#9333ea', fallback: '/Farming Tools Images/Tractor.jpg' },
  'Modern Technology':  { emoji: '🚁', color: '#0891b2', fallback: '/Farming Tools Images/Drone Sprayer.jpg' },
};

const CATEGORY_ORDER = [
  'Heavy Machinery', 'Tillage Equipment', 'Irrigation', 'Planting Equipment',
  'Harvesting', 'Hand Tools', 'Post-Harvest', 'Transport', 'Modern Technology',
];

/* fallback app images shown in the image-picker per category */
const FALLBACK_OPTIONS = {
  'Heavy Machinery':    ['/Farming Tools Images/Tractor.jpg', '/Farming Tools Images/Harvester.jpg', '/Farming Tools Images/JCB.jpg'],
  'Tillage Equipment':  ['/Farming Tools Images/Disc Harrow.jpg', '/Farming Tools Images/Rotavator.jpg', '/Farming Tools Images/Cultivator.jpg', '/Farming Tools Images/Chisel Plough.jpg', '/Farming Tools Images/Disc Plough.jpg'],
  'Irrigation':         ['/Farming Tools Images/7.5hp water pump.jpg', '/Farming Tools Images/Sprayer.jpg', '/Farming Tools Images/2hp Borewell Pump.jpg', '/Farming Tools Images/5Pcs Sprinklers.jpg', '/Farming Tools Images/Drip Irrigation.jpg'],
  'Planting Equipment': ['/Farming Tools Images/Super Seeder.jpg', '/Farming Tools Images/Rice Transplanter.jpg'],
  'Harvesting':         ['/Farming Tools Images/Harvester.jpg', '/Farming Tools Images/Corn Thresher.jpg', '/Farming Tools Images/Ground Thresher.jpg', '/Farming Tools Images/Round Baler.jpg', '/Farming Tools Images/Reaper.jpg'],
  'Hand Tools':         ['/Farming Tools Images/hand Cultivators.jpg', '/Farming Tools Images/Sickle.jpg', '/Farming Tools Images/Power Duster.jpg', '/Farming Tools Images/Dibbler.jpg', '/Farming Tools Images/Spade.jpg', '/Farming Tools Images/Trowel.jpg', '/Farming Tools Images/Rake.jpg', '/Farming Tools Images/Khurpi.jpg'],
  'Post-Harvest':       ['/Farming Tools Images/Winnower.jpg', '/Farming Tools Images/Grain Grader.jpg', '/Farming Tools Images/Storage Silo.jpg'],
  'Transport':          ['/Farming Tools Images/Tractor Trailer.jpg', '/Farming Tools Images/Bullock Cart.jpg'],
  'Modern Technology':  ['/Farming Tools Images/Drone Sprayer.jpg'],
};

const INITIAL_TOOLS = [
  { id:1,  name:'5Pcs Sprinklers',          category:'Irrigation',        costPerHour:80,  state:'Rajasthan',     district:'Jaipur',      village:'Chomu',        owner:'Mohan Lal',        phone:'+91 9876543227', description:'Complete 5-piece sprinkler irrigation set for efficient water distribution. Covers large area uniformly.',           availability:'Available', image:'/Farming Tools Images/5Pcs Sprinklers.jpg',          rating:4.5, totalBookings:62, yearMade:2021, featured:false, tags:['Water Efficient','Wide Coverage','Easy Install'] },
  { id:2,  name:'7.5HP Water Pump',         category:'Irrigation',        costPerHour:150, state:'Tamil Nadu',    district:'Chennai',     village:'Tambaram',     owner:'Murugan Raj',      phone:'+91 9876543213', description:'High-capacity water pump for field irrigation. Energy efficient with low maintenance.',                          availability:'Available', image:'/Farming Tools Images/7.5hp water pump.jpg',         rating:4.7, totalBookings:56, yearMade:2020, featured:false, tags:['Energy Efficient','Low Noise','Portable'] },
  { id:3,  name:'Chisel Plough',            category:'Tillage Equipment', costPerHour:220, state:'Punjab',        district:'Amritsar',    village:'Tarn Taran',   owner:'Amarjeet Singh',   phone:'+91 9876543222', description:'Deep tillage chisel plough for breaking hardpan and improving soil aeration.',                                   availability:'Available', image:'/Farming Tools Images/Chisel Plough.jpg',             rating:4.6, totalBookings:34, yearMade:2021, featured:true,  tags:['Deep Tillage','Heavy Duty','Adjustable Depth'] },
  { id:4,  name:'Corn Thresher',            category:'Harvesting',        costPerHour:280, state:'Karnataka',     district:'Mysuru (Mysore)', village:'Nanjangud',    owner:'Mahesh Gowda',     phone:'+91 9876543223', description:'Efficient corn thresher for quick processing. High capacity with minimal grain damage.',                          availability:'Available', image:'/Farming Tools Images/Corn Thresher.jpg',             rating:4.7, totalBookings:28, yearMade:2020, featured:true,  tags:['High Capacity','Low Damage','Quick Processing'] },
  { id:5,  name:'Crop Reaper',              category:'Harvesting',        costPerHour:250, state:'Rajasthan',     district:'Hanumangarh', village:'Bhadra',       owner:'Hemraj Choudhary', phone:'+91 9876543246', description:'Walk-behind crop reaper for cutting wheat, paddy and soybean. Reduces harvesting time by 80%.',                   availability:'Available', image:'/Farming Tools Images/crop reaper.jpg',              rating:4.5, totalBookings:44, yearMade:2020, featured:true,  tags:['Walk-Behind','Multi-Crop','Time Saving'] },
  { id:6,  name:'Cultivator',               category:'Tillage Equipment', costPerHour:180, state:'Gujarat',       district:'Ahmedabad',   village:'Dholka',       owner:'Kiran Patel',      phone:'+91 9876543218', description:'Multi-purpose cultivator for soil cultivation and weed management. Suitable for various crops.',                  availability:'Available', image:'/Farming Tools Images/Cultivator.jpg',                rating:4.2, totalBookings:19, yearMade:2021, featured:false, tags:['Multi-Purpose','Adjustable','Easy Operation'] },
  { id:7,  name:'Disc Harrow',              category:'Tillage Equipment', costPerHour:200, state:'Karnataka',     district:'Bengaluru Rural', village:'Devanahalli',  owner:'Prakash Singh',    phone:'+91 9876543212', description:'Professional disc harrow for soil preparation and weed control. Heavy-duty construction.',                       availability:'Available', image:'/Farming Tools Images/Disc Harrow.jpg',               rating:4.6, totalBookings:28, yearMade:2021, featured:false, tags:['Heavy Duty','Adjustable','Durable'] },
  { id:8,  name:'Disc Plough',              category:'Tillage Equipment', costPerHour:220, state:'Madhya Pradesh',district:'Indore',      village:'Mhow',         owner:'Akash Verma',      phone:'+91 9876543220', description:'Heavy-duty disc plough for primary tillage operations. Suitable for hard soil conditions.',                       availability:'Available', image:'/Farming Tools Images/Disc Plough.jpg',               rating:4.5, totalBookings:24, yearMade:2021, featured:false, tags:['Heavy Duty','Hard Soil','Durable'] },
  { id:9,  name:'Drip Pipes',               category:'Irrigation',        costPerHour:90,  state:'Maharashtra',   district:'Nashik',      village:'Dindori',      owner:'Santosh Patil',    phone:'+91 9876543243', description:'Complete drip irrigation pipe setup for efficient water usage. Saves up to 60% water vs flood irrigation.',     availability:'Available', image:'/Farming Tools Images/Drip Pipes.jpg',                rating:4.8, totalBookings:53, yearMade:2022, featured:true,  tags:['Water Saving','Fertigation Ready','Easy Install'] },
  { id:10, name:'Drone Sprayer',            category:'Modern Technology', costPerHour:400, state:'Karnataka',     district:'Mysuru (Mysore)', village:'Hunsur',       owner:'Priya Reddy',      phone:'+91 9876543221', description:'Advanced drone sprayer for precision agriculture. GPS-enabled with automated spraying.',                          availability:'Available', image:'/Farming Tools Images/Drone Sprayer.jpg',             rating:4.9, totalBookings:18, yearMade:2023, featured:true,  tags:['GPS Enabled','Precision Agriculture','Automated'] },
  { id:11, name:'Eicher Tractor',           category:'Heavy Machinery',   costPerHour:450, state:'Punjab',        district:'Ludhiana',    village:'Sahnewal',     owner:'Gurpreet Singh',   phone:'+91 9876543260', description:'Reliable Eicher tractor for plowing, cultivation and general farm work. Fuel efficient and easy to maintain.',    availability:'Available', image:'/Farming Tools Images/eicher tractor.jpg',           rating:4.6, totalBookings:22, yearMade:2021, featured:false, tags:['Fuel Efficient','Reliable','Multi-Purpose'] },
  { id:12, name:'Ground Thresher',          category:'Harvesting',        costPerHour:190, state:'Andhra Pradesh',district:'NTR',         village:'Gannavaram',   owner:'Venkatesh Reddy',  phone:'+91 9876543224', description:'Portable ground thresher for wheat, rice, and pulses. Easy to transport and operate.',                            availability:'Available', image:'/Farming Tools Images/Ground Thresher.jpg',           rating:4.4, totalBookings:36, yearMade:2021, featured:false, tags:['Portable','Multi-Crop','Easy Setup'] },
  { id:13, name:'Harvester',                category:'Harvesting',        costPerHour:800, state:'Andhra Pradesh',district:'Guntur',      village:'Tenali',       owner:'Suresh Patel',     phone:'+91 9876543211', description:'Modern combine harvester for efficient crop harvesting. Perfect for wheat, rice, and corn.',                     availability:'Available', image:'/Farming Tools Images/Harvester.jpg',                 rating:4.9, totalBookings:32, yearMade:2019, featured:true,  tags:['High Capacity','GPS Tracking','Auto Steering'] },
  { id:14, name:'JCB',                      category:'Heavy Machinery',   costPerHour:600, state:'Rajasthan',     district:'Jaipur',      village:'Sanganer',     owner:'Ramesh Sharma',    phone:'+91 9876543217', description:'Heavy-duty JCB for land preparation and construction work. Experienced operator included.',                       availability:'Available', image:'/Farming Tools Images/JCB.jpg',                       rating:4.7, totalBookings:41, yearMade:2019, featured:true,  tags:['Operator Included','Heavy Duty','Multi-Purpose'] },
  { id:15, name:'Knapsack Power Sprayer',   category:'Irrigation',        costPerHour:60,  state:'Punjab',        district:'Patiala',     village:'Rajpura',      owner:'Balwinder Singh',  phone:'+91 9876543244', description:'Battery-powered knapsack sprayer for pesticide and fertilizer application. Covers large area quickly.',              availability:'Available', image:'/Farming Tools Images/knapsack power sprayer.jpg',   rating:4.2, totalBookings:30, yearMade:2021, featured:false, tags:['Battery Powered','Wide Coverage','Portable'] },
  { id:16, name:'Kubota Tractor',           category:'Heavy Machinery',   costPerHour:480, state:'Karnataka',     district:'Tumakuru (Tumkur)', village:'Tiptur',       owner:'Naresh Kumar',     phone:'+91 9876543261', description:'High-performance Kubota tractor for precision farming. Excellent for paddy fields and wet soil conditions.',       availability:'Available', image:'/Farming Tools Images/kubota tractor.jpg',           rating:4.7, totalBookings:18, yearMade:2022, featured:false, tags:['Precision Farming','4WD','Paddy Special'] },
  { id:17, name:'Mahindra Rotavator',       category:'Tillage Equipment', costPerHour:200, state:'Haryana',       district:'Karnal',      village:'Nilokheri',    owner:'Vikas Yadav',      phone:'+91 9876543262', description:'Mahindra heavy-duty rotavator for soil preparation and seedbed creation. Wide working width for fast coverage.',   availability:'Available', image:'/Farming Tools Images/Mahindra rotavator.jpg',        rating:4.5, totalBookings:26, yearMade:2021, featured:false, tags:['Heavy Duty','Wide Width','Tractor Mounted'] },
  { id:18, name:'Mahindra Tractor',         category:'Heavy Machinery',   costPerHour:500, state:'Maharashtra',   district:'Pune',        village:'Baramati',     owner:'Sanjay Patil',     phone:'+91 9876543263', description:'Popular Mahindra tractor for all-round farm operations. Powerful engine with excellent fuel efficiency.',           availability:'Available', image:'/Farming Tools Images/Mahindra tractor.jpg',          rating:4.8, totalBookings:35, yearMade:2020, featured:true,  tags:['High Torque','Fuel Efficient','All-Terrain'] },
  { id:19, name:'Massey Tractor',           category:'Heavy Machinery',   costPerHour:520, state:'Punjab',        district:'Amritsar',    village:'Majitha',      owner:'Harjit Singh',     phone:'+91 9876543264', description:'Massey Ferguson tractor well-suited for heavy ploughing and harvesting. GPS-ready and versatile.',                 availability:'Available', image:'/Farming Tools Images/massey tractor.jpg',            rating:4.7, totalBookings:30, yearMade:2019, featured:false, tags:['GPS Ready','Heavy Duty','Versatile'] },
  { id:20, name:'Mini Tiller',              category:'Tillage Equipment', costPerHour:140, state:'Kerala',        district:'Thrissur',    village:'Kodungallur',  owner:'Rajan Nair',       phone:'+91 9876543228', description:'Compact mini tiller perfect for small farms and greenhouses. Easy to maneuver in tight spaces.',                  availability:'Available', image:'/Farming Tools Images/mini tiller.jpg',              rating:4.4, totalBookings:27, yearMade:2022, featured:false, tags:['Compact','Lightweight','Maneuverable'] },
  { id:21, name:'Mulcher Machine',          category:'Tillage Equipment', costPerHour:290, state:'Madhya Pradesh',district:'Indore',      village:'Mhow',         owner:'Pradeep Sharma',   phone:'+91 9876543232', description:'Heavy-duty mulcher for crop residue management. Helps improve soil health and moisture retention.',               availability:'Available', image:'/Farming Tools Images/mulcher machine.jpg',           rating:4.6, totalBookings:22, yearMade:2023, featured:true,  tags:['Soil Health','Residue Management','Heavy Duty'] },
  { id:22, name:'Power Weeder',             category:'Hand Tools',        costPerHour:70,  state:'Odisha',        district:'Cuttack',     village:'Banki',        owner:'Pradyumna Swain',  phone:'+91 9876543233', description:'Motorized power weeder for efficient weed control. Reduces manual labor significantly.',                          availability:'Available', image:'/Farming Tools Images/power weeder.jpg',             rating:4.3, totalBookings:55, yearMade:2021, featured:false, tags:['Motorized','Efficient','Labor Saving'] },
  { id:23, name:'Rice Planter',             category:'Planting Equipment',costPerHour:320, state:'West Bengal',   district:'Bardhaman',   village:'Kalna',        owner:'Tapas Mondal',     phone:'+91 9876543241', description:'Mechanized rice planter for fast and uniform paddy transplanting. Reduces labor cost significantly.',               availability:'Available', image:'/Farming Tools Images/rice planter.jpg',             rating:4.6, totalBookings:40, yearMade:2021, featured:true,  tags:['Uniform Planting','Labor Saving','High Speed'] },
  { id:24, name:'Rotavator',                category:'Tillage Equipment', costPerHour:250, state:'Haryana',       district:'Karnal',      village:'Indri',        owner:'Deepak Kumar',     phone:'+91 9876543216', description:'Advanced rotavator for soil preparation and mixing. Perfect for preparing a fine seedbed.',                       availability:'Available', image:'/Farming Tools Images/Rotavator.jpg',                 rating:4.4, totalBookings:31, yearMade:2020, featured:false, tags:['Quick Setup','Adjustable Depth','Low Maintenance'] },
  { id:25, name:'Round Baler',              category:'Harvesting',        costPerHour:350, state:'Gujarat',       district:'Rajkot',      village:'Gondal',       owner:'Jayesh Patel',     phone:'+91 9876543225', description:'Automatic round baler for hay and straw. Creates uniform bales with net wrap system.',                            availability:'Available', image:'/Farming Tools Images/Round Baler.jpg',               rating:4.8, totalBookings:29, yearMade:2022, featured:true,  tags:['Automatic','Net Wrap','Uniform Bales'] },
  { id:26, name:'Seed Drill Machine',       category:'Planting Equipment',costPerHour:260, state:'Uttar Pradesh', district:'Meerut',      village:'Sardhana',     owner:'Ramesh Chaudhary', phone:'+91 9876543229', description:'Precision seed drill machine for uniform seed placement. Suitable for multiple crops with adjustable row spacing.', availability:'Available', image:'/Farming Tools Images/seed drill machine.jpg',        rating:4.6, totalBookings:38, yearMade:2021, featured:true,  tags:['Precision','Adjustable','Multi-Crop'] },
  { id:27, name:'Sonalika Tractor',         category:'Heavy Machinery',   costPerHour:460, state:'Haryana',       district:'Hisar',       village:'Fatehabad',    owner:'Rajpal Singh',     phone:'+91 9876543265', description:'Sonalika tractor known for durability in tough field conditions. Good for deep plowing and rotavation.',           availability:'Available', image:'/Farming Tools Images/sonalika tractor.jpg',          rating:4.5, totalBookings:25, yearMade:2021, featured:false, tags:['Durable','Deep Plowing','Powerful'] },
  { id:28, name:'Sprayer',                  category:'Irrigation',        costPerHour:120, state:'Uttar Pradesh', district:'Lucknow',     village:'Mohanlalganj', owner:'Sunil Kumar',      phone:'+91 9876543219', description:'High-pressure sprayer for pesticide and fertilizer application. Tank capacity 200 liters.',                      availability:'Available', image:'/Farming Tools Images/Sprayer.jpg',                   rating:4.6, totalBookings:37, yearMade:2020, featured:false, tags:['High Pressure','Large Tank','Even Spray'] },
  { id:29, name:'Sprinklers',               category:'Irrigation',        costPerHour:70,  state:'Rajasthan',     district:'Jodhpur',     village:'Phalodi',      owner:'Ramji Lal',        phone:'+91 9876543266', description:'Standard sprinkler system for field irrigation. Even water distribution for various crop types.',                 availability:'Available', image:'/Farming Tools Images/sprinklers.jpg',                rating:4.3, totalBookings:42, yearMade:2021, featured:false, tags:['Even Distribution','Simple Setup','Reliable'] },
  { id:30, name:'Super Seeder',             category:'Planting Equipment',costPerHour:300, state:'Karnataka',     district:'Belagavi (Belgaum)', village:'Baramati',     owner:'Vikram Patil',     phone:'+91 9876543214', description:'Precision super seeder for accurate seed placement. Ideal for direct seeding operations.',                       availability:'Available', image:'/Farming Tools Images/Super Seeder.jpg',              rating:4.5, totalBookings:23, yearMade:2022, featured:true,  tags:['Precision Seeding','Multi-Crop','GPS Compatible'] },
  { id:31, name:'Swaraj Harvester',         category:'Harvesting',        costPerHour:750, state:'Punjab',        district:'Ludhiana',    village:'Raikot',       owner:'Kulwant Singh',    phone:'+91 9876543267', description:'Swaraj combine harvester ideal for paddy and wheat. High throughput with minimal crop loss.',                      availability:'Available', image:'/Farming Tools Images/swaraj harvestor.jpg',          rating:4.8, totalBookings:27, yearMade:2020, featured:true,  tags:['High Throughput','Low Crop Loss','Reliable'] },
  { id:32, name:'Swaraj Tractor',           category:'Heavy Machinery',   costPerHour:470, state:'Punjab',        district:'Patiala',     village:'Nabha',        owner:'Sukhdev Singh',    phone:'+91 9876543268', description:'Swaraj tractor for all types of farm operations. Known for ease of maintenance and good resale value.',            availability:'Available', image:'/Farming Tools Images/swaraj tractor.jpg',            rating:4.6, totalBookings:33, yearMade:2020, featured:false, tags:['Easy Maintenance','Versatile','Value for Money'] },
  { id:33, name:'Tractor',                  category:'Heavy Machinery',   costPerHour:500, state:'Telangana',     district:'Hyderabad',   village:'Gachibowli',   owner:'Rajesh Kumar',     phone:'+91 9876543210', description:'High-performance tractor suitable for plowing and cultivation. Well-maintained with latest features.',              availability:'Available', image:'/Farming Tools Images/Tractor.jpg',                   rating:4.8, totalBookings:47, yearMade:2020, featured:true,  tags:['GPS Enabled','Fuel Efficient','Air Conditioned'] },
];

const TOOL_IMAGE_BY_NAME = INITIAL_TOOLS.reduce((acc, tool) => {
  const key = (tool.name || '').trim().toLowerCase();
  if (key && tool.image) acc[key] = tool.image;
  return acc;
}, {});

/* ── State → Districts map ── */
const STATE_DISTRICTS = {
  'Andhra Pradesh':  ['Srikakulam','Parvathipuram Manyam','Vizianagaram','Visakhapatnam','Alluri Sitharama Raju','Anakapalli','Polavaram','Kakinada','East Godavari','Dr. B.R. Ambedkar Konaseema','Eluru','West Godavari','NTR','Krishna','Palnadu','Guntur','Bapatla','Prakasam','Markapuram','Sri Potti Sriramulu Nellore','Kurnool','Nandyal','Ananthapuramu','Sri Sathya Sai','YSR Kadapa','Annamayya','Tirupati','Chittoor'],
  'Telangana':       ['Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Kumuram Bheem','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'],
  'Tamil Nadu':      ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Kanniyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivagangai','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'],
  'Karnataka':       ['Bagalkot','Ballari (Bellary)','Belagavi (Belgaum)','Bengaluru Rural','Bengaluru Urban','Bidar','Chamarajanagara','Chikkaballapura','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi (Gulbarga)','Kodagu','Kolar','Koppal','Mandya','Mysuru (Mysore)','Raichur','Ramanagara','Shivamogga (Shimoga)','Tumakuru (Tumkur)','Udupi','Uttara Kannada (Karwar)','Vijayapura (Bijapur)','Vijayanagara (Hospet)','Yadgir'],
  'Kerala':          ['Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'],
  'Maharashtra':     ['Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'],
  'Punjab':          ['Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Fazilka','Firozpur','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Mansa','Moga','Mohali','Muktsar','Nawanshahr','Pathankot','Patiala','Rupnagar','Sangrur','Tarn Taran'],
  'Haryana':         ['Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'],
  'Uttar Pradesh':   ['Agra','Aligarh','Allahabad','Ambedkar Nagar','Amethi','Amroha','Auraiya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri','Kushinagar','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Raebareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shrawasti','Siddharthnagar','Sitapur','Sonbhadra','Sultanpur','Unnao','Varanasi'],
  'Madhya Pradesh':  ['Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch','Niwari','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'],
  'Rajasthan':       ['Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'],
  'Odisha':          ['Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh'],
  'West Bengal':     ['Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'],
  'Gujarat':         ['Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhumi Dwarka','Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kheda','Kutch','Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'],
  'Bihar':           ['Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga','East Champaran','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar','Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul','Vaishali','West Champaran'],
  'Jharkhand':       ['Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum','Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara','Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu','Ramgarh','Ranchi','Sahebganj','Seraikela Kharsawan','Simdega','West Singhbhum'],
};

const RESOURCE_ALLOWED_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Kerala',
  'Goa',
];

const sanitizeResourceState = (state = '') =>
  RESOURCE_ALLOWED_STATES.includes(state) ? state : '';

const sanitizeResourceDistrict = (state = '', district = '') => {
  if (!state || !district) return '';
  const allowedDistricts = STATE_DISTRICTS[state] || [];
  return allowedDistricts.includes(district) ? district : '';
};

/* ── Simple BLANK_TOOL for P2P listing ── */
const BLANK_TOOL = {
  toolName: '',
  category: 'Tractor', // simplified: Tractor | Tool | Transport
  brand: '',
  model: '',
  hp: '',             // horsepower (optional)
  priceAmount: '',
  priceUnit: 'hour', // 'hour' | 'day' | 'acre'
  state: '', district: '', village: '', houseNo: '',
  owner: '', phone: '',
  description: '',
  withOperator: false,
  availability: 'Available',
  image: '',
};

/* ── Sub-types per category ── */
const CATEGORY_SUBTYPES = {
  'Heavy Machinery':    ['Tractor','Combine Harvester','JCB / Excavator','Power Tiller','Mini Tractor','Other'],
  'Tillage Equipment':  ['Disc Harrow','Rotavator','Cultivator','Disc Plough','Chisel Plough','Subsoiler','Other'],
  'Irrigation':         ['Water Pump','Sprinkler System','Drip Irrigation','Borewell Pump','Sprayer','Other'],
  'Planting Equipment': ['Seed Drill','Super Seeder','Rice Transplanter','Potato Planter','Sugarcane Planter','Other'],
  'Harvesting':         ['Combine Harvester','Reaper','Corn Thresher','Ground Thresher','Round Baler','Potato Harvester','Other'],
  'Hand Tools':         ['Sickle','Khurpi / Hand Weeder','Spade','Rake','Trowel','Dibbler','Hand Cultivator','Power Duster','Other'],
  'Post-Harvest':       ['Winnower','Grain Cleaner / Grader','Metal Storage Silo','Dryer','Other'],
  'Transport':          ['Tractor with Trailer','Mini Truck','Bullock Cart','Other'],
  'Modern Technology':  ['Drone Sprayer','GPS Tracker','Soil Testing Kit','Other'],
};

/* ── Brands per sub-type ── */
const SUBTYPE_BRANDS = {
  'Tractor':               ['Mahindra','Massey Ferguson','John Deere','Kubota','Swaraj','TAFE','New Holland','Sonalika','Escorts','Eicher','Indo Farm','Other'],
  'Combine Harvester':     ['John Deere','Claas','New Holland','Kubota','Dasmesh','Preet','Other'],
  'JCB / Excavator':       ['JCB','Komatsu','Caterpillar','BEML','Hyundai','Other'],
  'Power Tiller':          ['Kamco','VST','Honda','Kubota','Krishi Uday','Other'],
  'Mini Tractor':          ['Mahindra JIVO','Sonalika Solis','Farmtrac Atom','New Holland 3230','Other'],
  'Water Pump':            ['Kirloskar','Grundfos','CRI','KSB','Shakti','Other'],
  'Sprinkler System':      ['Nelson','Rain Bird','Netafim','Jain Irrigation','Other'],
  'Drip Irrigation':       ['Netafim','Jain Irrigation','Finolex','WaterNew','Other'],
  'Borewell Pump':         ['Kirloskar','Grundfos','CRI','Texmo','Other'],
  'Sprayer':               ['Aspee','Honda','China Generic','Neptune','Other'],
  'Drone Sprayer':         ['DJI Agras','IdeaForge','Garuda Aerospace','TartanSense','Other'],
  'Seed Drill':            ['Fieldking','Shaktiman','John Deere','Landforce','Other'],
  'Super Seeder':          ['Fieldking','Shaktiman','Happy Seeder','Other'],
  'Rice Transplanter':     ['Kubota','ISEKI','Mitsubishi','Yanmar','Other'],
  'Disc Harrow':           ['Fieldking','Shaktiman','John Deere','Landforce','Other'],
  'Rotavator':             ['Fieldking','Shaktiman','Sonalika','Mahindra','KMW','Other'],
  'Cultivator':            ['Fieldking','Shaktiman','Landforce','Other'],
  'Disc Plough':           ['Fieldking','Shaktiman','John Deere','Other'],
  'Chisel Plough':         ['Fieldking','Shaktiman','Landforce','Other'],
  'Reaper':                ['Kartar','Preet','Dasmesh','Other'],
  'Corn Thresher':         ['Kartar','Dasmesh','Preet','Generic','Other'],
  'Ground Thresher':       ['Kartar','Dasmesh','Generic','Other'],
  'Round Baler':           ['John Deere','New Holland','Claas','Other'],
  'Tractor with Trailer':  ['Custom Built','Mahindra','John Deere','Other'],
};

/* ── Models per brand per sub-type (most common ones) ── */
const BRAND_MODELS = {
  'Mahindra':         { 'Tractor': ['Yuvo 215 NXT','Yuvo 245 DI','Yuvo 265 DI','Jivo 245 DI','Jivo 305 DI','Arjun 605','Arjun 655 DI','475 DI','575 DI','595 Plus','OJA 3140','Other'], default: ['Other'] },
  'Massey Ferguson':  { 'Tractor': ['241 DI','245 DI','1035 DI','7235','8055 DI','9500','Samraat 7235','245 Power Up','Other'], default: ['Other'] },
  'John Deere':       { 'Tractor': ['3028 EN','3036 EN','3042 EN','5050 D','5065 E','5075 E','6120 B','Other'], 'Combine Harvester': ['W70','W80','S660','Other'], default: ['Other'] },
  'Kubota':           { 'Tractor': ['MU4018','MU5501','L4508','L3408','Other'], default: ['Other'] },
  'Swaraj':           { 'Tractor': ['724 FE','735 FE','742 FE','744 FE','855 FE','963 FE','Other'], default: ['Other'] },
  'TAFE':             { 'Tractor': ['35 DI Powermaax','45 DI Powermaax','55 DI','Maxxa 40','Maxxa 45','8502','9502','Other'], default: ['Other'] },
  'New Holland':      { 'Tractor': ['3230 TX','3430','3630','4710','5500','TD5.90','Other'], default: ['Other'] },
  'Sonalika':         { 'Tractor': ['DI 35','DI 47','DI 60','Sikander 60','Tiger DI 75','RX 35','Other'], default: ['Other'] },
  'Escorts':          { 'Tractor': ['Farmtrac 45','Farmtrac 60','Farmtrac 75','Powertrac 434','Powertrac 439','Other'], default: ['Other'] },
  'DJI Agras':   { 'Drone Sprayer': ['T10','T20P','T40','T50','Other'], default: ['Other'] },
  'Kirloskar':   { 'Water Pump': ['Star-1 Plus','Star-3 Plus','DM 10','DM 15','Other'], default: ['Other'] },
  'Fieldking':   { default: ['Standard Model','Heavy Duty Model','Other'] },
  'Shaktiman':   { default: ['Standard Model','Heavy Duty Model','Other'] },
  'Claas':       { 'Combine Harvester': ['Crop Tiger 30','Dominator 108','Lexion 700','Other'], default: ['Other'] },
};

/* ── HP options per sub-type ── */
const SUBTYPE_HP = {
  'Tractor':       ['15–25 HP','26–35 HP','36–45 HP','46–55 HP','56–65 HP','66–75 HP','76–90 HP','91+ HP'],
  'Power Tiller':  ['7–10 HP','11–14 HP','15 HP+'],
  'Mini Tractor':  ['15–25 HP','26–35 HP'],
  'Water Pump':    ['1 HP','2 HP','3 HP','5 HP','7.5 HP','10 HP+'],
  'Borewell Pump': ['0.5 HP','1 HP','2 HP','3 HP','5 HP+'],
};

/* ── Extra fields per sub-type ── */
const SUBTYPE_EXTRA_FIELDS = {
  'Tractor': [
    { key: 'tractorType', label: '🚜 Tractor Type',  type: 'select', options: ['Standard','Paddy Special','Orchard / Mini','Heavy Duty'] },
    { key: 'hp',          label: '⚡ Engine HP',     type: 'select', optionKey: 'Tractor' },
    { key: 'driveType',   label: '🔧 Drive Type',    type: 'select', options: ['2WD','4WD'] },
    { key: 'condition',   label: '✅ Condition',      type: 'select', options: ['Excellent','Good','Fair'] },
    { key: 'attachments', label: '🔗 Attachments',   type: 'text',   placeholder: 'e.g., Plough, Rotavator (comma separated)' },
  ],
  'Combine Harvester': [
    { key: 'cuttingWidth', label: '📐 Cutting Width', type: 'select', options: ['< 3m','3–4m','4–5m','> 5m'] },
    { key: 'cropTypes',    label: '🌾 Crops',         type: 'text',   placeholder: 'e.g., Wheat, Rice, Corn' },
    { key: 'condition',    label: '✅ Condition',      type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'JCB / Excavator': [
    { key: 'bucketCapacity', label: '⚖️ Bucket Capacity', type: 'select', options: ['0.1–0.2 m³','0.2–0.4 m³','0.4–0.6 m³','0.6 m³+'] },
    { key: 'condition',      label: '✅ Condition',         type: 'select', options: ['Excellent','Good','Fair'] },
    { key: 'operatorIncluded', label: '👷 Operator',       type: 'select', options: ['Included','Not Included'] },
  ],
  'Power Tiller': [
    { key: 'hp',        label: '⚡ Power',     type: 'select', optionKey: 'Power Tiller' },
    { key: 'condition', label: '✅ Condition', type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Water Pump': [
    { key: 'hp',          label: '⚡ Motor HP',     type: 'select', optionKey: 'Water Pump' },
    { key: 'powerSource', label: '🔌 Power Source', type: 'select', options: ['Electric','Diesel','Solar'] },
    { key: 'coverage',    label: '🌾 Coverage',     type: 'text',   placeholder: 'e.g., 5 acres/hr' },
    { key: 'condition',   label: '✅ Condition',     type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Drone Sprayer': [
    { key: 'tankCapacity', label: '🛢️ Tank Capacity', type: 'select', options: ['5L','10L','16L','20L','40L+'] },
    { key: 'coverage',     label: '🌾 Coverage/Charge', type: 'number', placeholder: 'acres per charge' },
    { key: 'condition',    label: '✅ Condition',       type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Sprinkler System': [
    { key: 'area',      label: '📐 Coverage Area', type: 'text',   placeholder: 'e.g., 2 acres' },
    { key: 'condition', label: '✅ Condition',      type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Drip Irrigation': [
    { key: 'area',      label: '📐 Coverage Area', type: 'text',   placeholder: 'e.g., 1 acre' },
    { key: 'condition', label: '✅ Condition',      type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Rotavator': [
    { key: 'width',     label: '📐 Working Width', type: 'select', options: ['5 ft','6 ft','7 ft','8 ft','9 ft+'] },
    { key: 'condition', label: '✅ Condition',      type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Reaper': [
    { key: 'type',      label: '🔧 Type',       type: 'select', options: ['Walk Behind','Tractor Mounted'] },
    { key: 'cropTypes', label: '🌾 Crops',      type: 'text',   placeholder: 'e.g., Wheat, Paddy' },
    { key: 'condition', label: '✅ Condition',   type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  'Tractor with Trailer': [
    { key: 'loadCapacity', label: '⚖️ Load Capacity', type: 'select', options: ['1 ton','2 ton','3 ton','5 ton','7 ton+'] },
    { key: 'condition',    label: '✅ Condition',       type: 'select', options: ['Excellent','Good','Fair'] },
  ],
  '_default': [
    { key: 'condition', label: '✅ Condition', type: 'select', options: ['Excellent','Good','Fair'] },
  ],
};

const BLANK_REQUEST = {
  toolName: '', category: '', requesterName: '', requesterPhone: '',
  location: '', fromDate: '', toDate: '', hoursNeeded: '', message: '',
};

const BLANK_RENT_REQUEST = {
  dateOfUse: '',
  duration: '',
  durationType: 'hours', // 'hours' | 'days'
  workNote: '',         // Work conditions note
  requesterPhone: '',   // phone entered in modal
};

const VALID_RESOURCE_TABS = new Set(['browse', 'requests', 'my-tools', 'list']);

const getTabFromSearch = (search = '') => {
  const tabValue = new URLSearchParams(search).get('tab');
  if (!tabValue) return '';
  return VALID_RESOURCE_TABS.has(tabValue) ? tabValue : '';
};

const ResourceSharePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData: authUserData } = useAuth();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [activeTab, setActiveTab]           = useState('browse');
  const [userTools, setUserTools]           = useState([]);
  const [rentalRequests, setRentalRequests] = useState([]);
  const [listingTool, setListingTool]       = useState(false);

  // edit tool
  const [editingTool, setEditingTool]       = useState(null);  // tool being edited
  const [editForm, setEditForm]             = useState({});    // form values
  const [savingEdit, setSavingEdit]         = useState(false);

  // sidebar
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [locationPref, setLocationPref]     = useState('all');   // 'all' | 'myDistrict'
  const [priceRange, setPriceRange]         = useState([0, 2000]); // [min, max]
  const [withOperatorFilter, setWithOperatorFilter] = useState(false);
  const [sortBy, setSortBy]                 = useState('default'); // 'default'|'price-asc'|'price-desc'|'rating'|'bookings'

  // district-mismatch warning modal
  const [districtWarnTool, setDistrictWarnTool] = useState(null);

  // Report/Complaint modal
  const [reportModal, setReportModal]   = useState(null); // req object
  const [reportForm, setReportForm]     = useState({ reason: '', details: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedUserIds, setReportedUserIds] = useState(new Set());

  // Cancel request modal
  const [cancelModal, setCancelModal] = useState(null); // req object
  const [cancelForm, setCancelForm] = useState({ reason: '', details: '' });
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Current farmer's district from profile
  const myDistrict  = authUserData?.district || '';
  const myPhone     = authUserData?.phone || authUserData?.phoneNumber || '';

  // Real-time Firestore listeners
  useEffect(() => {
    const unsubTools = onSnapshot(
      collection(db, 'resource_tools'),
      (snap) => setUserTools(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.error('resource_tools listener error:', err)
    );
    const unsubRentals = onSnapshot(
      collection(db, 'rental_requests'),
      (snap) => setRentalRequests(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.error('rental_requests listener error:', err)
    );
    return () => { unsubTools(); unsubRentals(); };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setReportedUserIds(new Set());
      return;
    }
    const reportsQ = query(
      collection(db, 'resource_reports'),
      where('reporterId', '==', currentUser.uid)
    );
    const unsubReports = onSnapshot(
      reportsQ,
      (snap) => {
        const ids = new Set(
          snap.docs
            .map((docSnap) => docSnap.data()?.reportedUserId)
            .filter(Boolean)
        );
        setReportedUserIds(ids);
      },
      (err) => console.error('resource_reports listener error:', err)
    );
    return () => { try { unsubReports(); } catch (_) {} };
  }, [currentUser?.uid]);

  useEffect(() => {
    const tabFromSearch = getTabFromSearch(location.search);
    if (tabFromSearch) {
      setActiveTab(tabFromSearch);
    }
  }, [location.search]);

  useEffect(() => {
    const currentQueryTab = getTabFromSearch(location.search) || 'browse';
    if (activeTab === currentQueryTab) return;

    const params = new URLSearchParams(location.search);
    if (activeTab === 'browse') {
      params.delete('tab');
    } else {
      params.set('tab', activeTab);
    }

    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
  }, [activeTab, location.pathname, location.search, navigate]);

  // Sync user profile data into the Add-Tool form whenever auth data loads
  useEffect(() => {
    if (authUserData) {
      setNewTool(prev => {
        const safePrevState = sanitizeResourceState(prev.state || '');
        const profileState = sanitizeResourceState(authUserData?.state || '');
        const finalState = safePrevState || profileState;
        return {
        ...prev,
        owner:    prev.owner    || authUserData?.name    || authUserData?.displayName || '',
        phone:    prev.phone    || authUserData?.phone   || authUserData?.phoneNumber || '',
        state:    finalState,
        district: sanitizeResourceDistrict(
          finalState,
          prev.district || authUserData?.district || ''
        ),
        village:  prev.village  || authUserData?.village || authUserData?.city || authUserData?.addressLine || '',
        };
      });
    }
  }, [authUserData]);

  /* browse search */
  const [searchTerm, setSearchTerm] = useState('');

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedAvailability('all');
    setLocationPref('all');
    setPriceRange([0, 2000]);
    setWithOperatorFilter(false);
    setSortBy('default');
  };

  /* list-tool form */
  const profileDefaults = {
    owner:   authUserData?.name || authUserData?.displayName || '',
    phone:   authUserData?.phone || authUserData?.phoneNumber || '',
    state:   sanitizeResourceState(authUserData?.state || ''),
    district: sanitizeResourceDistrict(
      sanitizeResourceState(authUserData?.state || ''),
      authUserData?.district || ''
    ),
    village: authUserData?.village || authUserData?.city || authUserData?.addressLine || '',
  };
  const BLANK_TOOL_WITH_PROFILE = { ...BLANK_TOOL, ...profileDefaults };
  const [newTool, setNewTool]           = useState(BLANK_TOOL_WITH_PROFILE);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [listPickerCat, setListPickerCat]       = useState('Heavy Machinery');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const fileRef = useRef(null);

  /* rent-request modal */
  const [rentModalTool, setRentModalTool]   = useState(null);
  const [rentForm, setRentForm]             = useState(BLANK_RENT_REQUEST);
  const [rentSubmitting, setRentSubmitting] = useState(false);

  /* ── helpers ── */
  // Normalise legacy tools (INITIAL_TOOLS use `name`, new tools use `toolName`)
  const normTool = (t) => ({ ...t, toolName: t.toolName || t.name || '' });
  const tools = userTools.map(normTool);

  const getEffectivePrice = (t) => t.priceAmount ? parseFloat(t.priceAmount) : (t.costPerHour || 0);

  const filteredTools = tools.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchQuery = (
      (t.toolName || '').toLowerCase().includes(q) ||
      (t.owner || '').toLowerCase().includes(q) ||
      (t.district || '').toLowerCase().includes(q) ||
      (t.state || '').toLowerCase().includes(q)
    );
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchAvail = selectedAvailability === 'all' || t.availability === selectedAvailability;
    const matchLocation = locationPref === 'all' || !myDistrict ||
      (t.district || '').toLowerCase() === myDistrict.toLowerCase();
    const price = getEffectivePrice(t);
    const matchPrice = price === 0 || (price >= priceRange[0] && price <= priceRange[1]);
    const matchOperator = !withOperatorFilter ||
      t.withOperator || t.serviceType === 'with_operator';

    // In Browse tab, hide tools listed by the currently logged-in farmer
    const notOwnListing = !currentUser?.uid || t.ownerId !== currentUser.uid;

    return matchQuery && matchCategory && matchAvail && matchLocation && matchPrice && matchOperator && notOwnListing;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return getEffectivePrice(a) - getEffectivePrice(b);
    if (sortBy === 'price-desc') return getEffectivePrice(b) - getEffectivePrice(a);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'bookings') return (b.totalBookings || 0) - (a.totalBookings || 0);
    // default: same-district tools first
    if (!myDistrict) return 0;
    const aLocal = (a.district || '').toLowerCase() === myDistrict.toLowerCase();
    const bLocal = (b.district || '').toLowerCase() === myDistrict.toLowerCase();
    if (aLocal && !bLocal) return -1;
    if (!aLocal && bLocal) return 1;
    return 0;
  });

  const activeFilterCount = [
    searchTerm !== '',
    selectedCategory !== 'all',
    selectedAvailability !== 'all',
    locationPref !== 'all',
    priceRange[1] < 2000,
    withOperatorFilter,
    sortBy !== 'default',
  ].filter(Boolean).length;

  const resolveImage = (tool) => {
    const categoryFallback = CATEGORY_META[tool.category]?.fallback || '';
    const explicitImage = tool.image || '';
    const nameKey = (tool.toolName || tool.name || '').trim().toLowerCase();
    const inferredByName = TOOL_IMAGE_BY_NAME[nameKey] || '';

    if (explicitImage && explicitImage !== categoryFallback) return explicitImage;
    if (inferredByName) return inferredByName;
    if (explicitImage) return explicitImage;
    return categoryFallback;
  };

  const getEstimatedHours = (duration, durationType) => {
    const numericDuration = parseFloat(duration);
    if (!Number.isFinite(numericDuration) || numericDuration <= 0) return 0;
    return durationType === 'days' ? numericDuration * 8 : numericDuration;
  };

  const requestTimeMs = (req) => {
    const ts = req?.createdAt;
    if (!ts) return 0;
    if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
    if (typeof ts?.seconds === 'number') return (ts.seconds * 1000) + Math.floor((ts.nanoseconds || 0) / 1e6);
    const parsed = new Date(ts).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const dedupeRequestsByToolAndRequester = (requests) => {
    const latestByPair = new Map();
    requests.forEach((req) => {
      const pairKey = `${req.toolId || req.toolName || 'unknown'}::${req.requesterId || req.requesterPhone || 'anon'}`;
      const existing = latestByPair.get(pairKey);
      if (!existing || requestTimeMs(req) > requestTimeMs(existing)) {
        latestByPair.set(pairKey, req);
      }
    });
    return Array.from(latestByPair.values());
  };

  /* ── open / close rent modal ── */
  const openRentModal = (tool) => {
    // Check district mismatch
    if (myDistrict && tool.district &&
        tool.district.toLowerCase() !== myDistrict.toLowerCase()) {
      setDistrictWarnTool(tool);
      return;
    }
    setRentModalTool(tool);
    setRentForm({ ...BLANK_RENT_REQUEST, requesterPhone: myPhone || '' });
  };
  const closeRentModal = () => { setRentModalTool(null); setRentForm(BLANK_RENT_REQUEST); };
  const proceedDespiteWarning = () => {
    setRentModalTool(districtWarnTool);
    setRentForm({ ...BLANK_RENT_REQUEST, requesterPhone: myPhone || '' });
    setDistrictWarnTool(null);
  };

  /* ── submit rental request ── */
  const handleRentRequest = async () => {
    if (!currentUser) {
      toastError('Please log in to send a rental request.');
      return;
    }
    if (!rentForm.dateOfUse || !rentForm.duration) return;
    const estimatedHours = getEstimatedHours(rentForm.duration, rentForm.durationType);
    if (!estimatedHours) {
      toastError('Please enter a valid duration (greater than 0).');
      return;
    }
    const phoneToUse = rentForm.requesterPhone || myPhone || '';
    if (!phoneToUse || phoneToUse.replace(/\D/g, '').length < 10) {
      toastError('Please enter your 10-digit phone number in the form below.');
      return;
    }

    const sameToolMyRequests = rentalRequests
      .filter(r => r.requesterId === currentUser.uid && r.toolId === (rentModalTool.id || null))
      .sort((a, b) => requestTimeMs(b) - requestTimeMs(a));
    const latestSameToolReq = sameToolMyRequests[0] || null;

    if (latestSameToolReq && ['Requested', 'Accepted', 'In Progress'].includes(latestSameToolReq.status)) {
      toastWarning('You already have an active request for this tool.');
      closeRentModal();
      setActiveTab('requests');
      return;
    }

    setRentSubmitting(true);
    try {
      const requestPayload = {
        toolId:           rentModalTool.id || null,
        toolName:         rentModalTool.toolName || rentModalTool.name,
        toolOwnerId:      rentModalTool.ownerId || null,
        ownerName:        rentModalTool.owner,
        ownerPhone:       rentModalTool.phone,
        ownerDistrict:    rentModalTool.district || '',
        category:         rentModalTool.category,
        withOperator:     rentModalTool.withOperator || false,
        durationType:     rentForm.durationType,
        duration:         rentForm.duration,
        estimatedHours,
        workNote:         rentForm.workNote || '',
        dateOfUse:        rentForm.dateOfUse,
        requesterId:      currentUser?.uid || null,
        requesterName:    authUserData?.name || currentUser?.displayName || '',
        requesterPhone:   phoneToUse,
        requesterDistrict: myDistrict || '',
        status:           'Requested',
        createdAt:        serverTimestamp(),
        reviewSubmitted:  false,
      };

      if (latestSameToolReq && ['Rejected', 'Completed', 'Cancelled'].includes(latestSameToolReq.status)) {
        await updateDoc(doc(db, 'rental_requests', latestSameToolReq.id), requestPayload);
      } else {
        await addDoc(collection(db, 'rental_requests'), requestPayload);
      }

      toastSuccess(`🚜 Request sent for "${rentModalTool.toolName || rentModalTool.name}"! Owner will contact you soon.`);
      closeRentModal();
      setActiveTab('requests');
    } catch (err) {
      console.error('Error sending rental request:', err);
      toastError('Failed to send request. Please try again.');
    } finally {
      setRentSubmitting(false);
    }
  };

  /* ── Owner: Approve rental request ── */
  const handleApproveRequest = async (reqId, toolId) => {
    try {
      await updateDoc(doc(db, 'rental_requests', reqId), { status: 'Accepted' });
      if (toolId && typeof toolId === 'string') {
        await updateDoc(doc(db, 'resource_tools', toolId), { availability: 'Rented' });
      }
      toastSuccess('✅ Request approved! Coordinate with the renter directly.');
    } catch (err) {
      console.error('Error approving request:', err);
      toastError('Failed to approve. Try again.');
    }
  };

  /* ── Owner: Reject rental request ── */
  const handleRejectRequest = async (reqId, toolId) => {
    try {
      await updateDoc(doc(db, 'rental_requests', reqId), { status: 'Rejected' });
      if (toolId && typeof toolId === 'string') {
        await updateDoc(doc(db, 'resource_tools', toolId), { availability: 'Available' });
      }
      toastSuccess('Request rejected and tool set back to Available.');
    } catch (err) {
      console.error('Error rejecting request:', err);
      toastError('Failed to reject. Try again.');
    }
  };

  /* ── Owner or Borrower: Mark In Progress ── */
  const handleMarkInProgress = async (reqId, toolId, toolOwnerId) => {
    try {
      await updateDoc(doc(db, 'rental_requests', reqId), { status: 'In Progress' });
      if (toolId && typeof toolId === 'string' && toolOwnerId === currentUser?.uid) {
        await updateDoc(doc(db, 'resource_tools', toolId), { availability: 'Rented' });
      }
      toastSuccess('🚜 Status updated to In Progress!');
    } catch (err) {
      console.error('Error marking in progress:', err);
      toastError('Failed to update. Try again.');
    }
  };

  /* ── Borrower: Mark Work Completed ── */
  const handleMarkCompleted = async (reqId, toolId, toolOwnerId) => {
    try {
      await updateDoc(doc(db, 'rental_requests', reqId), { status: 'Completed' });
      if (toolId && typeof toolId === 'string' && toolOwnerId === currentUser?.uid) {
        await updateDoc(doc(db, 'resource_tools', toolId), { availability: 'Available' });
      }
      toastSuccess('🎉 Marked as completed! Tool is back to Available.');
    } catch (err) {
      console.error('Error completing request:', err);
      toastError('Failed to update. Try again.');
    }
  };

  const openCancelModal = (req) => {
    setCancelModal(req);
    setCancelForm({ reason: '', details: '' });
  };

  const handleCancelRequest = async () => {
    if (!cancelModal?.id) return;
    if (!cancelForm.reason) {
      toastError('Please select a cancellation reason.');
      return;
    }
    setCancelSubmitting(true);
    try {
      await updateDoc(doc(db, 'rental_requests', cancelModal.id), {
        status: 'Cancelled',
        cancelReason: cancelForm.reason,
        cancelDetails: (cancelForm.details || '').trim(),
        cancelledBy: currentUser?.uid || null,
        cancelledAt: serverTimestamp(),
      });
      if (
        cancelModal.toolId &&
        typeof cancelModal.toolId === 'string' &&
        cancelModal.toolOwnerId === currentUser?.uid
      ) {
        await updateDoc(doc(db, 'resource_tools', cancelModal.toolId), { availability: 'Available' });
      }
      toastSuccess('Request cancelled successfully.');
      setCancelModal(null);
      setCancelForm({ reason: '', details: '' });
    } catch (err) {
      console.error('Error cancelling request:', err);
      toastError('Failed to cancel request. Try again.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleSubmitResourceReview = async (reqId, rating, comment) => {
    try {
      await updateDoc(doc(db, 'rental_requests', reqId), {
        reviewSubmitted: true,
        reviewRating: Number(rating),
        reviewComment: comment || '',
        reviewedAt: serverTimestamp(),
      });
      toastSuccess('⭐ Review submitted successfully.');
    } catch (err) {
      console.error('Error submitting review:', err);
      toastError('Failed to submit review. Try again.');
    }
  };

  /* ── Submit Report / Complaint ── */
  const handleSubmitReport = async () => {
    if (!reportForm.reason || !reportModal) return;
    const isOwnerOfTool = reportModal.toolOwnerId === currentUser?.uid;
    const reportedUserId = isOwnerOfTool ? reportModal.requesterId : reportModal.toolOwnerId;
    const reportedUserName = isOwnerOfTool ? reportModal.requesterName : reportModal.ownerName;

    if (!reportedUserId) {
      toastError('Unable to identify the person to report.');
      return;
    }

    if (reportedUserIds.has(reportedUserId)) {
      toastWarning('You have already reported this person. Duplicate reporting is not allowed.');
      setReportModal(null);
      setReportForm({ reason: '', details: '' });
      return;
    }

    setReportSubmitting(true);
    try {
      await addDoc(collection(db, 'resource_reports'), {
        requestId:     reportModal.id,
        toolId:        reportModal.toolId || null,
        toolName:      reportModal.toolName,
        reporterId:    currentUser?.uid || null,
        reporterName:  authUserData?.name || currentUser?.displayName || '',
        reportedUserId,
        reportedUserName: reportedUserName || 'Unknown',
        reason:        reportForm.reason,
        details:       reportForm.details,
        status:        'Open',
        createdAt:     serverTimestamp(),
      });
      toastSuccess('📋 Report submitted. Our team will review it shortly.');
      setReportModal(null);
      setReportForm({ reason: '', details: '' });
    } catch (err) {
      console.error('Error submitting report:', err);
      toastError('Failed to submit report. Try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  /* ── handlers ── */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddTool = async () => {
    if (!currentUser) {
      toastError('Please log in to list a tool.');
      return;
    }
    if (!newTool.toolName || !newTool.category || !newTool.priceAmount || !newTool.owner || !newTool.phone || !newTool.district || !newTool.state) {
      toastError('Please fill in all required fields (tool, price, name, phone, state, district).');
      return;
    }
    setListingTool(true);
    try {
      const fallbackImage =
        newTool.image ||
        selectedTemplate?.image ||
        CATEGORY_META[newTool.category]?.fallback ||
        '';
      const docRef = await addDoc(collection(db, 'resource_tools'), {
        toolName:     newTool.toolName,
        name:         newTool.toolName,
        category:     newTool.category,
        brand:        newTool.brand,
        model:        newTool.model,
        priceAmount:  parseFloat(newTool.priceAmount),
        priceUnit:    newTool.priceUnit,
        costPerHour:  newTool.priceUnit === 'hour' ? parseFloat(newTool.priceAmount) : 0,
        state:        newTool.state,
        district:     newTool.district,
        village:      newTool.village,
        houseNo:      newTool.houseNo || '',
        owner:        newTool.owner,
        phone:        newTool.phone,
        description:  newTool.description,
        hp:           newTool.hp || '',
        withOperator: newTool.withOperator,
        availability: 'Available',
        image:        fallbackImage,
        rating:       0,
        totalBookings: 0,
        yearMade:     new Date().getFullYear(),
        featured:     false,
        tags:         [],
        ownerId:      currentUser?.uid || '',
        createdAt:    serverTimestamp(),
      });

      const optimisticTool = {
        id:            docRef.id,
        toolName:      newTool.toolName,
        name:          newTool.toolName,
        category:      newTool.category,
        brand:         newTool.brand,
        model:         newTool.model,
        priceAmount:   parseFloat(newTool.priceAmount),
        priceUnit:     newTool.priceUnit,
        costPerHour:   newTool.priceUnit === 'hour' ? parseFloat(newTool.priceAmount) : 0,
        state:         newTool.state,
        district:      newTool.district,
        village:       newTool.village,
        houseNo:       newTool.houseNo || '',
        owner:         newTool.owner,
        phone:         newTool.phone,
        description:   newTool.description,
        hp:            newTool.hp || '',
        withOperator:  newTool.withOperator,
        availability:  'Available',
        image:         fallbackImage,
        ownerId:       currentUser?.uid || '',
      };
      setUserTools(prev => [...prev, optimisticTool]);

      if (imageFile) {
        const storageRef = ref(storage, `tool_images/${docRef.id}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        await updateDoc(doc(db, 'resource_tools', docRef.id), { image: downloadURL });
        setUserTools(prev => prev.map(t => t.id === docRef.id ? { ...t, image: downloadURL } : t));
      }
      setNewTool({ ...BLANK_TOOL, ...profileDefaults });
      setImagePreview('');
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toastSuccess('✅ Tool listed successfully! Borrowers can now request it.');
      setActiveTab('my-tools');
    } catch (err) {
      console.error('Error listing tool:', err);
      toastError('Failed to list tool. Please try again.');
    } finally {
      setListingTool(false);
    }
  };

  const handleDeleteTool = async (toolId) => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await deleteDoc(doc(db, 'resource_tools', toolId));
      toastSuccess('Listing removed.');
    } catch (err) {
      console.error('Error deleting tool:', err);
    }
  };

  const openEditTool = (tool) => {
    setEditingTool(tool);
    setEditForm({
      toolName:    tool.toolName || tool.name || '',
      brand:       tool.brand || '',
      model:       tool.model || '',
      hp:          tool.hp || '',
      priceAmount: tool.priceAmount || tool.costPerHour || '',
      priceUnit:   tool.priceUnit || 'hour',
      village:     tool.village || '',
      district:    tool.district || '',
      state:       tool.state || '',
      phone:       tool.phone || '',
      description: tool.description || '',
      availability: tool.availability || 'Available',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTool) return;
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, 'resource_tools', editingTool.id), {
        toolName:    editForm.toolName,
        name:        editForm.toolName,
        brand:       editForm.brand,
        model:       editForm.model,
        hp:          editForm.hp,
        priceAmount: parseFloat(editForm.priceAmount) || 0,
        priceUnit:   editForm.priceUnit,
        costPerHour: editForm.priceUnit === 'hour' ? parseFloat(editForm.priceAmount) || 0 : (editingTool.costPerHour || 0),
        village:     editForm.village,
        district:    editForm.district,
        state:       editForm.state,
        phone:       editForm.phone,
        description: editForm.description,
        availability: editForm.availability || 'Available',
      });
      toastSuccess('Tool updated successfully!');
      setEditingTool(null);
    } catch (err) {
      console.error('Error updating tool:', err);
      toastError('Failed to update. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  /* ── ToolCard ── */
  const ToolCard = ({ tool }) => {
    const img  = resolveImage(tool);
    const meta = CATEGORY_META[tool.category] || {};
    const displayName = tool.toolName || tool.name || '';
    const priceLabel = tool.priceAmount
      ? `₹${tool.priceAmount}/${tool.priceUnit || 'hour'}`
      : tool.costPerHour ? `₹${tool.costPerHour}/hour` : '';
    const isAvail    = tool.availability === 'Available';
    const isRented   = tool.availability === 'Rented';
    const isMaint    = tool.availability === 'Under Maintenance';
    const isRequested= tool.availability === 'Requested';
    const isBusy     = !isAvail;

    // Local badge: tool.district matches logged-in farmer's district
    const isLocal = myDistrict &&
      (tool.district || '').toLowerCase() === myDistrict.toLowerCase();

    // Cross-district warning
    const isFar = myDistrict && tool.district &&
      tool.district.toLowerCase() !== myDistrict.toLowerCase();

    return (
      <div className={`tool-card p2p-tool-card ${isBusy ? 'p2p-card-busy' : ''}`}>
        <div className="tool-image-container">
          {img ? (
            <img src={img} alt={displayName} className="tool-image"
              onError={e => { e.target.onerror = null; e.target.src = TOOL_IMAGE_BY_NAME[(displayName || '').trim().toLowerCase()] || meta.fallback || ''; }} />
          ) : (
            <div className="tool-image-placeholder" style={{ color: meta.color || '#16a34a' }}>
              <FaTools size={60} />
            </div>
          )}
          <div className={`availability-badge ${isAvail ? 'available' : 'unavailable'}`}>
            {isAvail ? <FaCheckCircle /> : isRented ? <FaBan /> : isMaint ? <FaEyeSlash /> : <FaRegClock />}
            {isAvail ? 'Open' : tool.availability}
          </div>
          {/* Local badge */}
          {isLocal && (
            <div className="p2p-local-badge"><FaMapPin /> Local</div>
          )}
        </div>

        <div className="tool-info">
          {/* F2F trust badge */}
          <div className="p2p-trust-badge">
            <FaShieldAlt /> Direct Farmer-to-Farmer
          </div>

          <div className="tool-header">
            <div className="tool-name-block">
              <h3 className="tool-name">{displayName}</h3>
              {(tool.brand || tool.model || tool.hp) && (
                <p className="tool-subtitle">
                  {[tool.brand, tool.model].filter(Boolean).join(' — ')}
                  {tool.hp ? ` · ${tool.hp} HP` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="tool-meta">
            <span className="category-badge"
              style={{ background: (meta.color || '#16a34a') + '22', color: meta.color || '#16a34a' }}>
              {meta.emoji || '🔧'} {tool.p2pCategory || tool.category}
            </span>
            {(tool.withOperator || tool.serviceType === 'with_operator') ? (
              <span className="rs-svc-badge rs-svc-op"><FaUserTie /> With Operator</span>
            ) : (
              <span className="rs-svc-badge rs-svc-tool"><FaTools /> Tool Only</span>
            )}
          </div>

          {/* Cross-district warning note */}
          {isFar && (
            <div className="p2p-far-warning">
              <FaExclamationTriangle /> Note: This resource is in a different district. Manual transport coordination may be required.
            </div>
          )}

          {tool.description && <p className="tool-description">{tool.description}</p>}

          <div className="tool-details">
            {priceLabel && <div className="detail-item"><div className="detail-icon"><FaRupeeSign /></div><span className="detail-text price">{priceLabel}</span></div>}
            <div className="detail-item"><div className="detail-icon"><FaMapMarkerAlt /></div><span className="detail-text">{[tool.village, tool.district, tool.state].filter(Boolean).join(', ')}</span></div>
            <div className="detail-item"><div className="detail-icon"><FaUser /></div><span className="detail-text">{tool.owner}</span></div>
            {tool.phone && <div className="detail-item"><div className="detail-icon"><FaPhone /></div><span className="detail-text">{tool.phone}</span></div>}
          </div>

          <div className="tool-buttons">
            {(() => {
              // Find latest request thread for this tool by current user
              const myReq = currentUser
                ? [...rentalRequests]
                    .filter(r => r.toolId === tool.id && r.requesterId === currentUser.uid)
                    .sort((a, b) => requestTimeMs(b) - requestTimeMs(a))[0]
                : null;

              const hasActiveReq = myReq && ['Requested', 'Accepted', 'In Progress'].includes(myReq.status);

              if (myReq?.status === 'Completed') {
                return <div className="rs-card-req-pending">✅ Completed — check My Requests for details</div>;
              }
              if (myReq?.status === 'Cancelled') {
                return <div className="rs-card-req-pending">⚪ Request cancelled</div>;
              }
              if (myReq?.status === 'Rejected') {
                return <div className="rs-card-req-pending">❌ Request rejected — you can request again</div>;
              }

              if (myReq) {
                if (myReq.status === 'Requested') {
                  return (
                    <div className="rs-card-req-pending">
                      ⏳ Request sent — awaiting farmer's confirmation
                    </div>
                  );
                }
                // Accepted or In Progress → reveal owner phone
                const ownerPhone = myReq.ownerPhone;
                return (
                  <div className="rs-card-req-accepted">
                    <div className="rs-card-req-banner">
                      <FaCheckCircle />
                      {myReq.status === 'Accepted' ? ' Request Accepted!' : ' Work in Progress'}
                    </div>
                    {ownerPhone ? (
                      <a href={`tel:${ownerPhone.replace(/\s/g,'')}`} className="rs-btn-call-owner">
                        <FaPhoneAlt /> Call Owner: {ownerPhone}
                      </a>
                    ) : (
                      <span className="rs-no-phone">No phone on file</span>
                    )}
                  </div>
                );
              }
              // No active request — show Request button only if Available
              if (isAvail && !hasActiveReq) {
                return (
                  <button className="btn-primary" onClick={() => openRentModal(tool)}>
                    <FaHandshake /> Request for Use
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    );
  };

  /* ── RentalCard for My Listings (owner sees incoming requests) ── */
  const RentalRequestCard = ({ req }) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState('5');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const isOwner = req.toolOwnerId === currentUser?.uid;
    const isRequester = req.requesterId === currentUser?.uid;
    // Mutual phone reveal: each party only sees the other's number after Accepted
    const contactPhone = isOwner ? req.requesterPhone : req.ownerPhone;
    const contactName  = isOwner ? req.requesterName  : req.ownerName;
    const contactRole  = isOwner ? 'Renter' : 'Owner';
    const telHref = contactPhone ? `tel:${contactPhone.replace(/\s/g, '')}` : '#';
    const canReport = ['Accepted', 'In Progress', 'Completed'].includes(req.status);
    const reportTargetId = isOwner ? req.requesterId : req.toolOwnerId;
    const alreadyReportedThisPerson = !!(reportTargetId && reportedUserIds.has(reportTargetId));
    const statusColors = {
      Requested:    { bg: '#fef3c7', color: '#d97706' },
      Accepted:     { bg: '#dcfce7', color: '#16a34a' },
      'In Progress':{ bg: '#fef9c3', color: '#b45309' },
      Rejected:     { bg: '#fee2e2', color: '#dc2626' },
      Completed:    { bg: '#e0e7ff', color: '#4338ca' },
      Cancelled:    { bg: '#f1f5f9', color: '#475569' },
    };
    const sColor = statusColors[req.status] || { bg: '#f1f5f9', color: '#64748b' };
    const statusClass =
      req.status === 'Requested' ? 'rs-req-pending' :
      req.status === 'Accepted' || req.status === 'In Progress' ? 'rs-req-accepted' :
      req.status === 'Rejected' || req.status === 'Cancelled' ? 'rs-req-offered' :
      '';

    return (
      <div className={`rs-request-card ${statusClass}`}>
        <div className="rs-req-top">
          <div>
            <h3 className="rs-req-tool">{req.toolName}</h3>
            <div className="rs-req-info">
              <span><FaCalendarAlt /> {req.dateOfUse}</span>
              <span><FaRegClock /> {req.duration} {req.durationType}</span>
              <span><FaUser /> Requested by: {req.requesterName || 'Anonymous'}</span>
            </div>
          </div>
          <span className="rs-req-status" style={{ background: sColor.bg, color: sColor.color }}>
            {req.status}
          </span>
        </div>

        {/* Work note from borrower */}
        {req.workNote && (
          <div className="rs-req-worknote">
            <FaStickyNote /> <em>Work note:</em> {req.workNote}
          </div>
        )}
        {req.estimatedHours && (
          <div className="rs-req-hours">
            <FaTachometerAlt /> Estimated hours: <strong>{req.estimatedHours} hrs</strong>
          </div>
        )}
        {/* Cross-district note */}
        {req.ownerDistrict && req.requesterDistrict &&
          req.ownerDistrict.toLowerCase() !== req.requesterDistrict.toLowerCase() && (
          <div className="rs-req-far-note">
            <FaExclamationTriangle /> Cross-district rental — transport coordination needed.
          </div>
        )}

        {/* Owner actions */}
        {isOwner && req.status === 'Requested' && (
          <div className="rs-req-actions">
            <button className="rs-btn-approve" onClick={() => handleApproveRequest(req.id, req.toolId)}>
              <FaThumbsUp /> Approve
            </button>
            <button className="rs-btn-reject" onClick={() => handleRejectRequest(req.id, req.toolId)}>
              <FaThumbsDown /> Reject
            </button>
          </div>
        )}

        {isRequester && ['Requested', 'Accepted'].includes(req.status) && (
          <div className="rs-req-actions">
            <button className="rs-btn-reject" onClick={() => openCancelModal(req)}>
              <FaTimesCircle /> Cancel Request
            </button>
          </div>
        )}

        {/* After acceptance: mutual phone reveal for both parties */}
        {req.status === 'Accepted' && (
          <div className="rs-accepted-block">
            <div className="rs-accepted-banner">
              <FaCheckCircle /> Request Accepted! Coordinate directly with the {contactRole}.
            </div>
            <div className="rs-contact-panel">
              <div className="rs-contact-info">
                <FaUser /> <strong>{contactName}</strong>
              </div>
              {contactPhone ? (
                <a href={telHref} className="rs-btn-call-owner">
                  <FaPhoneAlt /> Call {contactRole}: {contactPhone}
                </a>
              ) : (
                <span className="rs-no-phone">No phone number on file</span>
              )}
            </div>
            {(isRequester || isOwner) && (
              <button className="rs-btn-inprogress" onClick={() => handleMarkInProgress(req.id, req.toolId, req.toolOwnerId)}>
                <FaTractor /> Start Work (Mark In Progress)
              </button>
            )}
            {canReport && (
              <button
                className="rs-btn-report"
                disabled={alreadyReportedThisPerson}
                style={alreadyReportedThisPerson ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                onClick={() => {
                  if (alreadyReportedThisPerson) {
                    toastWarning('You already reported this person.');
                    return;
                  }
                  setReportModal(req);
                  setReportForm({ reason: '', details: '' });
                }}>
                {alreadyReportedThisPerson ? '✅ Already Reported' : '🚩 Report an Issue'}
              </button>
            )}
          </div>
        )}

        {/* In Progress */}
        {req.status === 'In Progress' && (
          <div className="rs-accepted-block">
            <div className="rs-accepted-banner" style={{ background: '#fef9c3', color: '#b45309' }}>
              <FaTractor /> Work is In Progress!
            </div>
            <div className="rs-contact-panel">
              {contactPhone ? (
                <a href={telHref} className="rs-btn-call-owner">
                  <FaPhoneAlt /> Call {contactRole}: {contactPhone}
                </a>
              ) : (
                <span className="rs-no-phone">No phone number on file</span>
              )}
            </div>
            {isRequester && (
              <button className="rs-btn-complete" onClick={() => handleMarkCompleted(req.id, req.toolId, req.toolOwnerId)}>
                <FaCheckCircle /> Task Completed — Mark as Done
              </button>
            )}
            {canReport && (
              <button
                className="rs-btn-report"
                disabled={alreadyReportedThisPerson}
                style={alreadyReportedThisPerson ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                onClick={() => {
                  if (alreadyReportedThisPerson) {
                    toastWarning('You already reported this person.');
                    return;
                  }
                  setReportModal(req);
                  setReportForm({ reason: '', details: '' });
                }}>
                {alreadyReportedThisPerson ? '✅ Already Reported' : '🚩 Report an Issue'}
              </button>
            )}
          </div>
        )}

        {req.status === 'Completed' && (
          <div className="rs-accepted-block">
            <div className="rs-accepted-banner" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <FaCheckCircle /> Task Completed. Tool is back Open for others.
            </div>

            {isRequester && !req.reviewSubmitted && (
              <div style={{ marginTop: 12, padding: 12, border: '1px solid #dbeafe', borderRadius: 10, background: '#f8fbff' }}>
                {!showReviewForm ? (
                  <button className="rs-btn-inprogress" style={{ background: '#2563eb' }} onClick={() => setShowReviewForm(true)}>
                    ⭐ Submit Review
                  </button>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.9rem' }}>Rating</label>
                      <select value={reviewRating} onChange={e => setReviewRating(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <option value="5">5</option>
                        <option value="4">4</option>
                        <option value="3">3</option>
                        <option value="2">2</option>
                        <option value="1">1</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Write your experience (optional)..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      style={{ width: '100%', minHeight: 74, borderRadius: 8, border: '1px solid #bfdbfe', padding: 8, marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="rs-btn-approve"
                        disabled={reviewSubmitting}
                        onClick={async () => {
                          setReviewSubmitting(true);
                          await handleSubmitResourceReview(req.id, reviewRating, reviewComment);
                          setReviewSubmitting(false);
                          setShowReviewForm(false);
                        }}>
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button className="rs-btn-cancel-offer" onClick={() => setShowReviewForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isRequester && req.reviewSubmitted && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#ecfdf5', color: '#166534', fontWeight: 700 }}>
                ⭐ Your review: {req.reviewRating}/5 {req.reviewComment ? `— ${req.reviewComment}` : ''}
              </div>
            )}

            {canReport && (
              <button
                className="rs-btn-report"
                disabled={alreadyReportedThisPerson}
                style={alreadyReportedThisPerson ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                onClick={() => {
                  if (alreadyReportedThisPerson) {
                    toastWarning('You already reported this person.');
                    return;
                  }
                  setReportModal(req);
                  setReportForm({ reason: '', details: '' });
                }}>
                {alreadyReportedThisPerson ? '✅ Already Reported' : '🚩 Report an Issue'}
              </button>
            )}
          </div>
        )}

        {req.status === 'Rejected' && (
          <div className="rs-accepted-banner" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <FaTimesCircle /> This request was declined.
          </div>
        )}

        {req.status === 'Cancelled' && (
          <div className="rs-accepted-banner" style={{ background: '#f1f5f9', color: '#334155' }}>
            <FaTimesCircle /> This request was cancelled.
          </div>
        )}
      </div>
    );
  };

  /* ── render ── */
  return (
    <div className="resource-share-page">
      <div className="resource-container">

        {/* ═══════ TAB NAVIGATION BAR ═══════ */}
        <div className="rs-top-action-bar">
          <button 
            className={`rs-tab-action-btn ${activeTab === 'browse' ? 'rs-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('browse')}>
            <FaSearch /> Browse Tools
          </button>
          <button 
            className={`rs-tab-action-btn ${activeTab === 'requests' ? 'rs-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('requests')}>
            <FaBell /> My Requests
            {rentalRequests.filter(r => (r.toolOwnerId === currentUser?.uid || r.requesterId === currentUser?.uid) && ['Requested', 'Accepted', 'In Progress'].includes(r.status)).length > 0 && (
              <span className="rs-tab-action-badge">
                {rentalRequests.filter(r => (r.toolOwnerId === currentUser?.uid || r.requesterId === currentUser?.uid) && ['Requested', 'Accepted', 'In Progress'].includes(r.status)).length}
              </span>
            )}
          </button>
          <button 
            className={`rs-tab-action-btn ${activeTab === 'my-tools' ? 'rs-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('my-tools')}>
            <FaBoxOpen /> My Tools
          </button>
          <button 
            className="rs-tab-add-btn"
            onClick={() => setActiveTab('list')}>
            <FaPlus /> Add Tool
          </button>
        </div>

        {/* ═══════ MY LISTINGS TAB ═══════ */}
        {activeTab === 'my-tools' && (() => {
          const myTools = userTools.filter(t => t.ownerId === currentUser?.uid);
          return (
            <div className="rs-my-listings-wrap">
              <div className="rs-my-listings-header">
                <div>
                  <h2 className="rs-my-listings-title"><FaBoxOpen /> My Listed Tools</h2>
                  <p className="rs-my-listings-sub">{myTools.length} tool{myTools.length !== 1 ? 's' : ''} listed by you</p>
                </div>
                <button className="rs-my-listings-add-btn" onClick={() => setActiveTab('list')}>
                  <FaPlus /> Add New Tool
                </button>
              </div>

              {myTools.length === 0 ? (
                <div className="no-results">
                  <FaTools size={48} />
                  <h3>No Tools Listed Yet</h3>
                  <p>List your farming equipment and start getting rental requests.</p>
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('list')}>
                    <FaPlus /> Add Your First Tool
                  </button>
                </div>
              ) : (
                <div className="rs-my-listings-grid">
                  {myTools.map(tool => {
                    const img = resolveImage(tool);
                    const meta = CATEGORY_META[tool.category] || {};
                    const isAvailNow = tool.availability === 'Available';
                    const priceLabel = tool.priceAmount
                      ? `₹${tool.priceAmount}/${tool.priceUnit || 'hour'}`
                      : tool.costPerHour ? `₹${tool.costPerHour}/hour` : '';
                    const pendingReqs = rentalRequests.filter(r => r.toolId === tool.id && r.status === 'Requested').length;
                    return (
                      <div key={tool.id} className="rs-mlc">
                        <div className="rs-mlc-img-wrap">
                          {img ? (
                            <img
                              src={img}
                              alt={tool.toolName || tool.name}
                              className="rs-mlc-img"
                              onError={e => { e.target.onerror = null; e.target.src = TOOL_IMAGE_BY_NAME[((tool.toolName || tool.name || '').trim().toLowerCase())] || meta.fallback || ''; }}
                            />
                          ) : (
                            <div className="rs-mlc-img-placeholder" style={{ color: meta.color || '#16a34a' }}>
                              <FaTools size={44} />
                            </div>
                          )}
                          <div className={`rs-mlc-status ${isAvailNow ? 'rs-mlc-status-open' : 'rs-mlc-status-busy'}`}>
                            {isAvailNow ? <FaCheckCircle /> : <FaTimesCircle />} {tool.availability}
                          </div>
                          {pendingReqs > 0 && (
                            <button
                              type="button"
                              className="rs-mlc-req-badge rs-mlc-req-badge-btn"
                              onClick={() => setActiveTab('requests')}
                              title="View rental requests">
                              <FaBell /> {pendingReqs} Request{pendingReqs > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>

                        <div className="rs-mlc-body">
                          <div className="rs-mlc-name">{tool.toolName || tool.name}</div>
                          <div
                            className="rs-mlc-cat"
                            style={{ background: (meta.color || '#16a34a') + '18', color: meta.color || '#16a34a' }}>
                            {meta.emoji || '🔧'} {tool.category}
                          </div>

                          <div className="rs-mlc-info-rows">
                            {priceLabel && (
                              <div className="rs-mlc-info-row">
                                <FaRupeeSign className="rs-mlc-info-icon" /> {priceLabel}
                              </div>
                            )}
                            <div className="rs-mlc-info-row">
                              <FaMapMarkerAlt className="rs-mlc-info-icon" />
                              {[tool.village, tool.district, tool.state].filter(Boolean).join(', ') || 'Location not set'}
                            </div>
                            {tool.phone && (
                              <div className="rs-mlc-info-row">
                                <FaPhone className="rs-mlc-info-icon" /> {tool.phone}
                              </div>
                            )}
                          </div>

                          <div className="rs-mlc-actions">
                            <button className="rs-mlc-btn rs-mlc-btn-edit" onClick={() => openEditTool(tool)}>
                              <FaAlignLeft /> Edit / Status
                            </button>
                            <button className="rs-mlc-btn rs-mlc-btn-del" onClick={() => handleDeleteTool(tool.id)}>
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════ BROWSE TAB ═══════ */}
        {activeTab === 'browse' && (
          <div className="rs-browse-layout">

            {/* ── Mobile sidebar overlay backdrop ── */}
            {sidebarOpen && (
              <div className="rs-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── LEFT SIDEBAR ── */}
            <aside className={`rs-sidebar ${sidebarOpen ? 'rs-sidebar-open' : ''}`}>

              {/* Header */}
              <div className="rs-sidebar-header">
                <div className="rs-sidebar-header-left">
                  <span>Filters & Sort</span>
                  {activeFilterCount > 0 && (
                    <span className="rs-filter-badge">{activeFilterCount}</span>
                  )}
                </div>

              </div>

              {/* Search */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Search</div>
                <div className="rs-search-box">
                  <input type="text" className="rs-search-input"
                    placeholder="Name, owner, location…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} />
                  {searchTerm && (
                    <button className="rs-search-clear" onClick={() => setSearchTerm('')}>✕</button>
                  )}
                </div>
              </div>

              {/* Sort */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Sort By</div>
                <div className="rs-sort-pills">
                  {[
                    { key: 'default',    label: '📍 Nearby' },
                    { key: 'price-asc',  label: '₹ Low→High' },
                    { key: 'price-desc', label: '₹ High→Low' },
                    { key: 'rating',     label: '⭐ Rating' },
                    { key: 'bookings',   label: '🔥 Popular' },
                  ].map(s => (
                    <button key={s.key}
                      className={`rs-sort-pill ${sortBy === s.key ? 'rs-sort-pill-active' : ''}`}
                      onClick={() => setSortBy(s.key)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Category</div>
                <div className="rs-category-grid">
                  <button
                    className={`rs-cat-chip ${selectedCategory === 'all' ? 'rs-cat-chip-active' : ''}`}
                    onClick={() => setSelectedCategory('all')}>
                    <span className="rs-cat-emoji">🌾</span>
                    <span className="rs-cat-label">All</span>
                  </button>
                  {CATEGORY_ORDER.map(cat => {
                    const meta = CATEGORY_META[cat] || {};
                    return (
                      <button key={cat}
                        className={`rs-cat-chip ${selectedCategory === cat ? 'rs-cat-chip-active' : ''}`}
                        style={selectedCategory === cat ? { borderColor: meta.color, background: meta.color + '18' } : {}}
                        onClick={() => setSelectedCategory(cat)}>
                        <span className="rs-cat-emoji">{meta.emoji}</span>
                        <span className="rs-cat-label">{cat.replace(' Equipment','').replace(' Technology','Tech').replace('Post-Harvest','Post‑Harv.')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Availability</div>
                {[
                  { val: 'all',               label: 'All',               dot: '#94a3b8' },
                  { val: 'Available',         label: 'Available',         dot: '#16a34a' },
                  { val: 'Requested',         label: 'Requested',         dot: '#d97706' },
                  { val: 'Rented',            label: 'In Use',            dot: '#dc2626' },
                  { val: 'Under Maintenance', label: 'Maintenance',       dot: '#7c3aed' },
                ].map(({ val, label, dot }) => (
                  <button key={val}
                    className={`rs-avail-row ${selectedAvailability === val ? 'rs-avail-active' : ''}`}
                    onClick={() => setSelectedAvailability(val)}>
                    <span className="rs-avail-dot" style={{ background: dot }} />
                    <span className="rs-avail-label">{label}</span>
                    {selectedAvailability === val && <span className="rs-avail-check">✓</span>}
                  </button>
                ))}
              </div>

              {/* Price Range */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Max Price</div>
                <div className="rs-price-display">
                  <span className="rs-price-val">Up to <strong>₹{priceRange[1]}</strong>/unit</span>
                  {priceRange[1] < 2000 && (
                    <button className="rs-price-reset" onClick={() => setPriceRange([0, 2000])}>Reset</button>
                  )}
                </div>
                <input type="range" className="rs-price-slider" min={0} max={2000} step={50}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([0, Number(e.target.value)])} />
                <div className="rs-price-ticks">
                  <span>₹0</span><span>₹500</span><span>₹1000</span><span>₹1500</span><span>₹2000+</span>
                </div>
              </div>

              {/* Location */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Location</div>
                <div className="rs-toggle-row">
                  <span className="rs-toggle-label">My district only</span>
                  <button
                    className={`rs-toggle-switch ${locationPref === 'myDistrict' ? 'rs-toggle-on' : ''}`}
                    onClick={() => setLocationPref(locationPref === 'myDistrict' ? 'all' : 'myDistrict')}>
                    <span className="rs-toggle-knob" />
                  </button>
                </div>
                {!myDistrict && locationPref === 'myDistrict' && (
                  <p className="rs-sidebar-hint">⚠️ Add your district in Profile to use this.</p>
                )}
              </div>

              {/* With Operator */}
              <div className="rs-sidebar-group">
                <div className="rs-sidebar-group-title">Operator</div>
                <div className="rs-toggle-row">
                  <span className="rs-toggle-label">Includes operator</span>
                  <button
                    className={`rs-toggle-switch ${withOperatorFilter ? 'rs-toggle-on' : ''}`}
                    onClick={() => setWithOperatorFilter(v => !v)}>
                    <span className="rs-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="rs-sidebar-footer">
                <div className="rs-sidebar-result-count">
                  <strong>{filteredTools.length}</strong> tool{filteredTools.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="rs-main-content">
              {/* Mobile toggle */}
              <button className="rs-sidebar-toggle" onClick={() => setSidebarOpen(v => !v)}>
                {sidebarOpen ? <FaTimes /> : <FaBars />}
                {sidebarOpen ? ' Close Filters' : ' Filters'}
              </button>

              {/* Results summary */}
              <div className="rs-results-summary">
                <span className="rs-results-count">{filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found</span>
              </div>

              {filteredTools.length === 0 ? (
                <div className="no-results">
                  <FaTools />
                  <h3>No Tools Found</h3>
                  <p>Try adjusting your search or filters</p>

                </div>
              ) : (
                <div className="tools-grid">
                  {filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ REQUESTS TAB ═══════ */}
        {activeTab === 'requests' && (() => {
          const myRequests = dedupeRequestsByToolAndRequester(rentalRequests.filter(
            r => r.toolOwnerId === currentUser?.uid || r.requesterId === currentUser?.uid
          ));
          return (
            <div className="rs-requests-page">
              <h2 className="section-title"><FaBell /> My Rental Requests</h2>
              {myRequests.length === 0 ? (
                <div className="no-results">
                  <FaBell />
                  <h3>No Requests Yet</h3>
                  <p>Browse tools and click "Request for Rent" to get started.</p>
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('browse')}>
                    Browse Tools
                  </button>
                </div>
              ) : (
                <div className="rs-requests-list">
                  {[...myRequests].sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
                    .map(req => <RentalRequestCard key={req.id} req={req} />)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════ LIST TOOL TAB ═══════ */}
        {activeTab === 'list' && (() => {
          const PICKER_CATS = [
            { key: 'Heavy Machinery',    label: '🚜 Tractors' },
            { key: 'Tillage Equipment',  label: '🔧 Tillage' },
            { key: 'Harvesting',         label: '🌾 Harvesting' },
            { key: 'Irrigation',         label: '💧 Irrigation' },
            { key: 'Planting Equipment', label: '🌱 Planting' },
            { key: 'Other',              label: '⚙️ Other' },
          ];
          const OTHER_CATS = ['Modern Technology','Hand Tools','Post-Harvest','Transport'];
          const pickerTools = listPickerCat === 'Other'
            ? INITIAL_TOOLS.filter(t => OTHER_CATS.includes(t.category))
            : INITIAL_TOOLS.filter(t => t.category === listPickerCat);

          const resetForm = () => {
            setNewTool({ ...BLANK_TOOL, ...profileDefaults }); setImagePreview('');
            setImageFile(null); setSelectedTemplate(null);
            if (fileRef.current) fileRef.current.value = '';
          };

          return (
            <div className="add-tool-section">
              <h2 className="section-title"><FaPlus /> Add Tool</h2>
              <form className="add-tool-form" onSubmit={e => { e.preventDefault(); handleAddTool(); }}>

                {/* ── STEP 1: Pick a tool ── */}
                <div className="rs-picker-step">
                  <div className="rs-picker-step-label">
                    <span className="rs-step-num">1</span> Select Your Tool
                  </div>

                  {/* Category tabs */}
                  <div className="rs-picker-cats">
                    {PICKER_CATS.map(pc => (
                      <button key={pc.key} type="button"
                        className={`rs-picker-cat-btn ${listPickerCat === pc.key ? 'rs-picker-cat-active' : ''}`}
                        onClick={() => setListPickerCat(pc.key)}>
                        {pc.label}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable horizontal tool cards */}
                  <div className="rs-tool-picker-strip">
                    {pickerTools.map(t => (
                      <button key={t.id} type="button"
                        className={`rs-tool-pick-card ${selectedTemplate?.id === t.id ? 'rs-tool-pick-selected' : ''}`}
                        onClick={() => {
                          setSelectedTemplate(t);
                          setNewTool(p => ({
                            ...p,
                            toolName:    t.name,
                            category:    t.category,
                            description: t.description || '',
                            image:       t.image || '',
                          }));
                        }}>
                        <div className="rs-pick-card-img-wrap">
                          <img src={t.image} alt={t.name} className="rs-pick-card-img"
                            onError={e => { e.target.style.display='none'; }} />
                          {selectedTemplate?.id === t.id && (
                            <div className="rs-pick-card-check"><FaCheckCircle /></div>
                          )}
                        </div>
                        <span className="rs-pick-card-name">{t.name}</span>
                      </button>
                    ))}
                    {/* Other / Custom card */}
                    <button type="button"
                      className={`rs-tool-pick-card rs-tool-pick-card-custom ${selectedTemplate?.id === 'custom' ? 'rs-tool-pick-selected' : ''}`}
                      onClick={() => {
                        const cat = listPickerCat === 'Other' ? 'Hand Tools' : listPickerCat;
                        setSelectedTemplate({ id: 'custom', name: '', category: cat });
                        setNewTool(p => ({ ...p, toolName: '', category: cat, description: '', image: '' }));
                      }}>
                      <div className="rs-pick-card-img-wrap rs-pick-card-custom-icon">
                        <FaPlus size={26} />
                      </div>
                      <span className="rs-pick-card-name">Other / Custom</span>
                    </button>
                  </div>

                  {/* Custom name input */}
                  {selectedTemplate?.id === 'custom' && (
                    <div className="form-group full-width" style={{ marginTop: 12 }}>
                      <label className="form-label"><FaTools /> Tool Name <span className="p2p-required">*</span></label>
                      <input type="text" className="form-input"
                        placeholder="e.g., My Old Thresher, Custom Cultivator..."
                        value={newTool.toolName}
                        onChange={e => setNewTool(p => ({ ...p, toolName: e.target.value }))} required />
                    </div>
                  )}

                  {/* Selected confirmation */}
                  {selectedTemplate && selectedTemplate.id !== 'custom' && (
                    <div className="rs-selected-tool-banner">
                      <FaCheckCircle />
                      <strong>{selectedTemplate.name}</strong> selected
                      <button type="button" className="rs-deselect-btn" onClick={resetForm}>
                        <FaTimes /> Change
                      </button>
                    </div>
                  )}
                </div>

                {/* ── STEP 2: Price & Details (only shown after tool picked) ── */}
                {selectedTemplate && (
                  <>
                    <div className="rs-picker-step-label" style={{ marginTop: 22 }}>
                      <span className="rs-step-num">2</span> Set Price &amp; Details
                    </div>

                    {/* Rent Price */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><FaRupeeSign /> Rent Price <span className="p2p-required">*</span></label>
                        <input type="number" className="form-input" placeholder="e.g., 500"
                          value={newTool.priceAmount}
                          onChange={e => setNewTool(p => ({ ...p, priceAmount: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Per</label>
                        <select className="form-select" value={newTool.priceUnit}
                          onChange={e => setNewTool(p => ({ ...p, priceUnit: e.target.value }))}>
                          <option value="hour">⏱ Hour</option>
                          <option value="day">📅 Day</option>
                          <option value="acre">🌾 Acre</option>
                        </select>
                      </div>
                    </div>

                    {/* With Operator toggle */}
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label className="form-label"><FaUserTie /> With Operator?</label>
                        <div className="rs-service-toggle">
                          <button type="button"
                            className={`rs-service-option ${!newTool.withOperator ? 'rs-service-active' : ''}`}
                            onClick={() => setNewTool(p => ({ ...p, withOperator: false }))}>
                            <FaTools className="rs-service-icon" />
                            <span className="rs-service-label">Tool Only</span>
                            <span className="rs-service-desc">Renter operates themselves</span>
                          </button>
                          <button type="button"
                            className={`rs-service-option ${newTool.withOperator ? 'rs-service-active rs-service-active-op' : ''}`}
                            onClick={() => setNewTool(p => ({ ...p, withOperator: true }))}>
                            <FaUserTie className="rs-service-icon" />
                            <span className="rs-service-label">With Operator</span>
                            <span className="rs-service-desc">I'll come and operate it</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="form-group full-width">
                      <label className="form-label"><FaAlignLeft /> Description</label>
                      <textarea className="form-textarea"
                        placeholder="Describe condition, horsepower, capacity, availability..."
                        value={newTool.description}
                        onChange={e => setNewTool(p => ({ ...p, description: e.target.value }))} />
                    </div>

                    {/* Photo upload */}
                    <div className="rs-image-upload-section">
                      <label className="form-label"><FaImage /> Your Photo (optional — replaces default)</label>
                      <div className="rs-image-upload-area" onClick={() => fileRef.current.click()}>
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="rs-image-preview" />
                        ) : selectedTemplate.image && selectedTemplate.id !== 'custom' ? (
                          <div className="rs-upload-placeholder rs-upload-with-default">
                            <img src={selectedTemplate.image} alt="default" className="rs-default-preview" />
                            <span>Click to use your own photo</span>
                          </div>
                        ) : (
                          <div className="rs-upload-placeholder">
                            <FaUpload size={32} />
                            <span>Click to upload a photo</span>
                            <small>JPG, PNG (max 5 MB)</small>
                          </div>
                        )}
                        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleImageChange} />
                      </div>
                      {imagePreview && (
                        <p className="rs-image-chosen">
                          <FaCheckCircle style={{ color: '#16a34a' }} /> Photo selected.
                          <button type="button" className="rs-remove-img" onClick={() => {
                            setImagePreview(''); setImageFile(null);
                            if (fileRef.current) fileRef.current.value = '';
                          }}>Remove</button>
                        </p>
                      )}
                    </div>

                    {/* Contact & Location — pre-filled from profile, editable */}
                    <div className="rs-profile-autofill-banner">
                      <FaUser /> Pre-filled from your profile — edit if needed
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><FaUser /> Your Name <span className="p2p-required">*</span></label>
                        <input type="text" className="form-input"
                          placeholder="Your full name"
                          value={newTool.owner}
                          onChange={e => setNewTool(p => ({ ...p, owner: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label"><FaPhone /> Phone <span className="p2p-required">*</span></label>
                        <input type="tel" className="form-input"
                          placeholder="+91 9876543210"
                          value={newTool.phone}
                          onChange={e => setNewTool(p => ({ ...p, phone: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><FaMapMarkerAlt /> State <span className="p2p-required">*</span></label>
                        <select className="form-select"
                          value={newTool.state}
                          onChange={e => setNewTool(p => ({ ...p, state: e.target.value, district: '' }))}
                          required>
                          <option value="">
                            -- Select State --
                          </option>
                          {RESOURCE_ALLOWED_STATES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <small style={{ color: '#64748b', marginTop: 6, display: 'block' }}>
                          Available states are limited to Consumer dashboard regions.
                        </small>
                      </div>
                      <div className="form-group">
                        <label className="form-label"><FaMapMarkerAlt /> District <span className="p2p-required">*</span></label>
                        <select className="form-select"
                          value={newTool.district}
                          onChange={e => setNewTool(p => ({ ...p, district: e.target.value }))} required
                          disabled={!newTool.state}>
                          <option value="">-- Select District --</option>
                          {(STATE_DISTRICTS[newTool.state] || []).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><FaMapMarkerAlt /> Village / Area</label>
                        <input type="text" className="form-input"
                          placeholder="e.g., Gachibowli"
                          value={newTool.village}
                          onChange={e => setNewTool(p => ({ ...p, village: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label"><FaMapMarkerAlt /> House / Door No.</label>
                        <input type="text" className="form-input"
                          placeholder="e.g., 12-3/4, Door No. 7"
                          value={newTool.houseNo || ''}
                          onChange={e => setNewTool(p => ({ ...p, houseNo: e.target.value }))} />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-submit"
                        disabled={listingTool || !newTool.toolName || !newTool.priceAmount || !newTool.owner || !newTool.phone || !newTool.district || !newTool.state}>
                        {listingTool ? <><FaSpinner /> Adding...</> : <><FaCheckCircle /> Add Tool</>}
                      </button>
                      <button type="button" className="btn-cancel" onClick={resetForm}>
                        <FaTimesCircle /> Clear
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          );
        })()}

      </div>

    {/* ═══════ RENT REQUEST MODAL ═══════ */}
    {rentModalTool && (
      <div className="rs-modal-backdrop" onClick={closeRentModal}>
        <div className="rs-modal" onClick={e => e.stopPropagation()}>
          <div className="rs-modal-header">
            <div className="rs-modal-title-block">
              <h2 className="rs-modal-title">Request for Rent</h2>
              <p className="rs-modal-tool-name">{rentModalTool.toolName || rentModalTool.name}</p>
            </div>
            <button className="rs-modal-close" onClick={closeRentModal}><FaTimes /></button>
          </div>

          {/* Date of Use */}
          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaCalendarAlt /> Date of Use <span className="p2p-required">*</span></label>
            <input type="date" className="rs-modal-input"
              min={new Date().toISOString().split('T')[0]}
              value={rentForm.dateOfUse}
              onChange={e => setRentForm(p => ({ ...p, dateOfUse: e.target.value }))} />
          </div>

          {/* Duration */}
          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaRegClock /> Duration <span className="p2p-required">*</span></label>
            <div className="rs-modal-row">
              <div className="rs-duration-toggle">
                {['hours','days'].map(t => (
                  <button key={t} type="button"
                    className={`rs-dur-btn ${rentForm.durationType === t ? 'rs-dur-active' : ''}`}
                    onClick={() => setRentForm(p => ({ ...p, durationType: t }))}>
                    {t === 'hours' ? '⏱ Hours' : '📅 Days'}
                  </button>
                ))}
              </div>
              <input type="number" min="1" className="rs-modal-input rs-dur-input"
                placeholder={`How many ${rentForm.durationType}?`}
                value={rentForm.duration}
                onChange={e => setRentForm(p => ({ ...p, duration: e.target.value }))} />
            </div>
          </div>

          {/* Total Estimated Hours (auto) */}
          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaTachometerAlt /> Total Estimated Hours (auto-calculated)</label>
            <input
              type="text"
              className="rs-modal-input"
              value={
                rentForm.duration
                  ? `${getEstimatedHours(rentForm.duration, rentForm.durationType)} hrs`
                  : 'Enter duration to auto-calculate'
              }
              readOnly
            />
            {rentForm.duration && (rentModalTool?.priceAmount || rentModalTool?.costPerHour) && (
              <p className="rs-modal-cost-hint">
                💡 Estimated cost: ₹{(
                  getEstimatedHours(rentForm.duration, rentForm.durationType) *
                  parseFloat(rentModalTool.priceAmount || rentModalTool.costPerHour)
                ).toLocaleString('en-IN')}
                {' '}(at ₹{rentModalTool.priceAmount || rentModalTool.costPerHour}/{rentModalTool.priceUnit || 'hour'})
              </p>
            )}
          </div>

          {/* Requester Phone */}
          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaPhone /> Your Phone Number <span className="p2p-required">*</span></label>
            <input type="tel" className="rs-modal-input"
              placeholder="Enter your 10-digit mobile number"
              value={rentForm.requesterPhone}
              onChange={e => setRentForm(p => ({ ...p, requesterPhone: e.target.value }))}
              style={!rentForm.requesterPhone ? { borderColor: '#f59e0b' } : {}} />
            <p style={{ fontSize: '0.75rem', color: rentForm.requesterPhone ? '#16a34a' : '#b45309', marginTop: 4, fontWeight: 500 }}>
              {rentForm.requesterPhone
                ? '✅ Phone entered — owner will call you after approval.'
                : '⚠️ Required: Type your mobile number so the owner can contact you.'}
            </p>
          </div>

          {/* Work Conditions Note */}
          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaStickyNote /> Work Conditions Note</label>
            <textarea className="rs-modal-textarea"
              placeholder="e.g., Soil is very hard, Paddy field is muddy, Hilly terrain..."
              rows={3}
              value={rentForm.workNote}
              onChange={e => setRentForm(p => ({ ...p, workNote: e.target.value }))} />
          </div>

          {/* Owner info bar */}
          <div className="rs-modal-owner-bar">
            <div className="rs-modal-owner-info">
              <FaUser className="rs-modal-owner-icon" />
              <span className="rs-modal-owner-name">{rentModalTool.owner}</span>
              <span className="rs-modal-owner-location">{[rentModalTool.district, rentModalTool.state].filter(Boolean).join(', ')}</span>
            </div>
            <div className="rs-modal-row-price">
              ₹{rentModalTool.priceAmount || rentModalTool.costPerHour}/{rentModalTool.priceUnit || 'hour'}
            </div>
          </div>

          {/* Actions */}
          <div className="rs-modal-actions">
            <button className="rs-modal-btn-primary"
              disabled={rentSubmitting || !rentForm.dateOfUse || !rentForm.duration}
              onClick={handleRentRequest}>
              {rentSubmitting ? <><FaSpinner /> Sending...</> : <><FaHandshake /> Send Request</>}
            </button>
            <button className="rs-modal-btn-cancel" onClick={closeRentModal}>
              <FaTimesCircle /> Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════ REPORT / COMPLAINT MODAL ══════ */}
    {reportModal && (
      <div className="rs-modal-backdrop" onClick={() => setReportModal(null)}>
        <div className="rs-modal rs-report-modal" onClick={e => e.stopPropagation()}>
          <div className="rs-modal-header">
            <div className="rs-modal-title-block">
              <h2 className="rs-modal-title">🚩 Report an Issue</h2>
              <p className="rs-modal-tool-name">{reportModal.toolName}</p>
            </div>
            <button className="rs-modal-close" onClick={() => setReportModal(null)}><FaTimes /></button>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label">Reason <span className="p2p-required">*</span></label>
            <select className="rs-modal-input"
              value={reportForm.reason}
              onChange={e => setReportForm(p => ({ ...p, reason: e.target.value }))}>
              <option value="">-- Select a reason --</option>
              <option value="No-Show">No-Show (Farmer didn't arrive)</option>
              <option value="Tool Damage">Tool Damage</option>
              <option value="Bad Behaviour">Bad Behaviour / Misconduct</option>
              <option value="Tool Not As Described">Tool Not As Described</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label">Details (optional)</label>
            <textarea className="rs-modal-textarea"
              placeholder="Describe what happened..."
              rows={4}
              value={reportForm.details}
              onChange={e => setReportForm(p => ({ ...p, details: e.target.value }))} />
          </div>

          <div className="rs-modal-actions">
            <button className="rs-modal-btn-primary rs-btn-report-submit"
              disabled={reportSubmitting || !reportForm.reason}
              onClick={handleSubmitReport}>
              {reportSubmitting ? <><FaSpinner /> Submitting...</> : <>📋 Submit Report</>}
            </button>
            <button className="rs-modal-btn-cancel" onClick={() => setReportModal(null)}>
              <FaTimesCircle /> Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════ CANCEL REQUEST MODAL ══════ */}
    {cancelModal && (
      <div className="rs-modal-backdrop" onClick={() => setCancelModal(null)}>
        <div className="rs-modal rs-report-modal" onClick={e => e.stopPropagation()}>
          <div className="rs-modal-header">
            <div className="rs-modal-title-block">
              <h2 className="rs-modal-title">❌ Cancel Request</h2>
              <p className="rs-modal-tool-name">{cancelModal.toolName}</p>
            </div>
            <button className="rs-modal-close" onClick={() => setCancelModal(null)}><FaTimes /></button>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label">Reason <span className="p2p-required">*</span></label>
            <select
              className="rs-modal-input"
              value={cancelForm.reason}
              onChange={e => setCancelForm(p => ({ ...p, reason: e.target.value }))}
            >
              <option value="">-- Select a reason --</option>
              <option value="Changed Plan">Changed Plan</option>
              <option value="Found Another Tool">Found Another Tool</option>
              <option value="Owner Not Responding">Owner Not Responding</option>
              <option value="Price Too High">Price Too High</option>
              <option value="Wrong Request Details">Wrong Request Details</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label">Additional details (optional)</label>
            <textarea
              className="rs-modal-textarea"
              placeholder="Add context for cancellation..."
              rows={4}
              value={cancelForm.details}
              onChange={e => setCancelForm(p => ({ ...p, details: e.target.value }))}
            />
          </div>

          <div className="rs-modal-actions">
            <button
              className="rs-modal-btn-primary"
              disabled={cancelSubmitting || !cancelForm.reason}
              onClick={handleCancelRequest}
            >
              {cancelSubmitting ? <><FaSpinner /> Cancelling...</> : <><FaTimesCircle /> Confirm Cancel</>}
            </button>
            <button className="rs-modal-btn-cancel" onClick={() => setCancelModal(null)}>
              Keep Request
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════ DISTRICT WARNING MODAL ══════ */}
    {districtWarnTool && (
      <div className="rs-modal-backdrop" onClick={() => setDistrictWarnTool(null)}>
        <div className="rs-modal rs-warn-modal" onClick={e => e.stopPropagation()}>
          <div className="rs-warn-icon"><FaExclamationTriangle /></div>
          <h2 className="rs-warn-title">Different District</h2>
          <p className="rs-warn-body">
            This resource (<strong>{districtWarnTool.toolName || districtWarnTool.name}</strong>) is
            located in <strong>{districtWarnTool.district}</strong>.
            Proceed only if you can manage transport coordination on your own.
          </p>
          <div className="rs-warn-actions">
            <button className="rs-btn-warn-proceed" onClick={proceedDespiteWarning}>
              <FaHandshake /> Proceed Anyway
            </button>
            <button className="rs-modal-btn-cancel" onClick={() => setDistrictWarnTool(null)}>
              <FaTimesCircle /> Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════ EDIT TOOL MODAL ══════ */}
    {editingTool && (
      <div className="rs-modal-backdrop" onClick={() => setEditingTool(null)}>
        <div className="rs-modal rs-edit-modal" onClick={e => e.stopPropagation()}>
          <div className="rs-modal-header">
            <div className="rs-modal-title-block">
              <h2 className="rs-modal-title">Edit Tool</h2>
              <p className="rs-modal-tool-name">{editingTool.toolName || editingTool.name}</p>
            </div>
            <button className="rs-modal-close" onClick={() => setEditingTool(null)}><FaTimes /></button>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaTools /> Tool Name</label>
            <input
              className="rs-modal-input"
              value={editForm.toolName || ''}
              onChange={e => setEditForm(p => ({ ...p, toolName: e.target.value }))}
            />
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaRupeeSign /> Price</label>
            <div className="rs-modal-row">
              <input
                type="number"
                className="rs-modal-input"
                value={editForm.priceAmount || ''}
                onChange={e => setEditForm(p => ({ ...p, priceAmount: e.target.value }))}
              />
              <select
                className="rs-modal-input"
                value={editForm.priceUnit || 'hour'}
                onChange={e => setEditForm(p => ({ ...p, priceUnit: e.target.value }))}
              >
                <option value="hour">hour</option>
                <option value="day">day</option>
                <option value="acre">acre</option>
              </select>
            </div>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaEye /> Availability</label>
            <select
              className="rs-modal-input"
              value={editForm.availability || 'Available'}
              onChange={e => setEditForm(p => ({ ...p, availability: e.target.value }))}
            >
              <option value="Available">Set Available</option>
              <option value="Under Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaPhone /> Phone</label>
            <input
              className="rs-modal-input"
              value={editForm.phone || ''}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="rs-modal-section">
            <label className="rs-modal-label"><FaAlignLeft /> Description</label>
            <textarea
              className="rs-modal-textarea"
              rows={3}
              value={editForm.description || ''}
              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="rs-modal-actions">
            <button
              className="rs-modal-btn-primary"
              disabled={savingEdit || !editForm.toolName}
              onClick={handleSaveEdit}
            >
              {savingEdit ? <><FaSpinner /> Saving...</> : <><FaCheckCircle /> Save Changes</>}
            </button>
            <button className="rs-modal-btn-cancel" onClick={() => setEditingTool(null)}>
              <FaTimesCircle /> Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default ResourceSharePage;

