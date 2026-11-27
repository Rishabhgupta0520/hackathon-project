/**
 * GhostWire WebWorker - Offloads PII scanning & regex execution off the main UI thread.
 * Ensures strict 60fps UI responsiveness even on 10,000+ line logs.
 */

import { scanPII } from '../engine/scanner';
import { applyRedaction } from '../engine/redactor';
import { DocumentType, RedactionStrategy } from '../engine/types';

interface WorkerRequest {
  id: string;
  type: 'SCAN' | 'REDACT';
  payload: {
    text: string;
    documentType?: DocumentType;
    strategy?: RedactionStrategy;
    salt?: string;
  };
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;

  try {
    if (type === 'SCAN') {
      const scanResult = scanPII(payload.text, payload.documentType || 'server_log');
      self.postMessage({ id, success: true, result: scanResult });
    } else if (type === 'REDACT') {
      const scan = scanPII(payload.text, payload.documentType || 'server_log');
      const redactedText = applyRedaction(
        payload.text,
        scan.entities,
        payload.strategy || 'redact',
        payload.salt || 'ghostwire_salt'
      );
      self.postMessage({ id, success: true, result: { redactedText, scan } });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown worker error';
    self.postMessage({ id, success: false, error: message });
  }
};
