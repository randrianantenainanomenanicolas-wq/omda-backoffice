import type { ReactNode } from 'react';

export const inputClass =
  'mt-1 w-full rounded-lg border border-omda-borderGray px-3 py-2 text-sm outline-none focus:border-omda-green/100 focus:ring-2 focus:ring-omda-green/20 disabled:bg-omda-warmGray disabled:text-omda-textGray';

export default function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-omda-errorRed">{error}</span>}
    </label>
  );
}
