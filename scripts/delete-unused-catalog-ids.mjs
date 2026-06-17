import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://wsygeerxfdaavdtvogvy.supabase.co',
  'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'
);

const report = JSON.parse(readFileSync('scripts/unused-catalog-ids.json', 'utf8'));

const TABLE_ID_COL = {
  db_PLAYERS: 'PLAYER_ID',
  db_MANAGERS: 'MANAGER_ID',
  db_TEAMS: 'TEAM_ID',
  db_REFEREES: 'REFEREE_ID',
};

async function deleteBatch(table, idCol, ids) {
  const { data, error } = await supabase.from(table).delete().in(idCol, ids).select(idCol);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data?.length ?? 0;
}

const summary = [];

for (const [table, section] of Object.entries(report)) {
  const idCol = TABLE_ID_COL[table];
  const ids = section.unused.map(r => r.id);
  if (!ids.length) {
    summary.push({ table, deleted: 0, expected: 0 });
    continue;
  }

  const deleted = await deleteBatch(table, idCol, ids);
  summary.push({ table, deleted, expected: ids.length, ids });
  console.log(`${table}: deleted ${deleted}/${ids.length}`);
}

console.log('\nDone:', summary.map(s => `${s.table} ${s.deleted}/${s.expected}`).join(', '));
