export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const SEPARATOR = ';'; // Excel en français attend le point-virgule.
const NUMBER_LIKE = /^[+-]?\d[\d\s.,-]*$/;

/**
 * Une cellule, protégée contre l'injection de formules : un texte commençant par = @ ou, pour + et -,
 * qui n'est pas un nombre ou un numéro de téléphone, est préfixé par une apostrophe.
 */
export function csvCell(v: string | number | null | undefined): string {
  let s = v == null ? '' : String(v);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !NUMBER_LIKE.test(s))) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Contenu CSV avec BOM UTF-8 : Excel affiche correctement les accents. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((c) => csvCell(c.header)).join(SEPARATOR),
    ...rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(SEPARATOR)),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadCsv<T>(baseName: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
