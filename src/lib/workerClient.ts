/**
 * GhostWire Client WebWorker Manager
 * Manages WebWorker lifecycle with graceful fallback to main-thread execution if WebWorkers are unavailable.
 */

import { ScanResult, DocumentType, RedactionStrategy } from '../engine/types';
import { scanPII } from '../engine/scanner';
import { applyRedaction } from '../engine/redactor';

export class ScannerWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, { resolve: (res: any) => void; reject: (err: any) => void }>();

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        // Instantiate WebWorker using Next.js / Webpack standard syntax
        this.worker = new Worker(new URL('../workers/scanner.worker.ts', import.meta.url));
        this.worker.onmessage = (e: MessageEvent) => {
          const { id, success, result, error } = e.data;
          const handler = this.pendingRequests.get(id);
          if (handler) {
            this.pendingRequests.delete(id);
            if (success) {
              handler.resolve(result);
            } else {
              handler.reject(new Error(error));
            }
          }
        };
      } catch (e) {
        console.warn('Worker initialization fallback to synchronous engine:', e);
        this.worker = null;
      }
    }
  }

  public async scan(text: string, documentType: DocumentType = 'server_log'): Promise<ScanResult> {
    if (!this.worker) {
      return scanPII(text, documentType);
    }

    const id = `req_${Date.now()}_${Math.random()}`;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({
        id,
        type: 'SCAN',
        payload: { text, documentType }
      });
    });
  }

  public async redact(
    text: string,
    strategy: RedactionStrategy = 'redact',
    documentType: DocumentType = 'server_log'
  ): Promise<{ redactedText: string; scan: ScanResult }> {
    if (!this.worker) {
      const scan = scanPII(text, documentType);
      const redactedText = applyRedaction(text, scan.entities, strategy);
      return { redactedText, scan };
    }

    const id = `req_${Date.now()}_${Math.random()}`;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({
        id,
        type: 'REDACT',
        payload: { text, strategy, documentType }
      });
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const scannerWorker = new ScannerWorkerClient();
