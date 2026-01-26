import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  isOffline?: boolean;
  isAnalyzing?: boolean;
  isSaved?: boolean;
}

interface PendingResponse {
  messageIndex: number;
  content: string;
  isComplete: boolean;
}

interface AIChatState {
  messages: Message[];
  isLoading: boolean;
  pendingResponse: PendingResponse | null;
  sessionId: string;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsLoading: (loading: boolean) => void;
  setPendingResponse: (pending: PendingResponse | null) => void;
  clearMessages: () => void;
  resetSession: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      pendingResponse: null,
      sessionId: crypto.randomUUID(),
      
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      updateLastMessage: (content) => set((state) => {
        const messages = [...state.messages];
        if (messages.length > 0) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content
          };
        }
        return { messages };
      }),
      
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setPendingResponse: (pending) => set({ pendingResponse: pending }),
      
      clearMessages: () => set({ messages: [], pendingResponse: null }),
      
      resetSession: () => set({ 
        sessionId: crypto.randomUUID(),
        messages: [],
        pendingResponse: null,
        isLoading: false
      }),
    }),
    {
      name: 'ai-chat-storage',
      partialize: (state) => ({ 
        messages: state.messages,
        sessionId: state.sessionId,
        // Don't persist loading state or pending response
      }),
    }
  )
);
