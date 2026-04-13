export interface EmailTemplate {
  id: string
  name: string
  category: 'generic' | 'property'
  subject: string
  body: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Generic
  {
    id: 'initial-intro',
    name: 'Initial Introduction',
    category: 'generic',
    subject: 'Introduction — Costi Cohen Property Advisory',
    body: `Hi {{first_name}},

Thank you for your interest in our property advisory services. I'm Costi Cohen, and I'd love to learn more about what you're looking for.

Whether you're searching for residential or commercial property, our team provides end-to-end buyers agency support — from defining your brief through to settlement.

Would you have time for a quick call this week to discuss your property goals?

Best regards,
Costi Cohen`,
  },
  {
    id: 'warm-checkin',
    name: 'Warm Check-in',
    category: 'generic',
    subject: 'Checking in — {{first_name}}',
    body: `Hi {{first_name}},

I hope you're well. I wanted to touch base and see if your property plans have progressed since we last spoke.

The market has been moving, and I've seen some opportunities that might align with what you were looking for. Happy to catch up whenever suits you.

Kind regards,
Costi Cohen`,
  },
  {
    id: 'meeting-followup',
    name: 'Meeting Follow-up',
    category: 'generic',
    subject: 'Great meeting today, {{first_name}}',
    body: `Hi {{first_name}},

Thanks for taking the time to meet today. It was great to discuss your property goals and understand what you're looking for.

As discussed, I'll start putting together some options for you and will be in touch shortly with an update.

If anything comes to mind in the meantime, don't hesitate to reach out.

Best,
Costi Cohen`,
  },
  // Property
  {
    id: 'mandate-confirmation',
    name: 'Mandate Confirmation',
    category: 'property',
    subject: 'Mandate Confirmation — Property Search',
    body: `Hi {{first_name}},

Thank you for engaging Costi Cohen as your buyers agent. I'm pleased to confirm we've received your mandate and are ready to begin the property search.

Here's a summary of your brief:
- Asset type: {{asset_type}}
- Budget range: {{budget_range}}
- Key requirements: [to be discussed]

Our fee structure is {{fee_percentage}}% of the purchase price, payable on exchange of contracts.

I'll begin sourcing properties immediately and will keep you updated throughout the process.

Best regards,
Costi Cohen`,
  },
  {
    id: 'off-market',
    name: 'Off-Market Opportunity',
    category: 'property',
    subject: 'Off-Market Opportunity for You',
    body: `Hi {{first_name}},

I've come across an off-market opportunity that I think could be a great fit for your brief.

I'd love to share the details with you. Are you available for a quick call to discuss?

This won't be on the open market for long, so it's worth having a look sooner rather than later.

Best,
Costi Cohen`,
  },
  {
    id: 'property-search-update',
    name: 'Property Search Update',
    category: 'property',
    subject: 'Property Search Update — {{first_name}}',
    body: `Hi {{first_name}},

I wanted to give you an update on your property search. We've been actively reviewing listings and off-market opportunities that match your brief.

Here's where things stand:
- Properties reviewed: [number]
- Shortlisted: [number]
- Next steps: [details]

I'll have some options to present to you shortly. In the meantime, let me know if any of your requirements have changed.

Kind regards,
Costi Cohen`,
  },
]

export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject
  let body = template.body

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(pattern, value)
    body = body.replace(pattern, value)
  }

  return { subject, body }
}

export function getTemplateVariables(contact: {
  name: string
  company?: string | null
  asset_type?: string | null
  budget_min?: number | null
  budget_max?: number | null
  fee_percentage?: number | null
  stage?: string
}): Record<string, string> {
  const firstName = contact.name.split(' ')[0]
  const budgetRange = contact.budget_min && contact.budget_max
    ? `$${(contact.budget_min / 1000000).toFixed(1)}M – $${(contact.budget_max / 1000000).toFixed(1)}M`
    : 'TBD'

  return {
    first_name: firstName,
    full_name: contact.name,
    company: contact.company || '',
    asset_type: contact.asset_type || 'TBD',
    budget_range: budgetRange,
    fee_percentage: contact.fee_percentage ? `${contact.fee_percentage}%` : 'TBD',
    stage: contact.stage || '',
  }
}
