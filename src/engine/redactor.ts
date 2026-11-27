/**
 * GhostWire Edge Redactor Engine
 * Supports 5 redaction strategies:
 * - Redact ([REDACTED: CATEGORY])
 * - Mask (full or partial asterisks e.g. *******1234)
 * - Tokenize (Deterministic Semantic Tokens e.g. [PAN_01], [PERSON_01])
 * - Generalize (e.g. 192.168.1.42 -> 192.168.0.0/16, age 28 -> [25-30])
 * - Synthetic Noise (Differential Privacy randomized replacement)
 */

import { PIIEntity, RedactionStrategy, PIICategory } from './types';

export function applyRedaction(
  originalText: string,
  entities: PIIEntity[],
  strategy: RedactionStrategy = 'redact',
  salt: string = 'ghostwire_salt_edge'
): string {
  if (!entities.length) return originalText;

  // Work backwards from end of document to start to preserve character index offsets
  const sorted = [...entities].sort((a, b) => b.startIndex - a.startIndex);
  let result = originalText;

  for (const ent of sorted) {
    const replacement = generateReplacement(ent, strategy, salt);
    result =
      result.slice(0, ent.startIndex) +
      replacement +
      result.slice(ent.endIndex);
  }

  return result;
}

function generateReplacement(
  entity: PIIEntity,
  strategy: RedactionStrategy,
  salt: string
): string {
  switch (strategy) {
    case 'redact':
      return `[REDACTED: ${entity.category}]`;

    case 'mask': {
      const val = entity.value;
      if (entity.category === 'CREDIT_CARD' || entity.category === 'AADHAAR') {
        const clean = val.replace(/\D/g, '');
        return `****-****-****-${clean.slice(-4)}`;
      }
      if (entity.category === 'EMAIL') {
        const [user, domain] = val.split('@');
        return `${user.slice(0, 1)}***@${domain}`;
      }
      if (entity.category === 'PHONE') {
        return `******${val.slice(-4)}`;
      }
      return '█'.repeat(Math.min(val.length, 12));
    }

    case 'tokenize': {
      const index = entity.tokenIndex ? String(entity.tokenIndex).padStart(2, '0') : '01';
      return `[${entity.category}_${index}]`;
    }

    case 'generalize': {
      return generalizeValue(entity.value, entity.category);
    }

    case 'synthetic_noise': {
      return generateSyntheticNoise(entity.category);
    }

    default:
      return `[REDACTED]`;
  }
}

function generalizeValue(val: string, category: PIICategory): string {
  if (category === 'IP_ADDRESS') {
    const parts = val.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.0.0/16`;
    }
    return '0.0.0.0/0';
  }
  if (category === 'QUASI_AGE') {
    const match = val.match(/\d{1,3}/);
    if (match) {
      const age = parseInt(match[0], 10);
      const lower = Math.floor(age / 5) * 5;
      return `[Age cohort: ${lower}–${lower + 5}]`;
    }
    return '[Age cohort: Adult]';
  }
  if (category === 'QUASI_PINCODE') {
    return '[Regional Metro Postal Zone]';
  }
  if (category === 'DATE_OF_BIRTH') {
    const match = val.match(/\d{4}/);
    if (match) {
      const year = parseInt(match[0], 10);
      const decade = Math.floor(year / 10) * 10;
      return `[${decade}s DECADE]`;
    }
    return '[APPROX_DECADE]';
  }
  if (category === 'PHONE') {
    return '[LOCAL_CARRIER_RANGE]';
  }
  return `[GENERALIZED_${category}]`;
}

function generateSyntheticNoise(category: PIICategory): string {
  switch (category) {
    case 'EMAIL':
      return `synth_${Math.floor(Math.random() * 9000 + 1000)}@privacy-twin.internal`;
    case 'IP_ADDRESS':
      return `10.254.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254 + 1)}`;
    case 'PHONE':
      return `+91-98${Math.floor(Math.random() * 89999999 + 10000000)}`;
    case 'CREDIT_CARD':
      return `4000-0012-3456-${Math.floor(Math.random() * 9000 + 1000)}`;
    case 'AADHAAR':
      return `9999-0000-${Math.floor(Math.random() * 9000 + 1000)}`;
    case 'PAN':
      return `ABCDE${Math.floor(Math.random() * 8999 + 1000)}F`;
    default:
      return `[SYNTHETIC_${category}_TOKEN]`;
  }
}
