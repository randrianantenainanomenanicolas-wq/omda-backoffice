import { useCallback, useState } from 'react';

export function useListState(initial: { sortKey: string; ascending?: boolean; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState('');
  const [sort, setSort] = useState({ key: initial.sortKey, ascending: initial.ascending ?? false });

  const setSearch = useCallback((v: string) => { setSearchRaw(v); setPage(1); }, []);
  const toggleSort = useCallback((key: string) => {
    setSort((s) => (s.key === key ? { key, ascending: !s.ascending } : { key, ascending: true }));
    setPage(1);
  }, []);
  const resetPage = useCallback(() => setPage(1), []);

  return { page, setPage, search, setSearch, sort, toggleSort, resetPage, pageSize: initial.pageSize ?? 15 };
}
