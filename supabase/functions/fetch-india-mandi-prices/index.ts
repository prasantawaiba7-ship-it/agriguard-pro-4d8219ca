import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { state, district, commodity, limit = 50 } = await req.json();
    
    const apiKey = Deno.env.get('DATA_GOV_INDIA_API_KEY');
    if (!apiKey) {
      throw new Error('DATA_GOV_INDIA_API_KEY not configured');
    }

    // Build query parameters for data.gov.in API
    // Resource ID for Daily Market Prices: 9ef84268-d588-465a-a308-a864a43d0070
    const params = new URLSearchParams({
      'api-key': apiKey,
      format: 'json',
      limit: limit.toString(),
    });

    // Add filters if provided
    const filters: Record<string, string> = {};
    if (state) filters['State'] = state;
    if (district) filters['District'] = district;
    if (commodity) filters['Commodity'] = commodity;
    
    if (Object.keys(filters).length > 0) {
      params.append('filters[State]', state || '');
      if (district) params.append('filters[District]', district);
      if (commodity) params.append('filters[Commodity]', commodity);
    }

    const apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;
    
    console.log('Fetching from data.gov.in:', apiUrl.replace(apiKey, '***'));

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API response to our format
    const prices: MandiPrice[] = (data.records || []).map((record: any) => ({
      state: record.State || record.state || '',
      district: record.District || record.district || '',
      market: record.Market || record.market || '',
      commodity: record.Commodity || record.commodity || '',
      variety: record.Variety || record.variety || '',
      arrival_date: record.Arrival_Date || record.arrival_date || '',
      min_price: parseFloat(record.Min_Price || record.min_price || 0),
      max_price: parseFloat(record.Max_Price || record.max_price || 0),
      modal_price: parseFloat(record.Modal_Price || record.modal_price || 0),
      unit: 'quintal', // Standard unit for Indian mandi prices
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: prices.length,
        total: data.total || prices.length,
        prices,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fetching mandi prices:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        prices: [],
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
