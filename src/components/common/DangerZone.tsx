import { useAuth } from '@/features/auth/AuthContext';
import DeleteAction, { type DeleteActionProps } from './DeleteAction';

/** Bloc « Zone de danger » en bas des fiches de détail, visible des seuls administrateurs. */
export default function DangerZone({ description, ...action }: DeleteActionProps & { description: string }) {
  const { profile } = useAuth();
  if (profile?.role !== 'ADMINISTRATEUR') return null;
  return (
    <section className="rounded-xl border border-omda-errorRed/30 bg-omda-errorRed/5 p-5">
      <h2 className="font-semibold text-omda-errorRed">Zone de danger</h2>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-omda-textGray">{description}</p>
        <DeleteAction {...action} />
      </div>
    </section>
  );
}
