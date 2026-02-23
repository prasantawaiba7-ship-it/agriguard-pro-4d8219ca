/**
 * FARMER ACTION FILM v1 — Journey Timeline component
 * How to disable: Remove this file or the parent action-film folder.
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { JourneyEvent } from '../data/demoData';

const gainColors: Record<string, string> = {
  skill: 'bg-primary/10 text-primary border-primary/20',
  yield: 'bg-accent/10 text-accent-foreground border-accent/20',
  risk_avoided: 'bg-destructive/10 text-destructive border-destructive/20',
  soil_health: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  community: 'bg-muted text-muted-foreground border-border',
};

interface Props {
  events: JourneyEvent[];
  detailed: boolean;
}

export function JourneyTimeline({ events, detailed }: Props) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-6">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="relative"
          >
            {/* Dot on timeline */}
            <div className="absolute -left-8 top-1 w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm">
              {event.icon}
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-[11px] text-muted-foreground mb-1">{event.date}</p>
              <h3 className="font-semibold text-sm text-foreground leading-snug">{event.title}</h3>

              {detailed && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {event.description}
                </p>
              )}

              <Badge
                variant="outline"
                className={`mt-2 text-[10px] px-2 py-0.5 ${gainColors[event.gainType] || ''}`}
              >
                {event.gainLabel}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
