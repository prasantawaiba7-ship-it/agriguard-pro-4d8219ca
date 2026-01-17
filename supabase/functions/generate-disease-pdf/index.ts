import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiseaseReportData {
  crop_name: string;
  disease_name: string;
  confidence: number;
  severity: string;
  farmer_location?: string;
  symptoms_keypoints: string[];
  recommended_chemicals: Array<{
    name: string;
    dose: string;
    usage_note?: string;
  }>;
  organic_treatment?: {
    name: string;
    preparation: string;
    application: string;
  };
  management_practices: string[];
  possible_alternatives?: string[];
  when_to_seek_help?: string;
  nepaliReport?: string;
  imageUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DiseaseReportData = await req.json();
    const date = new Date().toLocaleDateString('ne-NP');

    // Determine severity styling
    const getSeverityStyle = (severity: string) => {
      switch (severity) {
        case 'गम्भीर':
        case 'high':
          return { bg: '#fee2e2', color: '#991b1b', text: 'गम्भीर' };
        case 'मध्यम':
        case 'medium':
          return { bg: '#fef3c7', color: '#92400e', text: 'मध्यम' };
        default:
          return { bg: '#dcfce7', color: '#166534', text: 'सामान्य' };
      }
    };
    
    const severityStyle = getSeverityStyle(data.severity);
    const confidencePercent = Math.round((data.confidence || 0) * 100);
    
    // Build confidence warning
    let confidenceWarning = '';
    if (data.confidence < 0.5) {
      confidenceWarning = `
        <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #dc2626;">⚠️ कम विश्वसनीयता चेतावनी:</strong>
          <p style="margin: 5px 0; color: #7f1d1d;">यो नतिजा कम विश्वसनीय (${confidencePercent}%) छ। कृषि प्राविधिकसँग फोटो/बाला लिएर जाँच गराउनुहोस्।</p>
        </div>`;
    } else if (data.confidence < 0.8) {
      confidenceWarning = `
        <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #b45309;">📋 नोट:</strong>
          <span style="color: #92400e;"> यो नतिजा अनुमान मात्र हो, केही भ्रम हुन सक्छ।</span>
        </div>`;
    }

    // Build chemicals section
    let chemicalsHtml = '';
    if (data.recommended_chemicals && data.recommended_chemicals.length > 0) {
      chemicalsHtml = `
        <div class="section">
          <h3>💊 उपचार विधि</h3>
          <ul>
            ${data.recommended_chemicals.map(c => `
              <li>
                <strong>${c.name}</strong><br/>
                <span style="color: #059669;">मात्रा:</span> ${c.dose}
                ${c.usage_note ? `<br/><span style="color: #6b7280; font-size: 13px;">${c.usage_note}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>`;
    } else {
      chemicalsHtml = `
        <div class="section">
          <h3>💊 उपचार विधि</h3>
          <p style="color: #6b7280;">औषधिको विस्तृत सिफारिस उपलब्ध छैन। नजिकको कृषि प्राविधिकसँग परामर्श गर्नुहोस्।</p>
        </div>`;
    }

    // Build organic treatment section
    let organicHtml = '';
    if (data.organic_treatment) {
      organicHtml = `
        <div class="section organic">
          <h3>🌿 जैविक उपचार</h3>
          <p><strong>${data.organic_treatment.name}</strong></p>
          <p><strong>तयारी:</strong> ${data.organic_treatment.preparation}</p>
          <p><strong>प्रयोग:</strong> ${data.organic_treatment.application}</p>
        </div>`;
    }

    // Build management practices section
    let managementHtml = '';
    if (data.management_practices && data.management_practices.length > 0) {
      managementHtml = `
        <div class="section">
          <h3>🛡️ व्यवस्थापन र रोकथाम</h3>
          <ul>
            ${data.management_practices.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>`;
    }

    // Build alternatives section
    let alternativesHtml = '';
    if (data.possible_alternatives && data.possible_alternatives.length > 0 && data.confidence < 0.8) {
      alternativesHtml = `
        <div class="section" style="border-left-color: #f59e0b;">
          <h3>🔍 संभावित अन्य समस्याहरू</h3>
          <ul>
            ${data.possible_alternatives.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>`;
    }

    const html = `
<!DOCTYPE html>
<html lang="ne">
<head>
  <meta charset="UTF-8">
  <title>${data.crop_name} : ${data.disease_name} को विवरण</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    
    * { box-sizing: border-box; }
    
    body { 
      font-family: 'Noto Sans Devanagari', Arial, sans-serif; 
      padding: 40px; 
      max-width: 800px; 
      margin: 0 auto;
      color: #1f2937;
      line-height: 1.7;
      background: #fff;
    }
    
    .header { 
      text-align: center; 
      border-bottom: 3px solid #16a34a; 
      padding-bottom: 25px; 
      margin-bottom: 30px;
    }
    
    .header h1 { 
      color: #16a34a; 
      margin-bottom: 10px;
      font-size: 24px;
    }
    
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    
    .meta-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 15px;
    }
    
    .meta-item {
      background: #f3f4f6;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 6px 18px;
      border-radius: 20px;
      font-weight: bold;
      background: ${severityStyle.bg};
      color: ${severityStyle.color};
    }
    
    .confidence-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
    }
    
    .confidence-fill {
      height: 100%;
      background: ${data.confidence >= 0.8 ? '#16a34a' : data.confidence >= 0.5 ? '#f59e0b' : '#ef4444'};
      width: ${confidencePercent}%;
      border-radius: 4px;
    }
    
    .section { 
      margin: 25px 0; 
      padding: 20px; 
      background: #f9fafb; 
      border-radius: 12px;
      border-left: 4px solid #16a34a;
    }
    
    .section.organic {
      background: #ecfdf5;
      border-left-color: #059669;
    }
    
    .section h3 { 
      color: #16a34a; 
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    
    .section ul { 
      padding-left: 20px; 
      margin: 0;
    }
    
    .section li { 
      margin: 10px 0; 
      line-height: 1.6; 
    }
    
    .disclaimer {
      background: #fffbeb;
      border: 1px solid #fbbf24;
      padding: 20px;
      border-radius: 12px;
      margin-top: 30px;
    }
    
    .disclaimer h3 {
      color: #b45309;
      margin: 0 0 10px 0;
    }
    
    .disclaimer ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .disclaimer li {
      margin: 8px 0;
      color: #92400e;
    }
    
    .footer { 
      text-align: center; 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }
    
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌿 ${data.crop_name} : ${data.disease_name} को विवरण</h1>
    <p class="subtitle">बाली रोग विश्लेषण रिपोर्ट</p>
    
    <div class="meta-row">
      <span class="meta-item">📅 मिति: ${date}</span>
      ${data.farmer_location ? `<span class="meta-item">📍 स्थान: ${data.farmer_location}</span>` : ''}
      <span class="severity-badge">${severityStyle.text}</span>
    </div>
    
    <div style="max-width: 300px; margin: 15px auto 0;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
        <span>विश्वासनियता</span>
        <span>${confidencePercent}%</span>
      </div>
      <div class="confidence-bar">
        <div class="confidence-fill"></div>
      </div>
    </div>
  </div>

  ${confidenceWarning}

  ${data.symptoms_keypoints && data.symptoms_keypoints.length > 0 ? `
  <div class="section">
    <h3>🔍 मुख्य लक्षणहरू</h3>
    <ul>
      ${data.symptoms_keypoints.map(s => `<li>${s}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${chemicalsHtml}

  ${organicHtml}

  ${managementHtml}

  ${alternativesHtml}

  ${data.when_to_seek_help ? `
  <div class="section" style="border-left-color: #8b5cf6;">
    <h3>👨‍🌾 विशेषज्ञ सल्लाह कहिले लिने?</h3>
    <p>${data.when_to_seek_help}</p>
  </div>
  ` : ''}

  <div class="disclaimer">
    <h3>⚠️ सावधानी</h3>
    <ul>
      <li>यो रिपोर्ट AI द्वारा उत्पन्न डिजिटल अनुमान मात्र हो।</li>
      <li>उपचार सुरु गर्नु अघि नजिकको कृषि प्राविधिक, कृषि ज्ञान केन्द्र वा सरकारी कृषि कार्यालयसँग अवश्य सल्लाह लिनुहोस्।</li>
      <li>औषधि प्रयोग गर्दा लेबलमा लेखिए अनुसार मात्र प्रयोग गर्नुहोस्। सुरक्षात्मक उपकरण अनिवार्य प्रयोग गर्नुहोस्।</li>
    </ul>
  </div>

  <div class="footer">
    <p>🌾 कृषि मित्र - तपाईंको कृषि सहायक</p>
    <p>© ${new Date().getFullYear()} KrishiMitra Nepal</p>
  </div>
</body>
</html>`;

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
