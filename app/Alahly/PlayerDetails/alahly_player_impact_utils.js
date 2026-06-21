export function isAhlyTeam(teamValue) {
    if (!teamValue) return false;
    const s = String(teamValue).trim();
    return s.includes("الأهلي") || s.includes("ال الأهلي") || s.includes("Al Ahly") || s.includes("Al-Ahly");
}

export function computePlayerGoalImpact(matches, allEvents, playerName, eventsByMatch = null) {
    const searchName = String(playerName || "").trim();
    let winImpact = 0;
    let drawImpact = 0;
    const impactMatches = [];

    (matches || []).forEach(match => {
        const mid = String(match.MATCH_ID);
        const gf = parseInt(match.GF) || 0;
        const ga = parseInt(match.GA) || 0;
        const res = match["W-D-L"];

        let matchEvents = [];
        if (eventsByMatch) {
            matchEvents = eventsByMatch.get(mid) || [];
        } else {
            matchEvents = (allEvents || []).filter(e => String(e.MATCH_ID) === mid);
        }

        const playerRecord = matchEvents.find(e => String(e["PLAYER NAME"] || "").trim() === searchName);
        if (!playerRecord) return;

        const isAhlySideInThisMatch = isAhlyTeam(playerRecord.TEAM);
        const playerTeamWon = isAhlySideInThisMatch ? (res === 'W') : (res === 'L');
        const isDraw = (res === 'D' || res === 'D.');
        const playerSideG = isAhlySideInThisMatch ? gf : ga;
        const opponentSideG = isAhlySideInThisMatch ? ga : gf;

        const sideGoals = matchEvents.filter(e =>
            isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
            (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
        ).sort((a, b) => {
            const seqA = parseInt(String(a.EVENT_ID || "").split('-').pop(), 10) || 0;
            const seqB = parseInt(String(b.EVENT_ID || "").split('-').pop(), 10) || 0;
            return seqA - seqB;
        });

        if (sideGoals.length === 0) return;

        if (playerTeamWon) {
            if (playerSideG - opponentSideG === 1) {
                const lg = sideGoals[sideGoals.length - 1];
                if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                    winImpact++;
                    impactMatches.push({ match, type: 'WINNER (Deciding Goal)', playerMins: [lg.MINUTE] });
                }
            } else if (playerSideG > 1 && opponentSideG < playerSideG) {
                const scorers = [...new Set(sideGoals.map(g => String(g["PLAYER NAME"] || "").trim()))];
                if (scorers.length === 1 && scorers[0] === searchName) {
                    winImpact++;
                    impactMatches.push({ match, type: 'WINNER (Sole Scorer)', playerMins: sideGoals.map(g => g.MINUTE) });
                }
            }
        } else if (isDraw && playerSideG > 0) {
            const lg = sideGoals[sideGoals.length - 1];
            if (String(lg["PLAYER NAME"] || "").trim() === searchName) {
                drawImpact++;
                impactMatches.push({ match, type: 'DRAW (Equalizer)', playerMins: [lg.MINUTE] });
            }
        }
    });

    return { winImpact, drawImpact, impactMatches };
}

export function computePlayerAssistImpact(matches, allEvents, playerName, eventsByMatch = null) {
    const searchName = String(playerName || "").trim();
    let winImpact = 0;
    let drawImpact = 0;
    const impactMatches = [];

    (matches || []).forEach(match => {
        const mid = String(match.MATCH_ID);
        const gf = parseInt(match.GF) || 0;
        const ga = parseInt(match.GA) || 0;
        const res = match["W-D-L"];

        let matchEvents = [];
        if (eventsByMatch) {
            matchEvents = eventsByMatch.get(mid) || [];
        } else {
            matchEvents = (allEvents || []).filter(e => String(e.MATCH_ID) === mid);
        }

        const playerRecord = matchEvents.find(e => String(e["PLAYER NAME"] || "").trim() === searchName);
        if (!playerRecord) return;

        const isAhlySideInThisMatch = isAhlyTeam(playerRecord.TEAM);
        const playerTeamWon = isAhlySideInThisMatch ? (res === 'W') : (res === 'L');
        const isDraw = (res === 'D' || res === 'D.');
        const playerSideG = isAhlySideInThisMatch ? gf : ga;
        const opponentSideG = isAhlySideInThisMatch ? ga : gf;

        const sideGoals = matchEvents.filter(e =>
            isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
            (["GOAL", "هدف"].includes(String(e.TYPE || "").toUpperCase()) || String(e.TYPE_SUB || "").toUpperCase() === "PENGOAL")
        ).sort((a, b) => {
            const seqA = parseInt(String(a.EVENT_ID || "").split('-').pop(), 10) || 0;
            const seqB = parseInt(String(b.EVENT_ID || "").split('-').pop(), 10) || 0;
            return seqA - seqB;
        });

        if (sideGoals.length === 0) return;

        if (playerTeamWon) {
            if (playerSideG - opponentSideG === 1) {
                const lg = sideGoals[sideGoals.length - 1];
                const gId = String(lg.EVENT_ID);

                const assistRow = matchEvents.find(e =>
                    isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
                    ["ASSIST", "اسيست", "صنع"].includes(String(e.TYPE || "").toUpperCase()) &&
                    String(e.PARENT_EVENT_ID) === gId &&
                    String(e["PLAYER NAME"] || "").trim() === searchName &&
                    String(e["PLAYER NAME"] || "").trim() !== String(lg["PLAYER NAME"] || "").trim()
                );

                if (assistRow) {
                    winImpact++;
                    impactMatches.push({ match, type: 'WINNER (Deciding Assist)', playerMins: [assistRow.MINUTE] });
                }
            }
        } else if (isDraw && playerSideG > 0) {
            const lg = sideGoals[sideGoals.length - 1];
            const gId = String(lg.EVENT_ID);

            const assistRow = matchEvents.find(e =>
                isAhlyTeam(e.TEAM) === isAhlySideInThisMatch &&
                ["ASSIST", "اسيست", "صنع"].includes(String(e.TYPE || "").toUpperCase()) &&
                String(e.PARENT_EVENT_ID) === gId &&
                String(e["PLAYER NAME"] || "").trim() === searchName &&
                String(e["PLAYER NAME"] || "").trim() !== String(lg["PLAYER NAME"] || "").trim()
            );

            if (assistRow) {
                drawImpact++;
                impactMatches.push({ match, type: 'DRAW (Equalizer Assist)', playerMins: [assistRow.MINUTE] });
            }
        }
    });

    return { winImpact, drawImpact, impactMatches };
}
