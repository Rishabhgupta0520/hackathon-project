import { DocumentType } from './types';

export interface SamplePreset {
  id: string;
  type: DocumentType;
  title: string;
  badge: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: SamplePreset[] = [
  {
    id: 'server_log_prod',
    type: 'server_log',
    title: 'Production Auth & Ingress Log',
    badge: 'K8s Cluster #4',
    content: `[2026-11-27T10:14:02.102Z] INFO worker-node-04 ingress-nginx: 192.168.1.104 - - "POST /api/v1/auth/login HTTP/2.0" 200 422 user_email="vikram.sharma@paycorp.in"
[2026-11-27T10:14:03.491Z] WARN billing-service payment_gateway: Failed charge attempt card=4532-8921-9920-1488 exp=09/28 amount=1499.00 customer_phone="+91-98765-43210"
[2026-11-27T10:14:05.112Z] DEBUG session-vault: User token generated Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_token_stream_99182312
[2026-11-27T10:14:06.820Z] ERROR auth-service: Verification failure for Aadhaar 9999 4105 2814 and PAN BKUPG8819L during KYC verification flow.
[2026-11-27T10:14:07.411Z] INFO s3-exporter: Exporting backup with AWS_KEY=AKIAIOSFODNN7EXAMPLE to bucket s3://prod-fintech-vault-eu`
  },
  {
    id: 'resume_senior_dev',
    type: 'resume',
    title: 'Candidate Profile — Principal Security Lead',
    badge: 'HR / Talent Pipeline',
    content: `PRIYA CHOUDHARY
Email: priya.choudhary@cloudsec.org | Phone: +91 91234 56789
Location: Bengaluru, Karnataka, India
PAN: ABCDE1234F | Aadhaar: 3672 9841 2019
DOB: 14/08/1992

PROFESSIONAL SUMMARY
Distinguished Cybersecurity Specialist with 9+ years architecting zero-knowledge enterprise architectures, Differential Privacy pipelines, and automated DPDP/GDPR compliance frameworks.

EXPERIENCE
Lead Security Architect — FinShield Systems (2021 - Present)
- Led SOC 2 Type II and DPDP Act 2023 compliance audits for tier-1 payment infrastructure.
- Secured patient data under HIPAA Safe Harbor protocols.
- Contact for verification: manager.arun@finshield.io`
  },
  {
    id: 'support_ticket_billing',
    type: 'support_ticket',
    title: 'Escalated Customer Support Ticket #9842',
    badge: 'Zendesk VIP Queue',
    content: `Ticket ID: #9842-URGENT
Customer: Rajesh Malhotra
Email: rajesh.malhotra89@gmail.com
Phone: +1 (555) 234-5678
Date: 2026-11-27

MESSAGE:
"Hello Support Team,
I noticed an unauthorized charge of $840 on my Visa ending in 4111-2222-3333-4444. 
My SSN on file is 123-45-6789.
Please verify my identity using my registered address: 742 Evergreen Terrace, Springfield, OR.
Also please forward the refund confirmation to my alternative email: r.malhotra@workplace.co.uk."`
  },
  {
    id: 'clinical_encounter_ehr',
    type: 'clinical_note',
    title: 'Clinical Encounter Note (HIPAA Safeguard)',
    badge: 'EMR / Oncology Ward',
    content: `PATIENT ENCOUNTER NOTE
Patient Name: Ananya Sen
Date of Birth: 05/12/1984 (Age: 42)
Record #: MRN-892401
SSN: 987-65-4321
Admitting Physician: Dr. Robert Vance (NPI: 1982736450)
Date of Service: 2026-11-20

CHIEF COMPLAINT:
Patient presented for post-operative oncology follow-up. 
Family contact emergency number: +91 99887 76655.
Address on file: Flat 402, Lakeview Apartments, Mumbai 400076.

IMPRESSION & PLAN:
Surgical incision healing appropriately. CBC and metabolic panel normal.
Follow-up biopsy scheduled in 6 weeks. Transferred records to oncologist: dr.vance@regional-health.org.`
  }
];
