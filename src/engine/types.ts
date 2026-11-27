/**
 * GhostWire Core Domain Types
 * Strict typing across Client WebWorker, Crypto Vault, Edge Redactor, Differential Privacy Proxy, and Audit Ledger.
 */

export type DocumentType = 'server_log' | 'resume' | 'support_ticket' | 'clinical_note';

export type PIICategory =
  | 'AADHAAR'
  | 'PAN'
  | 'SSN'
  | 'EMAIL'
  | 'PHONE'
  | 'CREDIT_CARD'
  | 'IP_ADDRESS'
  | 'DATE_OF_BIRTH'
  | 'NAME'
  | 'ADDRESS'
  | 'MEDICAL_RECORD_NUMBER'
  | 'PASSPORT'
  | 'API_KEY'
  | 'IFSC_CODE'
  | 'UPI_ID'
  | 'ICD_CODE'
  | 'QUASI_AGE'
  | 'QUASI_PINCODE';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'QUASI';

export interface PIIEntity {
  id: string;
  category: PIICategory;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0.0 - 1.0
  severity: SeverityLevel;
  ruleMatched: string;
  line: number;
  column: number;
  maskedPreview?: string;
  tokenIndex?: number;
}

export type RedactionStrategy = 'redact' | 'mask' | 'tokenize' | 'generalize' | 'synthetic_noise';

export interface ScanResult {
  scanId: string;
  documentType: DocumentType;
  timestamp: string;
  charCount: number;
  lineCount: number;
  executionTimeMs: number;
  entities: PIIEntity[];
  riskScore: number; // 0 - 100
  riskLevel: 'MINIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  anonymizedMetadata: {
    countsByCategory: Record<PIICategory, number>;
    countsBySeverity: Record<SeverityLevel, number>;
    detectedCategories: PIICategory[];
    documentType: DocumentType;
  };
}

export interface DifferentialPrivacyConfig {
  epsilon: number; // Privacy budget (e.g. 0.1 to 2.0)
  mechanism: 'laplace' | 'gaussian';
  sensitivity: number;
}

export interface AdversarialAttackResult {
  attackType: 'membership_inference' | 'linkage_attack' | 'quasi_identifier_probe';
  vulnerabilityScore: number; // 0 - 100
  potentialReIdentifiedRecords: number;
  description: string;
  mitigationRecommendation: string;
  quasisFound: string[];
  deductionChain?: string[];
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  documentType: DocumentType;
  entitiesDetected: number;
  riskScore: number;
  anonymizedSummary: string; // Zero raw PII!
  redactionStrategyUsed: RedactionStrategy;
  epsilonUsed?: number;
}
