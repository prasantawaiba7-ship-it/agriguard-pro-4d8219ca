import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface AgOffice {
  id: string;
  name: string;
  district: string;
  contact_phone: string | null;
  contact_email: string | null;
}

export interface Technician {
  id: string;
  office_id: string;
  name: string;
  role_title: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  is_active: boolean;
}

export interface ExpertTicket {
  id: string;
  farmer_id: string;
  office_id: string;
  technician_id: string;
  crop_name: string;
  problem_title: string;
  problem_description: string;
  status: string;
  has_unread_farmer: boolean;
  has_unread_technician: boolean;
  created_at: string;
  updated_at: string;
  // joined
  technician?: Technician;
  office?: AgOffice;
}

export interface ExpertTicketMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string | null;
  message_text: string | null;
  image_url: string | null;
  created_at: string;
}

// --- Queries ---

export function useAgOffices() {
  return useQuery({
    queryKey: ['ag-offices'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ag_offices')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as AgOffice[];
    },
  });
}

export function useTechnicians(officeId: string | null) {
  return useQuery({
    queryKey: ['technicians', officeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('technicians')
        .select('*')
        .eq('office_id', officeId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as Technician[];
    },
    enabled: !!officeId,
  });
}

export function useMyExpertTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-expert-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('expert_tickets')
        .select('*, technician:technicians(*), office:ag_offices(*)')
        .eq('farmer_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ExpertTicket[];
    },
    enabled: !!user,
  });
}

export function useTechnicianTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['technician-tickets', user?.id],
    queryFn: async () => {
      // First get technician record for this user
      const { data: techData } = await (supabase as any)
        .from('technicians')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (!techData) return [];

      const { data, error } = await (supabase as any)
        .from('expert_tickets')
        .select('*, technician:technicians(*), office:ag_offices(*)')
        .eq('technician_id', techData.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ExpertTicket[];
    },
    enabled: !!user,
  });
}

export function useExpertTicketMessages(ticketId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expert-ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await (supabase as any)
        .from('expert_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ExpertTicketMessage[];
    },
    enabled: !!ticketId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`expert-ticket-msgs-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expert_ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expert-ticket-messages', ticketId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);

  return query;
}

// --- Mutations ---

// --- Auto-assign technician for an office (least-tickets rule) ---

export async function assignTechnicianForOffice(officeId: string): Promise<string | null> {
  // Get active technicians for this office
  const { data: techs, error: techErr } = await (supabase as any)
    .from('technicians')
    .select('id, is_primary')
    .eq('office_id', officeId)
    .eq('is_active', true);
  if (techErr || !techs || techs.length === 0) return null;

  // If there's a primary technician, use that
  const primary = techs.find((t: any) => t.is_primary);
  if (primary) return primary.id;

  // Otherwise, pick the technician with fewest open/in_progress tickets
  const techIds = techs.map((t: any) => t.id);
  const { data: tickets } = await (supabase as any)
    .from('expert_tickets')
    .select('technician_id')
    .in('technician_id', techIds)
    .in('status', ['open', 'in_progress']);

  const countMap: Record<string, number> = {};
  techIds.forEach((id: string) => { countMap[id] = 0; });
  (tickets || []).forEach((t: any) => {
    if (countMap[t.technician_id] !== undefined) countMap[t.technician_id]++;
  });

  // Pick the one with the least tickets
  let minId = techIds[0];
  let minCount = countMap[minId];
  for (const id of techIds) {
    if (countMap[id] < minCount) { minId = id; minCount = countMap[id]; }
  }
  return minId;
}

// --- AI escalation stub ---

export async function createExpertTicketFromAI(params: {
  farmerId: string;
  officeId: string;
  cropName: string;
  problemTitle: string;
  problemDescription: string;
  imageUrls?: string[];
}): Promise<ExpertTicket | null> {
  const techId = await assignTechnicianForOffice(params.officeId);
  if (!techId) return null;

  const { data: ticket, error } = await (supabase as any)
    .from('expert_tickets')
    .insert({
      farmer_id: params.farmerId,
      office_id: params.officeId,
      technician_id: techId,
      crop_name: params.cropName,
      problem_title: params.problemTitle,
      problem_description: params.problemDescription,
    })
    .select()
    .single();
  if (error) return null;

  const firstMsg: any = {
    ticket_id: ticket.id,
    sender_type: 'farmer',
    sender_id: params.farmerId,
    message_text: params.problemDescription,
  };
  if (params.imageUrls && params.imageUrls.length > 0) {
    firstMsg.image_url = params.imageUrls[0];
  }
  await (supabase as any).from('expert_ticket_messages').insert(firstMsg);

  if (params.imageUrls && params.imageUrls.length > 1) {
    for (let i = 1; i < params.imageUrls.length; i++) {
      await (supabase as any).from('expert_ticket_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'farmer',
        sender_id: params.farmerId,
        image_url: params.imageUrls[i],
      });
    }
  }
  return ticket as ExpertTicket;
}

// --- Mutations ---

export function useCreateExpertTicket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      officeId: string;
      cropName: string;
      problemTitle: string;
      problemDescription: string;
      imageUrls?: string[];
    }) => {
      // Auto-assign technician
      const technicianId = await assignTechnicianForOffice(data.officeId);
      if (!technicianId) {
        throw new Error('NO_TECHNICIAN');
      }

      const { data: ticket, error } = await (supabase as any)
        .from('expert_tickets')
        .insert({
          farmer_id: user!.id,
          office_id: data.officeId,
          technician_id: technicianId,
          crop_name: data.cropName,
          problem_title: data.problemTitle,
          problem_description: data.problemDescription,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert first message
      const firstMsg: any = {
        ticket_id: ticket.id,
        sender_type: 'farmer',
        sender_id: user!.id,
        message_text: data.problemDescription,
      };
      if (data.imageUrls && data.imageUrls.length > 0) {
        firstMsg.image_url = data.imageUrls[0];
      }
      await (supabase as any).from('expert_ticket_messages').insert(firstMsg);

      // Insert additional image messages
      if (data.imageUrls && data.imageUrls.length > 1) {
        for (let i = 1; i < data.imageUrls.length; i++) {
          await (supabase as any).from('expert_ticket_messages').insert({
            ticket_id: ticket.id,
            sender_type: 'farmer',
            sender_id: user!.id,
            image_url: data.imageUrls[i],
          });
        }
      }

      return ticket as ExpertTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
      toast({ title: '✅ प्रश्न पठाइयो', description: 'सम्बन्धित कृषि प्राविधिकलाई तपाईंको प्रश्न स्वतः पठाइएको छ।' });
    },
    onError: (err: any) => {
      if (err?.message === 'NO_TECHNICIAN') {
        toast({ title: 'प्राविधिक उपलब्ध छैन', description: 'यस कार्यालयमा अहिले सक्रिय कृषि प्राविधिक उपलब्ध छैन।', variant: 'destructive' });
      } else {
        toast({ title: 'त्रुटि', description: 'प्रश्न पठाउन सकिएन।', variant: 'destructive' });
      }
    },
  });
}

export function useSendExpertTicketMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      message: string;
      senderType?: string;
      imageUrl?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('expert_ticket_messages')
        .insert({
          ticket_id: data.ticketId,
          sender_type: data.senderType || 'farmer',
          sender_id: user!.id,
          message_text: data.message || null,
          image_url: data.imageUrl || null,
        });
      if (error) throw error;

      // Update unread flags and status
      const updates: any = {};
      if (data.senderType === 'technician') {
        updates.has_unread_farmer = true;
        updates.status = 'answered';
      } else {
        updates.has_unread_technician = true;
      }
      await (supabase as any).from('expert_tickets').update(updates).eq('id', data.ticketId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['expert-ticket-messages', vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['my-expert-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['technician-tickets'] });
    },
    onError: () => {
      toast({ title: 'सन्देश पठाउन सकिएन', variant: 'destructive' });
    },
  });
}

export async function uploadExpertImage(file: File): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
  const { error } = await supabase.storage.from('expert-images').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('expert-images').getPublicUrl(fileName);
  return data.publicUrl;
}
