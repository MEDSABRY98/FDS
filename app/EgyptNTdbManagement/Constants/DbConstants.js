export const COLUMN_ORDER = {
    egy_NT_MATCHDETAILS: [
        "ROW_ID",
        "MATCH_ID",
        "AGE",
        "CHAMPION_SYSTEM",
        "SYSTEM_KIND",
        "DATE",
        "CHAMPION",
        "SEASON",
        "EGYPT MANAGER",
        "OPPONENT MANAGER",
        "REFREE",
        "ROUND",
        "H-A-N",
        "PLACE",
        "Egypt TEAM",
        "GF",
        "GA",
        "ET",
        "PEN",
        "OPPONENT TEAM",
        "NOTE",
        "W-L Q & F"
    ],
    egy_NT_PKS: [
        "ROW_ID",
        "MATCH_ID",
        "DATE",
        "PKS System",
        "CHAMPION System",
        "Egypt TEAM",
        "Egypt PLAYER",
        "Egypt STATUS",
        "EGYPT HOW MISS",
        "EGYPT GK",
        "OPPONENT TEAM",
        "OPPONENT PLAYER",
        "OPPONENT STATUS",
        "OPPONENT HOW MISS",
        "OPPONENT GK",
        "G-OPPONENT",
        "G-EGYPT",
        "PKS W-L"
    ],
    egy_NT_LINEUPDETAILS: [
        "ROW_ID",
        "MATCH_ID",
        "MATCH MINUTE",
        "TEAM",
        "PLAYER NAME",
        "CLUB",
        "STATU",
        "PLAYER NAME OUT",
        "OUT MINUTE",
        "TOTAL MINUTE"
    ],
    egy_NT_PLAYERDETAILS: [
        "ROW_ID",
        "MATCH_ID",
        "EVENT_ID",
        "PARENT_EVENT_ID",
        "PLAYER NAME",
        "TEAM",
        "CLUB",
        "TYPE",
        "TYPE_SUB",
        "MINUTE"
    ],
    egy_NT_GKSDETAILS: [
        "ROW_ID",
        "MATCH_ID",
        "TEAM",
        "PLAYER NAME",
        "CLUB",
        "STATU",
        "OUT MINUTE",
        "GOALS CONCEDED",
        "EVENT_ID"
    ],
    egy_NT_HOWPENMISSED: [
        "ROW_ID",
        "MATCH_ID",
        "HOW MISSED?",
        "TEAM",
        "CLUB",
        "MINUTE",
        "EVENT_ID"
    ],
    egy_NT_SQUAD: [
        "ROW_ID",
        "PLAYERNAME",
        "POSITION",
        "CLUB",
        "SEASON",
        "CHAMPION"
    ]
};

export const TABLES_TO_SORT_BY_ROWID = [
    'egy_NT_GKSDETAILS', 
    'egy_NT_HOWPENMISSED', 
    'egy_NT_LINEUPDETAILS', 
    'egy_NT_PKS', 
    'egy_NT_SQUAD'
];
