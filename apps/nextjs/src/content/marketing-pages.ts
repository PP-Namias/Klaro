export interface MarketingFooterLink {
  label: string;
  href: string;
}

export interface MarketingFooterGroup {
  title: string;
  links: MarketingFooterLink[];
}

export interface MarketingPageCard {
  title: string;
  body: string;
}

export interface MarketingPageStat {
  label: string;
  value: string;
}

export interface MarketingPageContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: MarketingFooterLink;
  secondaryAction: MarketingFooterLink;
  stats: MarketingPageStat[];
  cards: MarketingPageCard[];
  closingTitle: string;
  closingBody: string;
}

export const MARKETING_FOOTER_GROUPS: MarketingFooterGroup[] = [
  {
    title: "Features",
    links: [
      { label: "Scan & Analyze", href: "/scan" },
      { label: "AI Medical Chat", href: "/chat" },
      { label: "Clinic Finder", href: "/maps" },
      { label: "Doctor Booking", href: "/booking" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it Works", href: "/how-it-works" },
      { label: "Patient Stories", href: "/patient-stories" },
      { label: "Security & Privacy", href: "/security-privacy" },
      { label: "Contact Support", href: "/contact-support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "DPA Compliance", href: "/dpa-compliance" },
      { label: "Cookie Settings", href: "/cookie-settings" },
    ],
  },
];

export const MARKETING_PAGES: Record<string, MarketingPageContent> = {
  chat: {
    eyebrow: "AI Medical Chat",
    title: "Ask follow-up questions without losing the thread.",
    description:
      "Use plain language to unpack confusing results, compare possibilities, and keep the conversation tied to the same scan context.",
    primaryAction: { label: "Start with a scan", href: "/scan" },
    secondaryAction: { label: "Find a clinic", href: "/maps" },
    stats: [
      { label: "Context window", value: "Always attached" },
      { label: "Tone", value: "Clear and calm" },
      { label: "Best for", value: "Follow-up questions" },
    ],
    cards: [
      {
        title: "Translate medical jargon",
        body: "Turn test names and abbreviations into everyday language you can actually use.",
      },
      {
        title: "Keep the same record in view",
        body: "The chat stays tied to the scan so you do not have to start from zero every time.",
      },
      {
        title: "Know the next question to ask",
        body: "Get a short list of follow-up prompts that make your next appointment more useful.",
      },
    ],
    closingTitle: "One conversation. Less guessing.",
    closingBody:
      "Use the chat after a scan to get practical guidance before you decide whether to watch, book, or follow up.",
  },
  booking: {
    eyebrow: "Doctor Booking",
    title: "Move from scan insight to an appointment that fits.",
    description:
      "Compare doctors, carry your summary forward, and book with less back-and-forth after you already have the important context.",
    primaryAction: { label: "Browse clinics", href: "/maps" },
    secondaryAction: { label: "See how it works", href: "/how-it-works" },
    stats: [
      { label: "Search area", value: "Nearby first" },
      { label: "Booking flow", value: "Fast and guided" },
      { label: "Transferable notes", value: "Included" },
    ],
    cards: [
      {
        title: "Match the right specialty",
        body: "Use the scan summary to narrow down which kind of doctor makes sense next.",
      },
      {
        title: "Bring the summary with you",
        body: "Carry the important highlights into the booking flow so the clinic starts informed.",
      },
      {
        title: "Reduce repeat explanations",
        body: "Keep the same context visible across search, booking, and follow-up.",
      },
    ],
    closingTitle: "Less friction. More follow-through.",
    closingBody:
      "When the next step is obvious, people are more likely to act on it while the context is still fresh.",
  },
  "how-it-works": {
    eyebrow: "How it Works",
    title: "Three steps from upload to action.",
    description:
      "Klaro is built to take a confusing result, break it down into the important parts, and point you to a sensible next move.",
    primaryAction: { label: "Try the scanner", href: "/scan" },
    secondaryAction: {
      label: "Read patient stories",
      href: "/patient-stories",
    },
    stats: [
      { label: "Step 1", value: "Upload" },
      { label: "Step 2", value: "Understand" },
      { label: "Step 3", value: "Act" },
    ],
    cards: [
      {
        title: "Upload the result",
        body: "Start with a scan, lab sheet, or medical document you already have.",
      },
      {
        title: "Let Klaro explain it",
        body: "The analysis highlights the values that matter and turns them into plain language.",
      },
      {
        title: "Choose the next move",
        body: "Continue with chat, clinic search, or a booking flow based on what you learn.",
      },
    ],
    closingTitle: "One flow, not five different tools.",
    closingBody:
      "The experience stays consistent so the person using it can keep moving instead of re-orienting.",
  },
  "patient-stories": {
    eyebrow: "Patient Stories",
    title: "See how clearer results change the conversation.",
    description:
      "These stories focus on the moment a confusing document turns into a calmer decision about what to do next.",
    primaryAction: { label: "Start a scan", href: "/scan" },
    secondaryAction: { label: "Explore features", href: "/" },
    stats: [
      { label: "Theme", value: "Less panic" },
      { label: "Outcome", value: "Clearer action" },
      { label: "Audience", value: "Patients and families" },
    ],
    cards: [
      {
        title: "From uncertainty to a plan",
        body: "A short explanation can change a result from alarming to actionable.",
      },
      {
        title: "From second-guessing to confidence",
        body: "Having the key points in one place makes it easier to decide on the next step.",
      },
      {
        title: "From confusion to shared understanding",
        body: "Family members and caregivers can review the same summary without re-interpreting it.",
      },
    ],
    closingTitle: "Useful when the result is only half the story.",
    closingBody:
      "Stories matter because they show how a better explanation can lead to a better decision.",
  },
  "security-privacy": {
    eyebrow: "Security & Privacy",
    title: "Designed to keep medical context private.",
    description:
      "Klaro aims to reduce unnecessary exposure by keeping sensitive data scoped, readable, and easy to control.",
    primaryAction: {
      label: "Read the privacy policy",
      href: "/privacy-policy",
    },
    secondaryAction: { label: "Contact support", href: "/contact-support" },
    stats: [
      { label: "Data handling", value: "Scoped access" },
      { label: "Sharing", value: "User-controlled" },
      { label: "Support", value: "Human-readable" },
    ],
    cards: [
      {
        title: "Limit what is exposed",
        body: "Only the information needed for the current flow should be visible to help the user.",
      },
      {
        title: "Make privacy choices obvious",
        body: "People should be able to understand what happens to their documents without hunting for settings.",
      },
      {
        title: "Keep support easy to reach",
        body: "When privacy questions come up, the support path should be direct and readable.",
      },
    ],
    closingTitle: "Private by default. Clear by design.",
    closingBody:
      "The goal is to make the safe path the easy path without burying people in legal noise.",
  },
  "contact-support": {
    eyebrow: "Contact Support",
    title: "Get help when the flow gets stuck.",
    description:
      "Whether it is an upload issue, a booking question, or a privacy concern, support should be easy to find and easy to understand.",
    primaryAction: { label: "Review security", href: "/security-privacy" },
    secondaryAction: { label: "Read the FAQ flow", href: "/how-it-works" },
    stats: [
      { label: "Best for", value: "Upload or access issues" },
      { label: "Response style", value: "Plain language" },
      { label: "Escalation", value: "Human follow-up" },
    ],
    cards: [
      {
        title: "Document upload help",
        body: "Support can help figure out file size, format, or scan quality problems.",
      },
      {
        title: "Account and access questions",
        body: "If login or recovery gets in the way, the support flow stays simple.",
      },
      {
        title: "Privacy and policy concerns",
        body: "People should not have to guess where to ask about data or consent.",
      },
    ],
    closingTitle: "Support should feel like part of the product.",
    closingBody:
      "A good help page reduces friction before it turns into a blocked care decision.",
  },
  "privacy-policy": {
    eyebrow: "Privacy Policy",
    title: "How Klaro handles personal information.",
    description:
      "This page is a plain-language overview of what the product collects, why it needs it, and how the data stays controlled.",
    primaryAction: { label: "See security details", href: "/security-privacy" },
    secondaryAction: { label: "Review terms", href: "/terms-of-service" },
    stats: [
      { label: "Scope", value: "Product usage" },
      { label: "Access", value: "Need-to-know" },
      { label: "Tone", value: "Plain and direct" },
    ],
    cards: [
      {
        title: "What is collected",
        body: "Only the information needed to run the product and support the user should be explained here.",
      },
      {
        title: "How it is used",
        body: "The policy should make it clear whether data is used for analysis, support, or improvement.",
      },
      {
        title: "How to ask questions",
        body: "A privacy page should end with a clear path to support and escalation.",
      },
    ],
    closingTitle: "Short enough to read, complete enough to trust.",
    closingBody:
      "The policy should explain the actual flow, not just repeat legal filler.",
  },
  "terms-of-service": {
    eyebrow: "Terms of Service",
    title: "The rules for using Klaro responsibly.",
    description:
      "These terms should cover the expected use of the product, the limits of the guidance, and the responsibilities on both sides.",
    primaryAction: {
      label: "Read the privacy policy",
      href: "/privacy-policy",
    },
    secondaryAction: { label: "Contact support", href: "/contact-support" },
    stats: [
      { label: "Purpose", value: "Usage rules" },
      { label: "Health guidance", value: "Informational" },
      { label: "Support path", value: "Available" },
    ],
    cards: [
      {
        title: "Define acceptable use",
        body: "Users should know what the platform is built for and what it is not.",
      },
      {
        title: "Set expectations clearly",
        body: "Terms should explain that guidance is informational and not a substitute for care.",
      },
      {
        title: "Keep recourse visible",
        body: "If there is a problem, the next step should be easy to find.",
      },
    ],
    closingTitle: "Simple rules help people trust the flow.",
    closingBody:
      "A product that deals with health should be plain about the boundaries it works within.",
  },
  "dpa-compliance": {
    eyebrow: "DPA Compliance",
    title: "Built with Philippine data protection in mind.",
    description:
      "This page should explain the controls, responsibilities, and handling practices that keep Klaro aligned with local privacy expectations.",
    primaryAction: { label: "Review security", href: "/security-privacy" },
    secondaryAction: { label: "Read privacy policy", href: "/privacy-policy" },
    stats: [
      { label: "Focus", value: "Data protection" },
      { label: "Audience", value: "Users and partners" },
      { label: "Approach", value: "Readable compliance" },
    ],
    cards: [
      {
        title: "Data rights and access",
        body: "Explain how a person can request, review, or question their own data.",
      },
      {
        title: "Retention and deletion",
        body: "Clarify how long records are kept and what happens when they are no longer needed.",
      },
      {
        title: "Handling and accountability",
        body: "Describe who is responsible for safeguarding the information in the product flow.",
      },
    ],
    closingTitle: "Compliance should be understandable, not hidden.",
    closingBody:
      "Good governance is easier to trust when it reads like a clear process instead of a wall of text.",
  },
  "cookie-settings": {
    eyebrow: "Cookie Settings",
    title: "Choose how Klaro remembers your visit.",
    description:
      "This page should make tracking and preference choices easy to review, adjust, and revisit without interrupting the experience.",
    primaryAction: { label: "Read privacy policy", href: "/privacy-policy" },
    secondaryAction: { label: "Contact support", href: "/contact-support" },
    stats: [
      { label: "Consent", value: "Editable" },
      { label: "Purpose", value: "Experience and analytics" },
      { label: "Default", value: "Respectful" },
    ],
    cards: [
      {
        title: "Preference controls",
        body: "Let people change their minds without digging through nested settings.",
      },
      {
        title: "Explain what each choice does",
        body: "The settings page should say what gets enabled and why it matters.",
      },
      {
        title: "Keep the path short",
        body: "Consent should be easy to manage before it becomes frustrating.",
      },
    ],
    closingTitle: "Small choice. Big trust signal.",
    closingBody:
      "Clear cookie controls make the product feel more honest and less intrusive.",
  },
};

export function getMarketingPageContent(slug: string) {
  return MARKETING_PAGES[slug] ?? null;
}
