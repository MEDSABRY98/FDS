export const EMPTY_MATCH = {
    "MATCH_ID": "", "AGE": "", "CHAMPION_SYSTEM": "", "DATE": "", "CHAMPION": "", "SEASON": "",
    "EGYPT MANAGER": "", "OPPONENT MANAGER": "", "REFREE": "", "ROUND": "", "PLACE": "",
    "H-A-N": "", "Egypt TEAM": "", "GF": "", "GA": "", "ET": "",
    "PEN": "", "OPPONENT TEAM": "", "NOTE": "", "MOTM": ""
};
export const EMPTY_LINEUP = { "MATCH_ID": "", "MATCH MINUTE": "", "TEAM": "", "PLAYER NAME": "", "CLUB": "", "STATU": "", "PLAYER NAME OUT": "", "OUT MINUTE": "", "TOTAL MINUTE": "" };
export const EMPTY_PLAYER = { "MATCH_ID": "", "EVENT_ID": "", "PARENT_EVENT_ID": "", "PLAYER NAME": "", "TEAM": "", "CLUB": "", "TYPE": "", "TYPE_SUB": "", "MINUTE": "", "HOW MISSED": "" };
export const EMPTY_GK = { "MATCH_ID": "", "EVENT_ID": "", "TEAM": "", "PLAYER NAME": "", "STATU": "", "OUT MINUTE": "", "GOALS CONCEDED": "" };

export const EGYPT_NT_MATCH_LINKED_TABLES = [
    "egy_NT_LINEUPDETAILS",
    "egy_NT_PLAYERDETAILS",
    "egy_NT_GKSDETAILS",
];

export const AUTOCOMPLETE_FIELDS = [
    'AGE', 'CHAMPION_SYSTEM', 'CHAMPION', 'SEASON', 'EGYPT MANAGER', 'OPPONENT MANAGER',
    'REFREE', 'ROUND', 'PLACE', 'H-A-N', 'Egypt TEAM', 'ET', 'PEN', 'OPPONENT TEAM', 'NOTE'
];

export const isFinalRound = (round) => String(round || "").trim() === "النهائي";
