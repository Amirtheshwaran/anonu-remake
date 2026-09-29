export interface ModerationResult {
  hasPII: boolean;
  piiType?: 'phone' | 'email' | 'student_id' | 'address';
  isCrisis: boolean;
  toxicityScores: {
    harassment: number;
    hateSpeech: number;
    threats: number;
    sexual: number;
    spam: number;
    selfHarm: number;
  };
  action: 'publish' | 'queue' | 'auto_hide';
  severity: 'low' | 'medium' | 'high' | 'crisis';
  flagReason?: string;
}

// 1. PII Regular Expressions
const PHONE_REGEX = /(\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}/;
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;
const STUDENT_ID_REGEX = /\b(80[0-9]{7}|\d{8,9})\b/;
const ADDRESS_REGEX = /\b\d{1,5}\s+([A-Za-z0-9.]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Place|Pl|Dorm|Hall)\b/i;

// 2. Self-Harm & Crisis Expressions
const CRISIS_PATTERNS = [
  /\bkill\s+myself\b/i,
  /\bcommit\s+suicide\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bend\s+my\s+life\b/i,
  /\bsuicidal\b/i,
  /\bcutting\s+myself\b/i,
  /\boverdose\b/i,
  /\bhang\s+myself\b/i,
  /\bcan'?t\s+go\s+on\s+anymore\b/i,
  /\beveryone\s+better\s+off\s+without\s+me\b/i,
];

// 3. Toxicity Keyword Banks
const THREAT_PATTERNS = [
  /\bshoot\s+up\b/i,
  /\bbomb\b/i,
  /\bgoing\s+to\s+kill\b/i,
  /\bbeat\s+the\s+shit\s+out\s+of\b/i,
  /\bwill\s+murder\b/i,
];

const HATE_PATTERNS = [
  /\b(nigger|faggot|kike|chink|spic|wetback)\b/i,
  /\bkill\s+all\s+(gays|blacks|jews|muslims|whites)\b/i,
];

const HARASSMENT_PATTERNS = [
  /\bkill\s+yourself\b/i,
  /\bky[s$]\b/i,
  /\bhate\s+you\s+so\s+much\s+die\b/i,
  /\bworthless\s+piece\s+of\s+shit\b/i,
];

const SPAM_PATTERNS = [
  /\b(buy\s+followers|free\s+crypto|telegram:\s*@|whatsapp:\s*\+)\b/i,
  /\b(cashapp\s+flip|join\s+my\s+onlyfans)\b/i,
];

export function screenContent(text: string): ModerationResult {
  const content = text.trim();

  // Check Crisis first
  const isCrisis = CRISIS_PATTERNS.some((pattern) => pattern.test(content));

  // Check PII
  let hasPII = false;
  let piiType: ModerationResult['piiType'] = undefined;

  if (PHONE_REGEX.test(content)) {
    hasPII = true;
    piiType = 'phone';
  } else if (EMAIL_REGEX.test(content)) {
    hasPII = true;
    piiType = 'email';
  } else if (STUDENT_ID_REGEX.test(content)) {
    hasPII = true;
    piiType = 'student_id';
  } else if (ADDRESS_REGEX.test(content)) {
    hasPII = true;
    piiType = 'address';
  }

  // Calculate Toxicity Scores
  let harassment = 0.0;
  let hateSpeech = 0.0;
  let threats = 0.0;
  let sexual = 0.0;
  let spam = 0.0;
  let selfHarm = isCrisis ? 0.95 : 0.0;

  if (HATE_PATTERNS.some((p) => p.test(content))) {
    hateSpeech = 0.95;
  }
  if (THREAT_PATTERNS.some((p) => p.test(content))) {
    threats = 0.95;
  }
  if (HARASSMENT_PATTERNS.some((p) => p.test(content))) {
    harassment = 0.9;
  }
  if (SPAM_PATTERNS.some((p) => p.test(content))) {
    spam = 0.85;
  }

  const maxToxicity = Math.max(harassment, hateSpeech, threats, sexual, spam, selfHarm);

  // Determine Action & Severity
  let action: ModerationResult['action'] = 'publish';
  let severity: ModerationResult['severity'] = 'low';
  let flagReason: string | undefined = undefined;

  if (isCrisis) {
    severity = 'crisis';
    action = 'queue'; // Flagged for immediate support and mod awareness, not silently destroyed
    flagReason = 'Self-harm or crisis intervention triggered';
  } else if (hasPII) {
    severity = 'high';
    action = 'auto_hide';
    flagReason = `PII Detected (${piiType})`;
  } else if (maxToxicity >= 0.8) {
    severity = 'high';
    action = 'auto_hide';
    flagReason = 'High severity violation (hate, threats, severe harassment, or spam)';
  } else if (maxToxicity >= 0.5) {
    severity = 'medium';
    action = 'queue';
    flagReason = 'Potential policy violation enqueued for review';
  }

  return {
    hasPII,
    piiType,
    isCrisis,
    toxicityScores: {
      harassment,
      hateSpeech,
      threats,
      sexual,
      spam,
      selfHarm,
    },
    action,
    severity,
    flagReason,
  };
}
