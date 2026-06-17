import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://wsygeerxfdaavdtvogvy.supabase.co',
  'sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk'
);

const CATALOG_TABLES = {
  db_PLAYERS: { idCol: 'PLAYER_ID', nameCol: 'PLAYER_NAME', prefix: 'P-' },
  db_MANAGERS: { idCol: 'MANAGER_ID', nameCol: 'MANAGER_NAME', prefix: 'M-' },
  db_TEAMS: { idCol: 'TEAM_ID', nameCol: 'TEAM_NAME', prefix: 'T-' },
  db_REFEREES: { idCol: 'REFEREE_ID', nameCol: 'REFEREE_NAME', prefix: 'REF-' },
};

const DATA_TABLES = [
  'alahly_MATCHDETAILS', 'alahly_LINEUPDETAILS', 'alahly_PLAYERDETAILS',
  'alahly_GKSDETAILS', 'alahly_PKS', 'alahly_HOWPENMISSED', 'alahly_MEDIATRACKER',
  'egy_NT_MATCHDETAILS', 'egy_NT_LINEUPDETAILS', 'egy_NT_PLAYERDETAILS',
  'egy_NT_GKSDETAILS', 'egy_NT_PKS', 'egy_NT_HOWPENMISSED', 'egy_NT_SQUAD',
  'egy_CLUB_MATCHDETAILS', 'egy_CLUB_TROPHY',
];

function getCatalogForColumn(colName) {
  const col = String(colName || '').toUpperCase();
  if (col.includes('COUNTRY')) return null;
  if (
    col.includes('PLAYER') || col === 'MOTM' || col === 'PLAYERNAME' ||
    col === 'CAPTAIN_ID' || col.includes('CAPTAIN') ||
    (col.includes('GK') && !col.includes('TEAM'))
  ) return 'db_PLAYERS';
  if (col.includes('MANAGER')) return 'db_MANAGERS';
  if (col.includes('REF')) return 'db_REFEREES';
  if (col.includes('TEAM') || col.includes('OPPONENT') || col === 'CLUB') return 'db_TEAMS';
  return null;
}

async function fetchAllFrom(table) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function fetchCatalog(table, idCol, nameCol) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(`${idCol}, ${nameCol}`).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows.map(r => ({
    id: String(r[idCol] || '').trim(),
    name: String(r[nameCol] || '').trim(),
  })).filter(r => r.id && r.name);
}

function norm(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

async function main() {
  console.log('Loading catalogs...');
  const catalogs = {};
  for (const [table, cfg] of Object.entries(CATALOG_TABLES)) {
    catalogs[table] = await fetchCatalog(table, cfg.idCol, cfg.nameCol);
    console.log(`  ${table}: ${catalogs[table].length}`);
  }

  const usedNames = Object.fromEntries(Object.keys(CATALOG_TABLES).map(k => [k, new Set()]));
  const usedIds = Object.fromEntries(Object.keys(CATALOG_TABLES).map(k => [k, new Set()]));

  const idSets = {};
  for (const [table, cfg] of Object.entries(CATALOG_TABLES)) {
    idSets[table] = new Set(catalogs[table].map(r => r.id));
  }

  for (const table of DATA_TABLES) {
    process.stdout.write(`Scanning ${table}...\n`);
    let rows;
    try {
      rows = await fetchAllFrom(table);
    } catch (e) {
      console.warn(`  SKIP ${table}: ${e.message}`);
      continue;
    }
    if (!rows.length) {
      console.log(`  (empty)`);
      continue;
    }

    const cols = Object.keys(rows[0]);
    const catalogCols = cols.map(c => ({ col: c, catalog: getCatalogForColumn(c) })).filter(x => x.catalog);
    console.log(`  rows=${rows.length}, catalog cols=${catalogCols.map(x => x.col).join(', ')}`);

    for (const row of rows) {
      for (const { col, catalog } of catalogCols) {
        const val = norm(row[col]);
        if (!val || ['-', '?', '؟', 'unknown', 'n/a'].includes(val.toLowerCase())) continue;
        usedNames[catalog].add(val);
      }
      // Any cell might contain a catalog ID
      for (const col of cols) {
        const val = norm(row[col]);
        if (!val) continue;
        for (const [cat, cfg] of Object.entries(CATALOG_TABLES)) {
          if (val.startsWith(cfg.prefix) && idSets[cat].has(val)) {
            usedIds[cat].add(val);
          }
        }
      }
    }
  }

  const report = {};
  for (const [table, cfg] of Object.entries(CATALOG_TABLES)) {
    const unused = catalogs[table].filter(entry => {
      const byName = usedNames[table].has(entry.name);
      const byId = usedIds[table].has(entry.id);
      return !byName && !byId;
    }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    report[table] = {
      label: table.replace('db_', ''),
      total: catalogs[table].length,
      used: catalogs[table].length - unused.length,
      unused_count: unused.length,
      unused,
    };
    console.log(`\n${table}: ${report[table].used} used, ${unused.length} unused`);
  }

  writeFileSync('scripts/unused-catalog-ids.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('\nSaved scripts/unused-catalog-ids.json');
}

main().catch(e => { console.error(e); process.exit(1); });
