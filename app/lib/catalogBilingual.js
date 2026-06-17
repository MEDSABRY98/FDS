const AR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LAT = /[A-Za-z]/;

export const CATALOG_BILINGUAL_TABLES = {
    db_PLAYERS: {
        idCol: "PLAYER_ID",
        nameColAr: "PLAYER_NAME",
        nameColEn: "PLAYER_NAME_EN",
    },
    db_MANAGERS: {
        idCol: "MANAGER_ID",
        nameColAr: "MANAGER_NAME",
        nameColEn: "MANAGER_NAME_EN",
    },
    db_REFEREES: {
        idCol: "REFEREE_ID",
        nameColAr: "REFEREE_NAME",
        nameColEn: "REFEREE_NAME_EN",
    },
    db_TEAMS: {
        idCol: "TEAM_ID",
        nameColAr: "TEAM_NAME",
        nameColEn: "TEAM_NAME_EN",
    },
    db_STADIUMS: {
        idCol: "STADIUM_ID",
        nameColAr: "STADIUM_NAME",
        nameColEn: "STADIUM_NAME_EN",
    },
    db_COUNTRIES: {
        idCol: "COUNTRY_ID",
        nameColAr: "COUNTRY_NAME",
        nameColEn: "COUNTRY_NAME_EN",
    },
};

export const CATALOG_COLUMN_LABELS = {
    PLAYER_NAME: "Arabic Name",
    PLAYER_NAME_EN: "English Name",
    MANAGER_NAME: "Arabic Name",
    MANAGER_NAME_EN: "English Name",
    REFEREE_NAME: "Arabic Name",
    REFEREE_NAME_EN: "English Name",
    TEAM_NAME: "Arabic Name",
    TEAM_NAME_EN: "English Name",
    STADIUM_NAME: "Arabic Name",
    STADIUM_NAME_EN: "English Name",
    COUNTRY_NAME: "Arabic Name",
    COUNTRY_NAME_EN: "English Name",
};

export const NAME_DISPLAY_LANG_KEY = "__GLOBAL_NAME_DISPLAY__";

export const NAME_DISPLAY_LANG_OPTIONS = [
    { value: "ar", label: "Arabic / عربي" },
    { value: "en", label: "English" },
];

export const NAME_DISPLAY_LANGUAGE_HINT = "Players, Managers, Referees, Teams, and Stadiums";

function titleCaseWords(text = "") {
    return String(text)
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function formatCatalogColumnLabel(columnName = "") {
    return CATALOG_COLUMN_LABELS[columnName] || titleCaseWords(columnName);
}

export function getScriptType(name) {
    const value = String(name || "");
    const hasArabic = AR.test(value);
    const hasLatin = LAT.test(value);
    if (hasArabic && !hasLatin) return "arabic";
    if (hasLatin && !hasArabic) return "latin";
    if (hasArabic && hasLatin) return "mixed";
    return "other";
}

export function splitNameCountry(name) {
    const parts = String(name || "")
        .split(/\s*[-–—]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    if (parts.length >= 2 && AR.test(parts[parts.length - 1])) {
        return {
            core: parts.slice(0, -1).join(" - "),
            country: parts[parts.length - 1],
        };
    }
    return { core: String(name || ""), country: null };
}

export function pickBilingualDisplayName(names, lang = "ar") {
    if (!names) return "";
    const ar = String(names.ar || "").trim();
    const en = String(names.en || "").trim();
    if (lang === "en") return en || ar;
    return ar || en;
}

export function sortCatalogNames(values = [], lang = "ar") {
    const locale = lang === "en" ? "en" : "ar";
    return [...values].filter(Boolean).sort((a, b) => a.localeCompare(b, locale));
}

export function buildCatalogOptions(rows, config, lang = "ar") {
    const { idCol, nameColAr, nameColEn } = config;
    const seen = new Set();
    const options = [];

    for (const row of rows || []) {
        const id = row?.[idCol];
        if (!id) continue;
        const label = pickBilingualDisplayName(
            { ar: row[nameColAr], en: row[nameColEn] },
            lang
        );
        if (!label || seen.has(label)) continue;
        seen.add(label);
        options.push(label);
    }

    return sortCatalogNames(options, lang);
}
