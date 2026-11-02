import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { downloadCsv, type CsvColumn } from '@/utils/csv';
import { toFrenchMessage } from '@/utils/errors';
import { printTablePdf } from '@/utils/printPdf';

interface Props<T> {
  filename: string;
  /** Titre du document PDF. */
  title?: string;
  columns: CsvColumn<T>[];
  /** Charge toutes les lignes correspondant aux filtres en cours (pas seulement la page affichée). */
  fetchAll: () => Promise<T[]>;
  disabled?: boolean;
}

export default function ExportButton<T>({ filename, title, columns, fetchAll, disabled }: Props<T>) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const run = async (kind: 'csv' | 'pdf') => {
    setOpen(false);
    setBusy(true);
    try {
      const rows = await fetchAll();
      if (!rows.length) { toast.info('Aucune ligne à exporter.'); return; }
      if (kind === 'csv') {
        downloadCsv(filename, rows, columns);
        toast.success(`${rows.length} ligne${rows.length > 1 ? 's' : ''} exportée${rows.length > 1 ? 's' : ''}.`);
      } else {
        const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        printTablePdf({ title: title ?? filename, subtitle: `Exporté le ${date}${profile ? ` par ${profile.email}` : ''}`, columns, rows });
        toast.info("Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF ».");
      }
    } catch (e) {
      toast.error(toFrenchMessage(e, "L'export a échoué. Veuillez réessayer."));
    } finally {
      setBusy(false);
    }
  };

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-omda-warmGray';
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} disabled={disabled || busy} aria-haspopup="menu" aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-omda-borderGray bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-omda-warmGray disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? 'Export…' : 'Exporter'} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-omda-borderGray bg-white py-1 shadow-lg">
          <button role="menuitem" onClick={() => run('csv')} className={item}><FileSpreadsheet className="h-4 w-4 text-omda-green" /> Fichier CSV (Excel)</button>
          <button role="menuitem" onClick={() => run('pdf')} className={item}><FileText className="h-4 w-4 text-omda-errorRed" /> Document PDF</button>
        </div>
      )}
    </div>
  );
}
