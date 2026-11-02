import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAvatarUrl } from '@/services/avatar.service';

const SIZE = { sm: 'h-8 w-8 text-sm', lg: 'h-14 w-14 text-2xl', xl: 'h-20 w-20 text-3xl' } as const;

/** Photo de profil si elle existe, sinon l'initiale sur fond vert. Aucune erreur visible : on retombe sur l'initiale. */
export default function Avatar({ path, label, size = 'sm' }: { path?: string | null; label: string; size?: keyof typeof SIZE }) {
  const [broken, setBroken] = useState(false);
  const { data: url } = useQuery({
    queryKey: ['avatar', path],
    queryFn: () => getAvatarUrl(path as string),
    enabled: !!path,
    staleTime: 50 * 60 * 1000, // le lien dure 1 h
    retry: false,
  });
  useEffect(() => setBroken(false), [url]);

  if (url && !broken) {
    return <img src={url} alt="" onError={() => setBroken(true)} className={`${SIZE[size]} shrink-0 rounded-full object-cover ring-1 ring-black/5`} />;
  }
  return (
    <span aria-hidden className={`flex ${SIZE[size]} shrink-0 items-center justify-center rounded-full bg-omda-green font-semibold text-white`}>
      {label.charAt(0).toUpperCase() || '?'}
    </span>
  );
}
