// Any assigned technician/Bigya or admin can annotate images.
// Farmers and non-assigned users only see annotations (read-only).

import { useAuth } from '@/hooks/useAuth';
import { useCurrentTechnician } from '@/hooks/useCurrentTechnician';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Determines if the current user can annotate images on a given ticket.
 * Returns true if:
 *   - User is admin, OR
 *   - User is the assigned technician/Bigya for that ticket.
 */
export function useCanAnnotate(ticketTechnicianId: string | null | undefined) {
  const { user } = useAuth();
  const { data: currentTech, isLoading: techLoading } = useCurrentTechnician();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const isLoading = techLoading || roleLoading;

  if (!user || isLoading) {
    return { canAnnotate: false, canEditNotes: false, isLoading };
  }

  const isAssignedTechnician = !!(currentTech?.id && ticketTechnicianId && currentTech.id === ticketTechnicianId);
  const admin = isAdmin();

  return {
    canAnnotate: admin || isAssignedTechnician,
    canEditNotes: admin || isAssignedTechnician,
    isLoading,
  };
}
