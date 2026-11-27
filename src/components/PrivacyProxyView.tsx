'use client';

import React, { useState } from 'react';
import { Sliders, Zap, Bug, RefreshCw, Database } from 'lucide-react';
import { ScanResult, AdversarialAttackResult } from '@/engine/types';
import { applyDifferentialPrivacy, simulateAdversarialAttacks } from '@/engine/privacyProxy';
import { soundEngine } from '@/lib/soundEngine';

interface PrivacyProxyProps {
  scanResult: ScanResult | null;
}

export function PrivacyProxyView({ scanResult }: PrivacyProxyProps) {
  const [epsilon, setEpsilon] = useState(0.5);
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [syntheticRecords, setSyntheticRecords] = useState<any[]>([]);

  if (!scanResult) {
    return (
      <div className="rounded-3xl border border-dashed border-[#DCDCDC] p-12 text-center bg-white/60">
        <p className="text-sm text-[#6A6A6A] font-sans">
          Run a scan on any document in the Privacy Studio to simulate Differential Privacy and Adversarial Attacks.
        </p>
      </div>
    );
  }

  // Calculate Differential Privacy Noise in real-time
  const dpResult = applyDifferentialPrivacy(scanResult, {
    epsilon,
    mechanism: 'laplace',
    sensitivity: 1,
  });

  // Calculate Adversarial Attacks
  const attacks: AdversarialAttackResult[] = simulateAdversarialAttacks(scanResult);

  const generateSyntheticTwin = async () => {
    soundEngine.playClick();
    setSyntheticLoading(true);

    try {
      const res = await fetch('/api/synthetic-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: scanResult.documentType,
          detectedCategories: scanResult.anonymizedMetadata.detectedCategories,
          recordCount: 3
        })
      });

      const data = await res.json();
      if (data.syntheticRecords) {
        setSyntheticRecords(data.syntheticRecords);
        soundEngine.playScanChime();
      }
    } catch {
      soundEngine.playWarning();
    } finally {
      setSyntheticLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Budget (Epsilon) Slider */}
      <div className="rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-[#627E4A]" />
              <h3 className="text-xl font-serif font-normal text-[#141414]">Differential Privacy Proxy (Laplace Mechanism)</h3>
            </div>
            <p className="mt-1 text-xs text-[#5A5A5A] font-sans max-w-xl leading-relaxed">
              Calibrated noise injected into structural query aggregations. Lower ε (Epsilon) grants stronger mathematical privacy guarantees at the cost of statistical utility.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono text-[#5A5A5A]">Budget (ε):</span>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={epsilon}
              onChange={(e) => {
                setEpsilon(parseFloat(e.target.value));
                soundEngine.playClick();
              }}
              className="w-36 accent-[#627E4A] cursor-pointer"
            />
            <span className="rounded bg-[#627E4A]/10 px-2.5 py-1 text-xs font-mono font-bold text-[#627E4A] border border-[#627E4A]/20">
              ε = {epsilon.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Real-time comparison table */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC]">
              <span className="text-xs font-mono text-[#7A7A7A] uppercase">True Raw Metadata Counts</span>
              <span className="text-xs font-mono text-[#5A5A5A]">Zero-Noise Baseline</span>
            </div>
            <div className="mt-3 space-y-2">
              {Object.entries(scanResult.anonymizedMetadata.countsByCategory)
                .filter(([_, count]) => count > 0)
                .map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="font-mono text-[#4A4A4A]">{cat}</span>
                    <span className="font-mono text-[#141414] font-bold">{count}</span>
                  </div>
                ))}
              <div className="flex justify-between text-xs pt-2 border-t border-[#ECECEC]">
                <span className="font-mono text-[#7A7A7A]">True Risk Score</span>
                <span className="font-mono text-[#141414] font-bold">{scanResult.riskScore}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#627E4A]/20 bg-[#627E4A]/5 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#627E4A]/20">
              <span className="text-xs font-mono text-[#627E4A] uppercase font-semibold">Differentially Private Query Result</span>
              <span className="text-[10px] font-mono text-[#627E4A]">Laplace(0, 1/ε)</span>
            </div>
            <div className="mt-3 space-y-2">
              {Object.entries(dpResult.noisyCategoryCounts)
                .filter(([cat]) => ((scanResult.anonymizedMetadata.countsByCategory as Record<string, number>)[cat] || 0) > 0)
                .map(([cat, noisyCount]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="font-mono text-[#4A4A4A]">{cat}</span>
                    <span className="font-mono text-[#627E4A] font-bold">{noisyCount}</span>
                  </div>
                ))}
              <div className="flex justify-between text-xs pt-2 border-t border-[#627E4A]/20">
                <span className="font-mono text-[#627E4A]">Differentially Private Risk Score</span>
                <span className="font-mono text-[#627E4A] font-bold">{dpResult.noisyRiskScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adversarial Attack Simulator Lab */}
      <div className="rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bug className="h-4 w-4 text-[#9B4A4A]" />
            <h3 className="text-xl font-serif font-normal text-[#141414]">Adversarial Leakage Simulator</h3>
          </div>
          <span className="text-xs font-mono text-[#7A7A7A]">Latanya Sweeney Linkage & Membership Inference</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {attacks.map((attack, idx) => (
            <div key={idx} className="rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#5A5A5A]">{attack.attackType.replace(/_/g, ' ')}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                    attack.vulnerabilityScore > 70
                      ? 'bg-[#9B4A4A]/10 text-[#9B4A4A]'
                      : attack.vulnerabilityScore > 30
                      ? 'bg-[#D97757]/10 text-[#D97757]'
                      : 'bg-[#627E4A]/10 text-[#627E4A]'
                  }`}>
                    Risk: {attack.vulnerabilityScore}%
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#4A4A4A] leading-relaxed font-sans">
                  {attack.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#ECECEC]">
                <span className="text-[10px] font-mono uppercase text-[#7A7A7A]">Mitigation:</span>
                <p className="text-xs text-[#627E4A] mt-0.5 font-medium">{attack.mitigationRecommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Synthetic Privacy-Twin Generation */}
      <div className="rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-[#627E4A]" />
              <h3 className="text-xl font-serif font-normal text-[#141414]">Synthetic Privacy-Twin Test Data Generator</h3>
            </div>
            <p className="mt-1 text-xs text-[#5A5A5A] font-sans">
              Generates fully anonymized synthetic replicas mirroring the exact schema without using any real personal data.
            </p>
          </div>

          <button
            onClick={generateSyntheticTwin}
            disabled={syntheticLoading}
            className="flex items-center space-x-2 rounded-[9px] bg-[#1E1E1E] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#141414] transition-editorial disabled:opacity-50"
          >
            {syntheticLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#A7CBE0]" />
                <span>Generating Twin...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-[#A7CBE0]" />
                <span>Generate Synthetic Twin</span>
              </>
            )}
          </button>
        </div>

        {syntheticRecords.length > 0 && (
          <div className="mt-4 space-y-3">
            {syntheticRecords.map((rec, i) => (
              <div key={i} className="rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-3 text-xs font-mono text-[#2A2A2A]">
                <div className="flex items-center justify-between text-[#7A7A7A] text-[10px] pb-1 border-b border-[#ECECEC] mb-2">
                  <span>Record ID: {rec.id}</span>
                  <span className="text-[#627E4A] font-semibold">100% Synthetic Benchmark</span>
                </div>
                <p className="whitespace-pre-wrap">{rec.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
