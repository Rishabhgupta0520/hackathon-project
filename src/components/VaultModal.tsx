'use client';

import React, { useState } from 'react';
import { Lock, Copy, Check, ShieldCheck } from 'lucide-react';
import { encryptZeroKnowledge } from '@/lib/cryptoVault';
import { soundEngine } from '@/lib/soundEngine';

interface VaultModalProps {
  redactedText: string;
  documentType: string;
  onClose: () => void;
}

export function VaultModal({ redactedText, documentType, onClose }: VaultModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [encrypting, setEncrypting] = useState(false);
  const [vaultShareUrl, setVaultShareUrl] = useState<string | null>(null);
  const [usedKey, setUsedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEncryptAndStore = async () => {
    soundEngine.playClick();
    setEncrypting(true);

    try {
      // 1. Encrypt client-side using Web Crypto AES-GCM
      const { payload, keyUsed } = await encryptZeroKnowledge(redactedText, passphrase.trim() || undefined);

      const vaultId = `vlt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 2. Post ONLY ciphertext, IV, and salt to the backend
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vaultId,
          ciphertextBase64: payload.ciphertextBase64,
          ivBase64: payload.ivBase64,
          saltBase64: payload.saltBase64,
          iterations: payload.iterations,
          expiresInHours: 48,
          documentType,
          title: `Encrypted Document (${documentType})`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to store vault item');

      setUsedKey(keyUsed);
      const fullUrl = `${window.location.origin}/share/${vaultId}#key=${encodeURIComponent(keyUsed)}`;
      setVaultShareUrl(fullUrl);
      soundEngine.playLock();
    } catch (err) {
      console.error(err);
      soundEngine.playWarning();
    } finally {
      setEncrypting(false);
    }
  };

  const copyUrl = () => {
    if (vaultShareUrl) {
      navigator.clipboard.writeText(vaultShareUrl);
      setCopied(true);
      soundEngine.playClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ECECEC] bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ECECEC] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#627E4A]/10 text-[#627E4A]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-semibold text-[#141414]">Zero-Knowledge Encrypted Share Vault</h3>
              <p className="text-[11px] font-mono text-[#7A7A7A]">Client-Side AES-256-GCM Encryption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#141414] text-xs font-mono"
          >
            ESC / CLOSE
          </button>
        </div>

        {!vaultShareUrl ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-[#4A4A4A] leading-relaxed">
              Encrypt your sanitized document client-side before storing. The secret decryption key is appended to the URL fragment (<code className="text-[#627E4A] font-mono">#key=...</code>) and is <strong>never transmitted to any server</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-[#2A2A2A] mb-1.5 font-sans">
                Custom Passphrase (Optional — Leave blank to auto-generate 256-bit key):
              </label>
              <input
                type="password"
                placeholder="Enter custom passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full rounded-[9px] border border-[#ECECEC] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#141414] placeholder-[#A0A0A0] focus:border-[#627E4A] focus:outline-none focus:ring-1 focus:ring-[#627E4A]"
              />
            </div>

            <button
              onClick={handleEncryptAndStore}
              disabled={encrypting}
              className="w-full flex items-center justify-center space-x-2 rounded-[9px] bg-[#1E1E1E] py-3 text-xs font-semibold text-white hover:bg-[#141414] transition-editorial disabled:opacity-50"
            >
              <Lock className="h-4 w-4 text-[#A7CBE0]" />
              <span>{encrypting ? 'Encrypting & Sealing...' : 'Encrypt & Generate Share Link'}</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center space-x-2 text-[#627E4A] text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Encrypted Document Stored Successfully</span>
            </div>

            <p className="text-xs text-[#5A5A5A] leading-relaxed">
              Anyone with this share link can decrypt the document client-side in their browser using the URL fragment key.
            </p>

            <div className="flex items-center space-x-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] p-2">
              <input
                type="text"
                readOnly
                value={vaultShareUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-[#141414] focus:outline-none"
              />
              <button
                onClick={copyUrl}
                className="flex items-center space-x-1.5 rounded-[7px] bg-[#1E1E1E] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#141414] transition-editorial"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#A7CBE0]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="rounded-xl border border-[#ECECEC] bg-[#F4F5F5] p-3 text-[11px] font-mono text-[#5A5A5A]">
              <span className="text-[#7A7A7A]">Decryption Key (in hash fragment):</span>
              <p className="text-[#627E4A] break-all font-mono mt-0.5 font-bold">{usedKey}</p>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-[9px] border border-[#ECECEC] bg-white py-2 text-xs font-medium text-[#4A4A4A] hover:text-[#141414] transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
