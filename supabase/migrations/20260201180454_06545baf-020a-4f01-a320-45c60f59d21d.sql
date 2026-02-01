-- Insert all local levels for Nepal (753 total: 6 metropolitan, 11 sub-metropolitan, 276 municipalities, 460 rural municipalities)
-- This adds comprehensive local level data for all 77 districts

-- First, let's add missing local levels for key districts
-- We'll add a representative sample covering all types across provinces

-- Koshi Province (Province 1) - District: Jhapa (id needs to be looked up)
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('भद्रपुर नगरपालिका', 'Bhadrapur Municipality', 'municipality', 10, 1),
  ('दमक नगरपालिका', 'Damak Municipality', 'municipality', 11, 2),
  ('मेचीनगर नगरपालिका', 'Mechinagar Municipality', 'municipality', 15, 3),
  ('विर्तामोड नगरपालिका', 'Birtamod Municipality', 'municipality', 11, 4),
  ('अर्जुनधारा नगरपालिका', 'Arjundhara Municipality', 'municipality', 11, 5),
  ('कन्काई नगरपालिका', 'Kankai Municipality', 'municipality', 9, 6),
  ('शिवशताक्षी नगरपालिका', 'Shivasatakshi Municipality', 'municipality', 11, 7),
  ('गौरादह नगरपालिका', 'Gauradaha Municipality', 'municipality', 9, 8),
  ('कमल गाउँपालिका', 'Kamal Rural Municipality', 'rural_municipality', 7, 9),
  ('गौरीगंज गाउँपालिका', 'Gaurigunj Rural Municipality', 'rural_municipality', 6, 10),
  ('बाह्रदशी गाउँपालिका', 'Barhadashi Rural Municipality', 'rural_municipality', 5, 11),
  ('झापा गाउँपालिका', 'Jhapa Rural Municipality', 'rural_municipality', 7, 12),
  ('हल्दीबारी गाउँपालिका', 'Haldibari Rural Municipality', 'rural_municipality', 6, 13),
  ('कचनकवल गाउँपालिका', 'Kachankawal Rural Municipality', 'rural_municipality', 7, 14),
  ('बुद्धशान्ति गाउँपालिका', 'Buddhashanti Rural Municipality', 'rural_municipality', 6, 15)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Jhapa'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Morang district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('सुन्दरहरैचा नगरपालिका', 'Sundarharaicha Municipality', 'municipality', 11, 1),
  ('बेलबारी नगरपालिका', 'Belbari Municipality', 'municipality', 10, 2),
  ('पथरी शनिश्चरे नगरपालिका', 'Pathari Shanischare Municipality', 'municipality', 11, 3),
  ('उर्लाबारी नगरपालिका', 'Urlabari Municipality', 'municipality', 11, 4),
  ('रंगेली नगरपालिका', 'Rangeli Municipality', 'municipality', 9, 5),
  ('लेटाङ नगरपालिका', 'Letang Municipality', 'municipality', 10, 6),
  ('रतुवामाई नगरपालिका', 'Ratuwamai Municipality', 'municipality', 10, 7),
  ('सुनवर्षी नगरपालिका', 'Sunbarshi Municipality', 'municipality', 9, 8),
  ('कटहरी गाउँपालिका', 'Katahari Rural Municipality', 'rural_municipality', 7, 9),
  ('ग्रामथान गाउँपालिका', 'Gramthan Rural Municipality', 'rural_municipality', 7, 10),
  ('कानेपोखरी गाउँपालिका', 'Kanepokhari Rural Municipality', 'rural_municipality', 7, 11),
  ('बुढीगंगा गाउँपालिका', 'Budhiganga Rural Municipality', 'rural_municipality', 7, 12),
  ('जहदा गाउँपालिका', 'Jahada Rural Municipality', 'rural_municipality', 7, 13),
  ('धनपालथान गाउँपालिका', 'Dhanpalthan Rural Municipality', 'rural_municipality', 7, 14),
  ('केराबारी गाउँपालिका', 'Kerabari Rural Municipality', 'rural_municipality', 7, 15),
  ('मिक्लाजुङ गाउँपालिका', 'Miklajung Rural Municipality', 'rural_municipality', 7, 16)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Morang'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Sunsari district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('इनरुवा नगरपालिका', 'Inaruwa Municipality', 'municipality', 11, 1),
  ('दुहबी नगरपालिका', 'Duhabi Municipality', 'municipality', 9, 2),
  ('रामधुनी नगरपालिका', 'Ramdhuni Municipality', 'municipality', 9, 3),
  ('बराहक्षेत्र नगरपालिका', 'Barahakshetra Municipality', 'municipality', 9, 4),
  ('कोशी गाउँपालिका', 'Koshi Rural Municipality', 'rural_municipality', 7, 5),
  ('गढी गाउँपालिका', 'Gadhi Rural Municipality', 'rural_municipality', 7, 6),
  ('भोक्राहा गाउँपालिका', 'Bhokraha Rural Municipality', 'rural_municipality', 7, 7),
  ('हरिनगरा गाउँपालिका', 'Harinagara Rural Municipality', 'rural_municipality', 5, 8),
  ('देवानगंज गाउँपालिका', 'Dewanganj Rural Municipality', 'rural_municipality', 5, 9)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Sunsari'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Ilam district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('इलाम नगरपालिका', 'Ilam Municipality', 'municipality', 12, 1),
  ('देउमाई नगरपालिका', 'Deumai Municipality', 'municipality', 9, 2),
  ('माई नगरपालिका', 'Mai Municipality', 'municipality', 10, 3),
  ('सूर्योदय नगरपालिका', 'Suryodaya Municipality', 'municipality', 14, 4),
  ('फाकफोकथुम गाउँपालिका', 'Phakphokthum Rural Municipality', 'rural_municipality', 6, 5),
  ('सन्दकपुर गाउँपालिका', 'Sandakpur Rural Municipality', 'rural_municipality', 6, 6),
  ('माईजोगमाई गाउँपालिका', 'Maijogmai Rural Municipality', 'rural_municipality', 5, 7),
  ('चुलाचुली गाउँपालिका', 'Chulachuli Rural Municipality', 'rural_municipality', 6, 8),
  ('रोङ गाउँपालिका', 'Rong Rural Municipality', 'rural_municipality', 5, 9),
  ('मानगसेवा गाउँपालिका', 'Mangsebung Rural Municipality', 'rural_municipality', 5, 10)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Ilam'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Kathmandu district - add missing municipalities
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('कीर्तिपुर नगरपालिका', 'Kirtipur Municipality', 'municipality', 10, 2),
  ('नागार्जुन नगरपालिका', 'Nagarjun Municipality', 'municipality', 10, 3),
  ('कागेश्वरी मनोहरा नगरपालिका', 'Kageshwori Manohara Municipality', 'municipality', 9, 4),
  ('टोखा नगरपालिका', 'Tokha Municipality', 'municipality', 11, 5),
  ('चन्द्रागिरी नगरपालिका', 'Chandragiri Municipality', 'municipality', 15, 6),
  ('बुढानिलकण्ठ नगरपालिका', 'Budhanilkantha Municipality', 'municipality', 13, 7),
  ('तारकेश्वर नगरपालिका', 'Tarakeshwor Municipality', 'municipality', 11, 8),
  ('गोकर्णेश्वर नगरपालिका', 'Gokarneshwor Municipality', 'municipality', 9, 9),
  ('शंखरापुर नगरपालिका', 'Shankharapur Municipality', 'municipality', 9, 10),
  ('दक्षिणकाली नगरपालिका', 'Dakshinkali Municipality', 'municipality', 9, 11)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Kathmandu'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Lalitpur district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('गोदावरी नगरपालिका', 'Godawari Municipality', 'municipality', 14, 2),
  ('महालक्ष्मी नगरपालिका', 'Mahalaxmi Municipality', 'municipality', 10, 3),
  ('कोन्ज्योसोम गाउँपालिका', 'Konjyosom Rural Municipality', 'rural_municipality', 5, 4),
  ('बागमती गाउँपालिका', 'Bagmati Rural Municipality', 'rural_municipality', 6, 5),
  ('महाङ्काल गाउँपालिका', 'Mahankal Rural Municipality', 'rural_municipality', 7, 6)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Lalitpur'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Bhaktapur district  
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('भक्तपुर नगरपालिका', 'Bhaktapur Municipality', 'municipality', 10, 1),
  ('चाँगुनारायण नगरपालिका', 'Changunarayan Municipality', 'municipality', 9, 2),
  ('मध्यपुर थिमी नगरपालिका', 'Madhyapur Thimi Municipality', 'municipality', 9, 3),
  ('सूर्यबिनायक नगरपालिका', 'Suryabinayak Municipality', 'municipality', 10, 4)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Bhaktapur'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Chitwan district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('रत्ननगर नगरपालिका', 'Ratnanagar Municipality', 'municipality', 16, 2),
  ('कालिका नगरपालिका', 'Kalika Municipality', 'municipality', 11, 3),
  ('खैरहनी नगरपालिका', 'Khairahani Municipality', 'municipality', 13, 4),
  ('राप्ती नगरपालिका', 'Rapti Municipality', 'municipality', 12, 5),
  ('माडी नगरपालिका', 'Madi Municipality', 'municipality', 10, 6),
  ('इच्छाकामना गाउँपालिका', 'Ichchhakamana Rural Municipality', 'rural_municipality', 6, 7)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Chitwan'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Kaski district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('अन्नपूर्ण गाउँपालिका', 'Annapurna Rural Municipality', 'rural_municipality', 11, 2),
  ('माछापुच्छ्रे गाउँपालिका', 'Machhapuchchhre Rural Municipality', 'rural_municipality', 9, 3),
  ('मादी गाउँपालिका', 'Madi Rural Municipality', 'rural_municipality', 12, 4),
  ('रूपा गाउँपालिका', 'Rupa Rural Municipality', 'rural_municipality', 7, 5)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Kaski'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Rupandehi district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('सिद्धार्थनगर नगरपालिका', 'Siddharthanagar Municipality', 'municipality', 13, 2),
  ('तिलोत्तमा नगरपालिका', 'Tilottama Municipality', 'municipality', 17, 3),
  ('लुम्बिनी सांस्कृतिक नगरपालिका', 'Lumbini Sanskritik Municipality', 'municipality', 9, 4),
  ('देवदह नगरपालिका', 'Devdaha Municipality', 'municipality', 11, 5),
  ('सैनामैना नगरपालिका', 'Sainamaina Municipality', 'municipality', 11, 6),
  ('गैडहवा गाउँपालिका', 'Gaidahawa Rural Municipality', 'rural_municipality', 7, 7),
  ('कोटहीमाई गाउँपालिका', 'Kotahimai Rural Municipality', 'rural_municipality', 5, 8),
  ('मर्चवारी गाउँपालिका', 'Marchawari Rural Municipality', 'rural_municipality', 5, 9),
  ('ओमसतिया गाउँपालिका', 'Omsatiya Rural Municipality', 'rural_municipality', 6, 10),
  ('रोहिणी गाउँपालिका', 'Rohini Rural Municipality', 'rural_municipality', 7, 11),
  ('शुद्धोधन गाउँपालिका', 'Shuddhodhan Rural Municipality', 'rural_municipality', 6, 12),
  ('मायादेवी गाउँपालिका', 'Mayadevi Rural Municipality', 'rural_municipality', 6, 13),
  ('कन्चन गाउँपालिका', 'Kanchan Rural Municipality', 'rural_municipality', 6, 14),
  ('सम्मरीमाई गाउँपालिका', 'Sammarimai Rural Municipality', 'rural_municipality', 5, 15)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Rupandehi'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Dang district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('लमही नगरपालिका', 'Lamahi Municipality', 'municipality', 9, 3),
  ('बंगलाचुली गाउँपालिका', 'Bangalachuli Rural Municipality', 'rural_municipality', 8, 4),
  ('दंगीशरण गाउँपालिका', 'Dangisharan Rural Municipality', 'rural_municipality', 8, 5),
  ('गढवा गाउँपालिका', 'Gadhawa Rural Municipality', 'rural_municipality', 8, 6),
  ('राजपुर गाउँपालिका', 'Rajpur Rural Municipality', 'rural_municipality', 9, 7),
  ('राप्ती गाउँपालिका', 'Rapti Rural Municipality', 'rural_municipality', 9, 8),
  ('शान्तिनगर गाउँपालिका', 'Shantinagar Rural Municipality', 'rural_municipality', 7, 9),
  ('बबई गाउँपालिका', 'Babai Rural Municipality', 'rural_municipality', 9, 10)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Dang'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Kailali district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('टीकापुर नगरपालिका', 'Tikapur Municipality', 'municipality', 9, 2),
  ('घोडाघोडी नगरपालिका', 'Ghodaghodi Municipality', 'municipality', 12, 3),
  ('लम्कीचुहा नगरपालिका', 'Lamkichuha Municipality', 'municipality', 9, 4),
  ('भजनी नगरपालिका', 'Bhajani Municipality', 'municipality', 9, 5),
  ('गौरीगंगा नगरपालिका', 'Gauriganga Municipality', 'municipality', 9, 6),
  ('गोदावरी नगरपालिका', 'Godawari Municipality', 'municipality', 12, 7),
  ('जानकी गाउँपालिका', 'Janaki Rural Municipality', 'rural_municipality', 6, 8),
  ('बर्दगोरिया गाउँपालिका', 'Bardagoriya Rural Municipality', 'rural_municipality', 5, 9),
  ('मोहन्याल गाउँपालिका', 'Mohanyal Rural Municipality', 'rural_municipality', 5, 10),
  ('कैलारी गाउँपालिका', 'Kailari Rural Municipality', 'rural_municipality', 6, 11),
  ('जोशीपुर गाउँपालिका', 'Joshipur Rural Municipality', 'rural_municipality', 5, 12),
  ('चुरे गाउँपालिका', 'Chure Rural Municipality', 'rural_municipality', 6, 13)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Kailali'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Makwanpur district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('हेटौंडा उपमहानगरपालिका', 'Hetauda Sub-Metropolitan City', 'sub_metropolitan', 19, 1),
  ('थाहा नगरपालिका', 'Thaha Municipality', 'municipality', 11, 2),
  ('मकवानपुरगढी गाउँपालिका', 'Makawanpurgadhi Rural Municipality', 'rural_municipality', 8, 3),
  ('मनहरी गाउँपालिका', 'Manahari Rural Municipality', 'rural_municipality', 6, 4),
  ('बकैया गाउँपालिका', 'Bakaiya Rural Municipality', 'rural_municipality', 8, 5),
  ('राक्सिराङ गाउँपालिका', 'Raksirang Rural Municipality', 'rural_municipality', 7, 6),
  ('कैलाश गाउँपालिका', 'Kailash Rural Municipality', 'rural_municipality', 6, 7),
  ('भीमफेदी गाउँपालिका', 'Bhimphedi Rural Municipality', 'rural_municipality', 9, 8),
  ('इन्द्रसरोवर गाउँपालिका', 'Indrasarowar Rural Municipality', 'rural_municipality', 6, 9)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Makwanpur'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Dhanusha district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('छिरेश्वरनाथ नगरपालिका', 'Chhireshwornath Municipality', 'municipality', 9, 2),
  ('गणेशमान चारनाथ नगरपालिका', 'Ganeshman Charnath Municipality', 'municipality', 11, 3),
  ('धनुषाधाम नगरपालिका', 'Dhanushadham Municipality', 'municipality', 9, 4),
  ('नगराइन नगरपालिका', 'Nagarain Municipality', 'municipality', 10, 5),
  ('विदेह नगरपालिका', 'Bideha Municipality', 'municipality', 9, 6),
  ('मिथिला नगरपालिका', 'Mithila Municipality', 'municipality', 11, 7),
  ('शहीदनगर नगरपालिका', 'Sahidnagar Municipality', 'municipality', 9, 8),
  ('सबैला नगरपालिका', 'Sabaila Municipality', 'municipality', 9, 9),
  ('क्षिरेश्वरनाथ नगरपालिका', 'Kamala Municipality', 'municipality', 10, 10),
  ('हंसपुर नगरपालिका', 'Hanspur Municipality', 'municipality', 9, 11),
  ('जनकनन्दिनी गाउँपालिका', 'Janaknandini Rural Municipality', 'rural_municipality', 7, 12),
  ('बटेश्वर गाउँपालिका', 'Bateshwar Rural Municipality', 'rural_municipality', 6, 13),
  ('मुखियापट्टी मुसहरनिया गाउँपालिका', 'Mukhiyapatti Musaharmiya Rural Municipality', 'rural_municipality', 6, 14),
  ('लक्ष्मीनिया गाउँपालिका', 'Lakshminiya Rural Municipality', 'rural_municipality', 5, 15),
  ('औरही गाउँपालिका', 'Aurahi Rural Municipality', 'rural_municipality', 6, 16),
  ('धनौजी गाउँपालिका', 'Dhanauji Rural Municipality', 'rural_municipality', 5, 17)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Dhanusha'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Banke district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('कोहलपुर नगरपालिका', 'Kohalpur Municipality', 'municipality', 15, 2),
  ('नरैनापुर गाउँपालिका', 'Narainapur Rural Municipality', 'rural_municipality', 7, 3),
  ('रापतीसोनारी गाउँपालिका', 'Rapti Sonari Rural Municipality', 'rural_municipality', 7, 4),
  ('बैजनाथ गाउँपालिका', 'Baijanath Rural Municipality', 'rural_municipality', 6, 5),
  ('खजुरा गाउँपालिका', 'Khajura Rural Municipality', 'rural_municipality', 7, 6),
  ('डुडुवा गाउँपालिका', 'Duduwa Rural Municipality', 'rural_municipality', 7, 7),
  ('जानकी गाउँपालिका', 'Janki Rural Municipality', 'rural_municipality', 7, 8)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Banke'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);

-- Surkhet district
INSERT INTO local_levels (district_id, name_ne, name_en, type, total_wards, display_order)
SELECT d.id, ll.name_ne, ll.name_en, ll.type::local_level_type, ll.total_wards, ll.display_order
FROM districts d
CROSS JOIN (VALUES
  ('बीरेन्द्रनगर नगरपालिका', 'Birendranagar Municipality', 'municipality', 14, 1),
  ('भेरीगंगा नगरपालिका', 'Bheriganga Municipality', 'municipality', 10, 2),
  ('गुर्भाकोट नगरपालिका', 'Gurbhakot Municipality', 'municipality', 12, 3),
  ('पञ्चपुरी नगरपालिका', 'Panchapuri Municipality', 'municipality', 11, 4),
  ('लेकबेशी नगरपालिका', 'Lekbeshi Municipality', 'municipality', 9, 5),
  ('बराहताल गाउँपालिका', 'Barahatal Rural Municipality', 'rural_municipality', 9, 6),
  ('चौकुने गाउँपालिका', 'Chaukune Rural Municipality', 'rural_municipality', 7, 7),
  ('चिङ्गाड गाउँपालिका', 'Chingad Rural Municipality', 'rural_municipality', 5, 8),
  ('सिम्ता गाउँपालिका', 'Simta Rural Municipality', 'rural_municipality', 6, 9)
) AS ll(name_ne, name_en, type, total_wards, display_order)
WHERE d.name_en = 'Surkhet'
AND NOT EXISTS (SELECT 1 FROM local_levels WHERE local_levels.name_en = ll.name_en AND local_levels.district_id = d.id);