import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// CONFIGURATION - Change these when switching to real API
// =============================================================================
const CONFIG = {
  // Set to 'mock' for simulated data, 'kalimati' for real Kalimati API
  dataSource: 'mock' as 'mock' | 'kalimati',
  
  // Real API endpoints (for future use)
  kalimatiApiUrl: 'https://kalimatimarket.gov.np/api/daily-prices', // placeholder
  kalimatiApiKey: Deno.env.get('KALIMATI_API_KEY') || '',
  
  // Default market info
  defaultMarket: {
    name_en: 'Kalimati',
    name_ne: 'कालिमाटी',
  },
};

// =============================================================================
// MOCK DATA - Simulates Kalimati wholesale market prices
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
}

function generateMockKalimatiData(date: string): RawMarketItem[] {
  // Simulated daily price data mimicking Kalimati API response structure
  const baseProducts: Omit<RawMarketItem, 'min_price' | 'max_price' | 'avg_price'>[] = [
    { commodity_id: '1', commodity_name_en: 'Tomato (Local)', commodity_name_ne: 'गोलभेडा (स्थानीय)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400' },
    { commodity_id: '2', commodity_name_en: 'Tomato (Hybrid)', commodity_name_ne: 'गोलभेडा (हाइब्रिड)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400' },
    { commodity_id: '3', commodity_name_en: 'Potato (Red)', commodity_name_ne: 'आलु (रातो)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82ber40a?w=400' },
    { commodity_id: '4', commodity_name_en: 'Potato (White)', commodity_name_ne: 'आलु (सेतो)', unit: 'kg', category: 'vegetable' },
    { commodity_id: '5', commodity_name_en: 'Onion (Dry)', commodity_name_ne: 'प्याज (सुकेको)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400' },
    { commodity_id: '6', commodity_name_en: 'Onion (Green)', commodity_name_ne: 'हरियो प्याज', unit: 'bundle', category: 'vegetable' },
    { commodity_id: '7', commodity_name_en: 'Cabbage', commodity_name_ne: 'बन्दा', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400' },
    { commodity_id: '8', commodity_name_en: 'Cauliflower', commodity_name_ne: 'काउली', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400' },
    { commodity_id: '9', commodity_name_en: 'Carrot (Local)', commodity_name_ne: 'गाजर (स्थानीय)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
    { commodity_id: '10', commodity_name_en: 'Radish (White)', commodity_name_ne: 'मुला (सेतो)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400' },
    { commodity_id: '11', commodity_name_en: 'Cucumber', commodity_name_ne: 'काँक्रो', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400' },
    { commodity_id: '12', commodity_name_en: 'Bitter Gourd', commodity_name_ne: 'करेला', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400' },
    { commodity_id: '13', commodity_name_en: 'Bottle Gourd', commodity_name_ne: 'लौका', unit: 'kg', category: 'vegetable' },
    { commodity_id: '14', commodity_name_en: 'Pumpkin', commodity_name_ne: 'फर्सी', unit: 'kg', category: 'vegetable' },
    { commodity_id: '15', commodity_name_en: 'Spinach', commodity_name_ne: 'पालुङ्गो', unit: 'bundle', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
    { commodity_id: '16', commodity_name_en: 'Mustard Greens', commodity_name_ne: 'रायो साग', unit: 'bundle', category: 'vegetable' },
    { commodity_id: '17', commodity_name_en: 'Coriander', commodity_name_ne: 'धनियाँ', unit: 'bundle', category: 'vegetable' },
    { commodity_id: '18', commodity_name_en: 'Green Chili', commodity_name_ne: 'हरियो खुर्सानी', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400' },
    { commodity_id: '19', commodity_name_en: 'Garlic (Dry)', commodity_name_ne: 'लसुन (सुकेको)', unit: 'kg', category: 'spice', image_url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400' },
    { commodity_id: '20', commodity_name_en: 'Ginger', commodity_name_ne: 'अदुवा', unit: 'kg', category: 'spice', image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400' },
    { commodity_id: '21', commodity_name_en: 'Brinjal (Long)', commodity_name_ne: 'भण्टा (लामो)', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1635909096289-7fdc0d87df6f?w=400' },
    { commodity_id: '22', commodity_name_en: 'Brinjal (Round)', commodity_name_ne: 'भण्टा (गोलो)', unit: 'kg', category: 'vegetable' },
    { commodity_id: '23', commodity_name_en: 'Green Beans', commodity_name_ne: 'सिमी', unit: 'kg', category: 'vegetable', image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400' },
    { commodity_id: '24', commodity_name_en: 'Okra', commodity_name_ne: 'भिण्डी', unit: 'kg', category: 'vegetable' },
    { commodity_id: '25', commodity_name_en: 'Apple (Fuji)', commodity_name_ne: 'स्याउ (फुजी)', unit: 'kg', category: 'fruit' },
    { commodity_id: '26', commodity_name_en: 'Banana', commodity_name_ne: 'केरा', unit: 'dozen', category: 'fruit' },
    { commodity_id: '27', commodity_name_en: 'Orange', commodity_name_ne: 'सुन्तला', unit: 'kg', category: 'fruit' },
    { commodity_id: '28', commodity_name_en: 'Lemon', commodity_name_ne: 'कागती', unit: 'kg', category: 'fruit' },
    { commodity_id: '29', commodity_name_en: 'Papaya', commodity_name_ne: 'मेवा', unit: 'kg', category: 'fruit' },
    { commodity_id: '30', commodity_name_en: 'Mango', commodity_name_ne: 'आँप', unit: 'kg', category: 'fruit' },
  ];

  // Generate daily prices with realistic variations based on date seed
  const dateSeed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  const basePrices: Record<string, number> = {
    '1': 80, '2': 100, '3': 45, '4': 40, '5': 70, '6': 25, '7': 35, '8': 50,
    '9': 60, '10': 35, '11': 50, '12': 65, '13': 40, '14': 30, '15': 20,
    '16': 15, '17': 20, '18': 120, '19': 280, '20': 200, '21': 55, '22': 60,
    '23': 75, '24': 85, '25': 250, '26': 100, '27': 150, '28': 120, '29': 80, '30': 180,
  };

  return baseProducts.map((product, index) => {
    const basePrice = basePrices[product.commodity_id] || 50;
    // Add daily variation (±15%) based on date seed
    const variation = ((dateSeed + index) % 30 - 15) / 100;
    const avg = Math.round(basePrice * (1 + variation));
    const min = Math.round(avg * 0.85);
    const max = Math.round(avg * 1.15);
    
    return {
      ...product,
      min_price: min,
      max_price: max,
      avg_price: avg,
    };
  });
}

// =============================================================================
// REAL API FETCHER (for future use)
// =============================================================================
async function fetchKalimatiData(_date: string): Promise<RawMarketItem[]> {
  // Placeholder for real Kalimati API integration
  // When ready, implement:
  // const response = await fetch(CONFIG.kalimatiApiUrl, {
  //   headers: { 'Authorization': `Bearer ${CONFIG.kalimatiApiKey}` }
  // });
  // const data = await response.json();
  // return mapKalimatiResponse(data);
  
  console.log('[update-daily-market] Real Kalimati API not yet configured, using mock data');
  return [];
}

// =============================================================================
// DATA MAPPER - Transforms raw API data to our schema
// =============================================================================
interface NormalizedProduct {
  date: string;
  crop_name: string;
  crop_name_ne: string | null;
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

function normalizeMarketData(
  rawData: RawMarketItem[],
  date: string,
  source: string
): NormalizedProduct[] {
  return rawData.map(item => ({
    date,
    crop_name: item.commodity_name_en,
    crop_name_ne: item.commodity_name_ne,
    image_url: item.image_url || null,
    unit: item.unit,
    price_min: item.min_price,
    price_max: item.max_price,
    price_avg: item.avg_price,
    market_name: CONFIG.defaultMarket.name_en,
    market_name_ne: CONFIG.defaultMarket.name_ne,
    district: 'Kathmandu',
    source,
    province_id: 3, // Bagmati Province
    district_id_fk: null, // Can be linked later
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
    
    console.log(`[update-daily-market] Starting update for ${today}, source: ${CONFIG.dataSource}`);

    // Fetch data based on configured source
    let rawData: RawMarketItem[];
    let sourceLabel: string;

    if (CONFIG.dataSource === 'kalimati') {
      rawData = await fetchKalimatiData(today);
      sourceLabel = 'kalimati_api';
      
      // Fallback to mock if API fails
      if (rawData.length === 0) {
        console.log('[update-daily-market] Falling back to mock data');
        rawData = generateMockKalimatiData(today);
        sourceLabel = 'mock_fallback';
      }
    } else {
      rawData = generateMockKalimatiData(today);
      sourceLabel = 'mock_kalimati';
    }

    console.log(`[update-daily-market] Fetched ${rawData.length} items from ${sourceLabel}`);

    if (rawData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No data available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize data to our schema
    const normalizedProducts = normalizeMarketData(rawData, today, sourceLabel);

    // Upsert products (idempotent - safe to run multiple times)
    const { error: upsertError } = await supabase
      .from('daily_market_products')
      .upsert(normalizedProducts, {
        onConflict: 'date,crop_name,market_name',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('[update-daily-market] Upsert error:', upsertError);
      throw upsertError;
    }

    console.log(`[update-daily-market] Successfully upserted ${normalizedProducts.length} products for ${today}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${normalizedProducts.length} products for ${today}`,
        date: today,
        source: sourceLabel,
        productsCount: normalizedProducts.length,
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