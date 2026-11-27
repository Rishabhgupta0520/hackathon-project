# GEMINI PROJECT SPECIFICATION: GHOSTWIRE CYBERSECURITY & PRIVACY PLATFORM

## Project Identity & Mission
**GhostWire** is an enterprise-grade, Zero-Knowledge Cybersecurity & Data Privacy SaaS application. It provides real-time client-side PII detection, redaction, differential privacy proxying, adversarial linkage simulation, zero-knowledge cryptographic vaulting, and persistent user authentication.

---

## UI, Theme & Motion Architecture
1. **Midnight Carbon & Electric Cyan Theme:**
   - Primary Canvas: `#06080F` (Deep Midnight Obsidian)
   - Elevated Bento Surfaces: `#0D111C` with `1px solid rgba(56, 189, 248, 0.14)` subtle cyan-tinted hairline borders and `backdrop-blur-xl` glassmorphism
   - Primary Brand Accent: `#38BDF8` (Electric Cyan) & `#22D3EE` (Neon Teal) for active shields, primary CTAs, and verified safe states
   - Secondary Warning Accent: `#F59E0B` (Amber) for quasi-identifier clues
   - Danger / Leak Accent: `#F43F5E` (Crimson Rose) for critical PII leaks and linkage attack alerts
   - Typography: `Space Grotesk` (Headings/Display), `Plus Jakarta Sans` (Body/Controls), `Fira Code` (Logs/Tokens/Hashes)

2. **Native CyberHero Canvas (`src/components/CyberHero.tsx`):**
   - High-performance, zero-latency HTML5 Canvas particle network simulating encrypted network packets flowing through a cyber-grid.
   - Interactive pointer magnetism and glowing cyber laser connection vectors.
   - 100% bespoke GhostWire telemetry HUD and action buttons.

3. **Motion Cursor & Procedural Audio:**
   - Magnetic Framer Motion cursor with contextual micro-badges (`SCAN`, `REDACT`, `LOCK`, `AUDIT`, `DEMO`).
   - Zero-dependency Web Audio API synthesizer for cyber-acoustic micro-feedback with persistent mute toggle.

---

## Core Security & Architecture Guarantees
1. **Client-Side Edge WebWorker Scanning (`src/workers/scanner.worker.ts`):**
   - All PII scanning, tokenization, and regex evaluation execute in background threads.
   - Zero raw PII is ever sent across the network or stored in any database.
2. **Deterministic Checksum Validators:**
   - Aadhaar 12-digit numbers: Validated via **Verhoeff dihedral D5 checksum**.
   - Credit Cards: Validated via **Luhn mod-10 checksum**.
   - PAN: Validated via entity-type 4th character check (`P`, `C`, `H`, `F`, etc.).
   - Quasi-Identifiers: Granular age cohorts, postal PIN codes, and network subnets.
3. **Full Authentication System:**
   - User registration and login backed by persistent SQLite (`src/lib/db.ts`).
   - `crypto.scryptSync` salted password hashing with constant-time verification.
   - Signed HTTP-only session cookies (`ghostwire_session`) via HMAC-SHA256.
   - 1-Click Instant Demo login for evaluators (`analyst@ghostwire.io`).
4. **Google Services Integration (`@google/genai`):**
   - Model: `gemini-2.5-flash` operating strictly on *anonymized structural metadata* for DPDP Act 2023, GDPR, and HIPAA compliance audits.
5. **Zero-Knowledge Cryptographic Vault:**
   - Client-side Web Crypto **AES-256-GCM** encryption with 100,000 PBKDF2 rounds.
   - The secret decryption key is stored purely in the URL hash (`#key=...`) and is never sent to the server.
