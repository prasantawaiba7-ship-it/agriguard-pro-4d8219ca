import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation, language = 'ne' } = await req.json();
    
    // Generate HTML report
    const title = language === 'ne' ? 'कृषि सल्लाह रिपोर्ट – किसान साथी' : 'Agricultural Advice Report – Kisan Saathi';
    const date = new Date().toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US');
    
    let conversationHtml = '';
    for (const msg of conversation) {
      const roleLabel = msg.role === 'user' 
        ? (language === 'ne' ? 'किसान' : 'Farmer')
        : (language === 'ne' ? 'किसान साथी' : 'Kisan Saathi');
      
      const bgColor = msg.role === 'user' ? '#e3f2fd' : '#f5f5f5';
      conversationHtml += `
        <div style="background: ${bgColor}; padding: 15px; margin: 10px 0; border-radius: 8px;">
          <strong>${roleLabel}:</strong>
          <p style="margin: 5px 0; white-space: pre-wrap;">${msg.content}</p>
        </div>
      `;
    }

    const disclaimer = language === 'ne' 
      ? `<div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong>महत्वपूर्ण:</strong>
          <p>यो रिपोर्ट किसानबाट प्राप्त जानकारीका आधारमा एआई प्रणालीले तयार गरेको सामान्य कृषि सल्लाह हो।</p>
          <p>उपचार सुरु गर्नु अघि नजिकको कृषि प्राविधिक, कृषि ज्ञान केन्द्र वा सरकारी कृषि कार्यालयसँग अवश्य सल्लाह लिनुहोस्।</p>
        </div>`
      : `<div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <strong>Important:</strong>
          <p>This report is general agricultural advice prepared by an AI system based on information provided by the farmer.</p>
          <p>Please consult with a local agricultural technician or government agricultural office before starting any treatment.</p>
        </div>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { 
            font-family: 'Noto Sans Devanagari', 'Segoe UI', Tahoma, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #2e7d32; border-bottom: 3px solid #4caf50; padding-bottom: 10px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .date { color: #666; }
          .logo { font-size: 2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌾 ${title}</h1>
          <span class="date">${date}</span>
        </div>
        
        <h2>${language === 'ne' ? 'संवाद विवरण' : 'Conversation Details'}</h2>
        ${conversationHtml}
        
        ${disclaimer}
        
        <footer style="margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          ${language === 'ne' ? 'किसान साथी - तपाईंको कृषि सहायक' : 'Kisan Saathi - Your Agricultural Assistant'}
        </footer>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("PDF report error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
