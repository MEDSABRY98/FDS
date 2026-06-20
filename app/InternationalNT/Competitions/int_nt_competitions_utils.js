export function buildCompetitionStats(matches) {
    const map = {};

    (matches || []).forEach((m) => {
        const game = m.GAME || "Unknown";
        const season = m.SEASON || "Unknown";
        const key = `${game}|${season}`;

        if (!map[key]) {
            map[key] = {
                game,
                season,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                gf: 0,
                ga: 0,
            };
        }

        const row = map[key];
        row.played++;
        row.gf += Number(m.TEAMASCORE) || 0;
        row.ga += Number(m.TEAMBSCORE) || 0;

        const outcome = m.OUTCOME;
        if (outcome === "W") row.wins++;
        else if (outcome === "L") row.losses++;
        else if (outcome && String(outcome).startsWith("D")) row.draws++;
    });

    return Object.values(map)
        .map((row) => ({
            ...row,
            gd: row.gf - row.ga,
            winRate: row.played > 0 ? Math.round((row.wins / row.played) * 100) : 0,
        }))
        .sort((a, b) =>
            String(b.season).localeCompare(String(a.season), undefined, { numeric: true })
            || String(a.game).localeCompare(String(b.game), "ar")
        );
}

export function buildCompetitionTotals(rows) {
    const t = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    (rows || []).forEach((row) => {
        t.played += row.played;
        t.wins += row.wins;
        t.draws += row.draws;
        t.losses += row.losses;
        t.gf += row.gf;
        t.ga += row.ga;
    });
    return {
        ...t,
        gd: t.gf - t.ga,
        winRate: t.played > 0 ? Math.round((t.wins / t.played) * 100) : 0,
    };
}
