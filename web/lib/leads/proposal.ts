import type { Lead } from "@/lib/leads/types";

// Proposal draft: a Markdown template filled from the lead and shaped by the agency's
// process from the brochure. [Square brackets] mark what the team must fill in.

export async function generateProposalDraft(lead: Lead, author: string): Promise<string> {
  const first = lead.name.split(" ")[0];
  const client = lead.business || lead.name;

  const services = lead.services.length > 0 ? lead.services : (["Digital Marketing"] as const);

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

## How we'll work

1. **Discovery & audit:** we map your brand, the competition and every gap in your current marketing.
2. **Strategy:** a content and channel plan built around real goals, not vanity metrics.
3. **Execution & creative:** scripting, shooting, designing and building, in-house and on schedule.
4. **Reporting & growth:** clear numbers each cycle, and a plan for what scales next.

## Next steps

- Reply to this email to confirm, or suggest changes.
- We'll send a short agreement and the first invoice.
- [Add anything specific to ${client}.]

Thanks again,

${author}
The Buzz Crew
`;
}
