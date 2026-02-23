/**
 * FARMER ACTION FILM v1 — Main page
 * 
 * What: Shows a farmer's crop journey as a visual timeline with gain badges.
 * How to disable: Remove the /action-film route from App.tsx and delete this folder.
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Film, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { JourneyTimeline } from './components/JourneyTimeline';
import { demoFilm } from './data/demoData';

export default function ActionFilmPage() {
  const [detailed, setDetailed] = useState(false);

  return (
    <>
      <Helmet>
        <title>मेरो कृषि यात्रा | Kishan Sathi</title>
        <meta name="description" content="तपाईंको बालीको यात्रा — के सिक्नुभयो, के जोगिनुभयो" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Link to="/farmer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <h1 className="font-bold text-base text-foreground">मेरो कृषि यात्रा</h1>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
          {/* Hero card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {demoFilm.cropEmoji} {demoFilm.cropName}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{demoFilm.seasonLabel} • {demoFilm.farmerName}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed">{demoFilm.summaryNe}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {demoFilm.badges.map(b => (
                    <Badge key={b.label} variant="secondary" className="text-[10px] gap-1">
                      {b.icon} {b.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* View toggle */}
          <div className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-2.5">
            <Label htmlFor="detail-toggle" className="text-sm flex items-center gap-2 cursor-pointer">
              {detailed ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              {detailed ? 'विस्तृत हेर्नुहोस्' : 'सरल दृश्य'}
            </Label>
            <Switch id="detail-toggle" checked={detailed} onCheckedChange={setDetailed} />
          </div>

          {/* Timeline */}
          <JourneyTimeline events={demoFilm.events} detailed={detailed} />

          {/* Demo notice */}
          <p className="text-center text-[11px] text-muted-foreground pt-2">
            📌 यो demo data हो। पछि तपाईंको वास्तविक बाली डेटा यहाँ देखिनेछ।
          </p>
        </main>
      </div>
    </>
  );
}
