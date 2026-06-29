export const EMPTY_MATCH = {
    "MATCH_ID": "", "CHAMPION SYSTEM": "", "DATE": "", "CHAMPION": "", "SEASON - NAME": "",
    "SEASON - NUMBER": "", "AHLY MANAGER": "", "OPPONENT MANAGER": "", "REFREE": "", "ROUND": "",
    "H-A-N": "", "STAD": "", "AHLY TEAM": "", "GF": "", "GA": "", "ET": "",
    "PEN": "", "OPPONENT TEAM": "", "NOTE": "", "MOTM": ""
};
export const EMPTY_LINEUP = { "MATCH_ID": "", "MATCH MINUTE": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "PLAYER NAME OUT": "", "OUT MINUTE": "", "TOTAL MINUTE": "" };
export const EMPTY_PLAYER = { "MATCH_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", "TEAM": "", "TYPE": "", "TYPE_SUB": "", "MINUTE": "", "HOW MISSED?": "" };
export const EMPTY_GK = { "MATCH_ID": "", "EVENT_ID": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "OUT MINUTE": "", "GOALS CONCEDED": "" };

export const ALAHLY_MATCH_LINKED_TABLES = [
    "alahly_LINEUPDETAILS",
    "alahly_PLAYERDETAILS",
    "alahly_GKSDETAILS",
    "alahly_PKS",
    "alahly_MEDIATRACKER",
];

export const AUTOCOMPLETE_FIELDS = [
    'CHAMPION SYSTEM', 'CHAMPION', 'SEASON - NAME', 'SEASON - NUMBER', 'AHLY MANAGER', 'OPPONENT MANAGER',
    'REFREE', 'ROUND', 'H-A-N', 'STAD', 'AHLY TEAM', 'ET', 'PEN', 'OPPONENT TEAM', 'NOTE'
];

export const isFinalRound = (round) => String(round || "").trim() === "النهائي";
