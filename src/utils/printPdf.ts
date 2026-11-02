import type { CsvColumn } from './csv';

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export interface PrintOptions<T> {
  title: string;
  /** Ex. « Exporté le 17 octobre 2026 par agent@omda.mg ». */
  subtitle?: string;
  columns: CsvColumn<T>[];
  rows: T[];
  /** Adresse ABSOLUE du logo (le document imprimé n'a pas d'adresse de base). */
  logoUrl?: string;
}

/** Document HTML imprimable : en-tête OMDA, tableau dont l'en-tête se répète à chaque page, A4 (paysage si > 6 colonnes). */
export function buildPrintHtml<T>(o: PrintOptions<T>): string {
  const cell = (v: string | number | null | undefined) => escapeHtml(v == null ? '' : String(v));
  const head = o.columns.map((c) => `<th>${cell(c.header)}</th>`).join('');
  const body = o.rows.map((r) => `<tr>${o.columns.map((c) => `<td>${cell(c.value(r))}</td>`).join('')}</tr>`).join('');
  const orientation = o.columns.length > 6 ? 'landscape' : 'portrait';
  const logo = o.logoUrl ? `<img src="${escapeHtml(o.logoUrl)}" alt="" />` : '';
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${cell(o.title)}</title>
<style>
  @page { size: A4 ${orientation}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 10pt/1.4 "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; }
  header { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px solid #2E7A46; }
  header img { height: 36px; width: 36px; object-fit: contain; }
  h1 { margin: 0; font-size: 15pt; color: #205C35; }
  .meta { margin: 2px 0 0; font-size: 8.5pt; color: #6B675E; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th { background: #F5F4EF; color: #205C35; text-align: left; font-size: 8.5pt; }
  th, td { padding: 5px 7px; border-bottom: 1px solid #DDD9CE; vertical-align: top; overflow-wrap: anywhere; }
  tr { page-break-inside: avoid; }
  tbody tr:nth-child(even) td { background: #FAF9F5; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head>
<body>
<header>${logo}<div><h1>${cell(o.title)}</h1><p class="meta">${cell(o.subtitle ?? '')}${o.subtitle ? ' – ' : ''}${o.rows.length} ligne${o.rows.length > 1 ? 's' : ''}</p></div></header>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

/** Ouvre la fenêtre d'impression du navigateur : « Enregistrer au format PDF » produit le fichier. */
export function printHtml(html: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) { frame.remove(); throw new Error('Impression indisponible dans ce navigateur.'); }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => setTimeout(() => frame.remove(), 500);
  const run = () => {
    win.focus();
    win.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 120_000); // filet de sécurité si « afterprint » n'est jamais émis
    win.print();
  };
  const img = doc.querySelector('img');
  if (img && !img.complete) {
    img.addEventListener('load', run, { once: true });
    img.addEventListener('error', run, { once: true });
  } else run();
}

export function printTablePdf<T>(o: Omit<PrintOptions<T>, 'logoUrl'>): void {
  printHtml(buildPrintHtml({ ...o, logoUrl: `${window.location.origin}/omda-logo.png` }));
}
