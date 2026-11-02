import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Fenêtres ouvertes, de la plus ancienne à la plus récente. Seule la plus haute réagit à Échap et à Tab :
// une confirmation ouverte au-dessus d'un formulaire ne ferme pas le formulaire en même temps.
const stack: symbol[] = [];
let lockCount = 0;
let savedOverflow = '';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const pressedOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    const id = Symbol('modal');
    stack.push(id);
    const isTop = () => stack[stack.length - 1] === id;

    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    // Le focus va au premier champ de saisie (ex. le motif d'un rejet), sinon au premier élément actif.
    (node?.querySelector<HTMLElement>('textarea, input, select') ?? focusables()[0] ?? node)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    if (lockCount === 0) savedOverflow = document.body.style.overflow;
    lockCount += 1;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(id);
      if (i !== -1) stack.splice(i, 1);
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = savedOverflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-omda-black/40 p-4"
      onMouseDown={(e) => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl outline-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-omda-textGray hover:bg-omda-warmGray" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
