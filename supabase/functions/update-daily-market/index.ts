import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// CONFIGURATION - Multi-market source configuration
// =============================================================================
// This architecture supports plugging in real APIs (AMPIS, Kalimati, etc.)
// Each source has its own fetcher function that can be swapped out.
// =============================================================================
interface MarketSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  marketCode: string;
  marketNameEn: string;
  marketNameNe: string;
  provinceId: number;
  districtIdFk: number | null;
  district: string;
  sourceType: 'mock' | 'api' | 'scraper';
  apiConfig?: {
    baseUrl: string;
    authType: 'none' | 'bearer' | 'apikey';
    authHeader?: string;
  };
  fetchFn: (date: string, config: MarketSourceConfig) => Promise<RawMarketItem[]>;
}

// =============================================================================
// EXTERNAL API CONNECTORS (Future-ready)
// These can be replaced with real implementations when API access is available
// =============================================================================

// AMPIS API Connector (placeholder - replace with real implementation)
class AmpisClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = config?.baseUrl || 'https://ampis.moald.gov.np/api'; // Placeholder
    this.apiKey = config?.apiKey;
  }

  async fetchMarkets(): Promise<{ code: string; name: string; district: string }[]> {
    // TODO: Implement when AMPIS API access is available
    console.log('[AmpisClient] fetchMarkets - Not implemented yet');
    return [];
  }

  async fetchDailyPrices(date: string): Promise<RawMarketItem[]> {
    // TODO: Implement when AMPIS API access is available
    console.log(`[AmpisClient] fetchDailyPrices for ${date} - Not implemented yet`);
    return [];
  }
}

// Kalimati API Connector (placeholder - replace with real implementation)
class KalimatiClient {
  private baseUrl: string;

  constructor(config?: { baseUrl?: string }) {
    this.baseUrl = config?.baseUrl || 'https://kalimatimarket.gov.np/api'; // Placeholder
  }

  async fetchDailyPrices(date: string): Promise<RawMarketItem[]> {
    // TODO: Implement when Kalimati API access is available
    // Could use web scraping as fallback if no official API
    console.log(`[KalimatiClient] fetchDailyPrices for ${date} - Not implemented yet`);
    return [];
  }
}

// =============================================================================
// MARKET SOURCES CONFIGURATION
// =============================================================================
const MARKET_SOURCES: MarketSourceConfig[] = [
  // Kalimati - Main wholesale market in Kathmandu
  {
    id: 'kalimati',
    name: 'Kalimati Wholesale Market',
    enabled: true,
    marketCode: 'KALIMATI',
    marketNameEn: 'Kalimati',
    marketNameNe: 'कालिमाटी',
    provinceId: 3,
    districtIdFk: null,
    district: 'Kathmandu',
    sourceType: 'mock', // Change to 'api' when real API is available
    apiConfig: {
      baseUrl: 'https://kalimatimarket.gov.np/api',
      authType: 'none',
    },
    fetchFn: fetchMockKalimatiData,
  },
  // Biratnagar - Eastern Nepal wholesale
  {
    id: 'biratnagar',
    name: 'Biratnagar Wholesale',
    enabled: true,
    marketCode: 'BIRATNAGAR_WH',
    marketNameEn: 'Biratnagar Wholesale',
    marketNameNe: 'विराटनगर थोक',
    provinceId: 1,
    districtIdFk: null,
    district: 'Morang',
    sourceType: 'mock',
    fetchFn: fetchMockBiratnagarData,
  },
  // Pokhara - Gandaki Province
  {
    id: 'pokhara',
    name: 'Pokhara Retail Market',
    enabled: true,
    marketCode: 'POKHARA_RT',
    marketNameEn: 'Pokhara Retail',
    marketNameNe: 'पोखरा खुद्रा',
    provinceId: 4,
    districtIdFk: null,
    district: 'Kaski',
    sourceType: 'mock',
    fetchFn: fetchMockPokharaData,
  },
  // Butwal - Lumbini Province
  {
    id: 'butwal',
    name: 'Butwal Market',
    enabled: true,
    marketCode: 'BUTWAL',
    marketNameEn: 'Butwal',
    marketNameNe: 'बुटवल',
    provinceId: 5,
    districtIdFk: null,
    district: 'Rupandehi',
    sourceType: 'mock',
    fetchFn: fetchMockButwalData,
  },
  // Nepalgunj - Lumbini Province (Western)
  {
    id: 'nepalgunj',
    name: 'Nepalgunj Market',
    enabled: true,
    marketCode: 'NEPALGUNJ',
    marketNameEn: 'Nepalgunj',
    marketNameNe: 'नेपालगञ्ज',
    provinceId: 5,
    districtIdFk: null,
    district: 'Banke',
    sourceType: 'mock',
    fetchFn: fetchMockNepalgunjData,
  },
  // Dhangadhi - Sudurpashchim Province
  {
    id: 'dhangadhi',
    name: 'Dhangadhi Market',
    enabled: true,
    marketCode: 'DHANGADHI',
    marketNameEn: 'Dhangadhi',
    marketNameNe: 'धनगढी',
    provinceId: 7,
    districtIdFk: null,
    district: 'Kailali',
    sourceType: 'mock',
    fetchFn: fetchMockDhangadhiData,
  },
  // Birgunj - Madhesh Province
  {
    id: 'birgunj',
    name: 'Birgunj Market',
    enabled: true,
    marketCode: 'BIRGUNJ',
    marketNameEn: 'Birgunj',
    marketNameNe: 'वीरगञ्ज',
    provinceId: 2,
    districtIdFk: null,
    district: 'Parsa',
    sourceType: 'mock',
    fetchFn: fetchMockBirgunjData,
  },
  // Itahari - Koshi Province
  {
    id: 'itahari',
    name: 'Itahari Market',
    enabled: true,
    marketCode: 'ITAHARI',
    marketNameEn: 'Itahari',
    marketNameNe: 'इटहरी',
    provinceId: 1,
    districtIdFk: null,
    district: 'Sunsari',
    sourceType: 'mock',
    fetchFn: fetchMockItahariData,
  },
];

// =============================================================================
// DATA INTERFACES
// =============================================================================
interface RawMarketItem {
  commodity_id: string;
  commodity_name_en: string;
  commodity_name_ne: string;
  unit: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  category: string;
  image_url?: string;
  crop_id?: number;
}

interface NormalizedProduct {
  date: string;
  crop_name: string;
  crop_name_ne: string | null;
  crop_id: number | null;
  image_url: string | null;
  unit: string;
  price_min: number | null;
  price_max: number | null;
  price_avg: number | null;
  market_name: string;
  market_name_ne: string;
  district: string;
  source: string;
  province_id: number | null;
  district_id_fk: number | null;
}

// =============================================================================
// BASE PRODUCT DATA (shared across mock sources with price variations)
// =============================================================================
const BASE_PRODUCTS: Omit<RawMarketItem, 'min_price' | 'max_price' | 'avg_price'>[] = [
  { commodity_id: '1', commodity_name_en: 'Tomato (Local)', commodity_name_ne: 'गोलभेडा (स्थानीय)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400' },
  { commodity_id: '2', commodity_name_en: 'Tomato (Hybrid)', commodity_name_ne: 'गोलभेडा (हाइब्रिड)', unit: 'kg', category: 'vegetable' },
  { commodity_id: '3', commodity_name_en: 'Potato (Red)', commodity_name_ne: 'आलु (रातो)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82ber40a?w=400' },
  { commodity_id: '4', commodity_name_en: 'Potato (White)', commodity_name_ne: 'आलु (सेतो)', unit: 'kg', category: 'vegetable' },
  { commodity_id: '5', commodity_name_en: 'Onion (Dry)', commodity_name_ne: 'प्याज (सुकेको)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400' },
  { commodity_id: '6', commodity_name_en: 'Onion (Green)', commodity_name_ne: 'हरियो प्याज', unit: 'bundle', category: 'vegetable' },
  { commodity_id: '7', commodity_name_en: 'Cabbage', commodity_name_ne: 'बन्दा', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400' },
  { commodity_id: '8', commodity_name_en: 'Cauliflower', commodity_name_ne: 'काउली', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400' },
  { commodity_id: '9', commodity_name_en: 'Carrot (Local)', commodity_name_ne: 'गाजर (स्थानीय)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { commodity_id: '10', commodity_name_en: 'Radish (White)', commodity_name_ne: 'मुला (सेतो)', unit: 'kg', category: 'vegetable' },
  { commodity_id: '11', commodity_name_en: 'Cucumber', commodity_name_ne: 'काँक्रो', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400' },
  { commodity_id: '12', commodity_name_en: 'Bitter Gourd', commodity_name_ne: 'करेला', unit: 'kg', category: 'vegetable' },
  { commodity_id: '13', commodity_name_en: 'Bottle Gourd', commodity_name_ne: 'लौका', unit: 'kg', category: 'vegetable' },
  { commodity_id: '14', commodity_name_en: 'Pumpkin', commodity_name_ne: 'फर्सी', unit: 'kg', category: 'vegetable' },
  { commodity_id: '15', commodity_name_en: 'Spinach', commodity_name_ne: 'पालुङ्गो', unit: 'bundle', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
  { commodity_id: '16', commodity_name_en: 'Mustard Greens', commodity_name_ne: 'रायो साग', unit: 'bundle', category: 'vegetable' },
  { commodity_id: '17', commodity_name_en: 'Coriander', commodity_name_ne: 'धनियाँ', unit: 'bundle', category: 'vegetable' },
  { commodity_id: '18', commodity_name_en: 'Green Chili', commodity_name_ne: 'हरियो खुर्सानी', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400' },
  { commodity_id: '19', commodity_name_en: 'Garlic (Dry)', commodity_name_ne: 'लसुन (सुकेको)', unit: 'kg', category: 'spice', image_url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400' },
  { commodity_id: '20', commodity_name_en: 'Ginger', commodity_name_ne: 'अदुवा', unit: 'kg', category: 'spice', image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400' },
  { commodity_id: '21', commodity_name_en: 'Brinjal (Long)', commodity_name_ne: 'भण्टा (लामो)', unit: 'kg', category: 'vegetable' },
  { commodity_id: '22', commodity_name_en: 'Green Beans', commodity_name_ne: 'सिमी', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400' },
  { commodity_id: '23', commodity_name_en: 'Okra', commodity_name_ne: 'भिण्डी', unit: 'kg', category: 'vegetable' },
  { commodity_id: '24', commodity_name_en: 'Apple (Fuji)', commodity_name_ne: 'स्याउ (फुजी)', unit: 'kg', category: 'fruit' },
  { commodity_id: '25', commodity_name_en: 'Banana', commodity_name_ne: 'केरा', unit: 'dozen', category: 'fruit' },
  { commodity_id: '26', commodity_name_en: 'Orange', commodity_name_ne: 'सुन्तला', unit: 'kg', category: 'fruit' },
  { commodity_id: '27', commodity_name_en: 'Lemon', commodity_name_ne: 'कागती', unit: 'kg', category: 'fruit' },
  { commodity_id: '28', commodity_name_en: 'Papaya', commodity_name_ne: 'मेवा', unit: 'kg', category: 'fruit' },
];

const BASE_PRICES: Record<string, number> = {
  '1': 80, '2': 100, '3': 45, '4': 40, '5': 70, '6': 25, '7': 35, '8': 50,
  '9': 60, '10': 35, '11': 50, '12': 65, '13': 40, '14': 30, '15': 20,
  '16': 15, '17': 20, '18': 120, '19': 280, '20': 200, '21': 55, '22': 75,
  '23': 85, '24': 250, '25': 100, '26': 150, '27': 120, '28': 80,
};

// =============================================================================
// MOCK DATA FETCHERS (per market)
// =============================================================================
function generatePricesWithVariation(date: string, marketSeed: number): RawMarketItem[] {
  const dateSeed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  return BASE_PRODUCTS.map((product, index) => {
    const basePrice = BASE_PRICES[product.commodity_id] || 50;
    // Different variation per market + date
    const variation = ((dateSeed + index + marketSeed) % 30 - 15) / 100;
    const avg = Math.round(basePrice * (1 + variation));
    const min = Math.round(avg * 0.85);
    const max = Math.round(avg * 1.15);
    
    return { ...product, min_price: min, max_price: max, avg_price: avg };
  });
}

async function fetchMockKalimatiData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Kalimati Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 0);
}

async function fetchMockBiratnagarData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Biratnagar Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 100).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 0.92),
    max_price: Math.round(item.max_price * 0.95),
    avg_price: Math.round(item.avg_price * 0.93),
  }));
}

async function fetchMockPokharaData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Pokhara Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 200).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 1.08),
    max_price: Math.round(item.max_price * 1.15),
    avg_price: Math.round(item.avg_price * 1.10),
  }));
}

async function fetchMockButwalData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Butwal Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 300).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 0.95),
    max_price: Math.round(item.max_price * 1.02),
    avg_price: Math.round(item.avg_price * 0.98),
  }));
}

async function fetchMockNepalgunjData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Nepalgunj Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 400).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 0.88),
    max_price: Math.round(item.max_price * 0.95),
    avg_price: Math.round(item.avg_price * 0.90),
  }));
}

async function fetchMockDhangadhiData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Dhangadhi Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 500).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 1.05),
    max_price: Math.round(item.max_price * 1.12),
    avg_price: Math.round(item.avg_price * 1.08),
  }));
}

async function fetchMockBirgunjData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Birgunj Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 600).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 0.90),
    max_price: Math.round(item.max_price * 0.98),
    avg_price: Math.round(item.avg_price * 0.94),
  }));
}

async function fetchMockItahariData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Itahari Mock] Generating data for ${date}`);
  return generatePricesWithVariation(date, 700).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 0.93),
    max_price: Math.round(item.max_price * 1.00),
    avg_price: Math.round(item.avg_price * 0.96),
  }));
}

// =============================================================================
// DATA MAPPER
// =============================================================================
function normalizeMarketData(
  rawData: RawMarketItem[],
  date: string,
  source: MarketSourceConfig
): NormalizedProduct[] {
  return rawData.map(item => ({
    date,
    crop_name: item.commodity_name_en,
    crop_name_ne: item.commodity_name_ne,
    crop_id: item.crop_id || null,
    image_url: item.image_url || null,
    unit: item.unit,
    price_min: item.min_price,
    price_max: item.max_price,
    price_avg: item.avg_price,
    market_name: source.marketNameEn,
    market_name_ne: source.marketNameNe,
    district: source.district,
    source: source.id,
    province_id: source.provinceId,
    district_id_fk: source.districtIdFk,
  }));
}

// =============================================================================
// PRICE ALERT EVALUATION
// =============================================================================
interface PriceAlert {
  id: string;
  user_id: string;
  crop_id: number | null;
  market_code: string | null;
  condition_type: 'greater_equal' | 'less_equal' | 'percent_increase' | 'percent_decrease';
  threshold_value: number;
  percent_reference_days: number | null;
  is_recurring: boolean;
  is_active: boolean;
}

async function evaluatePriceAlerts(
  supabase: any,
  updatedProducts: NormalizedProduct[],
  today: string
): Promise<number> {
  console.log('[Alert Evaluation] Starting...');
  
  // Fetch all active alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('is_active', true);

  if (alertsError) {
    console.error('[Alert Evaluation] Error fetching alerts:', alertsError);
    return 0;
  }

  if (!alerts || alerts.length === 0) {
    console.log('[Alert Evaluation] No active alerts found');
    return 0;
  }

  console.log(`[Alert Evaluation] Found ${alerts.length} active alerts`);

  let triggeredCount = 0;

  for (const alert of alerts as PriceAlert[]) {
    try {
      // Find matching price data
      let matchingProducts = updatedProducts;
      
      // Filter by crop_id if specified
      if (alert.crop_id) {
        matchingProducts = matchingProducts.filter(p => p.crop_id === alert.crop_id);
      }
      
      // Filter by market_code if specified
      if (alert.market_code) {
        // Need to match market_name to market_code
        const { data: market } = await supabase
          .from('markets')
          .select('name_en')
          .eq('market_code', alert.market_code)
          .maybeSingle();
        
        if (market) {
          matchingProducts = matchingProducts.filter(p => p.market_name === market.name_en);
        }
      }

      if (matchingProducts.length === 0) continue;

      const currentPrice = matchingProducts[0].price_avg;
      if (!currentPrice) continue;

      let shouldTrigger = false;

      switch (alert.condition_type) {
        case 'greater_equal':
          shouldTrigger = currentPrice >= alert.threshold_value;
          break;
        case 'less_equal':
          shouldTrigger = currentPrice <= alert.threshold_value;
          break;
        case 'percent_increase':
        case 'percent_decrease': {
          const refDays = alert.percent_reference_days || 7;
          const refDate = new Date(today);
          refDate.setDate(refDate.getDate() - refDays);
          const refDateStr = refDate.toISOString().split('T')[0];

          // Fetch historical price
          const { data: histData } = await supabase
            .from('daily_market_products')
            .select('price_avg')
            .eq('date', refDateStr)
            .eq('crop_name', matchingProducts[0].crop_name)
            .eq('market_name', matchingProducts[0].market_name)
            .maybeSingle();

          if (histData?.price_avg) {
            const percentChange = ((currentPrice - histData.price_avg) / histData.price_avg) * 100;
            if (alert.condition_type === 'percent_increase') {
              shouldTrigger = percentChange >= alert.threshold_value;
            } else {
              shouldTrigger = percentChange <= -alert.threshold_value;
            }
          }
          break;
        }
      }

      if (shouldTrigger) {
        console.log(`[Alert Evaluation] Triggering alert ${alert.id}`);

        // Get crop name
        const { data: cropData } = await supabase
          .from('crops')
          .select('name_ne')
          .eq('id', alert.crop_id)
          .maybeSingle();

        const cropName = cropData?.name_ne || matchingProducts[0].crop_name_ne || 'Unknown';

        // Create notification
        const { error: notifError } = await supabase
          .from('farmer_notifications')
          .insert({
            farmer_id: alert.user_id, // Note: This assumes user_id matches farmer_id
            type: 'price_alert',
            title: `${cropName} मूल्य अलर्ट!`,
            message: `आज ${cropName} को मूल्य रु. ${currentPrice} भयो।`,
            data: {
              alert_id: alert.id,
              crop_name: cropName,
              current_price: currentPrice,
              market: matchingProducts[0].market_name_ne,
            },
          });

        if (notifError) {
          console.error(`[Alert Evaluation] Error creating notification:`, notifError);
        }

        // Update alert: mark as triggered
        const updates: any = { last_triggered_at: new Date().toISOString() };
        if (!alert.is_recurring) {
          updates.is_active = false;
        }

        await supabase
          .from('price_alerts')
          .update(updates)
          .eq('id', alert.id);

        triggeredCount++;
      }
    } catch (err) {
      console.error(`[Alert Evaluation] Error processing alert ${alert.id}:`, err);
    }
  }

  console.log(`[Alert Evaluation] Triggered ${triggeredCount} alerts`);
  return triggeredCount;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const enabledSources = MARKET_SOURCES.filter(s => s.enabled);
    
    console.log(`[update-daily-market] Starting update for ${today}`);
    console.log(`[update-daily-market] Enabled sources: ${enabledSources.map(s => s.id).join(', ')}`);

    let totalProducts = 0;
    let allNormalizedProducts: NormalizedProduct[] = [];
    const results: { source: string; count: number; success: boolean; error?: string }[] = [];

    // Fetch from each enabled source
    for (const source of enabledSources) {
      try {
        console.log(`[update-daily-market] Fetching from ${source.name}...`);
        
        const rawData = await source.fetchFn(today, source);
        console.log(`[update-daily-market] ${source.id}: Fetched ${rawData.length} items`);

        if (rawData.length === 0) {
          results.push({ source: source.id, count: 0, success: true });
          continue;
        }

        const normalizedProducts = normalizeMarketData(rawData, today, source);
        allNormalizedProducts = [...allNormalizedProducts, ...normalizedProducts];

        // Upsert products (idempotent - safe to run multiple times)
        const { error: upsertError } = await supabase
          .from('daily_market_products')
          .upsert(normalizedProducts, {
            onConflict: 'date,crop_name,market_name',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`[update-daily-market] ${source.id} upsert error:`, upsertError);
          results.push({ source: source.id, count: 0, success: false, error: upsertError.message });
        } else {
          totalProducts += normalizedProducts.length;
          results.push({ source: source.id, count: normalizedProducts.length, success: true });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[update-daily-market] ${source.id} error:`, errorMsg);
        results.push({ source: source.id, count: 0, success: false, error: errorMsg });
      }
    }

    // Evaluate price alerts after all products are updated
    let alertsTriggered = 0;
    if (allNormalizedProducts.length > 0) {
      alertsTriggered = await evaluatePriceAlerts(supabase, allNormalizedProducts, today);
    }

    console.log(`[update-daily-market] Completed. Total products: ${totalProducts}, Alerts triggered: ${alertsTriggered}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${totalProducts} products from ${enabledSources.length} sources`,
        date: today,
        productsCount: totalProducts,
        alertsTriggered,
        sources: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[update-daily-market] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});