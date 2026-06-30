/** Fixed miss reasons for PENMISSED — not player catalog entries. */
export const PENALTY_MISS_DESCRIPTIONS = ["برا المرمى", "القائم", "العارضة", "؟"];

export function isPenaltyMissReason(value) {
    return PENALTY_MISS_DESCRIPTIONS.includes(String(value || "").trim());
}

export function isPlayerCatalogId(value) {
    return /^P-\d+/i.test(String(value || "").trim());
}

/** HOW MISSED values that must not be resolved via db_PLAYERS. */
export function isHowMissedCatalogExempt(value) {
    const raw = String(value || "").trim();
    if (!raw) return true;
    return isPenaltyMissReason(raw) || isPlayerCatalogId(raw);
}
