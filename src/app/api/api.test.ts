import { describe, it, expect } from 'vitest';
import { GET as getHealth } from '@/app/api/health/route';
import { NextRequest } from 'next/server';
import { POST as postCompliance } from '@/app/api/compliance-audit/route';
import { POST as postVault, GET as getVault } from '@/app/api/vault/route';
import { POST as postRegister } from '@/app/api/auth/register/route';
import { POST as postLogin } from '@/app/api/auth/login/route';
import { POST as postLogout } from '@/app/api/auth/logout/route';

describe('GhostWire API Routes & Security Controls', () => {
  it('GET /api/health returns valid architecture specs and security headers', async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);

    const headers = res.headers;
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');

    const json = await res.json();
    expect(json.status).toBe('healthy');
    expect(json.architecture.zeroKnowledge).toBeDefined();
    expect(json.architecture.googleGenAi.model).toBe('gemini-2.5-flash');
  });

  it('POST /api/compliance-audit strictly rejects requests containing raw plaintext or PII', async () => {
    const maliciousReq = new NextRequest('http://localhost:3000/api/compliance-audit', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Unmasked raw logs with pan BKUPG8819L',
        documentType: 'server_log',
        riskScore: 80,
        riskLevel: 'CRITICAL',
        detectedCategories: ['PAN'],
        countsByCategory: { PAN: 1 },
        countsBySeverity: { CRITICAL: 1 }
      })
    });

    const res = await postCompliance(maliciousReq);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('Zero-Knowledge policy violated');
  });

  it('POST /api/vault accepts encrypted ciphertext and returns retrieveable share item', async () => {
    const vaultId = `vlt_test_${Date.now()}`;
    const storeReq = new NextRequest('http://localhost:3000/api/vault', {
      method: 'POST',
      body: JSON.stringify({
        id: vaultId,
        ciphertextBase64: 'kldjfasldf==',
        ivBase64: 'abc123==',
        saltBase64: 'def456==',
        iterations: 100000,
        documentType: 'server_log',
        title: 'Test Encrypted Document'
      })
    });

    const postRes = await postVault(storeReq);
    expect(postRes.status).toBe(200);

    const getReq = new NextRequest(`http://localhost:3000/api/vault?id=${vaultId}`);
    const getRes = await getVault(getReq);
    expect(getRes.status).toBe(200);

    const json = await getRes.json();
    expect(json.vault.id).toBe(vaultId);
    expect(json.vault.ciphertextBase64).toBe('kldjfasldf==');
  });

  it('POST /api/auth/register creates user and issues session cookie', async () => {
    const testEmail = `test_${Date.now()}@ghostwire.io`;
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Analyst',
        email: testEmail,
        password: 'Password123!',
      }),
    });

    const res = await postRegister(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe(testEmail);
    expect(res.cookies.get('ghostwire_session')).toBeDefined();
  });

  it('POST /api/auth/login supports 1-Click Instant Demo Login', async () => {
    const demoReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ isDemo: true }),
    });

    const res = await postLogin(demoReq);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe('analyst@ghostwire.io');
    expect(res.cookies.get('ghostwire_session')).toBeDefined();
  });

  it('POST /api/auth/logout clears session cookie', async () => {
    const res = await postLogout();
    expect(res.status).toBe(200);
    const cookie = res.cookies.get('ghostwire_session');
    expect(cookie?.value).toBe('');
  });
});
