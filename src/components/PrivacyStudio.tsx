'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Lock,
  Download,
  FileText,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  Bot,
  Eye,
  EyeOff,
  Files,
  Sliders,
  Bug,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SamplePreset } from '@/engine/presets';
import { DocumentType, RedactionStrategy, ScanResult, PIIEntity } from '@/engine/types';
import { scannerWorker } from '@/lib/workerClient';
import { applyRedaction } from '@/engine/redactor';
import { exportCompliancePDF, exportAuditXLSX } from '@/lib/exportUtils';
import { soundEngine } from '@/lib/soundEngine';
import { VaultModal } from '@/components/VaultModal';
import { ComplianceAuditView } from '@/components/ComplianceAuditView';
import { PrivacyProxyView } from '@/components/PrivacyProxyView';
import { simulateLinkageAttack, LinkageSimulationResult } from '@/engine/linkageSimulator';

interface PrivacyStudioProps {
  initialPreset?: string;
  isDashboardPage?: boolean;
}

export function PrivacyStudio({ initialPreset, isDashboardPage = false }: PrivacyStudioProps) {
  const [activeTab, setActiveTab] = useState<'firewall' | 'privacy_proxy' | 'compliance_audit' | 'vault'>('firewall');
  const [documentType, setDocumentType] = useState<DocumentType>('server_log');
  const [textInput, setTextInput] = useState(SAMPLE_DOCUMENTS[0].content);
  const [redactedText, setRedactedText] = useState('');
  const [strategy, setStrategy] = useState<RedactionStrategy>('tokenize');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<PIIEntity | null>(null);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showLlmSandbox, setShowLlmSandbox] = useState(false);
  const [previewOriginal, setPreviewOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [batchFiles, setBatchFiles] = useState<{ name: string; size: number }[]>([]);
  const [simulateAttackActive, setSimulateAttackActive] = useState(false);
  const [linkageResult, setLinkageResult] = useState<LinkageSimulationResult | null>(null);

  // Initial Scan
  useEffect(() => {
    const selected = initialPreset
      ? SAMPLE_DOCUMENTS.find(p => p.type === initialPreset) || SAMPLE_DOCUMENTS[0]
      : SAMPLE_DOCUMENTS[0];

    setDocumentType(selected.type);
    setTextInput(selected.content);
    handleScan(selected.content, selected.type);
    fetchAuditLedger();
  }, [initialPreset]);

  // Keyboard shortcut: Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleScan(textInput, documentType);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [textInput, documentType]);

  const fetchAuditLedger = async () => {
    try {
      const res = await fetch('/api/audit-history?limit=5');
      const data = await res.json();
      if (data.logs) {
        setRecentAudits(data.logs);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  const handleScan = async (text: string, docType: DocumentType) => {
    soundEngine.playClick();
    setScanning(true);
    try {
      const res = await scannerWorker.scan(text, docType);
      setScanResult(res);

      const redacted = applyRedaction(text, res.entities, strategy);
      setRedactedText(redacted);

      // Calculate linkage simulation
      const lSim = simulateLinkageAttack(res, strategy !== 'redact' && strategy !== 'tokenize');
      setLinkageResult(lSim);

      if (res.riskScore >= 75) {
        soundEngine.playWarning();
      } else {
        soundEngine.playScanChime();
      }

      // Log strictly anonymized metadata to backend
      fetch('/api/audit-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: res.scanId,
          documentType: res.documentType,
          entitiesCount: res.entities.length,
          riskScore: res.riskScore,
          riskLevel: res.riskLevel,
          categories: res.anonymizedMetadata.countsByCategory,
          strategyUsed: strategy,
          anonymizedSummary: `Detected ${res.entities.length} PII tokens across ${res.anonymizedMetadata.detectedCategories.length} categories.`
        })
      }).then(() => fetchAuditLedger()).catch(() => {});

    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleStrategyChange = (newStrategy: RedactionStrategy) => {
    soundEngine.playClick();
    setStrategy(newStrategy);
    if (scanResult) {
      const updated = applyRedaction(textInput, scanResult.entities, newStrategy);
      setRedactedText(updated);
      setLinkageResult(simulateLinkageAttack(scanResult, newStrategy === 'generalize' || newStrategy === 'synthetic_noise'));
    }
  };

  const loadPreset = (preset: SamplePreset) => {
    soundEngine.playClick();
    setDocumentType(preset.type);
    setTextInput(preset.content);
    setPreviewOriginal(false);
    handleScan(preset.content, preset.type);
  };

  const handleBatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundEngine.playClick();
    const fileList: { name: string; size: number }[] = [];
    let combinedContent = '';

    Array.from(files).forEach((file, idx) => {
      fileList.push({ name: file.name, size: file.size });
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        combinedContent += `\n/* ── File [${idx + 1}/${files.length}]: ${file.name} ── */\n` + text;
        if (idx === files.length - 1) {
          setTextInput(combinedContent.trim());
          setBatchFiles(fileList);
          handleScan(combinedContent.trim(), documentType);
        }
      };
      reader.readAsText(file);
    });
  };

  const copyRedacted = () => {
    navigator.clipboard.writeText(previewOriginal ? textInput : redactedText);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const exportMarkdown = () => {
    const md = `# GhostWire Privacy Audit Certification\n\n**Document Type:** ${documentType}\n**Risk Score:** ${scanResult?.riskScore}/100 (${scanResult?.riskLevel})\n**Sanitization Strategy:** ${strategy}\n\n## Sanitized Output\n\`\`\`\n${redactedText}\n\`\`\`\n\n*Generated locally via GhostWire Zero-Knowledge Engine.*`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghostwire_sanitized_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="privacy-studio" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 scroll-mt-24">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ECECEC]">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-[#E7F0FC] px-3 py-0.5 text-xs font-mono text-[#3B55F0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B55F0]" />
            <span>Interactive Zero-Knowledge Privacy Studio</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#141414] mt-2 font-normal">
            Client-Side Firewall & Sanitization Workbench
          </h2>
          <p className="text-xs text-[#5A5A5A] mt-1 font-sans max-w-xl">
            Inspect raw streams, execute multi-threaded WebWorker redactions, simulate adversarial hacker linkage attacks, and certify statutory compliance.
          </p>
        </div>

        {/* Tab Mode Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#F4F5F5] p-1.5 rounded-2xl border border-[#ECECEC]">
          {[
            { id: 'firewall', label: 'Firewall & Redactor', icon: Shield },
            { id: 'privacy_proxy', label: 'DP & Attack Lab', icon: Bug },
            { id: 'compliance_audit', label: 'GenAI Audit', icon: BookOpen },
            { id: 'vault', label: 'ZK Vault', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-editorial ${
                  isActive
                    ? 'bg-white text-[#141414] shadow-sm font-semibold'
                    : 'text-[#6A6A6A] hover:text-[#141414]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#627E4A]' : 'text-[#8A8A8A]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Routing */}
      {activeTab === 'compliance_audit' && (
        <ComplianceAuditView scanResult={scanResult} />
      )}

      {activeTab === 'privacy_proxy' && (
        <PrivacyProxyView scanResult={scanResult} />
      )}

      {activeTab === 'vault' && (
        <div className="rounded-3xl border border-[#ECECEC] bg-white p-10 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-[#627E4A]/10 text-[#627E4A] flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-serif font-normal text-[#141414]">Client-Side Zero-Knowledge Encrypted Vault</h3>
          <p className="text-xs text-[#5A5A5A] max-w-md mx-auto leading-relaxed">
            Seal your redacted document with client-side Web Crypto AES-256-GCM. The decryption key is appended to the URL fragment (<code className="text-[#627E4A] font-mono">#key=...</code>) and is never transmitted to the server.
          </p>
          <button
            onClick={() => setShowVaultModal(true)}
            className="inline-flex items-center space-x-2 rounded-[9px] bg-[#1E1E1E] text-white px-6 py-3 text-xs font-semibold hover:bg-[#141414] transition-editorial shadow-sm"
          >
            <Lock className="h-4 w-4 text-[#A7CBE0]" />
            <span>Launch Encryption Vault</span>
          </button>
        </div>
      )}

      {/* Primary Firewall Tab */}
      {activeTab === 'firewall' && (
        <div className="space-y-6">

          {/* Safe LLM Prompt Sandbox Toggle Drawer */}
          {showLlmSandbox && (
            <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECECEC]">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-[#627E4A]" />
                  <h4 className="text-sm font-serif font-semibold text-[#141414]">LLM Pipeline Privacy Proxy Sandbox</h4>
                </div>
                <span className="text-[10px] font-mono text-[#627E4A] bg-[#627E4A]/10 px-2 py-0.5 rounded">
                  Zero Raw PII Exfiltration to OpenAI / Anthropic / Gemini
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#9B4A4A]/20 bg-[#9B4A4A]/5 p-4 text-xs font-mono">
                  <span className="text-[10px] text-[#9B4A4A] font-bold uppercase tracking-wider">
                    ❌ Unprotected Direct Prompt (Data Breach)
                  </span>
                  <p className="mt-2 text-[#4A4A4A] whitespace-pre-wrap max-h-36 overflow-auto">
                    {`Prompt: "Summarize this incident:"\n\n${textInput.slice(0, 320)}...`}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#627E4A]/20 bg-[#627E4A]/5 p-4 text-xs font-mono">
                  <span className="text-[10px] text-[#627E4A] font-bold uppercase tracking-wider">
                    ✅ GhostWire Sanitized Prompt (Safe & Compliant)
                  </span>
                  <p className="mt-2 text-[#141414] whitespace-pre-wrap max-h-36 overflow-auto">
                    {`Prompt: "Summarize this incident:"\n\n${redactedText.slice(0, 320)}...`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dual Bento Workbench Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Columns: Preset Selector & Dual-Pane Text Editor */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Presets & Multi-File Batch Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F4F5F5] p-3 rounded-2xl border border-[#ECECEC]">
                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  {SAMPLE_DOCUMENTS.map((preset) => {
                    const isSelected = documentType === preset.type;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => loadPreset(preset)}
                        className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-editorial ${
                          isSelected
                            ? 'bg-white text-[#141414] shadow-sm font-semibold border border-[#ECECEC]'
                            : 'text-[#6A6A6A] hover:text-[#141414]'
                        }`}
                      >
                        <FileText className="h-3 w-3 text-[#627E4A]" />
                        <span>{preset.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Multi-File Upload */}
                <label className="flex items-center space-x-1.5 rounded-[9px] border border-[#ECECEC] bg-white px-3 py-1.5 text-xs font-sans text-[#4A4A4A] hover:text-[#141414] hover:border-[#627E4A]/40 cursor-pointer transition-editorial shadow-sm">
                  <UploadCloud className="h-3.5 w-3.5 text-[#627E4A]" />
                  <span>Batch Upload</span>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.log,.json,.csv,.md"
                    onChange={handleBatchFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {batchFiles.length > 0 && (
                <div className="flex items-center space-x-2 rounded-xl border border-[#627E4A]/20 bg-[#627E4A]/5 p-2.5 text-xs font-mono text-[#627E4A]">
                  <Files className="h-4 w-4" />
                  <span>Loaded {batchFiles.length} batch documents ({batchFiles.map(f => f.name).join(', ')})</span>
                </div>
              )}

              {/* Raw Input Stream Pane */}
              <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#ECECEC] pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase text-[#6A6A6A]">Input Stream</span>
                    <span className="text-[10px] font-mono text-[#8A8A8A]">({documentType})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7A7A7A]">Cmd/Ctrl + Enter to Scan</span>
                </div>

                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste logs, resumes, clinical notes, or tickets..."
                  rows={8}
                  className="w-full resize-none rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-3.5 text-xs font-mono text-[#141414] placeholder-[#A0A0A0] focus:border-[#627E4A] focus:outline-none focus:ring-1 focus:ring-[#627E4A] leading-relaxed transition-colors"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#7A7A7A]">
                    {textInput.length} chars | {textInput.split('\n').length} lines
                  </span>

                  <button
                    onClick={() => handleScan(textInput, documentType)}
                    disabled={scanning}
                    className="flex items-center space-x-2 rounded-[9px] bg-[#1E1E1E] text-white px-4 py-2 text-xs font-semibold hover:bg-[#141414] disabled:opacity-50 transition-editorial shadow-sm"
                  >
                    {scanning ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#A7CBE0]" />
                        <span>Scanning (&lt;1.8ms)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 text-[#A7CBE0] fill-current" />
                        <span>Run Edge Scan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Redacted Output Pane with 3 Sanitization Modes */}
              <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECECEC] pb-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-3.5 w-3.5 text-[#627E4A]" />
                    <span className="text-xs font-mono text-[#141414] font-semibold uppercase">
                      Sanitized Output Stream
                    </span>
                  </div>

                  {/* Strategy Switcher */}
                  <div className="flex items-center space-x-1 rounded-xl bg-[#F4F5F5] p-1 border border-[#ECECEC]">
                    {(['tokenize', 'redact', 'mask', 'generalize', 'synthetic_noise'] as RedactionStrategy[]).map((strat) => (
                      <button
                        key={strat}
                        onClick={() => handleStrategyChange(strat)}
                        className={`rounded-[7px] px-2.5 py-1 text-[10px] font-mono uppercase transition-editorial ${
                          strategy === strat
                            ? 'bg-[#1E1E1E] text-white font-semibold shadow-sm'
                            : 'text-[#6A6A6A] hover:text-[#141414]'
                        }`}
                      >
                        {strat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {/* Output Action Pill Bar */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECECEC]">
                    <span className="text-[10px] font-mono text-[#7A7A7A]">
                      {previewOriginal ? '⚠️ Unmasked In-Memory Preview' : `Active Mode: ${strategy.toUpperCase()}`}
                    </span>
                    <div className="flex items-center space-x-2">
                      {/* Ephemeral "Preview Original" toggle */}
                      <button
                        onClick={() => setPreviewOriginal(!previewOriginal)}
                        title="Preview Unmasked Original in memory"
                        className={`flex items-center space-x-1 rounded-[7px] border px-2.5 py-1 text-[10px] font-mono transition-editorial shadow-sm ${
                          previewOriginal
                            ? 'border-[#D97757] bg-[#D97757]/15 text-[#D97757] font-bold'
                            : 'border-[#ECECEC] bg-white text-[#4A4A4A] hover:text-[#141414]'
                        }`}
                      >
                        {previewOriginal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3 text-[#627E4A]" />}
                        <span>{previewOriginal ? 'Masked' : 'Preview Original'}</span>
                      </button>

                      <button
                        onClick={copyRedacted}
                        className="flex items-center space-x-1 rounded-[7px] border border-[#ECECEC] bg-white px-2.5 py-1 text-[10px] font-mono text-[#4A4A4A] hover:text-[#141414] transition-editorial shadow-sm"
                      >
                        {copied ? <Check className="h-3 w-3 text-[#627E4A]" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => setShowVaultModal(true)}
                        className="flex items-center space-x-1 rounded-[7px] bg-[#627E4A] text-white px-2.5 py-1 text-[10px] font-mono hover:bg-[#526a3c] transition-editorial shadow-sm"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Seal Vault</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    readOnly
                    value={previewOriginal ? textInput : redactedText}
                    rows={8}
                    className="w-full resize-none rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-3.5 text-xs font-mono text-[#141414] leading-relaxed focus:outline-none"
                  />
                </div>

                {/* Export Options Toolbar */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#ECECEC] text-xs">
                  <button
                    onClick={() => setShowLlmSandbox(!showLlmSandbox)}
                    className={`flex items-center space-x-1.5 rounded-[7px] border px-2.5 py-1 text-[11px] font-mono transition-editorial ${
                      showLlmSandbox
                        ? 'border-[#627E4A] bg-[#627E4A]/10 text-[#627E4A] font-bold'
                        : 'border-[#ECECEC] bg-[#F4F5F5] text-[#5A5A5A] hover:text-[#141414]'
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5 text-[#627E4A]" />
                    <span>Safe LLM Sandbox</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={exportMarkdown}
                      className="flex items-center space-x-1 rounded-[7px] border border-[#ECECEC] bg-white px-2.5 py-1 text-[11px] font-mono text-[#4A4A4A] hover:text-[#141414] transition-colors"
                    >
                      <Download className="h-3 w-3 text-[#627E4A]" />
                      <span>Markdown</span>
                    </button>
                    <button
                      onClick={() => exportCompliancePDF(scanResult!)}
                      disabled={!scanResult}
                      className="flex items-center space-x-1 rounded-[7px] border border-[#ECECEC] bg-white px-2.5 py-1 text-[11px] font-mono text-[#4A4A4A] hover:text-[#141414] transition-colors disabled:opacity-40"
                    >
                      <Download className="h-3 w-3 text-[#627E4A]" />
                      <span>PDF Cert</span>
                    </button>
                    <button
                      onClick={() => exportAuditXLSX(scanResult!)}
                      disabled={!scanResult}
                      className="flex items-center space-x-1 rounded-[7px] border border-[#ECECEC] bg-white px-2.5 py-1 text-[11px] font-mono text-[#4A4A4A] hover:text-[#141414] transition-colors disabled:opacity-40"
                    >
                      <FileSpreadsheet className="h-3 w-3 text-[#627E4A]" />
                      <span>XLSX</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Threat Gauge, Adversarial Linkage Simulator & Entity Register */}
            <div className="lg:col-span-5 space-y-4">

              {/* Threat Gauge Bento Card */}
              <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6A6A6A]">
                    Real-Time Threat Exposure Index
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                    scanResult?.riskLevel === 'CRITICAL'
                      ? 'bg-[#9B4A4A]/10 text-[#9B4A4A]'
                      : scanResult?.riskLevel === 'HIGH'
                      ? 'bg-[#D97757]/10 text-[#D97757]'
                      : 'bg-[#627E4A]/10 text-[#627E4A]'
                  }`}>
                    {scanResult?.riskLevel || 'CLEAN'}
                  </span>
                </div>

                <div className="flex items-baseline space-x-3 pt-1">
                  <span className="text-4xl font-serif text-[#141414] font-normal">
                    {scanResult?.riskScore ?? 0}
                  </span>
                  <span className="text-xs font-mono text-[#8A8A8A]">/ 100 EXPOSURE RATING</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-[#F4F5F5] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (scanResult?.riskScore || 0) > 60
                        ? 'bg-[#9B4A4A]'
                        : (scanResult?.riskScore || 0) > 30
                        ? 'bg-[#D97757]'
                        : 'bg-[#627E4A]'
                    }`}
                    style={{ width: `${scanResult?.riskScore || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#ECECEC] text-center">
                  <div>
                    <span className="text-[10px] font-mono text-[#7A7A7A]">EDGE LATENCY</span>
                    <p className="text-xs font-mono text-[#627E4A] font-bold mt-0.5">
                      {scanResult?.executionTimeMs ?? 0} ms
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#7A7A7A]">TOKENS MASKED</span>
                    <p className="text-xs font-mono text-[#141414] font-bold mt-0.5">
                      {scanResult?.entities.length ?? 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#7A7A7A]">CRITICAL LEAKS</span>
                    <p className="text-xs font-mono text-[#9B4A4A] font-bold mt-0.5">
                      {scanResult?.anonymizedMetadata.countsBySeverity.CRITICAL ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adversarial Hacker Linkage Attack Simulator Card */}
              <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                  <div className="flex items-center space-x-2">
                    <Bug className="h-4 w-4 text-[#9B4A4A]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-[#141414] font-semibold">
                      Adversarial Linkage Simulator
                    </span>
                  </div>
                  <button
                    onClick={() => setSimulateAttackActive(!simulateAttackActive)}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                      simulateAttackActive
                        ? 'bg-[#9B4A4A] text-white'
                        : 'bg-[#F4F5F5] text-[#5A5A5A] hover:text-[#141414]'
                    }`}
                  >
                    {simulateAttackActive ? 'Simulating...' : 'Simulate Attack'}
                  </button>
                </div>

                {linkageResult && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-[#FAFAFA] p-3 rounded-2xl border border-[#ECECEC]">
                      <span className="text-[#5A5A5A]">Re-Identification Risk:</span>
                      <div className="flex items-center space-x-2 font-mono font-bold">
                        <span className={simulateAttackActive ? 'text-[#9B4A4A]' : 'text-[#D97757]'}>
                          {linkageResult.vulnerabilityScore}% Vulnerability
                        </span>
                        <span className="text-[#8A8A8A]">→</span>
                        <span className="text-[#627E4A]">
                          &lt;{linkageResult.mitigatedScore}% Mitigated
                        </span>
                      </div>
                    </div>

                    {/* Attacker deduction chain */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#7A7A7A]">Attacker Deduction Chain:</span>
                      {linkageResult.deductionChain.map((chain, i) => (
                        <div key={i} className="flex items-start space-x-2 text-[11px] text-[#4A4A4A] bg-[#F4F5F5] p-2 rounded-xl">
                          <span className="text-[#D97757] font-bold font-mono">#{i + 1}</span>
                          <span>{chain}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detected PII Entities Register */}
              <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6A6A6A]">
                    Discovered Entities ({scanResult?.entities.length || 0})
                  </span>
                  <span className="text-[10px] font-mono text-[#627E4A]">Deterministic Pass</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {scanResult?.entities.length ? (
                    scanResult.entities.map((entity) => (
                      <div
                        key={entity.id}
                        onClick={() => setSelectedEntity(entity)}
                        className={`flex items-center justify-between rounded-2xl border p-2.5 transition-editorial cursor-pointer ${
                          selectedEntity?.id === entity.id
                            ? 'border-[#627E4A] bg-[#627E4A]/10 shadow-sm'
                            : 'border-[#ECECEC] bg-[#FAFAFA] hover:border-[#D0D0D0]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`h-2 w-2 rounded-full ${
                            entity.severity === 'CRITICAL' ? 'bg-[#9B4A4A]' : entity.severity === 'QUASI' ? 'bg-[#D97757]' : 'bg-[#627E4A]'
                          }`} />
                          <div>
                            <span className="text-xs font-mono font-bold text-[#141414]">{entity.category}</span>
                            <p className="text-[10px] font-mono text-[#6A6A6A]">
                              {entity.maskedPreview}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#627E4A] font-bold">
                            {Math.round(entity.confidence * 100)}%
                          </span>
                          <p className="text-[9px] font-mono text-[#8A8A8A]">
                            Ln {entity.line}, Col {entity.column}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs font-mono text-[#8A8A8A]">
                      Zero PII entities discovered. Document is clean.
                    </div>
                  )}
                </div>

                {/* Selected Entity Inspector */}
                {selectedEntity && (
                  <div className="rounded-2xl border border-[#627E4A]/30 bg-[#627E4A]/5 p-3 text-xs font-mono space-y-1">
                    <div className="flex justify-between text-[#627E4A] font-bold">
                      <span>{selectedEntity.category}</span>
                      <span>{selectedEntity.severity}</span>
                    </div>
                    <p className="text-[#4A4A4A] text-[11px]">Rule: {selectedEntity.ruleMatched} | Confidence: {Math.round(selectedEntity.confidence * 100)}%</p>
                    <p className="text-[#7A7A7A] text-[10px]">Span: {selectedEntity.startIndex}..{selectedEntity.endIndex} (Line {selectedEntity.line}, Col {selectedEntity.column})</p>
                  </div>
                )}
              </div>

              {/* SQLite Audit Ledger Stream */}
              <div className="rounded-3xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6A6A6A]">
                    SQLite Zero-Knowledge Ledger
                  </span>
                  <span className="text-[10px] font-mono text-[#627E4A]">WAL Mode Active</span>
                </div>

                <div className="space-y-2">
                  {recentAudits.slice(0, 3).map((audit) => (
                    <div key={audit.id} className="rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-2.5 text-[11px] font-mono">
                      <div className="flex justify-between text-[#4A4A4A]">
                        <span className="text-[#141414] font-bold">{audit.document_type}</span>
                        <span className="text-[#627E4A]">Score: {audit.risk_score}/100</span>
                      </div>
                      <p className="text-[10px] text-[#6A6A6A] mt-1 truncate">
                        {audit.anonymized_summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Vault Modal */}
      {showVaultModal && (
        <VaultModal
          redactedText={redactedText}
          documentType={documentType}
          onClose={() => setShowVaultModal(false)}
        />
      )}
    </section>
  );
}
