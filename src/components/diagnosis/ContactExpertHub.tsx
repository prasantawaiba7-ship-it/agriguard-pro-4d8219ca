import { 
  Phone, MessageSquare, Send, Smartphone, 
  ExternalLink, Clock, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ContactExpertHubProps {
  onOpenAppForm: () => void;
}

const SMS_NUMBER = '31001';
const WHATSAPP_NUMBER = '+977-9800000000';
const HELPLINE_NUMBER = '1620';
const HELPLINE_HOURS = 'बिहान १०:०० – साँझ ५:०० (आइतबार–शुक्रबार)';

export function ContactExpertHub({ onOpenAppForm }: ContactExpertHubProps) {
  return (
    <div className="space-y-4">
      {/* Section title */}
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        कृषि विज्ञसँग सम्पर्क गर्ने तरिका
      </h2>
      <p className="text-sm text-muted-foreground -mt-2">
        तपाईंलाई सुविधाजनक माध्यमबाट कृषि विज्ञसँग सोध्न सक्नुहुन्छ।
      </p>

      {/* Channel 1: In-App (Primary) */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-foreground">App बाट सोध्नुहोस्</h3>
                <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">सबैभन्दा राम्रो</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                फोटो, बाली, र समस्या सहित विज्ञलाई सीधै पठाउनुहोस्। AI विश्लेषण पनि स्वचालित संलग्न हुन्छ।
              </p>
              <Button onClick={onOpenAppForm} className="w-full sm:w-auto" size="lg">
                <Send className="w-4 h-4 mr-2" />
                यहाँ क्लिक गरेर प्रश्न पठाउनुहोस्
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative channels grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Channel 2: SMS */}
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1">SMS बाट सोध्नुहोस्</h3>
            <p className="text-[13px] text-muted-foreground mb-2">
              Feature phone छ? SMS पठाएर पनि सोध्न सक्नुहुन्छ।
            </p>
            <div className="p-2.5 bg-muted/50 rounded-lg border border-border/30 mb-2">
              <p className="text-xs font-medium text-foreground mb-1">नम्बर: <span className="font-mono text-primary">{SMS_NUMBER}</span></p>
              <p className="text-[11px] text-muted-foreground">
                ढाँचा: <span className="font-mono">KS &lt;बाली&gt; &lt;जिल्ला&gt; &lt;समस्या&gt;</span>
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              उदाहरण: <span className="font-mono text-xs">KS धान काठमाडौं पातमा दाग</span>
            </p>
          </CardContent>
        </Card>

        {/* Channel 3: WhatsApp / Viber */}
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-success" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1">WhatsApp / Viber</h3>
            <p className="text-[13px] text-muted-foreground mb-2">
              WhatsApp वा Viber मा फोटो सहित सोध्न सक्नुहुन्छ।
            </p>
            <div className="p-2.5 bg-muted/50 rounded-lg border border-border/30 mb-2">
              <p className="text-xs font-medium text-foreground">
                नम्बर: <span className="font-mono text-primary">{WHATSAPP_NUMBER}</span>
              </p>
            </div>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              WhatsApp खोल्नुहोस् <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Channel 4: Helpline */}
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5 text-warning" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1">कृषि हेल्पलाइन</h3>
            <p className="text-[13px] text-muted-foreground mb-2">
              कुरा गरेर सोध्न चाहनुहुन्छ? टोल-फ्री नम्बरमा फोन गर्नुहोस्।
            </p>
            <div className="p-2.5 bg-muted/50 rounded-lg border border-border/30 mb-2">
              <p className="text-xs font-medium text-foreground">
                नम्बर: <span className="font-mono text-primary text-base font-bold">{HELPLINE_NUMBER}</span>
                <span className="ml-1 text-[11px] text-muted-foreground">(टोल-फ्री)</span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {HELPLINE_HOURS}
            </div>
            <a
              href={`tel:${HELPLINE_NUMBER}`}
              className="mt-2 inline-block"
            >
              <Button variant="outline" size="sm" className="text-xs">
                <Phone className="w-3 h-3 mr-1" />
                फोन गर्नुहोस्
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground text-center px-4">
        सबै माध्यमबाट आएका प्रश्नहरू एउटै विज्ञ ड्यासबोर्डमा जान्छन् — तपाईंले जुनसुकै तरिकाले सोध्नुभए पनि जवाफ पाउनुहुन्छ।
      </p>
    </div>
  );
}
