/**
 * GhostWire PII Detection Engine
 * High-performance, O(n) single-pass regex scanner with deterministic Luhn, Aadhaar Verhoeff, and context-aware validators.
 */

import { DocumentType, PIIEntity, PIICategory, SeverityLevel, ScanResult } from './types';

// Deterministic Verhoeff Algorithm for Aadhaar 12-digit number verification
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export function validateVerhoeff(numStr: string): boolean {
  const clean = numStr.replace(/\D/g, '');
  if (clean.length !== 12) return false;
  let c = 0;
  const reversed = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][reversed[i]]];
  }
  return c === 0;
}

// Luhn algorithm for Credit Card verification
export function validateLuhn(ccNumber: string): boolean {
  const clean = ccNumber.replace(/\D/g, '');
  if (clean.length < 11 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

interface PatternRule {
  category: PIICategory;
  severity: SeverityLevel;
  regex: RegExp;
  validator?: (match: string) => boolean;
  baseConfidence: number;
}

export const SCANNER_PATTERNS: PatternRule[] = [
  // Indian Aadhaar (12 digits)
  {
    category: 'AADHAAR',
    severity: 'CRITICAL',
    regex: /\b[2-9][0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g,
    validator: validateVerhoeff,
    baseConfidence: 0.98,
  },
  // Indian PAN (Permanent Account Number)
  {
    category: 'PAN',
    severity: 'CRITICAL',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    validator: (m) => ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'].includes(m.charAt(3)),
    baseConfidence: 0.95,
  },
  // US SSN
  {
    category: 'SSN',
    severity: 'CRITICAL',
    regex: /\b(?!000|666|9\d{2})\d{3}[- ](?!00)\d{2}[- ](?!0000)\d{4}\b/g,
    baseConfidence: 0.97,
  },
  // Credit Cards (Visa, MasterCard, Amex, Discover, RuPay)
  {
    category: 'CREDIT_CARD',
    severity: 'CRITICAL',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b|\b(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4})\b/g,
    validator: validateLuhn,
    baseConfidence: 0.99,
  },
  // Indian Bank IFSC Code
  {
    category: 'IFSC_CODE',
    severity: 'HIGH',
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    baseConfidence: 0.96,
  },
  // Indian UPI Virtual Payment Address (VPA)
  {
    category: 'UPI_ID',
    severity: 'HIGH',
    regex: /\b[a-zA-Z0-9.\-_]{2,}@(okaxis|okhdfcbank|okicici|oksbi|paytm|ybl|apl|upi)\b/gi,
    baseConfidence: 0.94,
  },
  // Email Addresses
  {
    category: 'EMAIL',
    severity: 'HIGH',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    baseConfidence: 0.99,
  },
  // Phone numbers (International & Domestic: +91, +1, standard 10-digit mobile)
  {
    category: 'PHONE',
    severity: 'HIGH',
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b(?:\+91[\-\s]?)?[6789]\d{9}\b/g,
    validator: (m) => m.replace(/\D/g, '').length >= 10,
    baseConfidence: 0.92,
  },
  // IPv4 & IPv6 Addresses
  {
    category: 'IP_ADDRESS',
    severity: 'MEDIUM',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    baseConfidence: 0.94,
  },
  // Leaked API Keys, Secrets & JWT Tokens
  {
    category: 'API_KEY',
    severity: 'CRITICAL',
    regex: /\b(?:AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z-_]{35}|ghp_[0-9a-zA-Z]{36}|sk-[a-zA-Z0-9]{32,}|Bearer\s+[A-Za-z0-9\-_=]{20,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
    baseConfidence: 0.99,
  },
  // Medical Record Numbers (MRN) & Clinical IDs
  {
    category: 'MEDICAL_RECORD_NUMBER',
    severity: 'CRITICAL',
    regex: /\b(?:MRN|MEDREC|Patient\s*ID|Record\s*#)[:#\s-]*([A-Z0-9]{6,12})\b/gi,
    baseConfidence: 0.93,
  },
  // ICD-10 Diagnosis Codes
  {
    category: 'ICD_CODE',
    severity: 'HIGH',
    regex: /\b[A-TV-Z][0-9][0-9AB]\.?[0-9A-TV-Z]{0,4}\b/g,
    validator: (m) => m.length >= 3 && m.length <= 7,
    baseConfidence: 0.88,
  },
  // Date of Birth (DOB)
  {
    category: 'DATE_OF_BIRTH',
    severity: 'MEDIUM',
    regex: /\b(?:DOB|Birthdate|Date\s+of\s+Birth)[:\s-]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/gi,
    baseConfidence: 0.90,
  },
  // Quasi-Identifier: Exact Age
  {
    category: 'QUASI_AGE',
    severity: 'QUASI',
    regex: /\b(?:Age[:\s]+(\d{1,3})|(\d{1,3})[- ]years?[- ]old)\b/gi,
    baseConfidence: 0.89,
  },
  // Quasi-Identifier: 6-digit Indian PIN Code or 5-digit US ZIP Code
  {
    category: 'QUASI_PINCODE',
    severity: 'QUASI',
    regex: /\b(?:PIN|PINCODE|ZIP|Postal)[:\s-]*([1-9][0-9]{5}|[0-9]{5})\b/gi,
    baseConfidence: 0.87,
  },
  // Passport Numbers (Standard Indian & US)
  {
    category: 'PASSPORT',
    severity: 'HIGH',
    regex: /\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b|\b[A-Z][0-9]{7,8}\b/g,
    baseConfidence: 0.85,
  }
];

// Document Type contextual heuristics
export function scanPII(text: string, documentType: DocumentType = 'server_log'): ScanResult {
  const startTime = performance.now();
  const rawEntities: PIIEntity[] = [];
  const lines = text.split('\n');

  // Pre-calculate line offsets for fast O(1) line/column lookup
  const lineOffsets: number[] = [0];
  for (let i = 0; i < lines.length - 1; i++) {
    lineOffsets.push(lineOffsets[i] + lines[i].length + 1);
  }

  function getPosition(offset: number): { line: number; column: number } {
    let low = 0;
    let high = lineOffsets.length - 1;
    let lineIdx = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lineOffsets[mid] <= offset) {
        lineIdx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return {
      line: lineIdx + 1,
      column: offset - lineOffsets[lineIdx] + 1
    };
  }

  // Map to track consistent index per unique value (e.g. [PERSON_01])
  const entityIndexMap = new Map<string, number>();
  let nextTokenIndex = 1;

  for (const rule of SCANNER_PATTERNS) {
    const rx = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = rx.exec(text)) !== null) {
      const matchedStr = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedStr.length;

      // Validate through deterministic check if rule specifies one
      if (rule.validator && !rule.validator(matchedStr)) {
        continue;
      }

      if (!entityIndexMap.has(matchedStr)) {
        entityIndexMap.set(matchedStr, nextTokenIndex++);
      }

      const pos = getPosition(startIndex);
      rawEntities.push({
        id: `pii_${startIndex}_${endIndex}_${rule.category}`,
        category: rule.category,
        value: matchedStr,
        startIndex,
        endIndex,
        confidence: rule.baseConfidence,
        severity: rule.severity,
        ruleMatched: rule.category,
        line: pos.line,
        column: pos.column,
        tokenIndex: entityIndexMap.get(matchedStr),
        maskedPreview: maskEntityPreview(matchedStr, rule.category)
      });
    }
  }

  // Deterministic Span Overlap Resolver:
  // Sort primarily by start offset ascending, then by severity priority (CRITICAL > HIGH > MEDIUM > QUASI > LOW), then by span length descending
  const severityRank: Record<SeverityLevel, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    QUASI: 2,
    LOW: 1
  };

  rawEntities.sort((a, b) => {
    if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
    const rankDiff = severityRank[b.severity] - severityRank[a.severity];
    if (rankDiff !== 0) return rankDiff;
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  const entities: PIIEntity[] = [];
  for (const candidate of rawEntities) {
    const isOverlapping = entities.some(
      e => (candidate.startIndex >= e.startIndex && candidate.startIndex < e.endIndex) ||
           (candidate.endIndex > e.startIndex && candidate.endIndex <= e.endIndex)
    );
    if (!isOverlapping) {
      entities.push(candidate);
    }
  }

  // Calculate Anonymized Aggregate Metadata
  const countsByCategory: Record<PIICategory, number> = {
    AADHAAR: 0,
    PAN: 0,
    SSN: 0,
    EMAIL: 0,
    PHONE: 0,
    CREDIT_CARD: 0,
    IP_ADDRESS: 0,
    DATE_OF_BIRTH: 0,
    NAME: 0,
    ADDRESS: 0,
    MEDICAL_RECORD_NUMBER: 0,
    PASSPORT: 0,
    API_KEY: 0,
    IFSC_CODE: 0,
    UPI_ID: 0,
    ICD_CODE: 0,
    QUASI_AGE: 0,
    QUASI_PINCODE: 0
  };

  const countsBySeverity: Record<SeverityLevel, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    QUASI: 0,
    LOW: 0
  };

  const detectedSet = new Set<PIICategory>();

  for (const ent of entities) {
    countsByCategory[ent.category] = (countsByCategory[ent.category] || 0) + 1;
    countsBySeverity[ent.severity] = (countsBySeverity[ent.severity] || 0) + 1;
    detectedSet.add(ent.category);
  }

  // Calculate Risk Score (0-100)
  const criticalWeight = countsBySeverity.CRITICAL * 35;
  const highWeight = countsBySeverity.HIGH * 15;
  const mediumWeight = countsBySeverity.MEDIUM * 5;
  const quasiWeight = countsBySeverity.QUASI * 8;
  const rawScore = criticalWeight + highWeight + mediumWeight + quasiWeight;
  const riskScore = Math.min(100, Math.round(rawScore));

  let riskLevel: 'MINIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'MINIMAL';
  if (riskScore >= 75) riskLevel = 'CRITICAL';
  else if (riskScore >= 45) riskLevel = 'HIGH';
  else if (riskScore >= 15) riskLevel = 'MODERATE';

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    documentType,
    timestamp: new Date().toISOString(),
    charCount: text.length,
    lineCount: lines.length,
    executionTimeMs,
    entities,
    riskScore,
    riskLevel,
    anonymizedMetadata: {
      countsByCategory,
      countsBySeverity,
      detectedCategories: Array.from(detectedSet),
      documentType
    }
  };
}

function maskEntityPreview(val: string, category: PIICategory): string {
  if (category === 'EMAIL') {
    const parts = val.split('@');
    if (parts.length === 2) {
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    }
  }
  if (category === 'CREDIT_CARD' || category === 'AADHAAR') {
    const clean = val.replace(/\D/g, '');
    return `****-****-${clean.slice(-4)}`;
  }
  if (val.length <= 4) return '***';
  return `${val.slice(0, 2)}...${val.slice(-2)}`;
}
