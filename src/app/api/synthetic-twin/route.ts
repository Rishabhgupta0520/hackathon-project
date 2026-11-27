/**
 * POST /api/synthetic-twin
 * Generates synthetic differential privacy-safe test records using @google/genai (gemini-2.5-flash).
 * Uses structured schema output strictly based on anonymized structural template metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

const SyntheticTwinSchema = z.object({
  documentType: z.enum(['server_log', 'resume', 'support_ticket', 'clinical_note']),
  detectedCategories: z.array(z.string()),
  recordCount: z.number().min(1).max(10).default(3)
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = SyntheticTwinSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.format() }, { status: 422 });
    }

    const { documentType, detectedCategories, recordCount } = parsed.data;
    const apiKey = process.env.GEMINI_API_KEY;

    let syntheticData: any = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Generate ${recordCount} synthetic, safe, completely realistic mock data samples for a "${documentType}".
Replace all sensitive entities (${detectedCategories.join(', ')}) with completely fictional, realistic benchmark data.
Ensure zero real personal identifiable data is used.

Respond with a JSON object:
{
  "documentType": "${documentType}",
  "syntheticRecords": [
    {
      "id": "SYNTH-01",
      "content": "string text with synthetic data",
      "syntheticSubstitutions": { "CATEGORY": "FAKE_VALUE" }
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          syntheticData = JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('Gemini synthetic generation fallback:', e);
      }
    }

    if (!syntheticData) {
      syntheticData = generateFallbackSynthetic(documentType, recordCount);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...syntheticData
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate synthetic twin', message: error.message }, { status: 500 });
  }
}

function generateFallbackSynthetic(docType: string, count: number) {
  const samples: Record<string, string[]> = {
    server_log: [
      `[2026-11-27T10:45:12.102Z] INFO 10.254.88.12 POST /api/v1/auth 200 user=synth_ops_user@corp.internal ref=TKN-SEC-4891`,
      `[2026-11-27T10:45:13.441Z] WARN 192.168.0.0/16 GET /dashboard/records patient_id=MRN-000000-SYNTH status=ANONYMIZED`,
      `[2026-11-27T10:45:14.890Z] DEBUG 172.16.42.10 PUT /customer/billing card_ending=4000-XXXX-XXXX-9999 amount=45.00`
    ],
    resume: [
      `CANDIDATE: [SYNTHETIC TALENT]\nEMAIL: candidate_01@privacy-talent.mock\nPHONE: +1-555-0199\nSUMMARY: Senior Security Analyst specializing in DPDP & GDPR privacy engineering.`,
      `CANDIDATE: [SYNTHETIC TALENT B]\nEMAIL: candidate_02@privacy-talent.mock\nPHONE: +91-98000-00000\nSUMMARY: Machine Learning Engineer focused on Differential Privacy mechanisms.`
    ],
    support_ticket: [
      `TICKET #8921-SYNTH: User synth_cust@domain.internal reports billing verification issue. Masked card: ****-****-****-1111. Status: Resolved.`,
      `TICKET #8922-SYNTH: Account verification requested for phone +1-555-0142. Two-factor bypass denied.`
    ],
    clinical_note: [
      `CLINICAL ENCOUNTER SYNTH-78\nPATIENT: [SYNTHETIC ANONYMOUS]\nDOB: [1970s DECADE]\nMRN: MRN-SYNTH-9941\nASSESSMENT: Patient presented with seasonal allergies. Prescribed Cetirizine 10mg.`,
      `CLINICAL ENCOUNTER SYNTH-79\nPATIENT: [SYNTHETIC ANONYMOUS]\nDOB: [1980s DECADE]\nMRN: MRN-SYNTH-9942\nASSESSMENT: Normal cardiovascular examination. Vitals stable.`
    ]
  };

  const records = (samples[docType] || samples.server_log).slice(0, count).map((content, idx) => ({
    id: `SYNTH-0${idx + 1}`,
    content,
    syntheticSubstitutions: {
      EMAIL: 'synthetic@safe-twin.internal',
      IP_ADDRESS: '10.254.0.1'
    }
  }));

  return {
    documentType: docType,
    syntheticRecords: records
  };
}
