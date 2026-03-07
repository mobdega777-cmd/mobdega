import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase query, paginating automatically
 * to bypass the default 1000-row limit.
 *
 * Usage:
 *   const data = await fetchAllRows(
 *     supabase.from('invoices').select('*, commerces(fantasy_name)').order('created_at', { ascending: false })
 *   );
 */
export async function fetchAllRows<T = any>(
  queryBuilder: any
): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilder.range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('fetchAllRows error:', error);
      throw error;
    }

    const rows = (data || []) as T[];
    allData = allData.concat(rows);

    if (rows.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      offset += PAGE_SIZE;
    }
  }

  return allData;
}
