import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  crop_name: string;
  crop_name_ne?: string;
  unit: string;
  price_min: number;
  price_max: number;
  price_avg?: number;
  market_name?: string;
  market_name_ne?: string;
  district?: string;
  date?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { csvData, marketName, marketNameNe, district, provinceId, date } = await req.json();

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No CSV data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    console.log(`[import-market-csv] Importing ${csvData.length} rows for ${targetDate}`);

    // Transform CSV rows to database format
    const products = csvData.map((row: CSVRow, index: number) => {
      const priceMin = parseFloat(String(row.price_min)) || 0;
      const priceMax = parseFloat(String(row.price_max)) || 0;
      const priceAvg = row.price_avg 
        ? parseFloat(String(row.price_avg)) 
        : (priceMin + priceMax) / 2;

      return {
        date: row.date || targetDate,
        crop_name: row.crop_name,
        crop_name_ne: row.crop_name_ne || null,
        unit: row.unit || 'kg',
        price_min: priceMin || null,
        price_max: priceMax || null,
        price_avg: priceAvg || null,
        market_name: row.market_name || marketName || 'Unknown',
        market_name_ne: row.market_name_ne || marketNameNe || null,
        district: row.district || district || null,
        province_id: provinceId || null,
        source: 'csv_import',
        source_ref: `csv_row_${index + 1}`,
        last_synced_at: now,
      };
    });

    // Filter out invalid rows
    const validProducts = products.filter(p => p.crop_name && (p.price_min || p.price_max));

    if (validProducts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid products found in CSV' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[import-market-csv] Upserting ${validProducts.length} valid products`);

    // Upsert products
    const { error: upsertError, count } = await supabase
      .from('daily_market_products')
      .upsert(validProducts, {
        onConflict: 'date,crop_name,market_name',
        ignoreDuplicates: false,
        count: 'exact',
      });

    if (upsertError) {
      console.error('[import-market-csv] Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ success: false, error: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[import-market-csv] Successfully imported ${validProducts.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${validProducts.length} products`,
        count: validProducts.length,
        date: targetDate,
        skipped: products.length - validProducts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[import-market-csv] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
