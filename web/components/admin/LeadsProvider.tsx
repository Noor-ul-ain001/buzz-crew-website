"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addLeadNote, deleteLead, updateLeadStatus } from "@/lib/leads/api";
import type { Lead, LeadEvent, LeadStatus } from "@/lib/leads/types";

type LeadsContextValue = {
  leads: Lead[];
  /** When the page was rendered: "this week" and "this month" are measured from here. */
  now: Date;
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

// Client-side cache of the admin's leads, loaded from the API by the panel layout, so a
// change made on one screen shows on the others without reloading.
export function LeadsProvider({
  initial,
  renderedAt,
  actorName,
  children,
}: {
  initial: Lead[];
  /** ISO time of the server render, so server and browser compute the same dates. */
  renderedAt: string;
  actorName: string;
  children: ReactNode;
}) {
  const [leads, setLeads] = useState<Lead[]>(initial);
  const now = useMemo(() => new Date(renderedAt), [renderedAt]);

  const updateLead = useCallback((id: string, update: (lead: Lead) => Lead) => {
    setLeads((current) => current.map((lead) => (lead.id === id ? update(lead) : lead)));
  }, []);

  const changeStatus = useCallback(
    async (id: string, status: LeadStatus) => {
      const lead = leads.find((item) => item.id === id);
      if (!lead || lead.status === status) return;

      const event: LeadEvent = {
        id: crypto.randomUUID(),
        from: lead.status,
        to: status,
        actor: actorName,
        createdAt: new Date().toISOString(),
      };
      updateLead(id, (current) => ({ ...current, status, events: [...current.events, event] }));

      try {
        const saved = await updateLeadStatus(id, status);
        updateLead(id, () => saved);
      } catch (error) {
        updateLead(id, (current) => ({
          ...current,
          status: lead.status,
          events: current.events.filter((item) => item.id !== event.id),
        }));
        throw error;
      }
    },
    [leads, actorName, updateLead],
  );

  const addNote = useCallback(
    async (id: string, body: string) => {
      const note = await addLeadNote(id, body);
      updateLead(id, (current) => ({ ...current, notes: [...current.notes, note] }));
    },
    [updateLead],
  );

  const removeLead = useCallback(async (id: string) => {
    await deleteLead(id);
    setLeads((current) => current.filter((lead) => lead.id !== id));
  }, []);

  const value = useMemo(
    () => ({ leads, now, changeStatus, addNote, removeLead }),
    [leads, now, changeStatus, addNote, removeLead],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}
