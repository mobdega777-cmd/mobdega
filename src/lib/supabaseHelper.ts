const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase query, paginating automatically
 * to bypass the default 1000-row limit.
 *
 * Pass a function that builds a fresh query builder each call.
 *
 * Usage:
 *   const data = await fetchAllRows(() =>
 *     supabase.from('invoices').select('*, commerces(fantasy_name)').order('created_at', { ascending: false })
 *   );
 */
export async function fetchAllRows<T = any>(
  buildQuery: () => any
): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildQuery().range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('fetchAllRows error:', error);
      throw error;
    }

    const rows = (data || []) as T[];
    allData = allData.concat(rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return allData;
}
