import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingCart, Tag, Package, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserMarketCardForm } from './UserMarketCardForm';
import { UserMarketCardsList } from './UserMarketCardsList';
import { MyDeliveryRequests } from './MyDeliveryRequests';
import { MyUserMarketCards } from './MyUserMarketCards';

export function UserMarketCardsSection() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse" className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">कार्डहरू</span>
          </TabsTrigger>
          <TabsTrigger value="my-cards" className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">मेरा कार्ड</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">अर्डर</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <UserMarketCardsList />
        </TabsContent>

        <TabsContent value="my-cards" className="mt-4">
          {!user ? (
            <Card className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                कार्ड थप्न कृपया पहिले लगइन गर्नुहोस्
              </p>
            </Card>
          ) : showAddForm ? (
            <UserMarketCardForm
              onSuccess={() => setShowAddForm(false)}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <div className="space-y-4">
              <Button onClick={() => setShowAddForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                नयाँ कार्ड थप्नुहोस्
              </Button>
              <MyUserMarketCards />
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          {!user ? (
            <Card className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                अर्डर हेर्न कृपया पहिले लगइन गर्नुहोस्
              </p>
            </Card>
          ) : (
            <MyDeliveryRequests />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
