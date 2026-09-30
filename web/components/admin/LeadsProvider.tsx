"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addLeadNote, deleteLead, updateLeadStatus } from "@/lib/data/admin-leads";
import { CURRENT_ADMIN, MOCK_LEADS } from "@/lib/data/mock-leads";
import type { Lead, LeadEvent, LeadStatus } from "@/lib/leads/types";

type LeadsContextValue = {
  leads: Lead[];
  /** Optimistic: the new status shows at once and is rolled back if the request fails. */
  changeStatus: (id: string, status: LeadStatus) => Promise<void>;
  addNote: (id: string, body: string) => Promise<void>;
  removeLead: (id: string) => Promise<void>;
};

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function useLeads(): LeadsContextValue {
  const value = useContext(LeadsContext);
  if (!value) throw new Error("useLeads must be used inside <LeadsProvider>");
  return value;
}

// Client-side cache of the leads for the admin area, so a change made on one screen shows
// on the others for the rest of the session. Seeded from the mock data; once the API
// exists, seed it from the server and keep the same actions.
export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);

  const findLead = useCallback(
    (id: string) => {
      const lead = leads.find((item) => item.id === id);
      if (!lead) throw new Error(`Lead ${id} not found`);
      return lead;
    },
    [leads],
  );

  const updateLead = useCallback((id: string, update: (lead: Lead) => Lead) => {
    setLeads((current) => current.map((lead) => (lead.id === id ? update(lead) : lead)));
  }, []);

  const changeStatus = useCallback(
    async (id: string, status: LeadStatus) => {
      const lead = findLead(id);
      if (lead.status === status) return;

      const event: LeadEvent = {
        id: crypto.randomUUID(),
        from: lead.status,
        to: status,
        actor: CURRENT_ADMIN,
        createdAt: new Date().toISOString(),
      };
      updateLead(id, (current) => ({ ...current, status, events: [...current.events, event] }));

      try {
        await updateLeadStatus(lead, status);
      } catch (error) {
        updateLead(id, (current) => ({
          ...current,
          status: lead.status,
          events: current.events.filter((item) => item.id !== event.id),
        }));
        throw error;
      }
    },
    [findLead, updateLead],
  );

  const addNote = useCallback(
    async (id: string, body: string) => {
      const note = await addLeadNote(findLead(id), body);
      updateLead(id, (current) => ({ ...current, notes: [...current.notes, note] }));
    },
    [findLead, updateLead],
  );

  const removeLead = useCallback(
    async (id: string) => {
      await deleteLead(findLead(id));
      setLeads((current) => current.filter((lead) => lead.id !== id));
    },
    [findLead],
  );

  const value = useMemo(
    () => ({ leads, changeStatus, addNote, removeLead }),
    [leads, changeStatus, addNote, removeLead],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}
