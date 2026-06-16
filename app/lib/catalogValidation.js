export const CATALOG_CONFIG = {
    db_PLAYERS: {
        idCol: "PLAYER_ID",
        nameCols: ["PLAYER_NAME"],
        idPrefix: "P-",
        label: "Player",
        labelAr: "اللاعب"
    },
    db_MANAGERS: {
        idCol: "MANAGER_ID",
        nameCols: ["MANAGER_NAME"],
        idPrefix: "M-",
        label: "Manager",
        labelAr: "المدرب"
    },
    db_REFEREES: {
        idCol: "REFEREE_ID",
        nameCols: ["REFEREE_NAME"],
        idPrefix: "REF-",
        label: "Referee",
        labelAr: "الحكم"
    },
    db_TEAMS: {
        idCol: "TEAM_ID",
        nameCols: ["TEAM_NAME"],
        idPrefix: "T-",
        label: "Team",
        labelAr: "الفريق"
    },
    db_COUNTRIES: {
        idCol: "COUNTRY_ID",
        nameCols: ["COUNTRY_NAME", "COUNTRY_NAME_EN"],
        idPrefix: "C-",
        label: "Country",
        labelAr: "الدولة"
    }
};

const SKIP_VALUES = new Set(["-", "unknown", "?", "؟", "n/a", "na", "none", ""]);

export function isSkippableCatalogValue(val) {
    if (val === null || val === undefined) return true;
    const s = String(val).trim();
    if (!s) return true;
    return SKIP_VALUES.has(s.toLowerCase());
}

export function getCatalogForColumn(colName) {
    const col = String(colName || "").toUpperCase();

    if (col.includes("COUNTRY")) return "db_COUNTRIES";
    if (
        col.includes("PLAYER") ||
        col === "MOTM" ||
        col === "PLAYERNAME" ||
        col === "CAPTAIN_ID" ||
        col.includes("CAPTAIN") ||
        (col.includes("GK") && !col.includes("TEAM"))
    ) {
        return "db_PLAYERS";
    }
    if (col.includes("MANAGER")) return "db_MANAGERS";
    if (col.includes("REF")) return "db_REFEREES";
    if (col.includes("TEAM") || col.includes("OPPONENT") || col === "CHAMPION" || col === "CLUB") {
        return "db_TEAMS";
    }

    return null;
}

export function isLikelyCatalogName(val, idPrefix) {
    if (typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (idPrefix && trimmed.toUpperCase().startsWith(idPrefix.toUpperCase())) return false;
    if (/^\d+$/.test(trimmed)) return false;
    return true;
}

export function buildCatalogError(catalog, value) {
    const cfg = CATALOG_CONFIG[catalog];
    const label = cfg?.labelAr || cfg?.label || catalog;
    return `"${value}" غير موجود في ${label}. أضفه أولاً من Global DB Management.`;
}