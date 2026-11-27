'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Lock, Unlock, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { decryptZeroKnowledge, EncryptedVaultPayload } from '@/lib/cryptoVault';

function ShareVaultContent() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [vaultData, setVaultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchVault() {
      try {
        const res = await fetch(`/api/vault?id=${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load vault item');

        setVaultData(data.vault);

        // Check if key is in URL hash (#key=...)
        const hash = window.location.hash;
        if (hash.includes('key=')) {
          const key = decodeURIComponent(hash.split('key=')[1]);
          attemptDecrypt(data.vault, key);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching vault');
      } finally {
        setLoading(false);
      }
    }

    fetchVault();
  }, [id]);

  const attemptDecrypt = async (vault: any, key: string) => {
    setDecrypting(true);
    setError(null);
    try {
      const payload: EncryptedVaultPayload = {
        ciphertextBase64: vault.ciphertextBase64,
        ivBase64: vault.ivBase64,
        saltBase64: vault.saltBase64,
        iterations: vault.iterations,
        tagLength: 128
      };

      const plain = await decryptZeroKnowledge(payload, key);
      setDecryptedText(plain);
    } catch {
      setError('Decryption failed: Incorrect passphrase or corrupted payload.');
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-[#ECECEC] bg-white p-8 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#ECECEC] pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#627E4A]/10 text-[#627E4A]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-normal text-[#141414]">GhostWire Encrypted Document Vault</h1>
            <p className="text-xs font-mono text-[#7A7A7A]">Zero-Knowledge Client-Side Decryption</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center space-x-1.5 rounded-[8px] border border-[#ECECEC] bg-[#F4F5F5] px-3 py-1.5 text-xs text-[#4A4A4A] hover:text-[#141414] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to App</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#7A7A7A]">
          Fetching encrypted payload from vault...
        </div>
      ) : error && !decryptedText ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#9B4A4A]/30 bg-[#9B4A4A]/10 p-4 text-xs text-[#9B4A4A] flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>

          <div className="rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-4 space-y-3">
            <p className="text-xs text-[#4A4A4A]">
              No valid decryption key was detected in the URL hash. Please enter the decryption key or passphrase manually:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                placeholder="Enter passphrase or base64 key..."
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="flex-1 rounded-[9px] border border-[#ECECEC] bg-white px-3.5 py-2 text-xs text-[#141414] placeholder-[#A0A0A0] focus:border-[#627E4A] focus:outline-none"
              />
              <button
                onClick={() => attemptDecrypt(vaultData, manualKey)}
                disabled={decrypting || !manualKey}
                className="flex items-center space-x-1.5 rounded-[9px] bg-[#1E1E1E] text-white px-4 py-2 text-xs font-semibold hover:bg-[#141414] disabled:opacity-50 transition-editorial"
              >
                <Unlock className="h-4 w-4 text-[#A7CBE0]" />
                <span>Decrypt</span>
              </button>
            </div>
          </div>
        </div>
      ) : decryptedText ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2 text-[#627E4A] text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Decryption Successful (AES-256-GCM)</span>
          </div>

          <div className="rounded-2xl border border-[#ECECEC] bg-[#FAFAFA] p-4">
            <textarea
              readOnly
              rows={12}
              value={decryptedText}
              className="w-full bg-transparent font-mono text-xs text-[#141414] leading-relaxed focus:outline-none resize-none"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ShareVaultPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] bg-sky-mist flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-[#7A7A7A]">Loading vault...</div>}>
        <ShareVaultContent />
      </Suspense>
    </div>
  );
}
