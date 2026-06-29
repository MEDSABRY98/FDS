import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    "https://wsygeerxfdaavdtvogvy.supabase.co",
    "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk"
);

const MISS = ["برا المرمى", "القائم", "العارضة", "؟"];

async function fetchAll(table, select) {
    let rows = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
        if (error) throw error;
        if (!data?.length) break;
        rows.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }
    return rows;
}

const matches = await fetchAll(
    "alahly_MATCHDETAILS",
    'MATCH_ID, "AHLY TEAM", "OPPONENT TEAM", DATE, CHAMPION'
);
const gks = await fetchAll("alahly_GKSDETAILS", 'MATCH_ID, TEAM, "PLAYER NAME", "OUT MINUTE"');
const players = await fetchAll(
    "alahly_PLAYERDETAILS",
    'MATCH_ID, "PLAYER NAME", TEAM, TYPE, MINUTE, "HOW MISSED", EVENT_ID'
);

const matchMap = Object.fromEntries(matches.map((m) => [String(m.MATCH_ID).trim(), m]));
const gksByMatchTeam = {};

for (const g of gks) {
    const key = `${String(g.MATCH_ID).trim()}|${String(g.TEAM).trim()}`;
    if (!gksByMatchTeam[key]) gksByMatchTeam[key] = [];
    gksByMatchTeam[key].push(g);
}

const penMissed = players.filter(
    (p) =>
        String(p.TYPE || "").toUpperCase() === "PENMISSED" &&
        MISS.includes(String(p["HOW MISSED"] || "").trim())
);

const oppMissTwoAhlyGk = [];
const ahlyMissTwoOppGk = [];

for (const pen of penMissed) {
    const matchId = String(pen.MATCH_ID).trim();
    const match = matchMap[matchId];
    if (!match) continue;

    const takerTeam = String(pen.TEAM).trim();
    const ahlyTeam = String(match["AHLY TEAM"]).trim();
    const oppTeam = String(match["OPPONENT TEAM"]).trim();
    const ahlyGks = gksByMatchTeam[`${matchId}|${ahlyTeam}`] || [];
    const oppGks = gksByMatchTeam[`${matchId}|${oppTeam}`] || [];

    const row = {
        MATCH_ID: matchId,
        DATE: match.DATE,
        CHAMPION: match.CHAMPION,
        MINUTE: pen.MINUTE,
        taker: pen["PLAYER NAME"],
        HOW: pen["HOW MISSED"],
        ahlyGks: ahlyGks.map((g) => `${g["PLAYER NAME"]} (out:${g["OUT MINUTE"] || "-"})`),
        oppGks: oppGks.map((g) => `${g["PLAYER NAME"]} (out:${g["OUT MINUTE"] || "-"})`),
    };

    if (takerTeam !== ahlyTeam && ahlyGks.length >= 2) oppMissTwoAhlyGk.push(row);
    if (takerTeam === ahlyTeam && oppGks.length >= 2) ahlyMissTwoOppGk.push(row);
}

console.log("=== منافس ضيّع + حارسان أهلي ===");
console.log("COUNT:", oppMissTwoAhlyGk.length);
for (const row of oppMissTwoAhlyGk) console.log(JSON.stringify(row));

console.log("\n=== أهلي ضيّع + حارسان منافس ===");
console.log("COUNT:", ahlyMissTwoOppGk.length);
for (const row of ahlyMissTwoOppGk) console.log(JSON.stringify(row));
