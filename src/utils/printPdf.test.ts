import { describe, expect, it } from 'vitest';
import { buildPrintHtml, escapeHtml } from './printPdf';

describe('printPdf', () => {
  it("échappe le HTML pour qu'une donnée saisie ne s'exécute pas", () => {
    expect(escapeHtml('<img src=x onerror="a()">')).toBe('&lt;img src=x onerror=&quot;a()&quot;&gt;');
  });
  it('génère un tableau avec en-têtes, lignes et nombre de lignes', () => {
    const html = buildPrintHtml({
      title: 'Membres', subtitle: 'Exporté par moi',
      columns: [{ header: 'Nom', value: (r: { n: string }) => r.n }],
      rows: [{ n: 'Rakoto <b>' }, { n: 'Rabe' }],
    });
    expect(html).toContain('<th>Nom</th>');
    expect(html).toContain('<td>Rakoto &lt;b&gt;</td>');
    expect(html).toContain('2 lignes');
    expect(html).toContain('portrait');
  });
  it('passe en paysage au-delà de 6 colonnes', () => {
    const columns = Array.from({ length: 7 }, (_, i) => ({ header: `C${i}`, value: () => '' }));
    expect(buildPrintHtml({ title: 'T', columns, rows: [] })).toContain('landscape');
  });
});
