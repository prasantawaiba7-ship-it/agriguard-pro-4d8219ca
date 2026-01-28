import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { useDeliveryRequests, DeliveryRequest, useDeliveryShipment } from '@/hooks/useDeliveryRequests';
import { formatDistanceToNow } from 'date-fns';


const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'पेन्डिङ', color: 'bg-yellow-500', icon: Clock },
  accepted: { label: 'स्वीकृत', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'अस्वीकृत', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'रद्द', color: 'bg-gray-500', icon: XCircle },
  completed: { label: 'सम्पन्न', color: 'bg-blue-500', icon: CheckCircle },
};

const SHIPMENT_STATUS: Record<string, { label: string; step: number }> = {
  created: { label: 'सिर्जना भयो', step: 1 },
  picked_up: { label: 'पिकअप भयो', step: 2 },
  in_transit: { label: 'ट्रान्जिटमा', step: 3 },
  out_for_delivery: { label: 'डेलिभरीमा', step: 4 },
  delivered: { label: 'डेलिभर भयो', step: 5 },
  failed: { label: 'असफल', step: 0 },
};

export function MyDeliveryRequests() {
  const [mode, setMode] = useState<'buyer' | 'seller'>('buyer');
  const { requests, isLoading, updateRequestStatus, cancelRequest } = useDeliveryRequests(mode);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [sellerNotes, setSellerNotes] = useState('');
  const [showSheet, setShowSheet] = useState(false);

  const handleAction = async (action: 'accept' | 'reject' | 'complete' | 'cancel') => {
    if (!selectedRequest) return;

    if (action === 'cancel') {
      await cancelRequest.mutateAsync(selectedRequest.id);
    } else {
      const statusMap = { accept: 'accepted', reject: 'rejected', complete: 'completed' };
      await updateRequestStatus.mutateAsync({
        id: selectedRequest.id,
        status: statusMap[action] as DeliveryRequest['status'],
        seller_notes: sellerNotes || undefined,
      });
    }
    setShowSheet(false);
    setSellerNotes('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'buyer' | 'seller')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buyer">मेरो अनुरोधहरू</TabsTrigger>
          <TabsTrigger value="seller">आएका अनुरोधहरू</TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="mt-4">
          {requests.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>कुनै अनुरोध भेटिएन</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const config = STATUS_CONFIG[request.status];
                const Icon = config.icon;

                return (
                  <Card
                    key={request.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowSheet(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {request.user_market_cards?.title || 'अनुरोध'}
                          </h4>
                          {request.user_market_cards?.crops && (
                            <p className="text-sm text-muted-foreground">
                              {request.user_market_cards.crops.name_ne}
                            </p>
                          )}
                          <p className="text-sm mt-1">
                            मात्रा: <strong>{request.requested_quantity} {request.user_market_cards?.unit}</strong>
                          </p>
                          {request.requested_price && (
                            <p className="text-sm text-primary">
                              प्रस्तावित मूल्य: रु. {request.requested_price}
                            </p>
                          )}
                        </div>
                        <Badge className={`${config.color} text-white`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Detail Sheet */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="overflow-y-auto">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>अनुरोध विवरण</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge className={`${STATUS_CONFIG[selectedRequest.status].color} text-white`}>
                    {STATUS_CONFIG[selectedRequest.status].label}
                  </Badge>
                </div>

                {/* Card Info */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedRequest.user_market_cards?.title}</p>
                  {selectedRequest.user_market_cards?.crops && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.user_market_cards.crops.name_ne}
                    </p>
                  )}
                </div>

                {/* Request Details */}
                <div className="space-y-2">
                  <p>
                    <strong>मात्रा:</strong> {selectedRequest.requested_quantity} {selectedRequest.user_market_cards?.unit}
                  </p>
                  {selectedRequest.requested_price && (
                    <p>
                      <strong>प्रस्तावित मूल्य:</strong> रु. {selectedRequest.requested_price}
                    </p>
                  )}
                  <p>
                    <strong>डेलिभरी ठेगाना:</strong><br />
                    {selectedRequest.delivery_address_text}
                  </p>
                  {selectedRequest.buyer_notes && (
                    <p>
                      <strong>क्रेताको नोट:</strong> {selectedRequest.buyer_notes}
                    </p>
                  )}
                  {selectedRequest.seller_notes && (
                    <p>
                      <strong>विक्रेताको नोट:</strong> {selectedRequest.seller_notes}
                    </p>
                  )}
                </div>

                {/* Shipment Tracking */}
                {selectedRequest.status === 'accepted' && (
                  <ShipmentTracker requestId={selectedRequest.id} />
                )}

                {/* Seller Actions */}
                {mode === 'seller' && selectedRequest.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t">
                    <Textarea
                      placeholder="बिक्रेता नोट (ऐच्छिक)"
                      value={sellerNotes}
                      onChange={(e) => setSellerNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleAction('accept')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        स्वीकार
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleAction('reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        अस्वीकार
                      </Button>
                    </div>
                  </div>
                )}

                {mode === 'seller' && selectedRequest.status === 'accepted' && (
                  <Button
                    className="w-full"
                    onClick={() => handleAction('complete')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    सम्पन्न भयो
                  </Button>
                )}

                {/* Buyer Cancel */}
                {mode === 'buyer' && selectedRequest.status === 'pending' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction('cancel')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    रद्द गर्नुहोस्
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ShipmentTracker({ requestId }: { requestId: string }) {
  const { shipment, isLoading } = useDeliveryShipment(requestId);

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  if (!shipment) {
    return (
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          <Truck className="h-6 w-6 mx-auto mb-2 opacity-50" />
          डेलिभरी ट्र्याकिङ उपलब्ध छैन
        </p>
      </Card>
    );
  }

  const currentStep = SHIPMENT_STATUS[shipment.status]?.step || 0;

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4" />
        ट्र्याकिङ स्थिति
      </h4>
      <div className="space-y-2">
        {Object.entries(SHIPMENT_STATUS)
          .filter(([key]) => key !== 'failed')
          .map(([key, { label, step }]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <span className={step <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
                {label}
              </span>
            </div>
          ))}
      </div>
      {shipment.last_location_text && (
        <p className="text-xs text-muted-foreground mt-3">
          अन्तिम स्थान: {shipment.last_location_text}
        </p>
      )}
    </Card>
  );
}
