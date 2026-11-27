/**
 * POST /api/vault & GET /api/vault?id=...
 * Zero-Knowledge encrypted document vault store.
 * Stores ONLY AES-GCM ciphertext, IV, and salt. The server holds NO decryption key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertVaultItem, getVaultItem } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const VaultStoreSchema = z.object({
  id: z.string(),
  ciphertextBase64: z.string(),
  ivBase64: z.string(),
  saltBase64: z.string(),
  iterations: z.number(),
  expiresInHours: z.number().optional(),
  documentType: z.string(),
  title: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    // Reject any attempt to send plaintext or decryption keys!
    if (raw.plaintext || raw.passphrase || raw.key) {
      return NextResponse.json(
        { error: 'Security breach attempt: Vault stores ONLY encrypted ciphertext.' },
        { status: 400 }
      );
    }

    const parsed = VaultStoreSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid vault payload', details: parsed.error.format() }, { status: 422 });
    }

    const user = await getCurrentUser();
    insertVaultItem({
      ...parsed.data,
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      id: parsed.data.id,
      shareUrl: `/share/${parsed.data.id}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Vault ID required' }, { status: 400 });
    }

    const item = getVaultItem(id);

    if (!item) {
      return NextResponse.json({ error: 'Vault entry not found or expired' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vault: {
        id: item.id,
        ciphertextBase64: item.ciphertext_base64,
        ivBase64: item.iv_base64,
        saltBase64: item.salt_base64,
        iterations: item.iterations,
        documentType: item.document_type,
        title: item.title,
        createdAt: item.created_at,
        expiresAt: item.expires_at
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
