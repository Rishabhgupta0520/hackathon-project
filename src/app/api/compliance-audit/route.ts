/**
 * POST /api/compliance-audit
 * Audits anonymized structural metadata using @google/genai (gemini-2.5-flash).
 * REJECTS any unmasked raw PII payload via Zod validation schema!
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

// Strict schema ensuring only aggregated counts and structural metadata arrive at the server
const ComplianceAuditSchema = z.object({
  documentType: z.enum(['server_log', 'resume', 'support_ticket', 'clinical_note']),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['MINIMAL', 'MODERATE', 'HIGH', 'CRITICAL']),
  detectedCategories: z.array(z.string()),
  countsByCategory: z.record(z.string(), z.number()),
  countsBySeverity: z.record(z.string(), z.number()),
  // Disallow raw text or any entities array containing raw text!
  rawText: z.undefined().optional(),
  entities: z.undefined().optional()
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Zero-Knowledge Validation: Reject if raw PII or text was sent
    if (rawBody.text || rawBody.rawText || rawBody.entities) {
      return NextResponse.json(
        { error: 'SECURITY_VIOLATION: Zero-Knowledge policy violated. Never send raw PII to the server.' },
        { status: 400 }
      );
    }

    const parseResult = ComplianceAuditSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid anonymized structural metadata schema', details: parseResult.error.format() },
        { status: 422 }
      );
    }

    const metadata = parseResult.data;
    const apiKey = process.env.GEMINI_API_KEY;

    let auditReport: any = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a Chief Privacy & Data Protection Compliance Officer.
Analyze the following ANONYMIZED STRUCTURAL METADATA for a ${metadata.documentType}:
- Risk Score: ${metadata.riskScore}/100 (${metadata.riskLevel})
- Detected Categories: ${metadata.detectedCategories.join(', ')}
- Entity Counts by Category: ${JSON.stringify(metadata.countsByCategory)}
- Severity Counts: ${JSON.stringify(metadata.countsBySeverity)}

Evaluate compliance against:
1. India Digital Personal Data Protection (DPDP) Act 2023 (Duties of Data Fiduciaries, Significant Data Fiduciary thresholds)
2. EU General Data Protection Regulation (GDPR) (Art 5, 9, 32 technical and organisational measures)
3. US Health Insurance Portability and Accountability Act (HIPAA) Safe Harbor (18 de-identification identifiers)

Respond with a valid JSON object matching this structure:
{
  "dpdpCompliance": { "status": "COMPLIANT|NON_COMPLIANT|ACTION_REQUIRED", "penaltyExposure": "Low|Medium|High", "keyViolations": ["string"], "requiredRemediations": ["string"] },
  "gdprCompliance": { "status": "COMPLIANT|NON_COMPLIANT|ACTION_REQUIRED", "articleBreaches": ["string"], "mitigations": ["string"] },
  "hipaaCompliance": { "status": "COMPLIANT|NON_COMPLIANT|ACTION_REQUIRED", "safeHarborExceptions": ["string"], "remediation": "string" },
  "executiveSummary": "string",
  "dpoActionChecklist": ["string"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          auditReport = JSON.parse(response.text);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, generating deterministic structural audit:', geminiError);
      }
    }

    // Deterministic fallback compliance audit if API key is absent or unreachable
    if (!auditReport) {
      auditReport = generateDeterministicAudit(metadata);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metadata,
      auditReport
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error during compliance evaluation', message: error.message },
      { status: 500 }
    );
  }
}

function generateDeterministicAudit(metadata: z.infer<typeof ComplianceAuditSchema>) {
  const hasAadhaarOrPan = metadata.detectedCategories.includes('AADHAAR') || metadata.detectedCategories.includes('PAN');
  const hasHealthData = metadata.detectedCategories.includes('MEDICAL_RECORD_NUMBER') || metadata.documentType === 'clinical_note';
  const isHighRisk = metadata.riskScore >= 45;

  return {
    dpdpCompliance: {
      status: isHighRisk ? 'ACTION_REQUIRED' : 'COMPLIANT',
      penaltyExposure: isHighRisk ? (hasAadhaarOrPan ? 'High (Up to ₹250 Crore under Sec 33)' : 'Medium') : 'Low',
      keyViolations: isHighRisk
        ? ['Failure to implement reasonable security safeguards under Sec 8(5)', ...(hasAadhaarOrPan ? ['Exposure of Unique Identity Data without consent notice under Sec 5'] : [])]
        : ['No major DPDP violations detected under standard threshold'],
      requiredRemediations: [
        'Mandate client-side differential privacy or HMAC tokenization before cross-border transmission',
        'Maintain verifiable audit logs of access and erasure requests'
      ]
    },
    gdprCompliance: {
      status: isHighRisk ? 'NON_COMPLIANT' : 'COMPLIANT',
      articleBreaches: isHighRisk ? ['Article 5(1)(c) Data Minimisation', 'Article 32 Security of Processing'] : [],
      mitigations: [
        'Enforce pseudonymous generalization on network and quasi-identifier fields',
        'Register automated Data Protection Impact Assessment (DPIA)'
      ]
    },
    hipaaCompliance: {
      status: hasHealthData ? 'ACTION_REQUIRED' : 'COMPLIANT',
      safeHarborExceptions: hasHealthData ? ['Clinical record or MRN detected without Safe Harbor 18-element de-identification certification'] : [],
      remediation: hasHealthData
        ? 'Strip all medical record numbers, dates other than year, and direct identifiers before analytics.'
        : 'Safe Harbor standard preserved.'
    },
    executiveSummary: `Automated assessment of ${metadata.documentType} revealed a risk rating of ${metadata.riskScore}/100 (${metadata.riskLevel}). ${metadata.detectedCategories.length} categories detected. Client-side edge redaction successfully neutralizes exfiltration risk prior to downstream processing.`,
    dpoActionChecklist: [
      'Enable client-side Zero-Knowledge AES-GCM vaulting for internal document distribution',
      'Set Differential Privacy epsilon budget to ε <= 0.5 for all aggregate data pipelines',
      'Schedule quarterly penetration testing for quasi-identifier linkage vulnerabilities'
    ]
  };
}
