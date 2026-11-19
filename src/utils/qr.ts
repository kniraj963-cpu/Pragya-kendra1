import QRCode from 'qrcode';

export const MERCHANT_UPI_ID = 'niraj2392130@naviaxis';
export const MERCHANT_UPI_NAME = 'Pragya Kendra Ranchi';
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CSBuz5zKEYbUEBE/review';
export const GOOGLE_MAPS_URL = 'https://maps.google.com/maps?cid=15313947144831856160';

export function buildUpiUri(amount?: number, note?: string): string {
  const params = new URLSearchParams({
    pa: MERCHANT_UPI_ID,
    pn: MERCHANT_UPI_NAME,
    cu: 'INR',
  });
  if (amount && amount > 0) {
    params.set('am', amount.toFixed(2));
  }
  if (note && note.trim()) {
    params.set('tn', note.trim().slice(0, 50));
  }
  return `upi://pay?${params.toString()}`;
}

export function buildTrackingUrl(ticketId: string): string {
  const origin =
    (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://pragyakendraranchi.in');
  return `${origin}/?ticket=${encodeURIComponent(ticketId.trim().toUpperCase())}#top`;
}

export async function generateQrDataUrl(text: string, width = 180): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 2,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}
