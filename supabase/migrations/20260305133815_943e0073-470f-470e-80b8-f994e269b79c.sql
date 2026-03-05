
-- Seed stage-wise advisory data for 4 major crops

-- ===== RICE (धान) =====
INSERT INTO public.crop_stage_advisories (crop_name, crop_name_ne, stage, stage_name_ne, risks, safe_practices, red_lines, warning_signs, referral_message, referral_message_ne) VALUES
('Rice', 'धान', 'nursery', 'बिउ/नर्सरी', 
  '["Seed-borne diseases (blast, brown spot)", "Damping off in wet nursery", "Iron toxicity in waterlogged beds", "Cold injury if sown too early"]'::jsonb,
  '["Use certified/treated seeds from trusted source", "Prepare raised nursery bed with good drainage", "Maintain thin water layer (2-3cm), not flooding", "Apply balanced basal fertilizer before sowing", "Keep nursery weed-free manually"]'::jsonb,
  '["Never recommend specific seed treatment chemical brands or exact doses", "Never advise skipping seed treatment entirely", "Do not suggest untested varieties"]'::jsonb,
  '["Seedlings turning yellow within first 10 days", "Wilting/damping off of young seedlings", "Unusual spots or lesions on seed leaves", "Seedlings not emerging after 7+ days"]'::jsonb,
  'If seedlings show widespread yellowing, wilting, or failure to emerge, visit your nearest Krishi Gyan Kendra or agriculture office immediately.',
  'यदि बिरुवा ठूलो मात्रामा पहेँलो हुँदै, सुक्दै वा उम्रिन नसकेमा, तुरुन्तै नजिकको कृषि ज्ञान केन्द्र वा कृषि कार्यालयमा जानुहोस्।'),

('Rice', 'धान', 'early_growth', 'प्रारम्भिक वृद्धि', 
  '["Stem borer (early infestation)", "Leaf blast", "Iron deficiency (yellowing)", "Weed competition critical period", "Brown plant hopper"]'::jsonb,
  '["Transplant at proper spacing (20x15cm or 20x20cm)", "Maintain 3-5cm standing water", "Apply first top-dress nitrogen at tillering stage", "Hand-weed or use mechanical weeder early", "Monitor for dead hearts (stem borer sign)"]'::jsonb,
  '["Never specify exact fertilizer kg/ropani without soil test context", "Never recommend blanket herbicide spraying", "Do not diagnose blast vs brown spot without photo"]'::jsonb,
  '["Dead hearts (central leaf drying in tillers)", "Diamond-shaped spots on leaves (blast)", "Heavy weed infestation competing with crop", "Leaves turning uniformly pale/yellow (nutrient issue)"]'::jsonb,
  'If you see dead hearts or diamond-shaped leaf spots spreading, contact your local agriculture technician for field inspection.',
  'यदि बोटको बीचको पात सुक्ने (dead heart) वा पातमा हीराआकारको दाग फैलिरहेको छ भने, स्थानीय कृषि प्राविधिकलाई खेत निरीक्षणको लागि सम्पर्क गर्नुहोस्।'),

('Rice', 'धान', 'mid_growth', 'बोट बढ्दै/फूल लाग्दै', 
  '["Sheath blight (high humidity)", "Bacterial leaf blight", "Brown plant hopper outbreak", "Neck blast at heading", "False smut", "Nutrient deficiency at panicle initiation"]'::jsonb,
  '["Apply second top-dress nitrogen before panicle initiation", "Drain field periodically to discourage BPH", "Avoid excessive nitrogen which worsens blast/BPH", "Use light traps to monitor insect populations", "Ensure potassium application for grain filling"]'::jsonb,
  '["Never recommend prophylactic insecticide spraying without pest sighting", "Do not suggest draining completely during flowering", "Never advise heavy nitrogen at this late stage"]'::jsonb,
  '["White powdery growth on leaf sheaths near water line (sheath blight)", "Brownish hopper colonies at base of tillers", "Neck of panicle turning brown/breaking (neck blast)", "Orange/yellow ball-like structures on grains (false smut)"]'::jsonb,
  'If BPH colonies or sheath blight is spreading across the field, this needs urgent expert assessment. Visit agriculture office or call Krishi helpline.',
  'यदि भूरो माहू (BPH) वा शीथ ब्लाइट खेतभर फैलिरहेको छ भने, तुरुन्तै कृषि कार्यालय वा कृषि हेल्पलाइनमा सम्पर्क गर्नुहोस्।'),

('Rice', 'धान', 'pre_harvest', 'काट्ने अवस्था', 
  '["Grain discoloration", "Bird damage", "Lodging from wind/rain", "Over-maturity and shattering loss", "Rat damage in mature crop"]'::jsonb,
  '["Harvest when 80-85% grains are golden/straw colored", "Drain field 7-10 days before harvest", "Use sharp sickle, cut at proper height", "Thresh within 24 hours of cutting to reduce losses", "Keep field bunds clean to reduce rat harboring"]'::jsonb,
  '["Never recommend chemical rodenticides without professional guidance", "Do not advise harvesting too early (high moisture = poor storage)", "Never suggest burning residue as first option"]'::jsonb,
  '["Grains turning black or discolored", "Heavy bird or rat damage in patches", "Crop lodging (falling down) after wind/rain", "Over 90% grains already mature (risk of shattering)"]'::jsonb,
  'For severe lodging or widespread grain discoloration, seek expert advice on salvage harvesting techniques.',
  'ढलेको बाली वा ठूलो मात्रामा दाना कालो भएमा, बचत कटनी प्रविधिको लागि विज्ञको सल्लाह लिनुहोस्।'),

('Rice', 'धान', 'post_harvest', 'भण्डारण/बिक्री', 
  '["High moisture grain leading to mold/aflatoxin", "Storage pest (rice weevil, grain moth)", "Improper drying causing cracking", "Price fluctuation at harvest glut"]'::jsonb,
  '["Dry grain to 12-14% moisture before storage", "Use clean, dry, raised storage containers or bins", "Store in cool, dry, ventilated area", "Use hermetic storage bags if available", "Check stored grain monthly for insects/mold", "Consider staggered selling to avoid price crash"]'::jsonb,
  '["Never recommend chemical fumigants for home storage without training", "Do not suggest storing wet grain even temporarily", "Never guarantee specific market prices"]'::jsonb,
  '["Musty smell from stored grain", "Visible insects or webbing in grain", "Grain feels warm/hot (heating)", "Mold or discoloration on stored grain"]'::jsonb,
  'If stored grain shows heating, mold, or heavy insect infestation, contact your local agriculture service center for proper fumigation guidance.',
  'भण्डारण गरिएको अन्नमा तातो, ढुसी, वा ठूलो मात्रामा कीरा देखिएमा, सही धुम्रीकरण (fumigation) मार्गदर्शनको लागि स्थानीय कृषि सेवा केन्द्रमा सम्पर्क गर्नुहोस्।');

-- ===== WHEAT (गहुँ) =====
INSERT INTO public.crop_stage_advisories (crop_name, crop_name_ne, stage, stage_name_ne, risks, safe_practices, red_lines, warning_signs, referral_message, referral_message_ne) VALUES
('Wheat', 'गहुँ', 'nursery', 'बीउ छर्ने', 
  '["Poor germination from old/untreated seed", "Seed-borne smut/bunt diseases", "Late sowing risk (reduced yield)", "Termite damage in dry soils"]'::jsonb,
  '["Use certified seeds, preferably treated", "Sow at recommended time (Mangsir for Terai, Kartik for hills)", "Ensure proper soil moisture at sowing", "Use line sowing at 20-22cm row spacing", "Apply recommended basal fertilizer"]'::jsonb,
  '["Never specify exact seed rate without knowing variety and soil type", "Do not recommend untested new varieties", "Never suggest skipping seed treatment"]'::jsonb,
  '["Poor/patchy germination after 10 days", "Termite damage at root zone", "Seedlings emerging unevenly"]'::jsonb,
  'If germination is below 50% after 10-12 days, consult your agriculture technician about re-sowing options.',
  'यदि १०-१२ दिनपछि ५०% भन्दा कम उम्रिएको छ भने, पुन: बिउ छर्ने विकल्पको बारेमा कृषि प्राविधिकसँग सल्लाह गर्नुहोस्।'),

('Wheat', 'गहुँ', 'early_growth', 'प्रारम्भिक वृद्धि', 
  '["Aphid infestation (especially in warm winters)", "Weed competition", "Yellow rust first appearance", "Nutrient deficiency (nitrogen)"]'::jsonb,
  '["First irrigation at crown root initiation (20-25 DAS)", "Apply first top-dress nitrogen", "Scout fields for aphid colonies on lower leaves", "Manual or mechanical weeding", "Monitor for rust pustules starting from lower leaves"]'::jsonb,
  '["Never recommend blanket insecticide spray for aphids without threshold check", "Do not advise over-irrigation", "Never diagnose rust type without proper identification"]'::jsonb,
  '["Yellow/orange pustules on leaves (rust)", "Curling leaves with aphid colonies underneath", "Yellowing from nitrogen deficiency", "Stunted growth compared to neighboring fields"]'::jsonb,
  'If yellow rust pustules appear and spread rapidly, this is an urgent situation. Contact the agriculture office immediately for variety-specific guidance.',
  'यदि पहेँलो रस्ट (Yellow Rust) को दागहरू देखिन्छन् र छिटो फैलिरहेछन् भने, यो जरुरी अवस्था हो। किस्म-विशिष्ट मार्गदर्शनको लागि तुरुन्तै कृषि कार्यालय सम्पर्क गर्नुहोस्।'),

('Wheat', 'गहुँ', 'mid_growth', 'बोट बढ्दै/बाला लाग्दै', 
  '["Yellow/brown rust epidemic", "Powdery mildew in humid conditions", "Lodging risk from excess nitrogen + rain", "Terminal heat stress (late sown crop)"]'::jsonb,
  '["Apply second irrigation at booting/heading stage", "Monitor and scout for rust weekly", "Avoid excess nitrogen that causes lodging", "Potassium application helps heat tolerance", "Foliar spray of generic fungicide if rust confirmed by expert"]'::jsonb,
  '["Never recommend fungicide brand names or exact doses", "Do not diagnose rust type from text alone without photos", "Never advise heavy irrigation during flowering"]'::jsonb,
  '["Rapid spread of rust pustules up the plant", "White powdery coating on leaves/stems (mildew)", "Crop starting to lodge (fall) after rain", "Premature drying/whitening of leaves (heat stress)"]'::jsonb,
  'Rust epidemics need immediate expert assessment. Visit your Krishi Gyan Kendra or district agriculture office for recommended action.',
  'रस्ट महामारीमा तुरुन्तै विज्ञको मूल्याङ्कन आवश्यक छ। सिफारिस गरिएको कार्यको लागि कृषि ज्ञान केन्द्र वा जिल्ला कृषि कार्यालय जानुहोस्।'),

('Wheat', 'गहुँ', 'pre_harvest', 'काट्ने अवस्था', 
  '["Shattering loss from delayed harvest", "Unseasonal rain damage", "Karnal bunt in some areas", "Bird damage on mature heads"]'::jsonb,
  '["Harvest when grain is hard and straw turns golden", "Test grain moisture by biting - should be hard", "Harvest in morning to reduce shattering", "Thresh promptly after cutting", "Clean threshing floor to avoid contamination"]'::jsonb,
  '["Never recommend pre-harvest chemical desiccants", "Do not suggest harvesting too early (immature grain)", "Never advise open field storage of cut crop in rainy forecast"]'::jsonb,
  '["Grain falling from heads when touched (over-mature)", "Dark/discolored grains in some heads (karnal bunt)", "Unexpected rain forecast with mature standing crop"]'::jsonb,
  'For karnal bunt suspicion or rain-damaged crop, consult local experts on salvage options.',
  'कर्नाल बन्ट शंका वा पानीले बिगारेको बालीको लागि, बचत विकल्पहरूको बारेमा स्थानीय विज्ञसँग सल्लाह गर्नुहोस्।'),

('Wheat', 'गहुँ', 'post_harvest', 'भण्डारण/बिक्री', 
  '["Storage pests (khapra beetle, grain weevil)", "High moisture causing mold", "Rodent damage in storage", "Price fluctuation"]'::jsonb,
  '["Dry grain to 12% moisture before storage", "Clean and disinfect storage bins before filling", "Use airtight containers or hermetic bags", "Store in cool, dry, dark place", "Inspect monthly for pest signs", "Consider cooperative marketing for better prices"]'::jsonb,
  '["Never recommend home fumigation chemicals", "Do not suggest mixing grain with pesticide powder without professional guidance", "Never guarantee market prices"]'::jsonb,
  '["Visible beetles or larvae in grain", "Grain dust/powder at bottom of storage", "Musty or off smell", "Rodent droppings near storage"]'::jsonb,
  'For heavy storage pest infestation, contact your agriculture service center for safe fumigation options.',
  'ठूलो मात्रामा भण्डारण कीराको समस्यामा, सुरक्षित धुम्रीकरण विकल्पहरूको लागि कृषि सेवा केन्द्रमा सम्पर्क गर्नुहोस्।');

-- ===== TOMATO (गोलभेडा) =====
INSERT INTO public.crop_stage_advisories (crop_name, crop_name_ne, stage, stage_name_ne, risks, safe_practices, red_lines, warning_signs, referral_message, referral_message_ne) VALUES
('Tomato', 'गोलभेडा', 'nursery', 'बिउ/नर्सरी', 
  '["Damping off disease", "Leaf curl virus from whitefly", "Poor germination from old seeds", "Excessive watering causing root rot"]'::jsonb,
  '["Use disease-free certified seeds", "Raise nursery in protected/net house if possible", "Use sterilized nursery media", "Water carefully - moist but not waterlogged", "Protect nursery from whitefly with fine net", "Harden seedlings before transplanting"]'::jsonb,
  '["Never recommend specific seed treatment chemicals by brand", "Do not advise direct sowing in main field for Nepal conditions", "Never suggest ignoring whitefly in nursery"]'::jsonb,
  '["Seedlings falling over at soil line (damping off)", "Upward curling of young leaves", "White tiny flies when nursery is disturbed", "Seedlings stretching tall and weak (etiolation)"]'::jsonb,
  'If damping off or leaf curl appears in nursery, immediately consult a technician before transplanting affected seedlings.',
  'नर्सरीमा ढलेपन (damping off) वा पात कुर्चिने (leaf curl) देखिएमा, प्रभावित बिरुवा रोप्नुअघि तुरुन्तै प्राविधिकसँग सल्लाह गर्नुहोस्।'),

('Tomato', 'गोलभेडा', 'early_growth', 'रोपाइ/प्रारम्भिक वृद्धि', 
  '["Transplant shock", "Bacterial wilt (sudden wilting)", "Early blight", "Cutworm damage at base", "Nutrient deficiency"]'::jsonb,
  '["Transplant in evening or cloudy day", "Maintain proper spacing (60x45cm)", "Stake or trellis plants early", "Mulch around base to conserve moisture", "Apply balanced basal fertilizer", "Scout for wilting plants and remove immediately"]'::jsonb,
  '["Never diagnose bacterial wilt vs fusarium wilt from text alone", "Do not recommend systemic pesticides without confirmed pest", "Never advise removing healthy plants as precaution"]'::jsonb,
  '["Sudden wilting of entire plant without yellowing (bacterial wilt)", "Brown concentric ring spots on lower leaves (early blight)", "Cut stems at base (cutworm)", "Yellowing from bottom leaves upward (nutrient issue)"]'::jsonb,
  'If plants wilt suddenly without yellowing, bacterial wilt is suspected. Remove affected plants and consult an expert before replanting.',
  'यदि बोट अचानक पहेँलो नभई ओइलाउँछ भने, ब्याक्टेरियल विल्ट शंका गर्नुहोस्। प्रभावित बोट हटाउनुहोस् र पुन: रोप्नुअघि विज्ञसँग सल्लाह गर्नुहोस्।'),

('Tomato', 'गोलभेडा', 'mid_growth', 'फूल/फल लाग्दै', 
  '["Leaf curl virus (TLCV)", "Fruit borer (Helicoverpa)", "Blossom end rot (calcium deficiency)", "Late blight in monsoon", "Whitefly/aphid vectors"]'::jsonb,
  '["Regular staking and pruning of suckers", "Remove and destroy virus-infected plants", "Ensure consistent watering to prevent blossom end rot", "Apply calcium-containing fertilizer if BER appears", "Use pheromone traps for fruit borer monitoring", "Spray neem-based preparations for minor pest issues"]'::jsonb,
  '["Never recommend aggressive chemical spraying during fruiting without PHI consideration", "Do not diagnose virus type without lab confirmation", "Never advise eating fruits from heavily diseased plants without expert clearance"]'::jsonb,
  '["Upward leaf curling with stunted growth (virus)", "Holes in green/ripe fruits with frass (fruit borer)", "Dark sunken area at bottom of fruit (BER)", "Water-soaked dark spots spreading rapidly on leaves/fruits (late blight)"]'::jsonb,
  'Leaf curl virus and late blight epidemics need immediate expert intervention. Contact Krishi helpline or visit district agriculture office.',
  'पात कुर्चिने भाइरस र ढिलो ब्लाइट महामारीमा तुरुन्तै विज्ञको हस्तक्षेप आवश्यक छ। कृषि हेल्पलाइन वा जिल्ला कृषि कार्यालयमा सम्पर्क गर्नुहोस्।'),

('Tomato', 'गोलभेडा', 'pre_harvest', 'फल पाक्दै/टिप्दै', 
  '["Fruit cracking from uneven watering", "Sun scald on exposed fruits", "Over-ripening and dropping", "Pest damage to ripe fruits"]'::jsonb,
  '["Harvest at breaker stage (pink) for distant markets", "Harvest fully ripe for local sale", "Handle fruits gently to avoid bruising", "Harvest in cool morning hours", "Sort and grade fruits immediately", "Use clean crates/baskets for harvesting"]'::jsonb,
  '["Never recommend ripening chemicals without proper guidance", "Do not advise storing ripe tomatoes in direct sun", "Never suggest chemical treatment on fruits near harvest"]'::jsonb,
  '["Extensive fruit cracking after rain", "Soft rot developing on harvested fruits", "Fruits dropping before fully mature"]'::jsonb,
  'For post-harvest quality issues or market questions, consult your local agriculture service center or cooperative.',
  'कटनी पछिको गुणस्तर समस्या वा बजार प्रश्नहरूमा, स्थानीय कृषि सेवा केन्द्र वा सहकारीसँग सल्लाह गर्नुहोस्।'),

('Tomato', 'गोलभेडा', 'post_harvest', 'भण्डारण/बिक्री', 
  '["Rapid spoilage (perishable crop)", "Price crash during peak season", "Transport damage", "Lack of cold storage"]'::jsonb,
  '["Grade and pack carefully for market", "Use ventilated crates, not sacks", "Sell quickly or process (sun-dry, pickle, sauce)", "Consider staggered planting for staggered harvest", "Connect with collection centers or cooperatives", "Explore solar dryer for value addition"]'::jsonb,
  '["Never recommend chemical preservatives for fresh market tomatoes", "Do not guarantee shelf life estimates", "Never suggest practices that compromise food safety"]'::jsonb,
  '["Rapid softening and mold on stored fruits", "Bruise marks from rough handling", "Market glut with very low prices"]'::jsonb,
  'For value addition techniques (drying, processing), contact your local agriculture knowledge center for training programs.',
  'मूल्य अभिवृद्धि प्रविधिहरू (सुकाउने, प्रशोधन) को लागि, तालिम कार्यक्रमहरूको बारेमा स्थानीय कृषि ज्ञान केन्द्रमा सम्पर्क गर्नुहोस्।');

-- ===== CAULIFLOWER (काउली) =====
INSERT INTO public.crop_stage_advisories (crop_name, crop_name_ne, stage, stage_name_ne, risks, safe_practices, red_lines, warning_signs, referral_message, referral_message_ne) VALUES
('Cauliflower', 'काउली', 'nursery', 'बिउ/नर्सरी', 
  '["Damping off", "Club root (soil-borne)", "Flea beetle damage on seedlings", "Poor germination in hot weather"]'::jsonb,
  '["Use disease-resistant varieties if available", "Raise nursery in partial shade during summer", "Use well-drained nursery beds with compost", "Treat seeds before sowing", "Protect from flea beetles with fine net", "Water gently with fine spray"]'::jsonb,
  '["Never recommend specific chemical seed treatments by brand", "Do not advise transplanting weak or diseased seedlings", "Never suggest using infected soil for nursery"]'::jsonb,
  '["Seedlings collapsing at soil level", "Swollen/distorted roots (club root)", "Tiny holes on cotyledon leaves (flea beetle)", "Seedlings turning purple (phosphorus deficiency or cold stress)"]'::jsonb,
  'If club root or widespread damping off occurs, do not transplant. Consult agriculture technician for soil treatment advice.',
  'क्लब रूट वा व्यापक ढलेपन भएमा, रोप्नुहोस्। माटो उपचार सल्लाहको लागि कृषि प्राविधिकसँग सल्लाह गर्नुहोस्।'),

('Cauliflower', 'काउली', 'early_growth', 'रोपाइ/प्रारम्भिक वृद्धि', 
  '["Transplant shock", "Diamond back moth (DBM)", "Aphid infestation", "Black rot (bacterial)", "Nutrient deficiency"]'::jsonb,
  '["Transplant in evening, water immediately", "Maintain 45x45cm or 60x45cm spacing", "Apply well-decomposed compost/FYM", "Scout for DBM larvae on undersides of leaves", "Install yellow sticky traps for monitoring", "Remove and destroy black rot infected plants"]'::jsonb,
  '["Never recommend broad-spectrum insecticides as first response", "Do not diagnose black rot from yellowing alone", "Never advise chemical application without confirmed pest presence"]'::jsonb,
  '["Small holes and windowpane damage on leaves (DBM)", "V-shaped yellow lesions from leaf margin (black rot)", "Curling leaves with aphid colonies", "Stunted growth with purpling leaves"]'::jsonb,
  'Black rot confirmed plants must be removed. Contact expert if more than 10% plants show V-shaped lesions.',
  'ब्ल्याक रट पुष्टि भएका बोटहरू हटाउनुपर्छ। १०% भन्दा बढी बोटमा V-आकारको दाग देखिएमा विज्ञसँग सम्पर्क गर्नुहोस्।'),

('Cauliflower', 'काउली', 'mid_growth', 'कर्ड बन्दै', 
  '["Hollow stem (boron deficiency)", "Browning/discoloration of curd", "DBM and cabbage butterfly heavy infestation", "Alternaria leaf spot", "Curd quality issues from temperature fluctuation"]'::jsonb,
  '["Apply boron micronutrient if hollow stem suspected", "Cover developing curd with inner leaves (blanching)", "Use Bt-based bio-pesticide for DBM if needed", "Maintain consistent irrigation", "Remove severely infested leaves", "Top-dress nitrogen carefully - excess causes leafy growth over curd"]'::jsonb,
  '["Never recommend exact boron dose without soil test", "Do not advise chemical spray on exposed curd", "Never suggest ignoring curd browning"]'::jsonb,
  '["Hollow/brown center in stem when cut (boron deficiency)", "Curd turning yellow/brown/purple", "Heavy caterpillar damage with frass on curd", "Circular brown spots on older leaves (Alternaria)"]'::jsonb,
  'For curd quality problems or suspected nutrient deficiency, collect a soil sample and visit your agriculture service center.',
  'कर्ड गुणस्तर समस्या वा शंकास्पद पोषक तत्व कमीको लागि, माटो नमूना सङ्कलन गरी कृषि सेवा केन्द्रमा जानुहोस्।'),

('Cauliflower', 'काउली', 'pre_harvest', 'काट्ने अवस्था', 
  '["Curd loosening (riceyness)", "Insect contamination in curd", "Premature bolting", "Frost damage in winter"]'::jsonb,
  '["Harvest when curd is compact and white/cream", "Cut with some wrapper leaves for protection", "Harvest in cool morning hours", "Handle gently to avoid bruising", "Do not delay harvest once curd is ready"]'::jsonb,
  '["Never recommend chemical spray within 7 days of harvest", "Do not advise harvesting loose/ricey curds for premium market", "Never suggest artificial whitening of curd"]'::jsonb,
  '["Curd segments separating (ricey/loose)", "Yellow flowers starting to appear (bolting)", "Insect larvae visible in curd folds", "Brown/frost-damaged curd edges"]'::jsonb,
  'If bolting or loose curd is widespread, consult expert on variety selection for next season.',
  'यदि बोल्टिङ वा खुकुलो कर्ड व्यापक छ भने, अर्को सिजनको लागि किस्म छनोटमा विज्ञसँग सल्लाह गर्नुहोस्।'),

('Cauliflower', 'काउली', 'post_harvest', 'भण्डारण/बिक्री', 
  '["Rapid wilting and yellowing", "Physical damage during transport", "Short shelf life (2-3 days without cold)", "Market price volatility"]'::jsonb,
  '["Keep wrapper leaves on for transport protection", "Use ventilated crates, not sacks", "Sell same day or next day for best quality", "Sprinkle water to maintain freshness during transport", "Consider cooperative marketing for better bargaining", "Grade by size for better price"]'::jsonb,
  '["Never recommend chemical treatment on harvested cauliflower", "Do not suggest long storage without cold chain", "Never advise soaking in chemicals for freshness"]'::jsonb,
  '["Yellowing of curd within hours of harvest", "Soft rot developing from cut stem end", "Physical bruising from rough handling"]'::jsonb,
  'For cold storage or market linkage support, contact your local agriculture cooperative or market committee.',
  'शीत भण्डारण वा बजार सम्पर्क सहायताको लागि, स्थानीय कृषि सहकारी वा बजार समितिमा सम्पर्क गर्नुहोस्।');

-- ===== GLOBAL AI SAFETY RULES =====
INSERT INTO public.ai_safety_rules (rule_type, scope, rule_text, rule_text_ne, severity) VALUES
('red_line', 'global', 'Never recommend specific pesticide/fungicide/herbicide brand names. Only use generic active ingredient names.', 'कहिल्यै विशिष्ट कीटनाशक/ढुसीनाशक/शाकनाशक ब्राण्ड नाम सिफारिस नगर्नुहोस्। सामान्य सक्रिय तत्व नामहरू मात्र प्रयोग गर्नुहोस्।', 'critical'),
('red_line', 'global', 'Never provide exact chemical dosage in ml/gm per unit area. Say "as recommended on the product label" or "consult local agrovet".', 'कहिल्यै प्रति एकाइ क्षेत्रफलमा ml/gm मा सटीक रासायनिक मात्रा नदिनुहोस्। "उत्पादन लेबलमा सिफारिस गरिए अनुसार" वा "स्थानीय एग्रोभेटसँग सल्लाह गर्नुहोस्" भन्नुहोस्।', 'critical'),
('red_line', 'global', 'Never diagnose a serious disease outbreak with high confidence from text description alone. Always ask for photos and suggest expert verification.', 'पाठ विवरण मात्रबाट कहिल्यै गम्भीर रोग प्रकोपको उच्च विश्वासका साथ निदान नगर्नुहोस्। सधैँ फोटो माग्नुहोस् र विज्ञ प्रमाणिकरण सुझाव दिनुहोस्।', 'critical'),
('red_line', 'global', 'Never suggest practices that violate food safety, like spraying chemicals close to harvest without mentioning PHI (pre-harvest interval).', 'कहिल्यै खाद्य सुरक्षा उल्लंघन गर्ने अभ्यासहरू सुझाव नदिनुहोस्, जस्तै PHI (कटनी पूर्व अन्तराल) नभनी कटनी नजिक रसायन छर्ने।', 'critical'),
('red_line', 'global', 'Never give human/animal medical advice. For poisoning or health emergencies, direct to nearest health facility.', 'कहिल्यै मानव/पशु चिकित्सा सल्लाह नदिनुहोस्। विषाक्तता वा स्वास्थ्य आपतकालीनमा, नजिकको स्वास्थ्य सुविधामा जान भन्नुहोस्।', 'critical'),
('guardrail', 'global', 'When confidence is low or situation seems complex, always add: "यो अवस्थामा नजिकको कृषि प्राविधिक वा कृषि ज्ञान केन्द्रमा सम्पर्क गर्नुहोस्।"', 'जब विश्वास कम छ वा अवस्था जटिल देखिन्छ, सधैँ थप्नुहोस्: "यो अवस्थामा नजिकको कृषि प्राविधिक वा कृषि ज्ञान केन्द्रमा सम्पर्क गर्नुहोस्।"', 'high'),
('guardrail', 'global', 'Always prioritize IPM approach: cultural controls first, then biological, then chemical as last resort.', 'सधैँ IPM दृष्टिकोणलाई प्राथमिकता दिनुहोस्: पहिले सांस्कृतिक नियन्त्रण, त्यसपछि जैविक, त्यसपछि अन्तिम उपायको रूपमा रासायनिक।', 'high'),
('disclaimer', 'global', 'AI advice is for general guidance only. Always verify with local experts, Krishi Gyan Kendra, or trusted agrovet before applying chemicals or making major crop decisions.', 'AI सल्लाह सामान्य मार्गदर्शनको लागि मात्र हो। रसायन प्रयोग गर्नु वा ठूलो बाली निर्णय गर्नुअघि सधैँ स्थानीय विज्ञ, कृषि ज्ञान केन्द्र, वा विश्वसनीय एग्रोभेटसँग प्रमाणित गर्नुहोस्।', 'critical'),
('referral', 'global', 'For emergencies (widespread outbreak, poisoning, crop insurance claims), contact: District Agriculture Office, Krishi helpline, or nearest agriculture service center.', 'आपतकालीन अवस्थामा (व्यापक प्रकोप, विषाक्तता, बाली बीमा दाबी), सम्पर्क गर्नुहोस्: जिल्ला कृषि कार्यालय, कृषि हेल्पलाइन, वा नजिकको कृषि सेवा केन्द्र।', 'critical');
