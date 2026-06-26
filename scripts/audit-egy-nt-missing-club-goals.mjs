/**
 * Audit: Egypt NT First Team (الأول) official goals (CHAMPION_SYSTEM=OFI)
 * missing CLUB on player event rows.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wsygeerxfdaavdtvogvy.supabase.co";
const supabaseAnonKey = "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AGE_FILTER = "الأول";
const OFFICIAL_SYSTEM = "OFI";

async function fetchAll(table, select) {
  let all = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + step - 1);
    if (error) throw error;
    if (!data?.length) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

function isCountableGoal(row) {
  const type = String(row.TYPE || "").trim();
  const sub = String(row.TYPE_SUB || "").trim().toUpperCase();
  if (type === "OG" || sub === "OG") return false;
  return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
}

function isEgyptScorerEvent(row, match) {
  const team = String(row.TEAM || "").trim();
  if (!team) return false;
  const opponent = String(match["OPPONENT TEAM"] || "").trim();
  const egyptTeam = String(match["Egypt TEAM"] || match["EGYPT TEAM"] || "منتخب مصر").trim();
  const norm = (v) => String(v || "").trim().toLowerCase();
  const t = norm(team);
  if (t === "opponent" && opponent) return false;
  if (opponent && t === norm(opponent)) return false;
  const egyptIds = new Set(
    ["مصر", "egypt", "منتخب مصر", "المنتخب المصري", egyptTeam].filter(Boolean).map(norm)
  );
  return egyptIds.has(t);
}

function isMissingClub(club) {
  const v = String(club ?? "").trim();
  return !v || v === "-" || v.toLowerCase() === "unknown";
}

async function main() {
  console.log("Fetching matches and player events...");
  const [matches, events] = await Promise.all([
    fetchAll("egy_NT_MATCHDETAILS", "MATCH_ID, DATE, AGE, CHAMPION_SYSTEM, CHAMPION, \"OPPONENT TEAM\", \"Egypt TEAM\", GF, GA"),
    fetchAll("egy_NT_PLAYERDETAILS", "ROW_ID, MATCH_ID, \"PLAYER NAME\", TEAM, TYPE, TYPE_SUB, CLUB, MINUTE, EVENT_ID"),
  ]);

  const officialFirstTeamIds = new Set(
    matches
      .filter((m) => String(m.AGE || "").trim() === AGE_FILTER)
      .filter((m) => String(m.CHAMPION_SYSTEM || "").trim() === OFFICIAL_SYSTEM)
      .map((m) => String(m.MATCH_ID))
  );

  const matchMap = new Map(matches.map((m) => [String(m.MATCH_ID), m]));

  const missing = [];
  const allOfficialGoals = [];

  for (const row of events) {
    const matchId = String(row.MATCH_ID || "");
    if (!officialFirstTeamIds.has(matchId)) continue;
    if (!isCountableGoal(row)) continue;

    const match = matchMap.get(matchId);
    if (!match || !isEgyptScorerEvent(row, match)) continue;

    allOfficialGoals.push(row);
    if (isMissingClub(row.CLUB)) {
      missing.push({ row, match });
    }
  }

  console.log("\n=== Egypt NT Club Audit (الأول + OFI) ===\n");
  console.log(`Official First Team matches: ${officialFirstTeamIds.size}`);
  console.log(`Egypt goals in those matches: ${allOfficialGoals.length}`);
  console.log(`Goals WITHOUT club (CLUB empty/null): ${missing.length}`);

  if (missing.length === 0) {
    console.log("\nNo missing CLUB on official First Team goals.");
    return;
  }

  console.log("\n--- Missing CLUB goals ---\n");
  missing
    .sort((a, b) => String(a.match.DATE || "").localeCompare(String(b.match.DATE || "")))
    .forEach(({ row, match }, i) => {
      console.log(
        [
          `${i + 1}.`,
          `DATE: ${match.DATE || "—"}`,
          `vs ${match["OPPONENT TEAM"] || "—"}`,
          `(${match.CHAMPION || "—"})`,
          `| ${row["PLAYER NAME"] || "—"}`,
          `min ${row.MINUTE || "—"}`,
          `| ROW_ID: ${row.ROW_ID}`,
          `MATCH_ID: ${match.MATCH_ID}`,
        ].join(" ")
      );
    });

  const byPlayer = {};
  missing.forEach(({ row }) => {
    const p = String(row["PLAYER NAME"] || "Unknown").trim();
    byPlayer[p] = (byPlayer[p] || 0) + 1;
  });
  console.log("\n--- By player ---");
  Object.entries(byPlayer)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => console.log(`  ${name}: ${count}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
