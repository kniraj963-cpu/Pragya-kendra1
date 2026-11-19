import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { generateQrDataUrl } from '../utils/qr.ts';

interface QRCodeBoxProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
  downloadName?: string;
  compact?: boolean;
}

export function QRCodeBox({
  value,
  size = 136,
  label,
  sublabel,
  downloadName,
  compact = false,
}: QRCodeBoxProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    generateQrDataUrl(value, size * 2)
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"
      />
    );
  }

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${compact ? '' : 'text-center'}`}>
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs inline-block">
        <img
          src={dataUrl}
          alt={label || 'QR Code'}
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="block rounded"
        />
      </div>
      {label && (
        <span className="text-[11px] font-semibold text-slate-900 dark:text-white leading-tight">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
          {sublabel}
        </span>
      )}
      {downloadName && (
        <a
          href={dataUrl}
          download={downloadName}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline no-print"
        >
          <Download className="w-3 h-3" />
          <span>Save QR</span>
        </a>
      )}
    </div>
  );
}
