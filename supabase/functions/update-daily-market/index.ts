import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample product data - this can be replaced with real API/scraper later
const SAMPLE_PRODUCTS = [
  { crop_name: 'Tomato', crop_name_ne: 'गोलभेडा', unit: 'kg', base_price: 100 },
  { crop_name: 'Potato', crop_name_ne: 'आलु', unit: 'kg', base_price: 50 },
  { crop_name: 'Onion', crop_name_ne: 'प्याज', unit: 'kg', base_price: 75 },
  { crop_name: 'Cabbage', crop_name_ne: 'बन्दा', unit: 'piece', base_price: 40 },
  { crop_name: 'Cauliflower', crop_name_ne: 'काउली', unit: 'piece', base_price: 55 },
  { crop_name: 'Carrot', crop_name_ne: 'गाजर', unit: 'kg', base_price: 65 },
  { crop_name: 'Green Beans', crop_name_ne: 'सिमी', unit: 'kg', base_price: 80 },
  { crop_name: 'Cucumber', crop_name_ne: 'काँक्रो', unit: 'kg', base_price: 55 },
  { crop_name: 'Spinach', crop_name_ne: 'पालुङ्गो', unit: 'bundle', base_price: 30 },
  { crop_name: 'Radish', crop_name_ne: 'मूला', unit: 'kg', base_price: 40 },
  { crop_name: 'Chili', crop_name_ne: 'खुर्सानी', unit: 'kg', base_price: 125 },
  { crop_name: 'Garlic', crop_name_ne: 'लसुन', unit: 'kg', base_price: 250 },
  { crop_name: 'Ginger', crop_name_ne: 'अदुवा', unit: 'kg', base_price: 180 },
  { crop_name: 'Brinjal', crop_name_ne: 'भण्टा', unit: 'kg', base_price: 60 },
  { crop_name: 'Bitter Gourd', crop_name_ne: 'करेला', unit: 'kg', base_price: 70 },
];

const PRODUCT_IMAGES: Record<string, string> = {
  'Tomato': 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400',
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82ber40a?w=400',
  'Onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
  'Cabbage': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400',
  'Cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400',
  'Carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
  'Green Beans': 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400',
  'Cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400',
  'Spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
  'Radish': 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400',
  'Chili': 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400',
  'Garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400',
  'Ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Brinjal': 'https://images.unsplash.com/photo-1635909096289-7fdc0d87df6f?w=400',
  'Bitter Gourd': 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400',
};

const MARKETS = [
  { name: 'Kalimati', name_ne: 'कालिमाटी', district: 'Kathmandu' },
  { name: 'Balkhu', name_ne: 'बाल्खु', district: 'Kathmandu' },
  { name: 'Dharan', name_ne: 'धरान', district: 'Sunsari' },
  { name: 'Pokhara', name_ne: 'पोखरा', district: 'Kaski' },
  { name: 'Biratnagar', name_ne: 'विराटनगर', district: 'Morang' },
];

// Generate random price variation
function randomVariation(basePrice: number, variationPercent: number = 20): { min: number; max: number; avg: number } {
  const variation = basePrice * (variationPercent / 100);
  const min = Math.round(basePrice - variation + (Math.random() * variation * 0.5));
  const max = Math.round(basePrice + variation - (Math.random() * variation * 0.5));
  const avg = Math.round((min + max) / 2);
  return { min, max, avg };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[update-daily-market] Starting daily market update for ${today}`);
    
    // Generate products for each market
    const productsToUpsert = [];
    
    for (const market of MARKETS) {
      for (const product of SAMPLE_PRODUCTS) {
        const prices = randomVariation(product.base_price);
        
        productsToUpsert.push({
          date: today,
          crop_name: product.crop_name,
          crop_name_ne: product.crop_name_ne,
          image_url: PRODUCT_IMAGES[product.crop_name] || null,
          unit: product.unit,
          price_min: prices.min,
          price_max: prices.max,
          price_avg: prices.avg,
          market_name: market.name,
          market_name_ne: market.name_ne,
          district: market.district,
          source: 'auto_update',
        });
      }
    }
    
    console.log(`[update-daily-market] Upserting ${productsToUpsert.length} products`);
    
    // Upsert products (update if exists, insert if not)
    const { data, error } = await supabase
      .from('daily_market_products')
      .upsert(productsToUpsert, {
        onConflict: 'date,crop_name,market_name',
        ignoreDuplicates: false,
      });
    
    if (error) {
      console.error('[update-daily-market] Error upserting products:', error);
      throw error;
    }
    
    console.log(`[update-daily-market] Successfully updated daily market products for ${today}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${productsToUpsert.length} products for ${today}`,
        date: today,
        productsCount: productsToUpsert.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update daily market products';
    console.error('[update-daily-market] Error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
