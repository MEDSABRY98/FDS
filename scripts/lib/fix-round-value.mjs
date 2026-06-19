const MONTH_MAP = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export const ROUND_MONTH_PATTERN = /^(\d{1,2})-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i;

export const ROUND_MONTH_SQL = `^[0-9]{1,2}-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$`;

export function fixRoundValue(round) {
    if (round == null || round === "") return round;
    const m = String(round).trim().match(ROUND_MONTH_PATTERN);
    if (!m) return round;
    const day = parseInt(m[1], 10);
    const month = MONTH_MAP[m[2].toLowerCase()];
    return `${day}/${month}`;
}
