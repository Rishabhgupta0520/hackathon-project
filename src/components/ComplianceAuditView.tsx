'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ScanResult } from '@/engine/types';
import { soundEngine } from '@/lib/soundEngine';

interface ComplianceAuditProps {
  scanResult: ScanResult | null;
}

export function ComplianceAuditView({ scanResult }: ComplianceAuditProps) {
  const [loading, setLoading] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!scanResult) return;
    soundEngine.playClick();
    setLoading(true);
    setError(null);

    try {
      // ZERO-KNOWLEDGE ENFORCEMENT: Send ONLY anonymized structural metadata
      const res = await fetch('/api/compliance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: scanResult.documentType,
          riskScore: scanResult.riskScore,
          riskLevel: scanResult.riskLevel,
          detectedCategories: scanResult.anonymizedMetadata.detectedCategories,
          countsByCategory: scanResult.anonymizedMetadata.countsByCategory,
          countsBySeverity: scanResult.anonymizedMetadata.countsBySeverity,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate audit');
      }

      setAuditReport(data.auditReport);
      soundEngine.playScanChime();
    } catch (err: any) {
      setError(err.message || 'Audit request failed');
      soundEngine.playWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded bg-[#E7F0FC] px-2.5 py-0.5 text-xs font-mono font-medium text-[#3B55F0]">
                @google/genai — gemini-2.5-flash
              </span>
              <span className="text-xs font-mono text-[#7A7A7A]">Zero-Knowledge Metadata Protocol</span>
            </div>
            <h2 className="mt-2 text-2xl font-serif font-normal text-[#141414]">
              DPDP Act 2023, GDPR & HIPAA Statutory Compliance Auditor
            </h2>
            <p className="mt-1 text-xs text-[#5A5A5A] font-sans max-w-2xl leading-relaxed">
              Evaluates statutory legal penalties, data fiduciary obligations, and HIPAA de-identification compliance using structured JSON schemas without exposing raw text.
            </p>
          </div>

          <button
            onClick={runAudit}
            disabled={loading || !scanResult}
            className="flex items-center justify-center space-x-2 rounded-[9px] bg-[#1E1E1E] px-5 py-3 text-xs font-semibold text-white hover:bg-[#141414] disabled:opacity-50 transition-editorial shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#A7CBE0]" />
                <span>Auditing Metadata...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-[#A7CBE0]" />
                <span>Execute Gemini Audit</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#9B4A4A]/30 bg-[#9B4A4A]/10 p-3 text-xs text-[#9B4A4A] flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {auditReport ? (
        <div className="space-y-6">
          {/* Statutory Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DPDP Act 2023 */}
            <div className="rounded-3xl border border-[#ECECEC] bg-[#FAFAFA] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#627E4A] font-semibold">India DPDP Act 2023</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                  auditReport.dpdpCompliance.status === 'COMPLIANT'
                    ? 'bg-[#627E4A]/10 text-[#627E4A]'
                    : 'bg-[#9B4A4A]/10 text-[#9B4A4A]'
                }`}>
                  {auditReport.dpdpCompliance.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#7A7A7A]">FINANCIAL PENALTY EXPOSURE</span>
                <p className="text-sm font-bold text-[#141414] mt-0.5">{auditReport.dpdpCompliance.penaltyExposure}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#7A7A7A]">KEY STATUTORY VIOLATIONS</span>
                <ul className="mt-1 space-y-1 text-xs text-[#4A4A4A]">
                  {auditReport.dpdpCompliance.keyViolations.map((v: string, i: number) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-[#627E4A] font-mono">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#ECECEC]">
                <span className="text-[10px] font-mono text-[#7A7A7A]">REQUIRED REMEDIATIONS</span>
                <ul className="mt-1 space-y-1 text-xs text-[#4A4A4A]">
                  {auditReport.dpdpCompliance.requiredRemediations.map((r: string, i: number) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="h-3 w-3 text-[#627E4A] flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* EU GDPR */}
            <div className="rounded-3xl border border-[#ECECEC] bg-[#FAFAFA] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#627E4A] font-semibold">EU GDPR Standard</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                  auditReport.gdprCompliance.status === 'COMPLIANT'
                    ? 'bg-[#627E4A]/10 text-[#627E4A]'
                    : 'bg-[#9B4A4A]/10 text-[#9B4A4A]'
                }`}>
                  {auditReport.gdprCompliance.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#7A7A7A]">ARTICLE BREACHES</span>
                <ul className="mt-1 space-y-1 text-xs text-[#4A4A4A]">
                  {auditReport.gdprCompliance.articleBreaches.length ? (
                    auditReport.gdprCompliance.articleBreaches.map((b: string, i: number) => (
                      <li key={i} className="flex items-start space-x-1.5 text-[#9B4A4A]">
                        <span className="font-mono">⚠</span>
                        <span>{b}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#6A6A6A] text-xs">No formal GDPR article breaches detected.</li>
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#ECECEC]">
                <span className="text-[10px] font-mono text-[#7A7A7A]">TECHNICAL & ORGANISATIONAL MITIGATIONS</span>
                <ul className="mt-1 space-y-1 text-xs text-[#4A4A4A]">
                  {auditReport.gdprCompliance.mitigations.map((m: string, i: number) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="h-3 w-3 text-[#627E4A] flex-shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* US HIPAA */}
            <div className="rounded-3xl border border-[#ECECEC] bg-[#FAFAFA] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#627E4A] font-semibold">HIPAA Safe Harbor</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                  auditReport.hipaaCompliance.status === 'COMPLIANT'
                    ? 'bg-[#627E4A]/10 text-[#627E4A]'
                    : 'bg-[#D97757]/10 text-[#D97757]'
                }`}>
                  {auditReport.hipaaCompliance.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#7A7A7A]">18-ELEMENT SAFE HARBOR VIOLATIONS</span>
                <ul className="mt-1 space-y-1 text-xs text-[#4A4A4A]">
                  {auditReport.hipaaCompliance.safeHarborExceptions.length ? (
                    auditReport.hipaaCompliance.safeHarborExceptions.map((e: string, i: number) => (
                      <li key={i} className="text-[#D97757] text-xs">
                        • {e}
                      </li>
                    ))
                  ) : (
                    <li className="text-[#6A6A6A] text-xs">Zero Safe Harbor de-identification exceptions.</li>
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#ECECEC]">
                <span className="text-[10px] font-mono text-[#7A7A7A]">CLINICAL REMEDIATION</span>
                <p className="mt-1 text-xs text-[#4A4A4A]">{auditReport.hipaaCompliance.remediation}</p>
              </div>
            </div>
          </div>

          {/* DPO Executive Summary & Checklist */}
          <div className="rounded-3xl border border-[#ECECEC] bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#627E4A] font-semibold">
              Data Protection Officer (DPO) Strategic Action Checklist
            </h3>

            <p className="text-xs text-[#3A3A3A] leading-relaxed border-l-2 border-[#627E4A] pl-3 font-sans">
              {auditReport.executiveSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {auditReport.dpoActionChecklist.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2 rounded-2xl border border-[#ECECEC] bg-[#F4F5F5] p-3 text-xs text-[#2A2A2A]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#627E4A] text-[10px] font-mono font-bold text-white flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#DCDCDC] bg-white/70 p-12 text-center text-xs font-mono text-[#6A6A6A]">
          No audit executed for current document. Click <strong className="text-[#627E4A]">Execute Gemini Audit</strong> above to evaluate statutory compliance.
        </div>
      )}
    </div>
  );
}
