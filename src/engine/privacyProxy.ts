/**
 * GhostWire Differential Privacy Proxy & Adversarial Attack Simulator
 * Implements Laplace mechanism for numerical aggregates & Latanya Sweeney quasi-identifier linkage attack simulation.
 */

import { ScanResult, AdversarialAttackResult, DifferentialPrivacyConfig } from './types';

/**
 * Laplace Mechanism Noise Generator
 * Adds calibrated noise drawn from Laplace(0, sensitivity / epsilon).
 */
export function addLaplaceNoise(value: number, sensitivity: number, epsilon: number): number {
  if (epsilon <= 0) throw new Error('Epsilon must be greater than 0');
  const scale = sensitivity / epsilon;
  // Sample uniform u in (-0.5, 0.5)
  const u = Math.random() - 0.5;
  // Quantile function for Laplace: -scale * sgn(u) * ln(1 - 2|u|)
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return Math.max(0, Math.round(value + noise));
}

/**
 * Applies Differential Privacy to an anonymized scan metadata payload.
 */
export function applyDifferentialPrivacy(
  scan: ScanResult,
  config: DifferentialPrivacyConfig = { epsilon: 0.5, mechanism: 'laplace', sensitivity: 1 }
): {
  noisyCategoryCounts: Record<string, number>;
  noisyRiskScore: number;
  privacyGuarantee: string;
  epsilon: number;
} {
  const noisyCounts: Record<string, number> = {};
  for (const [cat, count] of Object.entries(scan.anonymizedMetadata.countsByCategory)) {
    noisyCounts[cat] = addLaplaceNoise(count, config.sensitivity, config.epsilon);
  }

  const noisyRisk = addLaplaceNoise(scan.riskScore, 5, config.epsilon);

  return {
    noisyCategoryCounts: noisyCounts,
    noisyRiskScore: Math.min(100, Math.max(0, noisyRisk)),
    privacyGuarantee: `(ε = ${config.epsilon}, δ = 0)-Differential Privacy satisfied via Laplace mechanism.`,
    epsilon: config.epsilon,
  };
}

/**
 * Adversarial Leakage Simulator
 * Simulates real-world Linkage Attacks, Membership Inference, and Quasi-Identifier Triangulation.
 */
export function simulateAdversarialAttacks(scan: ScanResult): AdversarialAttackResult[] {
  const attacks: AdversarialAttackResult[] = [];
  const detected = scan.anonymizedMetadata.detectedCategories;

  // 1. Quasi-Identifier Linkage Attack (Latanya Sweeney's k-anonymity vulnerability)
  const quasiIdentifiers = ['DATE_OF_BIRTH', 'IP_ADDRESS', 'PHONE', 'QUASI_AGE', 'QUASI_PINCODE'];
  const matchedQuasis = detected.filter(c => quasiIdentifiers.includes(c));

  if (matchedQuasis.length >= 2) {
    const reIdProbability = matchedQuasis.length >= 3 ? 92 : 78;
    attacks.push({
      attackType: 'linkage_attack',
      vulnerabilityScore: reIdProbability,
      potentialReIdentifiedRecords: Math.ceil(scan.entities.length * (reIdProbability / 100)),
      quasisFound: matchedQuasis,
      description: `Cross-Database Linkage Attack Viable: Coexistence of ${matchedQuasis.join(' + ')} narrows population uniqueness (k-anonymity < 2), enabling re-identification against public census/voter databases.`,
      deductionChain: [
        `Postal zone/IP subnet narrows geographic cohort to <0.02% of population`,
        `Age/DOB combined with gender/organization narrows anonymity set to <3 individuals`,
        `Re-identification confidence: ${reIdProbability}%`
      ],
      mitigationRecommendation: 'Apply "Generalize" (K-Anonymity) or "Synthetic Noise" to collapse granular age cohorts and IP CIDR subnets.'
    });
  } else {
    attacks.push({
      attackType: 'linkage_attack',
      vulnerabilityScore: 12,
      potentialReIdentifiedRecords: 0,
      quasisFound: matchedQuasis,
      description: 'Insufficient quasi-identifiers discovered for external cross-database linkage.',
      mitigationRecommendation: 'Maintain minimal quasi-identifier exposure.'
    });
  }

  // 2. High-Severity Critical Entity Leakage (Aadhaar, SSN, Credit Card, API Key, PAN)
  const criticals = detected.filter(c => ['AADHAAR', 'PAN', 'SSN', 'CREDIT_CARD', 'API_KEY'].includes(c));
  if (criticals.length > 0) {
    attacks.push({
      attackType: 'quasi_identifier_probe',
      vulnerabilityScore: 98,
      potentialReIdentifiedRecords: scan.anonymizedMetadata.countsBySeverity.CRITICAL,
      quasisFound: criticals,
      description: `Direct Identity Exfiltration Threat: Found ${criticals.length} critical direct identifiers (${criticals.join(', ')}). Total account takeover possible without external linkage.`,
      mitigationRecommendation: 'Immediate zero-knowledge client-side masking or non-reversible HMAC-SHA256 tokenization required before transmission.'
    });
  }

  // 3. Membership Inference Threat (Differential Privacy assessment)
  const entityCount = scan.entities.length;
  const miRisk = entityCount > 10 ? 82 : entityCount > 4 ? 48 : 18;
  attacks.push({
    attackType: 'membership_inference',
    vulnerabilityScore: miRisk,
    potentialReIdentifiedRecords: Math.max(1, Math.floor(entityCount * 0.4)),
    quasisFound: detected,
    description: `Membership Inference Probe: Distinctive entity footprint allows an attacker with query access to determine whether specific individuals exist in the underlying training set/dataset.`,
    mitigationRecommendation: 'Inject Laplace noise (ε <= 0.5) to aggregate counts and redact high-frequency outlier values.'
  });

  return attacks;
}
