import { useState } from 'react';
import { Phone, Clock, CheckCircle2, XCircle, PhoneCall, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useCallRequestForTicket,
  useCreateCallRequest,
  type CallRequest,
} from '@/hooks/useCallRequests';

interface CallRequestBannerProps {
  ticketId: string;
  technicianId: string | null;
  technicianPhone?: string | null;
}

export function CallRequestBanner({ ticketId, technicianId, technicianPhone }: CallRequestBannerProps) {
  const { data: callRequest, isLoading } = useCallRequestForTicket(ticketId);
  const createRequest = useCreateCallRequest();
  const [showModal, setShowModal] = useState(false);
  const [farmerNote, setFarmerNote] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  if (isLoading) return null;

  const handleSubmit = () => {
    if (!technicianId) return;
    createRequest.mutate(
      {
        ticketId,
        technicianId,
        farmerNote: farmerNote.trim() || undefined,
        preferredTime: preferredTime.trim() || undefined,
      },
      { onSuccess: () => setShowModal(false) }
    );
  };

  // No active request — show "Request call" button
  if (!callRequest || callRequest.status === 'rejected' || callRequest.status === 'completed' || callRequest.status === 'cancelled') {
    return (
      <>
        <Card className="border-dashed border-primary/30 bg-primary/5 mb-4">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              यदि तपाईँ बिग्याको साथमा फोनमा कुरा गर्न चाहनुहुन्छ भने, call request पठाउन सक्नुहुन्छ।
            </p>
            {callRequest?.status === 'rejected' && callRequest.technician_note && (
              <p className="text-xs text-destructive mb-2">
                अघिल्लो request अस्वीकार: "{callRequest.technician_note}"
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowModal(true)}
              disabled={!technicianId}
            >
              <Phone className="w-3.5 h-3.5" />
              Call request पठाउनुहोस्
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>📞 Call Request</DialogTitle>
              <DialogDescription>बिग्यालाई call request पठाउनुहोस्।</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">के बारेमा कुरा गर्न चाहनुहुन्छ? (ऐच्छिक)</label>
                <Textarea
                  value={farmerNote}
                  onChange={e => setFarmerNote(e.target.value)}
                  placeholder="जस्तै: बालीमा रोग देखिएको छ..."
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">मनपर्ने समय (ऐच्छिक)</label>
                <Input
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  placeholder="जस्तै: बिहान ९–१० बजे"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={createRequest.isPending} className="gap-1.5">
                {createRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                Request पठाउनुहोस्
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Pending
  if (callRequest.status === 'pending') {
    return (
      <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 mb-4">
        <CardContent className="p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Call request पठाइएको छ।
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">बिग्याको उत्तरको प्रतिक्षामा…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Accepted — show "Call now" button
  if (callRequest.status === 'accepted') {
    return (
      <Card className="border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800 mb-4">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                Krishi Bigya ले तपाईंको call request स्वीकार गर्नुभयो।
              </p>
              {callRequest.technician_note && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  सन्देश: "{callRequest.technician_note}"
                </p>
              )}
              {callRequest.preferred_time && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                  समय: {callRequest.preferred_time}
                </p>
              )}
            </div>
          </div>
          {technicianPhone && (
            <div className="mt-3 text-center">
              <a href={`tel:${technicianPhone}`}>
                <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                  <PhoneCall className="w-4 h-4" />
                  अब call गर्नुहोस्
                </Button>
              </a>
              <p className="text-[10px] text-muted-foreground mt-1">
                यस call बाट बाहिर फोन call (SIM) प्रयोग हुन्छ।
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
