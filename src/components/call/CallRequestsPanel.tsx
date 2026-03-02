import { useState } from 'react';
import { Phone, PhoneCall, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useCallRequestsForTechnician,
  useUpdateCallRequest,
} from '@/hooks/useCallRequests';
import { formatDistanceToNow } from 'date-fns';

interface CallRequestsPanelProps {
  technicianId: string;
}

export function CallRequestsPanel({ technicianId }: CallRequestsPanelProps) {
  const { data: requests, isLoading } = useCallRequestsForTechnician(technicianId);
  const updateRequest = useUpdateCallRequest();
  const [actionModal, setActionModal] = useState<{
    type: 'accept' | 'reject' | 'complete';
    requestId: string;
  } | null>(null);
  const [note, setNote] = useState('');

  const handleAction = () => {
    if (!actionModal) return;
    updateRequest.mutate(
      {
        requestId: actionModal.requestId,
        status: actionModal.type === 'accept' ? 'accepted' : actionModal.type === 'reject' ? 'rejected' : 'completed',
        technicianNote: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setActionModal(null);
          setNote('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Phone className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">कुनै call request छैन।</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map(req => (
          <Card key={req.id} className={req.status === 'pending' ? 'ring-2 ring-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {req.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate">
                    🌾 {req.ticket?.crop_name} — {req.ticket?.problem_title}
                  </h3>
                  {req.farmer_note && (
                    <p className="text-xs text-muted-foreground mt-1">किसानको नोट: "{req.farmer_note}"</p>
                  )}
                  {req.preferred_time && (
                    <p className="text-xs text-muted-foreground">समय: {req.preferred_time}</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
              </div>

              <div className="flex gap-2 mt-3">
                {req.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => { setActionModal({ type: 'accept', requestId: req.id }); setNote(''); }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive border-destructive/30"
                      onClick={() => { setActionModal({ type: 'reject', requestId: req.id }); setNote(''); }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </>
                )}
                {req.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => { setActionModal({ type: 'complete', requestId: req.id }); setNote(''); }}
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Mark completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!actionModal} onOpenChange={(open) => { if (!open) setActionModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionModal?.type === 'accept' && '✅ Call Request Accept'}
              {actionModal?.type === 'reject' && '❌ Call Request Reject'}
              {actionModal?.type === 'complete' && '📞 Call सम्पन्न'}
            </DialogTitle>
            <DialogDescription>
              {actionModal?.type === 'accept' && 'किसानलाई call गर्ने समय वा सन्देश लेख्नुहोस्।'}
              {actionModal?.type === 'reject' && 'अस्वीकारको कारण लेख्नुहोस् (ऐच्छिक)।'}
              {actionModal?.type === 'complete' && 'Call पछि नोट लेख्नुहोस् (ऐच्छिक)।'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={
              actionModal?.type === 'accept'
                ? 'जस्तै: आज ४–५ बजे call गर्छु'
                : actionModal?.type === 'reject'
                ? 'जस्तै: अहिले व्यस्त छु…'
                : 'जस्तै: फोनमा सुझाव दिइयो'
            }
            rows={2}
            className="text-sm"
          />
          <DialogFooter>
            <Button onClick={handleAction} disabled={updateRequest.isPending}>
              {updateRequest.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {actionModal?.type === 'accept' ? 'Accept' : actionModal?.type === 'reject' ? 'Reject' : 'Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
