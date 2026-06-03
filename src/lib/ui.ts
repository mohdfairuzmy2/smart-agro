import type { AlertLevel } from '../data/types';

export const levelStyles: Record<AlertLevel, { bg: string; text: string; dot: string; label: string }> = {
  rendah: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Rendah' },
  sederhana: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Sederhana' },
  tinggi: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Tinggi' },
};

export function formatRM(value: number, unit: string): string {
  const formatted =
    value >= 100
      ? value.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : value.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `RM${formatted}/${unit}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
