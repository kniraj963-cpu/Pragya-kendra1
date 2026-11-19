import type { AttachedDocMeta } from '../data/catalog.ts';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 KB';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function hasValidMagicBytes(bytes: Uint8Array, filename: string): boolean {
  if (bytes.length < 4) return false;
  const isPdf =
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (/\.pdf$/i.test(filename)) return isPdf;
  if (/\.png$/i.test(filename)) return isPng;
  if (/\.jpe?g$/i.test(filename)) return isJpg;
  return isPdf || isPng || isJpg;
}

export async function readAndValidateFiles(
  files: FileList | File[],
  requirementKey: string,
  requirementLabel: string
): Promise<{ valid: AttachedDocMeta[]; skipped: string[] }> {
  const valid: AttachedDocMeta[] = [];
  const skipped: string[] = [];

  for (const file of Array.from(files)) {
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      skipped.push(`${file.name} (exceeds 5 MB limit)`);
      continue;
    }
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      skipped.push(`${file.name} (only PDF, JPG, PNG supported)`);
      continue;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (!hasValidMagicBytes(bytes, file.name)) {
        skipped.push(`${file.name} (corrupted or invalid file signature)`);
        continue;
      }

      const mimeType =
        file.type ||
        (/\.pdf$/i.test(file.name)
          ? 'application/pdf'
          : /\.png$/i.test(file.name)
            ? 'image/png'
            : 'image/jpeg');

      valid.push({
        requirementKey,
        requirementLabel,
        name: file.name,
        mimeType,
        sizeBytes: file.size,
        size: formatFileSize(file.size),
        category: requirementLabel,
        dataBase64: arrayBufferToBase64(buffer),
      });
    } catch {
      skipped.push(`${file.name} (could not read file)`);
    }
  }

  return { valid, skipped };
}
