export const parseTimelineMinute = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw || raw === "?" || raw === "؟" || raw === "-") return null;
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(num) ? num : null;
};

export const parseTimelineEventOrder = (event) => {
    const isPenMissDetail = event?.eventType === 'penMiss';
    const id = String(
        isPenMissDetail
            ? (event?.PARENT_EVENT_ID || event?.EVENT_ID || "")
            : (event?.EVENT_ID || event?.PARENT_EVENT_ID || "")
    ).trim();
    if (!id) return Number.MAX_SAFE_INTEGER;

    const trailingNumber = id.match(/(\d+)(?!.*\d)/);
    const base = trailingNumber ? parseInt(trailingNumber[1], 10) : Number.MAX_SAFE_INTEGER - 1;

    return isPenMissDetail ? base + 0.5 : base;
};

export const compareTimelineEvents = (a, b) => {
    const orderA = parseTimelineEventOrder(a);
    const orderB = parseTimelineEventOrder(b);
    if (orderA !== orderB) return orderA - orderB;

    const minuteA = parseTimelineMinute(a.MINUTE);
    const minuteB = parseTimelineMinute(b.MINUTE);
    if (minuteA !== null && minuteB !== null && minuteA !== minuteB) {
        return minuteA - minuteB;
    }
    if (minuteA !== null && minuteB === null) return -1;
    if (minuteA === null && minuteB !== null) return 1;

    const aIsPenMissDetail = a?.eventType === 'penMiss';
    const bIsPenMissDetail = b?.eventType === 'penMiss';
    if (aIsPenMissDetail !== bIsPenMissDetail) {
        return aIsPenMissDetail ? 1 : -1;
    }

    return String(a.ROW_ID ?? "").localeCompare(String(b.ROW_ID ?? ""), undefined, { numeric: true });
};

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

export const getEventMeta = (event) => {
    const type = String(event.TYPE || "").trim().toUpperCase();
    const sub = String(event.TYPE_SUB || "").trim().toUpperCase();

    if (type === "PENASSISTGOAL") return { kind: "assist", label: "Penalty Assist" };
    if (type === "PENMAKEGOAL") return { kind: "assist", label: "Penalty Won" };
    if (type === "ASSIST" || type === "اسيست" || type === "صنع" || type.includes("ASSIST")) {
        return { kind: "assist", label: "Assist" };
    }

    if (event.eventType === "penMiss" || type === "PEN MISS") {
        return { kind: "miss", label: "Penalty Missed" };
    }

    if (type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء") {
        const isPen = sub === "PENGOAL" || sub === "هدف جزاء";
        return { kind: "goal", label: isPen ? "Penalty Goal" : "Goal" };
    }

    if (type === "انذار" || type === "YELLOW") return { kind: "card", label: "Yellow Card" };
    if (type === "طرد" || type === "RED") return { kind: "card", label: "Red Card" };
    if (type === "تغيير" || type === "SUB") return { kind: "sub", label: "Substitution" };

    return {
        kind: "other",
        label: event.TYPE || "Event",
        subLabel: event.TYPE_SUB || null
    };
};
