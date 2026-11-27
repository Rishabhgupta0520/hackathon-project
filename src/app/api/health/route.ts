/**
 * GET /api/health
 * Health check & architectural specification endpoint.
 * Details zero-knowledge design, Google Services integration (@google/genai), and security protocols.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  const body = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'GhostWire: Zero-Knowledge Edge PII Firewall & Differential Privacy Proxy',
    architecture: {
      zeroKnowledge: 'Client-side WebWorker scanning & AES-GCM encryption. Zero raw PII sent or stored in database.',
      googleGenAi: {
        package: '@google/genai',
        model: 'gemini-2.5-flash',
        role: 'Structured compliance synthesis (DPDP Act 2023, GDPR, HIPAA) & synthetic privacy-twin data generation operating solely on anonymized structural metadata.',
        status: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'DEMO_READY'
      },
      cryptography: {
        primitive: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-SHA256 (100,000 rounds)',
        saltLength: '128-bit',
        ivLength: '96-bit'
      },
      supportedDocumentTypes: ['server_log', 'resume', 'support_ticket', 'clinical_note'],
      complianceFrameworks: ['India DPDP Act 2023', 'EU GDPR', 'US HIPAA Safe Harbor', 'ISO/IEC 27701']
    }
  };

  return NextResponse.json(body, {
    status: 200,
    headers: securityHeaders
  });
}
