export function parseMatchDate(match) {
    if (!match?.DATE) return new Date(0);
    const dateStr = String(match.DATE);
    if (dateStr.includes("/")) return new Date(dateStr.split("/").reverse().join("-"));
    return new Date(dateStr);
}

export function normalizeTeamLabel(value) {
    return String(value || "").trim().toLowerCase();
}

export function isEgyptTeamSide(teamValue, match) {
    const name = String(teamValue || "").trim();
    if (!name) return false;

    const opponentTeam = String(match?.["OPPONENT TEAM"] || "").trim();
    const egyptTeamName = String(match?.["Egypt TEAM"] || match?.["EGYPT TEAM"] || "منتخب مصر").trim();
    const normalizedName = normalizeTeamLabel(name);

    if (normalizedName === "opponent" && opponentTeam) return false;
    if (opponentTeam && normalizedName === normalizeTeamLabel(opponentTeam)) return false;

    const egyptIdentifiers = new Set(
        ["مصر", "egypt", "منتخب مصر", "المنتخب المصري", egyptTeamName]
            .filter(Boolean)
            .map(normalizeTeamLabel)
    );

    return egyptIdentifiers.has(normalizedName);
}

export function isOwnGoal(event) {
    const goalType = String(event?.TYPE || "").trim().toUpperCase();
    const goalSubType = String(event?.TYPE_SUB || "").trim().toUpperCase();
    return goalType === "OG" || goalSubType === "OG";
}

export function isCountableGoalEvent(event) {
    if (isOwnGoal(event)) return false;
    const goalType = String(event?.TYPE || "").trim().toUpperCase();
    const goalSubType = String(event?.TYPE_SUB || "").trim().toUpperCase();
    return goalType === "GOAL" || goalType === "هدف" || goalSubType === "PENGOAL" || goalSubType === "هدف جزاء";
}

export function isAssistEvent(event) {
    const assistType = String(event?.TYPE || "").trim().toUpperCase();
    return assistType === "ASSIST" || assistType === "اسيست" || assistType === "صنع";
}

export function isEventOnPlayerSide(event, match, playerSideIsEgypt) {
    const team = String(event?.TEAM || "").trim();
    if (!team) return playerSideIsEgypt;
    return isEgyptTeamSide(team, match) === playerSideIsEgypt;
}

export function sortEventsByMinute(events) {
    return [...events].sort((a, b) => {
        const seqA = parseInt(String(a.EVENT_ID || "").split('-').pop(), 10) || 0;
        const seqB = parseInt(String(b.EVENT_ID || "").split('-').pop(), 10) || 0;
        return seqA - seqB;
    });
}

export function getPlayerSideFlag(playerRecord, match) {
    const playerTeam = String(playerRecord?.TEAM || "").trim();
    return playerTeam ? isEgyptTeamSide(playerTeam, match) : true;
}
