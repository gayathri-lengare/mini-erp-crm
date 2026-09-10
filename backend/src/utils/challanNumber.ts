import { PoolClient } from 'pg';
import { query } from '../config/db.js';

/**
 * Generates the next sequential challan number formatted as CH-YYYY-XXXX
 * e.g., CH-2026-0001
 */
export async function generateNextChallanNumber(client?: PoolClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CH-${currentYear}-`;

  const sql = `
    SELECT challan_number
    FROM challans
    WHERE challan_number LIKE $1
    ORDER BY challan_number DESC
    LIMIT 1
  `;

  const result = client
    ? await client.query(sql, [`${prefix}%`])
    : await query(sql, [`${prefix}%`]);

  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastChallanNumber = result.rows[0].challan_number as string;
  const lastSeqStr = lastChallanNumber.replace(prefix, '');
  const lastSeq = parseInt(lastSeqStr, 10);

  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
