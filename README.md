# Pragya Kendra Ranchi — Citizen, Revenue & Legal Service Portal

Digital citizen service portal for **Pragya Kendra Ranchi** (*Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001*).

> **Notice:** Independent local documentation, revenue assistance, and digital service portal. Not an official government portal. Aadhaar enrollment and biometric update services are excluded.

## Features

- **Bilingual & Theme Support:** Full **English / हिन्दी** toggle and **Light / Dark** mode.
- **Auto-Applied Best Service Packages & 115+ Directory:**
  - Core packages (`Jharbhoomi Land Mutation`, `Kutchery Registry & Deed Drafting`, `Online Lagaan / Rent Receipt`, `JharSewa Caste, Income & Residential`, `Legal Affidavits`, and `PAN, Passport & Business Licenses`) with recommended Best Service bundles and fees.
  - Searchable **115+ Services Directory** with keyword and browser voice search.
- **Strict Per-Item `.PDF` Application & UPI Payment:**
  - Client-side `%PDF-` header signature validation (max 10 MB per slot), live readiness bar, and inline PDF preview.
  - Local **UPI QR Code** generation (`pragyakendra.ranchi@upi`), 12-digit UTR input, and printable **Token Receipt** (`PKR-2026-...`) with QR tracking code.
- **Real-Time Status Tracker & Flagged PDF Re-upload:** Look up applications by Token ID or 10-digit mobile number and replace any staff-flagged PDF directly inline.
- **Citizen Portal & Staff Operations Console:**
  - **Citizen Login:** Auto-fill applications and view personal tokens by mobile number.
  - **Staff Console (Default local PIN: `1234`):** Filter applications, verify UTRs, update statuses, flag/unflag PDFs with notes, export JSON backups, update Staff PIN, and sync to a Cloudflare D1 endpoint.
- **Ranchi Land & Legal Smart Tools:**
  - **Land Area Converter:** Ranchi/Chotanagpur standards (`Katha = 720 sq.ft`, `Decimal = 435.6 sq.ft`, `Bigha`, `Sq.Ft`, `Sq.M`, `Acre`).
  - **Jharkhand Registry Fee Estimator:** `4% Stamp Duty + 3% Registration Fee` on higher valuation base + live UPI QR.
  - **PDF Exports & Drafts:** Printable A4 Checklist PDF, blank Counter Intake Form PDF, and Kutchery legal draft previewer.
- **Location, FAQs, WhatsApp Desk & PWA:** Google Maps embed, GPS distance estimator, reviews carousel, floating WhatsApp Counter Desk widget, Web App Manifest, service worker caching, and install prompt.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, `qrcode`, `jspdf`
- **Backend / Sync:** Express (`server.ts`) with MongoDB / local store (`server/db.ts`), Cloudflare Worker + D1 adapter (`worker/index.ts`), and `localStorage` client persistence
- **PWA:** `vite-plugin-pwa`

## Local Development

1. Install dependencies:
   ```bash
   npm install
