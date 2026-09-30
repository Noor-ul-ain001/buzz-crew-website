import { CURRENT_ADMIN } from "@/lib/data/mock-leads";
import type { Lead } from "@/lib/leads/types";

// Mock proposal draft: no AI calls. A Markdown template filled from the lead, standing in
// for a model-written draft. [Square brackets] mark what the team must fill in.

export async function generateProposalDraft(lead: Lead): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1800));
  const first = lead.name.split(" ")[0];
  const client = lead.business || lead.name;

  const services = lead.services.length > 0 ? lead.services : (["Social Media"] as const);

  return `# Proposal for ${client}

Prepared for ${lead.name} by The Buzz Crew · [date]

Hi ${first},

Thank you for getting in touch. Here's how we'd help ${client} reach its goals.

## What you told us

> ${lead.message}

## What we recommend

${services.map((service) => `### ${service}\n\n[Describe the scope and deliverables for ${service}.]`).join("\n\n")}

## Investment

[Add the quote after the discovery call.]

## Timeline

1. **Week 1:** kick-off call, access to accounts, and a plan for the first month.
2. **Weeks 2–4:** first content, campaigns or pages go live.
3. **Monthly:** a short report on results and what we'll try next.

## Next steps

- Reply to this email to confirm, or suggest changes.
- We'll send a short agreement and the first invoice.
- [Add anything specific to ${client}.]

Thanks again,

${CURRENT_ADMIN}
The Buzz Crew
`;
}
