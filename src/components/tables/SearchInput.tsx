import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

/** Champ de recherche avec anti-rebond (350 ms) et bouton d'effacement. `onChange` doit être stable (useCallback). */
export default function SearchInput({ onChange, placeholder = 'Rechercher…' }: { onChange: (v: string) => void; placeholder?: string }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    const t = setTimeout(() => onChange(value), 350);
    return () => clearTimeout(t);
  }, [value, onChange]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-omda-textGray" />
      <input type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="w-full rounded-lg border border-omda-borderGray bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-omda-green focus:ring-2 focus:ring-omda-green/20 [&::-webkit-search-cancel-button]:hidden" />
      {value && (
        <button type="button" onClick={() => setValue('')} className="absolute right-2 top-1.5 rounded p-1 text-omda-textGray hover:text-omda-black" aria-label="Effacer la recherche">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
