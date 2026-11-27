/**
 * POST /api/audit-history & GET /api/audit-history
 * Persists and retrieves anonymized scan logs in SQLite audit ledger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertAuditLog, getAuditLogs } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const AuditLogPostSchema = z.object({
  id: z.string(),
  documentType: z.string(),
  entitiesCount: z.number(),
  riskScore: z.number(),
  riskLevel: z.string(),
  categories: z.record(z.string(), z.number()),
  strategyUsed: z.string(),
  epsilon: z.number().optional(),
  anonymizedSummary: z.string()
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const user = await getCurrentUser();
    
    const logs = getAuditLogs(limit, user?.id);

    return NextResponse.json({
      success: true,
      logs
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    // Reject if unmasked raw text or raw entities are present
    if (raw.text || raw.rawText || raw.rawEntities) {
      return NextResponse.json(
        { error: 'Zero-Knowledge Violation: Plaintext cannot be written to audit ledger.' },
        { status: 400 }
      );
    }

    const parsed = AuditLogPostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Schema mismatch', details: parsed.error.format() }, { status: 422 });
    }

    const user = await getCurrentUser();
    insertAuditLog({
      ...parsed.data,
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      persistedId: parsed.data.id,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
