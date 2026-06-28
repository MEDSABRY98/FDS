export function checkIfAhly(teamName, opponentName) {
    if (!teamName) return true;
    const name = String(teamName).trim();
    const opp = String(opponentName || "").trim();

    if (name === opp) return false;
    if (name === "الأهلي") return true;
    if (name.includes("أهلي") && !opp.includes("أهلي")) return true;

    return false;
}

export const formatMatchDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const getSubInfo = (subPlayer) => {
    const inMin = subPlayer["IN MINUTE"] || subPlayer["MINUTE IN"] || subPlayer["MINUTE"] || subPlayer["OUT MINUTE"];
    const playerOut = subPlayer["PLAYER NAME OUT"] || subPlayer["NAME OUT"];

    if (inMin) {
        return {
            minute: inMin,
            playerOut: playerOut || null
        };
    }
    return null;
};

export const getEventIcon = (type) => {
    const t = String(type || "").trim().toUpperCase();
    if (t === "PENASSISTGOAL") return "⭐";
    if (t === "PENASSISTMISSED") return "⚠️";
    if (t === "PENMAKEGOAL") return "🎯";
    if (t === "PENMAKEMISSED") return "❌";

    const tLower = t.toLowerCase();
    if (tLower.includes('هدف') || tLower.includes('goal')) return '⚽';
    if (tLower.includes('اسيست') || tLower.includes('assist') || tLower.includes('صنع')) return 'A';

    switch (tLower) {
        case 'انذار':
        case 'yellow': return '🟨';
        case 'طرد':
        case 'red': return '🟥';
        case 'تغيير':
        case 'sub': return '🔄';
        case 'pen miss': return '❌';
        default: return '⚽';
    }
};
