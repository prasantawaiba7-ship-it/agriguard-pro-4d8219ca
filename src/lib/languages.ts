export type Language = 'en' | 'ne' | 'tamang' | 'newar' | 'maithili' | 'magar' | 'rai';

export const languages: Record<Language, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  ne: { name: 'Nepali', nativeName: 'नेपाली' },
  tamang: { name: 'Tamang', nativeName: 'तामाङ' },
  newar: { name: 'Newar', nativeName: 'नेवारी' },
  maithili: { name: 'Maithili', nativeName: 'मैथिली' },
  magar: { name: 'Magar', nativeName: 'मगर' },
  rai: { name: 'Rai', nativeName: 'राई' },
};

// Nepal Provinces
export const nepalProvinces = [
  { name: 'Koshi Province', nepaliName: 'कोशी प्रदेश', capital: 'Biratnagar' },
  { name: 'Madhesh Province', nepaliName: 'मधेश प्रदेश', capital: 'Janakpur' },
  { name: 'Bagmati Province', nepaliName: 'बागमती प्रदेश', capital: 'Hetauda' },
  { name: 'Gandaki Province', nepaliName: 'गण्डकी प्रदेश', capital: 'Pokhara' },
  { name: 'Lumbini Province', nepaliName: 'लुम्बिनी प्रदेश', capital: 'Butwal' },
  { name: 'Karnali Province', nepaliName: 'कर्णाली प्रदेश', capital: 'Birendranagar' },
  { name: 'Sudurpashchim Province', nepaliName: 'सुदूरपश्चिम प्रदेश', capital: 'Godawari' },
];

// Nepal Districts by Province (all 77 districts)
export const nepalDistricts: Record<string, string[]> = {
  'Koshi Province': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh Province': ['Saptari', 'Siraha', 'Dhanusha', 'Mahottari', 'Sarlahi', 'Rautahat', 'Bara', 'Parsa'],
  'Bagmati Province': ['Sindhuli', 'Ramechhap', 'Dolakha', 'Bhaktapur', 'Dhading', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Nuwakot', 'Rasuwa', 'Sindhupalchok', 'Chitwan', 'Makwanpur'],
  'Gandaki Province': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini Province': ['Kapilvastu', 'Parasi', 'Rupandehi', 'Palpa', 'Arghakhanchi', 'Gulmi', 'Rolpa', 'Rukum East', 'Pyuthan', 'Dang', 'Banke', 'Bardiya'],
  'Karnali Province': ['Dolpa', 'Humla', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Dailekh', 'Jajarkot', 'Rukum West'],
  'Sudurpashchim Province': ['Kailali', 'Achham', 'Doti', 'Bajhang', 'Bajura', 'Kanchanpur', 'Dadeldhura', 'Baitadi', 'Darchula'],
};

// Ward numbers for different municipality types
export const wardNumbersByType: Record<'metro' | 'sub-metro' | 'municipality' | 'rural', number[]> = {
  'metro': Array.from({ length: 35 }, (_, i) => i + 1), // 1-35 wards for metropolitan cities
  'sub-metro': Array.from({ length: 23 }, (_, i) => i + 1), // 1-23 wards for sub-metropolitan cities
  'municipality': Array.from({ length: 15 }, (_, i) => i + 1), // 1-15 wards for municipalities
  'rural': Array.from({ length: 9 }, (_, i) => i + 1), // 1-9 wards for rural municipalities
};

// Get wards for a specific municipality
export const getWardsForMunicipality = (municipalityType: 'metro' | 'sub-metro' | 'municipality' | 'rural'): number[] => {
  return wardNumbersByType[municipalityType];
};

// Municipality ward data with exact ward counts (key municipalities)
export const municipalityWardCounts: Record<string, number> = {
  // Metropolitan Cities
  'Kathmandu Metropolitan City': 32,
  'Lalitpur Metropolitan City': 29,
  'Biratnagar Metropolitan City': 19,
  'Pokhara Metropolitan City': 33,
  'Bharatpur Metropolitan City': 29,
  // Sub-Metropolitan Cities
  'Itahari Sub-Metropolitan City': 20,
  'Dharan Sub-Metropolitan City': 20,
  'Janakpur Sub-Metropolitan City': 27,
  'Butwal Sub-Metropolitan City': 19,
  'Dhangadhi Sub-Metropolitan City': 19,
  'Kalaiya Sub-Metropolitan City': 27,
  'Jitpur Simara Sub-Metropolitan City': 23,
  'Ghorahi Sub-Metropolitan City': 19,
  'Tulsipur Sub-Metropolitan City': 19,
  'Nepalgunj Sub-Metropolitan City': 23,
  // Regular Municipalities (sample)
  'Kirtipur Municipality': 10,
  'Tokha Municipality': 11,
  'Chandragiri Municipality': 15,
  'Budhanilkantha Municipality': 13,
  'Bhaktapur Municipality': 10,
  'Damak Municipality': 11,
  'Birtamod Municipality': 11,
};

// Helper function to get exact ward count for a municipality
export const getWardCount = (municipalityName: string, municipalityType: 'metro' | 'sub-metro' | 'municipality' | 'rural'): number => {
  if (municipalityWardCounts[municipalityName]) {
    return municipalityWardCounts[municipalityName];
  }
  // Default ward counts by type
  switch (municipalityType) {
    case 'metro': return 32;
    case 'sub-metro': return 20;
    case 'municipality': return 12;
    case 'rural': return 7;
    default: return 9;
  }
};

// Generate ward options for a municipality
export const generateWardOptions = (municipalityName: string, municipalityType: 'metro' | 'sub-metro' | 'municipality' | 'rural'): { value: number; label: string; nepaliLabel: string }[] => {
  const wardCount = getWardCount(municipalityName, municipalityType);
  return Array.from({ length: wardCount }, (_, i) => ({
    value: i + 1,
    label: `Ward ${i + 1}`,
    nepaliLabel: `वडा ${i + 1}`,
  }));
};

// Nepal Municipalities (Palikas) by District - Sample key municipalities
export const nepalMunicipalities: Record<string, { name: string; nepaliName: string; type: 'metro' | 'sub-metro' | 'municipality' | 'rural'; wardCount?: number }[]> = {
  // Koshi Province
  'Jhapa': [
    { name: 'Bhadrapur Municipality', nepaliName: 'भद्रपुर नगरपालिका', type: 'municipality' },
    { name: 'Birtamod Municipality', nepaliName: 'विर्तामोड नगरपालिका', type: 'municipality' },
    { name: 'Mechinagar Municipality', nepaliName: 'मेचीनगर नगरपालिका', type: 'municipality' },
    { name: 'Damak Municipality', nepaliName: 'दमक नगरपालिका', type: 'municipality' },
    { name: 'Arjundhara Municipality', nepaliName: 'अर्जुनधारा नगरपालिका', type: 'municipality' },
    { name: 'Kankai Municipality', nepaliName: 'कन्काई नगरपालिका', type: 'municipality' },
    { name: 'Shivasatakshi Municipality', nepaliName: 'शिवशताक्षी नगरपालिका', type: 'municipality' },
    { name: 'Gauradaha Municipality', nepaliName: 'गौरादह नगरपालिका', type: 'municipality' },
  ],
  'Morang': [
    { name: 'Biratnagar Metropolitan City', nepaliName: 'विराटनगर महानगरपालिका', type: 'metro' },
    { name: 'Sundarharaicha Municipality', nepaliName: 'सुन्दरहरैचा नगरपालिका', type: 'municipality' },
    { name: 'Belbari Municipality', nepaliName: 'बेलबारी नगरपालिका', type: 'municipality' },
    { name: 'Pathari Shanischare Municipality', nepaliName: 'पथरी शनिश्चरे नगरपालिका', type: 'municipality' },
    { name: 'Urlabari Municipality', nepaliName: 'उर्लाबारी नगरपालिका', type: 'municipality' },
    { name: 'Rangeli Municipality', nepaliName: 'रंगेली नगरपालिका', type: 'municipality' },
    { name: 'Letang Municipality', nepaliName: 'लेटाङ नगरपालिका', type: 'municipality' },
    { name: 'Ratuwamai Municipality', nepaliName: 'रतुवामाई नगरपालिका', type: 'municipality' },
  ],
  'Sunsari': [
    { name: 'Itahari Sub-Metropolitan City', nepaliName: 'इटहरी उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Dharan Sub-Metropolitan City', nepaliName: 'धरान उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Inaruwa Municipality', nepaliName: 'इनरुवा नगरपालिका', type: 'municipality' },
    { name: 'Duhabi Municipality', nepaliName: 'दुहबी नगरपालिका', type: 'municipality' },
    { name: 'Ramdhuni Municipality', nepaliName: 'रामधुनी नगरपालिका', type: 'municipality' },
    { name: 'Barahakshetra Municipality', nepaliName: 'बराहक्षेत्र नगरपालिका', type: 'municipality' },
  ],
  'Ilam': [
    { name: 'Ilam Municipality', nepaliName: 'इलाम नगरपालिका', type: 'municipality' },
    { name: 'Deumai Municipality', nepaliName: 'देउमाई नगरपालिका', type: 'municipality' },
    { name: 'Mai Municipality', nepaliName: 'माई नगरपालिका', type: 'municipality' },
    { name: 'Suryodaya Municipality', nepaliName: 'सूर्योदय नगरपालिका', type: 'municipality' },
    { name: 'Phakphokthum Rural Municipality', nepaliName: 'फाकफोकथुम गाउँपालिका', type: 'rural' },
    { name: 'Sandakpur Rural Municipality', nepaliName: 'सन्दकपुर गाउँपालिका', type: 'rural' },
  ],
  // Madhesh Province
  'Dhanusha': [
    { name: 'Janakpur Sub-Metropolitan City', nepaliName: 'जनकपुर उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Chhireshwornath Municipality', nepaliName: 'छिरेश्वरनाथ नगरपालिका', type: 'municipality' },
    { name: 'Ganeshman Charnath Municipality', nepaliName: 'गणेशमान चारनाथ नगरपालिका', type: 'municipality' },
    { name: 'Dhanushadham Municipality', nepaliName: 'धनुषाधाम नगरपालिका', type: 'municipality' },
    { name: 'Nagarain Municipality', nepaliName: 'नगराइन नगरपालिका', type: 'municipality' },
    { name: 'Bideha Municipality', nepaliName: 'विदेह नगरपालिका', type: 'municipality' },
    { name: 'Mithila Municipality', nepaliName: 'मिथिला नगरपालिका', type: 'municipality' },
    { name: 'Sahidnagar Municipality', nepaliName: 'शहीदनगर नगरपालिका', type: 'municipality' },
  ],
  'Saptari': [
    { name: 'Rajbiraj Municipality', nepaliName: 'राजबिराज नगरपालिका', type: 'municipality' },
    { name: 'Kanchanrup Municipality', nepaliName: 'कञ्चनरुप नगरपालिका', type: 'municipality' },
    { name: 'Bodebarsain Municipality', nepaliName: 'बोदेबरसाईन नगरपालिका', type: 'municipality' },
    { name: 'Dakneshwori Municipality', nepaliName: 'डाक्नेश्वरी नगरपालिका', type: 'municipality' },
    { name: 'Hanumannagar Kankalini Municipality', nepaliName: 'हनुमाननगर कंकालिनी नगरपालिका', type: 'municipality' },
    { name: 'Khadak Municipality', nepaliName: 'खडक नगरपालिका', type: 'municipality' },
  ],
  'Bara': [
    { name: 'Kalaiya Sub-Metropolitan City', nepaliName: 'कलैया उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Jitpur Simara Sub-Metropolitan City', nepaliName: 'जीतपुर सिमरा उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Kolhabi Municipality', nepaliName: 'कोल्हबी नगरपालिका', type: 'municipality' },
    { name: 'Nijgadh Municipality', nepaliName: 'निजगढ नगरपालिका', type: 'municipality' },
    { name: 'Mahagadhimai Municipality', nepaliName: 'महागढीमाई नगरपालिका', type: 'municipality' },
  ],
  // Bagmati Province
  'Kathmandu': [
    { name: 'Kathmandu Metropolitan City', nepaliName: 'काठमाडौं महानगरपालिका', type: 'metro' },
    { name: 'Kirtipur Municipality', nepaliName: 'कीर्तिपुर नगरपालिका', type: 'municipality' },
    { name: 'Nagarjun Municipality', nepaliName: 'नागार्जुन नगरपालिका', type: 'municipality' },
    { name: 'Kageshwori Manohara Municipality', nepaliName: 'कागेश्वरी मनोहरा नगरपालिका', type: 'municipality' },
    { name: 'Tokha Municipality', nepaliName: 'टोखा नगरपालिका', type: 'municipality' },
    { name: 'Chandragiri Municipality', nepaliName: 'चन्द्रागिरी नगरपालिका', type: 'municipality' },
    { name: 'Budhanilkantha Municipality', nepaliName: 'बुढानिलकण्ठ नगरपालिका', type: 'municipality' },
    { name: 'Tarakeshwor Municipality', nepaliName: 'तारकेश्वर नगरपालिका', type: 'municipality' },
    { name: 'Gokarneshwor Municipality', nepaliName: 'गोकर्णेश्वर नगरपालिका', type: 'municipality' },
    { name: 'Shankharapur Municipality', nepaliName: 'शंखरापुर नगरपालिका', type: 'municipality' },
    { name: 'Dakshinkali Municipality', nepaliName: 'दक्षिणकाली नगरपालिका', type: 'municipality' },
  ],
  'Lalitpur': [
    { name: 'Lalitpur Metropolitan City', nepaliName: 'ललितपुर महानगरपालिका', type: 'metro' },
    { name: 'Godawari Municipality', nepaliName: 'गोदावरी नगरपालिका', type: 'municipality' },
    { name: 'Mahalaxmi Municipality', nepaliName: 'महालक्ष्मी नगरपालिका', type: 'municipality' },
    { name: 'Konjyosom Rural Municipality', nepaliName: 'कोन्ज्योसोम गाउँपालिका', type: 'rural' },
    { name: 'Bagmati Rural Municipality', nepaliName: 'बागमती गाउँपालिका', type: 'rural' },
  ],
  'Bhaktapur': [
    { name: 'Bhaktapur Municipality', nepaliName: 'भक्तपुर नगरपालिका', type: 'municipality' },
    { name: 'Changunarayan Municipality', nepaliName: 'चाँगुनारायण नगरपालिका', type: 'municipality' },
    { name: 'Madhyapur Thimi Municipality', nepaliName: 'मध्यपुर थिमी नगरपालिका', type: 'municipality' },
    { name: 'Suryabinayak Municipality', nepaliName: 'सूर्यबिनायक नगरपालिका', type: 'municipality' },
  ],
  'Chitwan': [
    { name: 'Bharatpur Metropolitan City', nepaliName: 'भरतपुर महानगरपालिका', type: 'metro' },
    { name: 'Ratnanagar Municipality', nepaliName: 'रत्ननगर नगरपालिका', type: 'municipality' },
    { name: 'Kalika Municipality', nepaliName: 'कालिका नगरपालिका', type: 'municipality' },
    { name: 'Khairahani Municipality', nepaliName: 'खैरहनी नगरपालिका', type: 'municipality' },
    { name: 'Rapti Municipality', nepaliName: 'राप्ती नगरपालिका', type: 'municipality' },
    { name: 'Madi Municipality', nepaliName: 'माडी नगरपालिका', type: 'municipality' },
    { name: 'Ichchhakamana Rural Municipality', nepaliName: 'इच्छाकामना गाउँपालिका', type: 'rural' },
  ],
  // Gandaki Province
  'Kaski': [
    { name: 'Pokhara Metropolitan City', nepaliName: 'पोखरा महानगरपालिका', type: 'metro' },
    { name: 'Annapurna Rural Municipality', nepaliName: 'अन्नपूर्ण गाउँपालिका', type: 'rural' },
    { name: 'Machhapuchchhre Rural Municipality', nepaliName: 'माछापुच्छ्रे गाउँपालिका', type: 'rural' },
    { name: 'Madi Rural Municipality', nepaliName: 'मादी गाउँपालिका', type: 'rural' },
    { name: 'Rupa Rural Municipality', nepaliName: 'रूपा गाउँपालिका', type: 'rural' },
  ],
  'Gorkha': [
    { name: 'Gorkha Municipality', nepaliName: 'गोरखा नगरपालिका', type: 'municipality' },
    { name: 'Palungtar Municipality', nepaliName: 'पालुङटार नगरपालिका', type: 'municipality' },
    { name: 'Sulikot Rural Municipality', nepaliName: 'सुलीकोट गाउँपालिका', type: 'rural' },
    { name: 'Siranchok Rural Municipality', nepaliName: 'सिरानचोक गाउँपालिका', type: 'rural' },
    { name: 'Ajirkot Rural Municipality', nepaliName: 'अजिरकोट गाउँपालिका', type: 'rural' },
  ],
  'Baglung': [
    { name: 'Baglung Municipality', nepaliName: 'बागलुङ नगरपालिका', type: 'municipality' },
    { name: 'Jaimini Municipality', nepaliName: 'जैमिनी नगरपालिका', type: 'municipality' },
    { name: 'Dhorpatan Municipality', nepaliName: 'ढोरपाटन नगरपालिका', type: 'municipality' },
    { name: 'Galkot Municipality', nepaliName: 'गल्कोट नगरपालिका', type: 'municipality' },
  ],
  // Lumbini Province
  'Rupandehi': [
    { name: 'Butwal Sub-Metropolitan City', nepaliName: 'बुटवल उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Siddharthanagar Municipality', nepaliName: 'सिद्धार्थनगर नगरपालिका', type: 'municipality' },
    { name: 'Tilottama Municipality', nepaliName: 'तिलोत्तमा नगरपालिका', type: 'municipality' },
    { name: 'Lumbini Sanskritik Municipality', nepaliName: 'लुम्बिनी सांस्कृतिक नगरपालिका', type: 'municipality' },
    { name: 'Devdaha Municipality', nepaliName: 'देवदह नगरपालिका', type: 'municipality' },
    { name: 'Sainamaina Municipality', nepaliName: 'सैनामैना नगरपालिका', type: 'municipality' },
  ],
  'Dang': [
    { name: 'Ghorahi Sub-Metropolitan City', nepaliName: 'घोराही उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Tulsipur Sub-Metropolitan City', nepaliName: 'तुलसीपुर उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Lamahi Municipality', nepaliName: 'लमही नगरपालिका', type: 'municipality' },
    { name: 'Gadhawa Rural Municipality', nepaliName: 'गढवा गाउँपालिका', type: 'rural' },
    { name: 'Rapti Rural Municipality', nepaliName: 'राप्ती गाउँपालिका', type: 'rural' },
  ],
  'Banke': [
    { name: 'Nepalgunj Sub-Metropolitan City', nepaliName: 'नेपालगञ्ज उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Kohalpur Municipality', nepaliName: 'कोहलपुर नगरपालिका', type: 'municipality' },
    { name: 'Rapti Sonari Rural Municipality', nepaliName: 'राप्ती सोनारी गाउँपालिका', type: 'rural' },
    { name: 'Baijanath Rural Municipality', nepaliName: 'बैजनाथ गाउँपालिका', type: 'rural' },
  ],
  // Karnali Province
  'Surkhet': [
    { name: 'Birendranagar Municipality', nepaliName: 'वीरेन्द्रनगर नगरपालिका', type: 'municipality' },
    { name: 'Gurbhakot Municipality', nepaliName: 'गुर्भाकोट नगरपालिका', type: 'municipality' },
    { name: 'Bheriganga Municipality', nepaliName: 'भेरीगंगा नगरपालिका', type: 'municipality' },
    { name: 'Lekbesi Municipality', nepaliName: 'लेकबेशी नगरपालिका', type: 'municipality' },
    { name: 'Panchapuri Municipality', nepaliName: 'पञ्चपुरी नगरपालिका', type: 'municipality' },
    { name: 'Chingad Rural Municipality', nepaliName: 'चिङ्गाड गाउँपालिका', type: 'rural' },
  ],
  'Jumla': [
    { name: 'Chandannath Municipality', nepaliName: 'चन्दननाथ नगरपालिका', type: 'municipality' },
    { name: 'Tila Rural Municipality', nepaliName: 'तिला गाउँपालिका', type: 'rural' },
    { name: 'Patarasi Rural Municipality', nepaliName: 'पातारासी गाउँपालिका', type: 'rural' },
    { name: 'Tatopani Rural Municipality', nepaliName: 'तातोपानी गाउँपालिका', type: 'rural' },
  ],
  // Sudurpashchim Province
  'Kailali': [
    { name: 'Dhangadhi Sub-Metropolitan City', nepaliName: 'धनगढी उपमहानगरपालिका', type: 'sub-metro' },
    { name: 'Tikapur Municipality', nepaliName: 'टीकापुर नगरपालिका', type: 'municipality' },
    { name: 'Ghodaghodi Municipality', nepaliName: 'घोडाघोडी नगरपालिका', type: 'municipality' },
    { name: 'Lamkichuha Municipality', nepaliName: 'लम्कीचुहा नगरपालिका', type: 'municipality' },
    { name: 'Bhajani Municipality', nepaliName: 'भजनी नगरपालिका', type: 'municipality' },
    { name: 'Godawari Municipality', nepaliName: 'गोदावरी नगरपालिका', type: 'municipality' },
    { name: 'Gauriganga Municipality', nepaliName: 'गौरीगंगा नगरपालिका', type: 'municipality' },
  ],
  'Kanchanpur': [
    { name: 'Bhimdatta Municipality', nepaliName: 'भीमदत्त नगरपालिका', type: 'municipality' },
    { name: 'Punarbas Municipality', nepaliName: 'पुनर्वास नगरपालिका', type: 'municipality' },
    { name: 'Bedkot Municipality', nepaliName: 'बेदकोट नगरपालिका', type: 'municipality' },
    { name: 'Belauri Municipality', nepaliName: 'बेलौरी नगरपालिका', type: 'municipality' },
    { name: 'Krishnapur Municipality', nepaliName: 'कृष्णपुर नगरपालिका', type: 'municipality' },
  ],
};

// Get all municipalities for a district
export function getMunicipalitiesForDistrict(district: string) {
  return nepalMunicipalities[district] || [];
}

// Get all districts for a province
export function getDistrictsForProvince(province: string) {
  return nepalDistricts[province] || [];
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    aiAssistant: 'AI Assistant',
    myPlots: 'My Plots',
    recommendations: 'Recommendations',
    history: 'History',
    settings: 'Settings',
    adminDashboard: 'Admin Dashboard',
    
    // AI Assistant
    askAnything: 'Ask anything about farming...',
    typeMessage: 'Type your message...',
    uploadImage: 'Upload Image',
    voiceInput: 'Voice Input',
    send: 'Send',
    analyzing: 'Analyzing...',
    speakNow: 'Speak now...',
    listening: 'Listening...',
    stopListening: 'Stop listening',
    listen: 'Listen',
    stop: 'Stop',
    
    // Crop Recommendations
    getCropRecommendations: 'Get Crop Recommendations',
    soilAnalysis: 'Soil Analysis',
    weatherForecast: 'Weather Forecast',
    marketPrices: 'Market Prices',
    viewDetails: 'View Details',
    
    // Disease Detection
    scanForDisease: 'Scan for Disease',
    takePhoto: 'Take Photo',
    uploadFromGallery: 'Upload from Gallery',
    diseaseDetected: 'Disease Detected',
    healthyCrop: 'Healthy Crop',
    treatment: 'Treatment',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    offline: 'Offline',
    online: 'Online',
    noData: 'No data available',
    clearChat: 'Clear Chat',
    cropTips: 'Crop Tips',
    
    // Nepal specific
    province: 'Province',
    district: 'District',
    village: 'Village',
    ward: 'Ward',
    municipality: 'Municipality',
    ruralMunicipality: 'Rural Municipality',
    metropolitanCity: 'Metropolitan City',
    subMetropolitanCity: 'Sub-Metropolitan City',
  },
  ne: {
    // Navigation
    home: 'गृहपृष्ठ',
    dashboard: 'ड्यासबोर्ड',
    aiAssistant: 'कृषि मित्र',
    myPlots: 'मेरा खेतहरू',
    recommendations: 'सिफारिसहरू',
    history: 'इतिहास',
    settings: 'सेटिङहरू',
    adminDashboard: 'प्रशासन ड्यासबोर्ड',
    
    // AI Assistant
    askAnything: 'खेतीको बारेमा केहि पनि सोध्नुहोस्...',
    typeMessage: 'आफ्नो सन्देश टाइप गर्नुहोस्...',
    uploadImage: 'फोटो अपलोड गर्नुहोस्',
    voiceInput: 'आवाजले बोल्नुहोस्',
    send: 'पठाउनुहोस्',
    analyzing: 'विश्लेषण भइरहेको छ...',
    speakNow: 'अहिले बोल्नुहोस्...',
    listening: 'सुनिरहेको छ...',
    stopListening: 'सुन्न रोक्नुहोस्',
    listen: 'सुन्नुहोस्',
    stop: 'रोक्नुहोस्',
    
    // Crop Recommendations
    getCropRecommendations: 'बाली सिफारिस प्राप्त गर्नुहोस्',
    soilAnalysis: 'माटो विश्लेषण',
    weatherForecast: 'मौसम पूर्वानुमान',
    marketPrices: 'बजार मूल्य',
    viewDetails: 'विवरण हेर्नुहोस्',
    
    // Disease Detection
    scanForDisease: 'रोग जाँच गर्नुहोस्',
    takePhoto: 'फोटो खिच्नुहोस्',
    uploadFromGallery: 'ग्यालेरीबाट छान्नुहोस्',
    diseaseDetected: 'रोग भेटियो',
    healthyCrop: 'स्वस्थ बाली',
    treatment: 'उपचार',
    
    // Common
    loading: 'लोड हुँदैछ...',
    error: 'त्रुटि',
    retry: 'पुनः प्रयास गर्नुहोस्',
    save: 'सेभ गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    offline: 'अफलाइन',
    online: 'अनलाइन',
    noData: 'डाटा उपलब्ध छैन',
    clearChat: 'च्याट खाली गर्नुहोस्',
    cropTips: 'बाली सुझाव',
    
    // Nepal specific
    province: 'प्रदेश',
    district: 'जिल्ला',
    village: 'गाउँ',
    ward: 'वडा',
    municipality: 'नगरपालिका',
    ruralMunicipality: 'गाउँपालिका',
    metropolitanCity: 'महानगरपालिका',
    subMetropolitanCity: 'उपमहानगरपालिका',
  },
  tamang: {
    home: 'क्ह्याला',
    dashboard: 'ड्यासबोर्ड',
    aiAssistant: 'कृषि ग्याल्बो',
    myPlots: 'ङाला खेत',
    recommendations: 'सल्लाह',
    history: 'ह्युला',
    settings: 'सेटिङ',
    adminDashboard: 'प्रशासन ड्यासबोर्ड',
    askAnything: 'खेतीला बारेमा तिमीले सोद...',
    typeMessage: 'तिम्रो सन्देश टाइप ला...',
    uploadImage: 'फोटो अपलोड ला',
    voiceInput: 'आवाजले भन',
    send: 'पठाउ',
    analyzing: 'जाँच्दैछ...',
    speakNow: 'अहिले बोल...',
    listening: 'सुनिरहेको छ...',
    stopListening: 'सुन्न रोक',
    listen: 'सुन',
    stop: 'रोक',
    getCropRecommendations: 'बाली सल्लाह लिउ',
    soilAnalysis: 'माटो जाँच',
    weatherForecast: 'मौसम',
    marketPrices: 'बजार भाउ',
    viewDetails: 'विवरण हेर',
    scanForDisease: 'रोग जाँच',
    takePhoto: 'फोटो खिच',
    uploadFromGallery: 'ग्यालेरीबाट छान',
    diseaseDetected: 'रोग भेटियो',
    healthyCrop: 'राम्रो बाली',
    treatment: 'उपचार',
    loading: 'लोड हुँदैछ...',
    error: 'गल्ती',
    retry: 'फेरि गर',
    save: 'सेभ गर',
    cancel: 'रद्द गर',
    offline: 'अफलाइन',
    online: 'अनलाइन',
    noData: 'डाटा छैन',
    clearChat: 'च्याट खाली गर',
    cropTips: 'बाली सुझाव',
    province: 'प्रदेश',
    district: 'जिल्ला',
    village: 'गाउँ',
    ward: 'वडा',
    municipality: 'नगरपालिका',
    ruralMunicipality: 'गाउँपालिका',
    metropolitanCity: 'महानगरपालिका',
    subMetropolitanCity: 'उपमहानगरपालिका',
  },
  newar: {
    home: 'छेँ',
    dashboard: 'ड्यासबोर्ड',
    aiAssistant: 'कृषि सहयोगी',
    myPlots: 'जिगु खेत',
    recommendations: 'सल्लाह',
    history: 'इतिहास',
    settings: 'सेटिङ',
    adminDashboard: 'प्रशासन ड्यासबोर्ड',
    askAnything: 'खेतीया बारेय छु नं न्हय...',
    typeMessage: 'छिगु सन्देश च्वय...',
    uploadImage: 'फोटो अपलोड या',
    voiceInput: 'आवाजं भन',
    send: 'ब्वय',
    analyzing: 'जाँच जुयाच्वंगु...',
    speakNow: 'अहिले भन...',
    listening: 'न्यनाच्वंगु...',
    stopListening: 'न्यनेगु रोक',
    listen: 'न्यन',
    stop: 'रोक',
    getCropRecommendations: 'बाली सल्लाह काय',
    soilAnalysis: 'माटो जाँच',
    weatherForecast: 'हवामान',
    marketPrices: 'बजार मूल्य',
    viewDetails: 'विवरण स्वय',
    scanForDisease: 'रोग जाँच',
    takePhoto: 'फोटो काय',
    uploadFromGallery: 'ग्यालेरीं थ्वय',
    diseaseDetected: 'रोग दु',
    healthyCrop: 'स्वस्थ बाली',
    treatment: 'उपचार',
    loading: 'लोड जुयाच्वंगु...',
    error: 'भुल',
    retry: 'लय या',
    save: 'सेभ या',
    cancel: 'रद्द या',
    offline: 'अफलाइन',
    online: 'अनलाइन',
    noData: 'डाटा मदु',
    clearChat: 'च्याट लय',
    cropTips: 'बाली सुझाव',
    province: 'प्रदेश',
    district: 'जिल्ला',
    village: 'गाउँ',
    ward: 'वडा',
    municipality: 'नगरपालिका',
    ruralMunicipality: 'गाउँपालिका',
    metropolitanCity: 'महानगरपालिका',
    subMetropolitanCity: 'उपमहानगरपालिका',
  },
  maithili: {
    home: 'घर',
    dashboard: 'ड्यासबोर्ड',
    aiAssistant: 'कृषि मित्र',
    myPlots: 'हमर खेत',
    recommendations: 'सलाह',
    history: 'इतिहास',
    settings: 'सेटिङ',
    adminDashboard: 'प्रशासन ड्यासबोर्ड',
    askAnything: 'खेतीक बारेमे किछु पूछू...',
    typeMessage: 'अपन सन्देश टाइप करू...',
    uploadImage: 'फोटो अपलोड करू',
    voiceInput: 'आवाजसँ बोलू',
    send: 'पठाउ',
    analyzing: 'जाँच भ रहल अछि...',
    speakNow: 'अखन बोलू...',
    listening: 'सुनि रहल छी...',
    stopListening: 'सुनब बन्द करू',
    listen: 'सुनू',
    stop: 'बन्द करू',
    getCropRecommendations: 'फसल सलाह लिउ',
    soilAnalysis: 'माटी जाँच',
    weatherForecast: 'मौसम',
    marketPrices: 'बजार भाव',
    viewDetails: 'विवरण देखू',
    scanForDisease: 'रोग जाँच',
    takePhoto: 'फोटो खीचू',
    uploadFromGallery: 'ग्यालेरीसँ चुनू',
    diseaseDetected: 'रोग भेटल',
    healthyCrop: 'नीक फसल',
    treatment: 'इलाज',
    loading: 'लोड भ रहल अछि...',
    error: 'गलती',
    retry: 'फेर प्रयास करू',
    save: 'सेभ करू',
    cancel: 'रद्द करू',
    offline: 'अफलाइन',
    online: 'अनलाइन',
    noData: 'डाटा नहि अछि',
    clearChat: 'च्याट साफ करू',
    cropTips: 'फसल सुझाव',
    province: 'प्रदेश',
    district: 'जिल्ला',
    village: 'गाम',
    ward: 'वार्ड',
    municipality: 'नगरपालिका',
    ruralMunicipality: 'गाउँपालिका',
    metropolitanCity: 'महानगरपालिका',
    subMetropolitanCity: 'उपमहानगरपालिका',
  },
  magar: {
    home: 'घर',
    dashboard: 'ड्यासबोर्ड',
    aiAssistant: 'कृषि सहायक',
    myPlots: 'ङा खेत',
    recommendations: 'सल्लाह',
    history: 'इतिहास',
    settings: 'सेटिङ',
    adminDashboard: 'प्रशासन ड्यासबोर्ड',
    askAnything: 'खेतीला बारेमा तिमीले सोध...',
    typeMessage: 'तिम्रो सन्देश टाइप गर...',
    uploadImage: 'फोटो राख',
    voiceInput: 'आवाजले भन',
    send: 'पठाउ',
    analyzing: 'जाँच्दैछ...',
    speakNow: 'अहिले बोल...',
    listening: 'सुनिरहेको छ...',
    stopListening: 'सुन्न रोक',
    listen: 'सुन',
    stop: 'रोक',
    getCropRecommendations: 'बाली सल्लाह लिउ',
    soilAnalysis: 'माटो जाँच',
    weatherForecast: 'मौसम',
    marketPrices: 'बजार भाउ',
    viewDetails: 'विवरण हेर',
    scanForDisease: 'रोग जाँच',
    takePhoto: 'फोटो खिच',
    uploadFromGallery: 'ग्यालेरीबाट छान',
    diseaseDetected: 'रोग भेटियो',
    healthyCrop: 'राम्रो बाली',
    treatment: 'उपचार',
    loading: 'लोड हुँदैछ...',
    error: 'गल्ती',
    retry: 'फेरि गर',
    save: 'सेभ गर',
    cancel: 'रद्द गर',
    offline: 'अफलाइन',
    online: 'अनलाइन',
    noData: 'डाटा छैन',
    clearChat: 'च्याट खाली गर',
    cropTips: 'बाली सुझाव',
    province: 'प्रदेश',
    district: 'जिल्ला',
    village: 'गाउँ',
    ward: 'वडा',
    municipality: 'नगरपालिका',
    ruralMunicipality: 'गाउँपालिका',
    metropolitanCity: 'महानगरपालिका',
    subMetropolitanCity: 'उपमहानगरपालिका',
  },
  rai: {
    home: 'खिम',
    dashboard: 'ड्यासबोर्ड',
    aiAssistant: 'कृषि सहायक',
    myPlots: 'आङ खेत',
    recommendations: 'सल्लाह',
    history: 'इतिहास',
    settings: 'सेटिङ',
    adminDashboard: 'प्रशासन ड्यासबोर्ड',
    askAnything: 'खेतीको बारेमा सोध...',
    typeMessage: 'सन्देश टाइप गर...',
    uploadImage: 'फोटो राख',
    voiceInput: 'आवाजले भन',
    send: 'पठाउ',
    analyzing: 'जाँच्दैछ...',
    speakNow: 'अहिले बोल...',
    listening: 'सुनिरहेको छ...',
    stopListening: 'सुन्न रोक',
    listen: 'सुन',
    stop: 'रोक',
    getCropRecommendations: 'बाली सल्लाह लिउ',
    soilAnalysis: 'माटो जाँच',
    weatherForecast: 'मौसम',
    marketPrices: 'बजार भाउ',
    viewDetails: 'विवरण हेर',
    scanForDisease: 'रोग जाँच',
    takePhoto: 'फोटो खिच',
    uploadFromGallery: 'ग्यालेरीबाट छान',
    diseaseDetected: 'रोग भेटियो',
    healthyCrop: 'राम्रो बाली',
    treatment: 'उपचार',
    loading: 'लोड हुँदैछ...',
    error: 'गल्ती',
    retry: 'फेरि गर',
    save: 'सेभ गर',
    cancel: 'रद्द गर',
    offline: 'अफलाइन',
    online: 'अनलाइन',
    noData: 'डाटा छैन',
    clearChat: 'च्याट खाली गर',
    cropTips: 'बाली सुझाव',
    province: 'प्रदेश',
    district: 'जिल्ला',
    village: 'गाउँ',
    ward: 'वडा',
    municipality: 'नगरपालिका',
    ruralMunicipality: 'गाउँपालिका',
    metropolitanCity: 'महानगरपालिका',
    subMetropolitanCity: 'उपमहानगरपालिका',
  },
};

export function useTranslation(language: Language) {
  return (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
}
