interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  pending?: boolean;
}

interface PendingMessage {
  id: string;
  messages: Array<{role: string; content: string; imageUrl?: string}>;
  timestamp: Date;
}

const CONVERSATIONS_KEY = 'krishi_mitra_conversations';
const PENDING_MESSAGES_KEY = 'krishi_mitra_pending';
const OFFLINE_RESPONSES_KEY = 'krishi_mitra_offline_responses';

// Common farming questions and pre-cached responses
const offlineResponses: Record<string, string> = {
  'disease': `🔍 **Offline Disease Detection Tips**

While I can't analyze images offline, here are common signs to look for:

**Fungal Diseases:**
• Yellow/brown spots on leaves
• White powdery coating
• Wilting despite adequate water

**Pest Damage:**
• Holes in leaves
• Curling or distorted leaves
• Visible insects or eggs

**Nutrient Deficiency:**
• Yellow leaves (Nitrogen)
• Purple stems (Phosphorus)
• Brown leaf edges (Potassium)

📱 *Save photos and I'll analyze them when you're back online!*`,

  'weather': `🌤️ **Offline Weather Tips**

**General Seasonal Guidance (India):**

**Kharif (June-October):**
• Monsoon crops: Rice, Cotton, Maize
• Watch for waterlogging
• Good for transplanting

**Rabi (October-March):**
• Winter crops: Wheat, Mustard, Gram
• Irrigation important
• Ideal for cereals

**Zaid (March-June):**
• Summer crops: Cucumber, Watermelon
• High irrigation needs
• Short duration crops

📱 *Check weather when online for accurate forecasts!*`,

  'crop': `🌾 **Offline Crop Recommendations**

**Based on Soil Type:**

**Clay Soil (चिकनी मिट्टी):**
• Rice, Wheat, Cotton
• Good water retention
• Add organic matter

**Sandy Soil (बलुई मिट्टी):**
• Groundnut, Millets, Carrots
• Needs frequent irrigation
• Add compost for nutrients

**Loamy Soil (दोमट मिट्टी):**
• Most crops grow well
• Ideal for vegetables
• Best for mixed farming

**General Tips:**
• Rotate crops each season
• Use green manure
• Test soil every 2-3 years

📱 *Get personalized recommendations when online!*`,

  'pest': `🐛 **Offline Pest Control Guide**

**Natural Remedies:**

**Neem Solution (नीम):**
• 100g neem leaves in 1L water
• Boil, cool, and spray
• Effective for most pests

**Garlic-Chili Spray:**
• 50g garlic + 50g chili
• Grind with 1L water
• Strain and spray

**Tobacco Extract:**
• 100g tobacco in water overnight
• Dilute 1:5 and spray
• For sucking pests

**Prevention Tips:**
• Remove infected plants
• Maintain field hygiene
• Use sticky traps
• Encourage beneficial insects

📱 *Send photos for specific pest identification when online!*`,

  'fertilizer': `🧪 **Offline Fertilizer Guide**

**NPK Basics:**

**Nitrogen (N) - For Growth:**
• Urea: 46% N
• Apply during vegetative stage
• 2-3 split doses

**Phosphorus (P) - For Roots:**
• DAP: 18% N, 46% P
• Apply at sowing
• Single dose preferred

**Potassium (K) - For Quality:**
• MOP: 60% K
• Apply before flowering
• Improves resistance

**Organic Alternatives:**
• Vermicompost: 1-2 tons/acre
• FYM: 5-10 tons/acre
• Green manure: Dhaincha, Sunhemp

**Dosage (General):**
• Cereals: 120:60:40 kg NPK/ha
• Vegetables: 100:50:50 kg NPK/ha

📱 *Get soil-based recommendations when online!*`,

  'default': `🌱 **Krishi Mitra - Offline Mode**

I'm currently offline, but I can still help with basic queries!

**Available Offline:**
• General farming tips
• Common disease symptoms
• Basic pest control methods
• Fertilizer guidance
• Seasonal crop suggestions

**Requires Internet:**
• Image analysis
• Weather data
• Personalized recommendations
• Market prices

💡 *Type keywords like "pest", "fertilizer", "crop", or "weather" for quick guides!*

📱 *Your message will be sent when you're back online.*`
};

export const offlineStorage = {
  // Save conversations to localStorage
  saveConversations(messages: Message[]): void {
    try {
      const serialized = messages.map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString()
      }));
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  },

  // Load conversations from localStorage
  loadConversations(): Message[] {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  },

  // Clear conversations
  clearConversations(): void {
    localStorage.removeItem(CONVERSATIONS_KEY);
  },

  // Queue a message for later sending
  queuePendingMessage(message: PendingMessage): void {
    try {
      const pending = this.getPendingMessages();
      pending.push(message);
      localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to queue message:', error);
    }
  },

  // Get all pending messages
  getPendingMessages(): PendingMessage[] {
    try {
      const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
      if (!stored) return [];
      return JSON.parse(stored).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get pending messages:', error);
      return [];
    }
  },

  // Clear pending messages
  clearPendingMessages(): void {
    localStorage.removeItem(PENDING_MESSAGES_KEY);
  },

  // Remove a specific pending message
  removePendingMessage(id: string): void {
    const pending = this.getPendingMessages().filter(m => m.id !== id);
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(pending));
  },

  // Get offline response based on keywords
  getOfflineResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('disease') || lowerQuery.includes('रोग') || lowerQuery.includes('बीमारी')) {
      return offlineResponses.disease;
    }
    if (lowerQuery.includes('weather') || lowerQuery.includes('मौसम') || lowerQuery.includes('बारिश')) {
      return offlineResponses.weather;
    }
    if (lowerQuery.includes('crop') || lowerQuery.includes('फसल') || lowerQuery.includes('recommend')) {
      return offlineResponses.crop;
    }
    if (lowerQuery.includes('pest') || lowerQuery.includes('कीट') || lowerQuery.includes('insect')) {
      return offlineResponses.pest;
    }
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('खाद') || lowerQuery.includes('urea')) {
      return offlineResponses.fertilizer;
    }
    
    return offlineResponses.default;
  }
};
