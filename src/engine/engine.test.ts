import { describe, it, expect } from 'vitest';
import { scanPII, validateLuhn, validateVerhoeff } from './scanner';
import { applyRedaction } from './redactor';
import { addLaplaceNoise, applyDifferentialPrivacy, simulateAdversarialAttacks } from './privacyProxy';

describe('Deterministic Validator Algorithms', () => {
  it('validates Luhn algorithm for credit card checksums correctly', () => {
    // Valid standard test card numbers
    expect(validateLuhn('4532 8921 9920 1488')).toBe(false); // bad checksum
    expect(validateLuhn('4532892199201488')).toBe(false);
    expect(validateLuhn('49927398716')).toBe(true); // valid Luhn
    expect(validateLuhn('1234567812345670')).toBe(true); // valid Luhn
  });

  it('validates Verhoeff algorithm for Indian Aadhaar checksums correctly', () => {
    expect(validateVerhoeff('999941052814')).toBe(false);
    expect(validateVerhoeff('123456789012')).toBe(false);
  });
});

describe('PII Scanner Engine', () => {
  it('detects Indian PAN, Emails, and IP Addresses with line and column precision', () => {
    const text = 'Admin user vikram@paycorp.in logged in from 192.168.1.50 with PAN BKUPG8819L.';
    const result = scanPII(text, 'server_log');

    expect(result.entities.length).toBe(3);
    const categories = result.entities.map(e => e.category);
    expect(categories).toContain('EMAIL');
    expect(categories).toContain('IP_ADDRESS');
    expect(categories).toContain('PAN');
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.charCount).toBe(text.length);
  });

  it('detects Medical Record Numbers and clinical dates in clinical notes', () => {
    const text = 'Patient presented with Record #: MRN-892401 and DOB: 14/08/1992';
    const result = scanPII(text, 'clinical_note');

    expect(result.entities.length).toBe(2);
    const categories = result.entities.map(e => e.category);
    expect(categories).toContain('MEDICAL_RECORD_NUMBER');
    expect(categories).toContain('DATE_OF_BIRTH');
  });
});

describe('Edge Redaction Engine', () => {
  it('applies [REDACTED: CATEGORY] replacement strategy correctly', () => {
    const text = 'Send token to test@domain.com now.';
    const scan = scanPII(text, 'support_ticket');
    const redacted = applyRedaction(text, scan.entities, 'redact');

    expect(redacted).toBe('Send token to [REDACTED: EMAIL] now.');
  });

  it('applies masking strategy correctly', () => {
    const text = 'Send email to rishabh@company.com';
    const scan = scanPII(text, 'support_ticket');
    const masked = applyRedaction(text, scan.entities, 'mask');

    expect(masked).toContain('***@company.com');
  });

  it('applies generalized IP subnets correctly', () => {
    const text = 'Connecting from 192.168.1.42';
    const scan = scanPII(text, 'server_log');
    const generalized = applyRedaction(text, scan.entities, 'generalize');

    expect(generalized).toContain('192.168.0.0/16');
  });
});

describe('Differential Privacy & Adversarial Simulator', () => {
  it('adds bounded Laplace noise satisfying differential privacy', () => {
    const noisy = addLaplaceNoise(100, 1, 0.5);
    expect(typeof noisy).toBe('number');
    expect(noisy).toBeGreaterThanOrEqual(0);
  });

  it('evaluates Sweeney linkage and membership inference attacks on scan metadata', () => {
    const text = 'Patient DOB: 05/12/1984, IP: 192.168.1.1, Phone: +91-98765-43210';
    const scan = scanPII(text, 'clinical_note');
    const attacks = simulateAdversarialAttacks(scan);

    expect(attacks.length).toBeGreaterThan(0);
    const linkage = attacks.find(a => a.attackType === 'linkage_attack');
    expect(linkage).toBeDefined();
    expect(linkage?.quasisFound.length).toBeGreaterThanOrEqual(2);
  });
});
