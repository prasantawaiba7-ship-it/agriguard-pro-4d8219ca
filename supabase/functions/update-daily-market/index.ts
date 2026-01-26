import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// CONFIGURATION - Multi-market source configuration
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
  fetchFn: (date: string, config: MarketSourceConfig) => Promise<RawMarketItem[]>;
}

const MARKET_SOURCES: MarketSourceConfig[] = [
  {
    id: 'kalimati_mock',
    name: 'Kalimati Wholesale (Mock)',
    enabled: true,
    marketCode: 'KALIMATI',
    marketNameEn: 'Kalimati',
    marketNameNe: 'कालिमाटी',
    provinceId: 3,
    districtIdFk: null,
    district: 'Kathmandu',
    fetchFn: fetchMockKalimatiData,
  },
  {
    id: 'biratnagar_mock',
    name: 'Biratnagar Wholesale (Mock)',
    enabled: true,
    marketCode: 'BIRATNAGAR_WH',
    marketNameEn: 'Biratnagar Wholesale',
    marketNameNe: 'विराटनगर थोक',
    provinceId: 1,
    districtIdFk: null,
    district: 'Morang',
    fetchFn: fetchMockBiratnagarData,
  },
  {
    id: 'pokhara_mock',
    name: 'Pokhara Retail (Mock)',
    enabled: true,
    marketCode: 'POKHARA_RT',
    marketNameEn: 'Pokhara Retail',
    marketNameNe: 'पोखरा खुद्रा',
    provinceId: 4,
    districtIdFk: null,
    district: 'Kaski',
    fetchFn: fetchMockPokharaData,
  },
  // Add real API sources here when ready:
  // {
  //   id: 'kalimati_api',
  //   name: 'Kalimati Official API',
  //   enabled: false,
  //   marketCode: 'KALIMATI',
  //   fetchFn: fetchKalimatiApiData,
  // },
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
  // Biratnagar prices ~5-10% lower than Kalimati
  return generatePricesWithVariation(date, 100).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 0.92),
    max_price: Math.round(item.max_price * 0.95),
    avg_price: Math.round(item.avg_price * 0.93),
  }));
}

async function fetchMockPokharaData(date: string, _config: MarketSourceConfig): Promise<RawMarketItem[]> {
  console.log(`[Pokhara Mock] Generating data for ${date}`);
  // Pokhara retail prices ~8-15% higher than wholesale
  return generatePricesWithVariation(date, 200).map(item => ({
    ...item,
    min_price: Math.round(item.min_price * 1.08),
    max_price: Math.round(item.max_price * 1.15),
    avg_price: Math.round(item.avg_price * 1.10),
  }));
}

// =============================================================================
// REAL API FETCHER TEMPLATE (for future use)
// =============================================================================
// async function fetchKalimatiApiData(date: string, config: MarketSourceConfig): Promise<RawMarketItem[]> {
//   const apiKey = Deno.env.get('KALIMATI_API_KEY');
//   const response = await fetch(`https://kalimatimarket.gov.np/api/daily-prices?date=${date}`, {
//     headers: { 'Authorization': `Bearer ${apiKey}` }
//   });
//   const data = await response.json();
//   return data.items.map((item: any) => ({
//     commodity_id: item.id,
//     commodity_name_en: item.name_en,
//     commodity_name_ne: item.name_np,
//     unit: item.unit,
//     min_price: item.price_min,
//     max_price: item.price_max,
//     avg_price: item.price_avg,
//     category: item.category || 'vegetable',
//   }));
// }

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

    console.log(`[update-daily-market] Completed. Total products: ${totalProducts}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${totalProducts} products from ${enabledSources.length} sources`,
        date: today,
        productsCount: totalProducts,
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