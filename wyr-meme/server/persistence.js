// Persistence: JSON file by default; Supabase (REST) for votes/rounds/submissions if configured.
import fs from 'node:fs';
import path from 'node:path';
import { emptyData } from '../shared/board.js';

const DATA_FILE = process.env.DATA_FILE || path.resolve('data/board.json');

export function loadBoard() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return emptyData(); }
}
let saveTimer;
export function saveBoard(data) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFile(DATA_FILE, JSON.stringify(data), (e) => e && console.warn('[persist] save failed', e.message));
  }, 500);
}

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseEnabled = !!(SB_URL && SB_KEY);

/** Fire-and-forget insert into a Supabase table (see supabase/schema.sql). */
export function sbInsert(table, row) {
  if (!supabaseEnabled) return;
  fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  }).catch((e) => console.warn(`[supabase] ${table} insert failed`, e.message));
}
