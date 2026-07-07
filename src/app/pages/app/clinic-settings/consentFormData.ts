// The clinic's single patient consent form template: structured fields +
// rich-text (HTML) body copy, with an append-only version history. Each
// version stores a full content snapshot (never a diff) so historical
// signatures can always be traced back to the exact text the patient saw —
// see Compare/View in VersionHistoryPanel for how two snapshots get diffed.

export type ConsentSection = {
  id: string;
  title: string;
  bodyHtml: string;
  required: boolean;
};

export type SignatureBlockConfig = {
  idNumber: boolean;
  witnessSignature: boolean;
};

export type ConsentFormContent = {
  title: string;
  introductionHtml: string;
  sections: ConsentSection[];
  signatureBlock: SignatureBlockConfig;
  footerHtml: string;
};

export type ConsentFormVersion = {
  version: number;
  status: "active" | "archived";
  editedBy: string;
  editedAtShort: string; // "28 Jun 2026" — header / card date
  editedAtFull: string; // "28 Jun 2026, 14:30" — card timestamp
  changeSummary: string; // auto-detected by the system — never hand-typed
  adminNote?: string; // optional free-text context the Admin chose to record
  signedCount: number;
  content: ConsentFormContent;
};

const GDPR_RETENTION_ORIGINAL =
  "My personal and health data will be processed and stored securely for the purpose of providing care, in line with applicable data protection law.";

const GDPR_RETENTION_UPDATED =
  "My personal and health data will be processed and stored securely for the purpose of providing care, in line with applicable data protection law. Health data will be retained for a period of <strong>10 years</strong> from the date of my last visit, after which it will be securely deleted unless a longer retention period is required by law.";

const FOOTER_HTML =
  "<p>Phenome Clinic, Istanbul &middot; This consent form is provided in accordance with Turkish Personal Data Protection Law (KVKK) and, where applicable, the EU General Data Protection Regulation (GDPR). For questions about this form, contact <a href=\"mailto:privacy@phenomeclinic.com\">privacy@phenomeclinic.com</a>.</p>";

const INTRO_V1 =
  "<p>This form explains what to expect during your health assessment at Phenome Clinic, and asks for your consent to proceed. Please read each section carefully.</p>";

const INTRO_V4 =
  "<p>This form explains what to expect during your comprehensive health assessment at Phenome Clinic, and asks for your consent to proceed. Please read each section carefully. Sections marked with an asterisk (*) are required in order to continue with your visit today.</p>";

const SECTION_GENERAL: ConsentSection = {
  id: "general-consent",
  title: "General Consent to Assessment",
  bodyHtml:
    "<p>I consent to undergo a health assessment at Phenome Clinic, including physical examination, body composition scanning, and standard laboratory testing as recommended by my care team. I understand the assessment findings will be reviewed with me by a clinician.</p>",
  required: true,
};

const SECTION_GENETIC: ConsentSection = {
  id: "genetic-testing",
  title: "Genetic Testing & Genomic Data",
  bodyHtml:
    "<p>I consent to the collection of a biological sample for genetic and genomic analysis. I understand that results may reveal information about inherited conditions, and that I can request genetic counselling to discuss any findings.</p>",
  required: true,
};

const SECTION_GDPR_V1: ConsentSection = {
  id: "data-processing",
  title: "Data Processing & Storage (GDPR/KVKK)",
  bodyHtml: `<p>${GDPR_RETENTION_ORIGINAL}</p>`,
  required: true,
};

const SECTION_GDPR_V3: ConsentSection = {
  id: "data-processing",
  title: "Data Processing & Storage (GDPR/KVKK)",
  bodyHtml: `<p>${GDPR_RETENTION_UPDATED}</p>`,
  required: true,
};

const SECTION_RESEARCH: ConsentSection = {
  id: "research-participation",
  title: "Optional: Research Participation",
  bodyHtml:
    "<p>I agree that my de-identified health data may be used in future clinical research conducted or sponsored by Phenome Clinic. This is entirely optional and declining will not affect my care in any way.</p>",
  required: false,
};

const CONTENT_V1: ConsentFormContent = {
  title: "Informed Consent for Health Assessment",
  introductionHtml: INTRO_V1,
  sections: [SECTION_GENERAL, SECTION_GDPR_V1],
  signatureBlock: { idNumber: false, witnessSignature: false },
  footerHtml: FOOTER_HTML,
};

const CONTENT_V2: ConsentFormContent = {
  title: "Informed Consent for Health Assessment",
  introductionHtml: INTRO_V1,
  sections: [SECTION_GENERAL, SECTION_GENETIC, SECTION_GDPR_V1],
  signatureBlock: { idNumber: false, witnessSignature: false },
  footerHtml: FOOTER_HTML,
};

const CONTENT_V3: ConsentFormContent = {
  title: "Informed Consent for Comprehensive Health Assessment",
  introductionHtml: INTRO_V4,
  sections: [SECTION_GENERAL, SECTION_GENETIC, SECTION_GDPR_V3],
  signatureBlock: { idNumber: true, witnessSignature: false },
  footerHtml: FOOTER_HTML,
};

const CONTENT_V4: ConsentFormContent = {
  title: "Informed Consent for Comprehensive Health Assessment",
  introductionHtml: INTRO_V4,
  sections: [SECTION_GENERAL, SECTION_GENETIC, SECTION_GDPR_V3, SECTION_RESEARCH],
  signatureBlock: { idNumber: true, witnessSignature: false },
  footerHtml: FOOTER_HTML,
};

// Newest first — matches how the Version History panel lists them.
export const CONSENT_FORM_VERSIONS: ConsentFormVersion[] = [
  {
    version: 4,
    status: "active",
    editedBy: "Ayşe Hançer",
    editedAtShort: "28 Jun 2026",
    editedAtFull: "28 Jun 2026, 14:30",
    changeSummary: "Added optional research participation clause",
    signedCount: 142,
    content: CONTENT_V4,
  },
  {
    version: 3,
    status: "archived",
    editedBy: "Ayşe Hançer",
    editedAtShort: "15 Jun 2026",
    editedAtFull: "15 Jun 2026, 09:05",
    changeSummary: "Updated GDPR data retention period to 10 years",
    signedCount: 89,
    content: CONTENT_V3,
  },
  {
    version: 2,
    status: "archived",
    editedBy: "Ayşe Hançer",
    editedAtShort: "1 May 2026",
    editedAtFull: "1 May 2026, 11:20",
    changeSummary: "Added genetic testing consent section",
    signedCount: 203,
    content: CONTENT_V2,
  },
  {
    version: 1,
    status: "archived",
    editedBy: "Ayşe Hançer",
    editedAtShort: "15 Mar 2026",
    editedAtFull: "15 Mar 2026, 10:00",
    changeSummary: "Initial consent form",
    signedCount: 156,
    content: CONTENT_V1,
  },
];

export function cloneContent(content: ConsentFormContent): ConsentFormContent {
  return {
    ...content,
    sections: content.sections.map((s) => ({ ...s })),
    signatureBlock: { ...content.signatureBlock },
  };
}

export function contentsEqual(a: ConsentFormContent, b: ConsentFormContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

let nextSectionId = 100;
export function newSectionId(): string {
  return `section-${nextSectionId++}`;
}
