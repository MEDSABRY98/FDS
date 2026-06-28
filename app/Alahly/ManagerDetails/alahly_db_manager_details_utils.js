export function isGoalEvent(type, sub) {
    const typeUp = String(type || "").trim().toUpperCase();
    const subUp = String(sub || "").trim().toUpperCase();
    const subRaw = String(sub || "").trim();
    return ["GOAL", "هدف"].includes(typeUp) || typeUp === "PENGOAL" || subUp === "PENGOAL" || subRaw === "هدف جزاء";
}

function parseGoalEventOrder(eventId) {
    const id = String(eventId || "").trim();
    const trailing = id.match(/(\d+)(?!.*\d)/);
    return trailing ? parseInt(trailing[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function getMatchGoalScoreStates(match, matchEvents, managerName, result, isAhlyTeam) {
    const isAsAhly = String(match["AHLY MANAGER"] || "").trim() === managerName;

    const goals = (matchEvents || [])
        .filter((event) => isGoalEvent(event.TYPE, event.TYPE_SUB))
        .sort((a, b) => parseGoalEventOrder(a.EVENT_ID) - parseGoalEventOrder(b.EVENT_ID));

    let managedGoals = 0;
    let concededGoals = 0;
    let everAhead = false;
    let everBehind = false;

    goals.forEach((event) => {
        const scoredByAhly = isAhlyTeam(event.TEAM);
        const scoredByManaged = isAsAhly ? scoredByAhly : !scoredByAhly;

        if (scoredByManaged) managedGoals += 1;
        else concededGoals += 1;

        if (managedGoals > concededGoals) everAhead = true;
        if (managedGoals < concededGoals) everBehind = true;
    });

    return { everAhead, everBehind, result };
}

export function applyScoreStateStats(summary, scoreState) {
    if (scoreState.everAhead) {
        if (scoreState.result === "W") summary.aheadWin += 1;
        else if (scoreState.result === "D") summary.aheadDraw += 1;
        else summary.aheadLoss += 1;
    }

    if (scoreState.everBehind) {
        if (scoreState.result === "W") summary.behindWin += 1;
        else if (scoreState.result === "D") summary.behindDraw += 1;
        else summary.behindLoss += 1;
    }
}
