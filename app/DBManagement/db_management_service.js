import { supabase } from "../Database";
import { getScriptType } from "../Database/CatalogBilingual_db";

const MERGE_BILINGUAL_CONFIG = {
    db_PLAYERS: { idCol: "PLAYER_ID", nameCol: "PLAYER_NAME", nameColEn: "PLAYER_NAME_EN" },
    db_MANAGERS: { idCol: "MANAGER_ID", nameCol: "MANAGER_NAME", nameColEn: "MANAGER_NAME_EN" },
    db_REFEREES: { idCol: "REFEREE_ID", nameCol: "REFEREE_NAME", nameColEn: "REFEREE_NAME_EN" },
    db_TEAMS: { idCol: "TEAM_ID", nameCol: "TEAM_NAME", nameColEn: "TEAM_NAME_EN" },
    db_STADIUMS: { idCol: "STADIUM_ID", nameCol: "STADIUM_NAME", nameColEn: "STADIUM_NAME_EN" },
};

/** Every [table, column] pair that stores a catalog ID (kept in sync with Supabase_db maps). */
const MERGE_CATALOG_REFERENCES = {
    db_PLAYERS: [
        ["alahly_GKSDETAILS", "PLAYER NAME"],
        ["alahly_LINEUPDETAILS", "PLAYER NAME"],
        ["alahly_LINEUPDETAILS", "PLAYER NAME OUT"],
        ["alahly_MATCHDETAILS", "MOTM"],
        ["alahly_PKS", "AHLY GK"],
        ["alahly_PKS", "AHLY PLAYER"],
        ["alahly_PKS", "OPPONENT GK"],
        ["alahly_PKS", "OPPONENT PLAYER"],
        ["alahly_PLAYERDETAILS", "PLAYER NAME"],
        ["alahly_PLAYERDETAILS", "HOW MISSED?"],
        ["egy_NT_GKSDETAILS", "PLAYER NAME"],
        ["egy_NT_LINEUPDETAILS", "PLAYER NAME"],
        ["egy_NT_LINEUPDETAILS", "PLAYER NAME OUT"],
        ["egy_NT_MATCHDETAILS", "MOTM"],
        ["egy_NT_PKS", "EGYPT GK"],
        ["egy_NT_PKS", "Egypt PLAYER"],
        ["egy_NT_PKS", "OPPONENT GK"],
        ["egy_NT_PKS", "OPPONENT PLAYER"],
        ["egy_NT_PLAYERDETAILS", "PLAYER NAME"],
        ["egy_NT_PLAYERDETAILS", "HOW MISSED?"],
        ["egy_NT_SQUAD", "PLAYERNAME"],
    ],
    db_MANAGERS: [
        ["alahly_MATCHDETAILS", "AHLY MANAGER"],
        ["alahly_MATCHDETAILS", "OPPONENT MANAGER"],
        ["egy_NT_MATCHDETAILS", "EGYPT MANAGER"],
        ["egy_NT_MATCHDETAILS", "OPPONENT MANAGER"],
        ["int_TROPHY", "W-MANAGER"],
        ["int_TROPHY", "L-MANAGER"],
    ],
    db_REFEREES: [
        ["alahly_MATCHDETAILS", "REFREE"],
        ["egy_NT_MATCHDETAILS", "REFREE"],
    ],
    db_STADIUMS: [
        ["alahly_MATCHDETAILS", "STAD"],
        ["egy_NT_MATCHDETAILS", "PLACE"],
        ["egy_CLUB_MATCHDETAILS", "PLACE"],
        ["egy_CLUB_TROPHY", "PLACE"],
        ["int_TROPHY", "PLACE"],
    ],
    db_TEAMS: [
        ["alahly_GKSDETAILS", "TEAM"],
        ["alahly_LINEUPDETAILS", "TEAM"],
        ["alahly_MATCHDETAILS", "AHLY TEAM"],
        ["alahly_MATCHDETAILS", "OPPONENT TEAM"],
        ["alahly_PLAYERDETAILS", "TEAM"],
        ["egy_CLUB_MATCHDETAILS", "EGYPT TEAM"],
        ["egy_CLUB_MATCHDETAILS", "OPPONENT TEAM"],
        ["egy_CLUB_TROPHY", "CHAMPION"],
        ["egy_CLUB_TROPHY", "RUNNER-UP"],
        ["egy_NT_GKSDETAILS", "TEAM"],
        ["egy_NT_LINEUPDETAILS", "TEAM"],
        ["egy_NT_LINEUPDETAILS", "CLUB"],
        ["egy_NT_MATCHDETAILS", "Egypt TEAM"],
        ["egy_NT_MATCHDETAILS", "OPPONENT TEAM"],
        ["egy_NT_MATCHDETAILS_CANCELLED", "Egypt TEAM"],
        ["egy_NT_MATCHDETAILS_CANCELLED", "OPPONENT TEAM"],
        ["egy_NT_PLAYERDETAILS", "TEAM"],
        ["egy_NT_PLAYERDETAILS", "CLUB"],
        ["egy_NT_SQUAD", "CLUB"],
        ["int_club_MATCHDETAILS", "TEAM A"],
        ["int_club_MATCHDETAILS", "TEAM B"],
        ["int_nt_MATCHDETAILS", "TEAMA"],
        ["int_nt_MATCHDETAILS", "TEAMB"],
        ["int_TROPHY", "CHAMPION"],
        ["int_TROPHY", "RUNNER-UP"],
    ],
};

async function fetchCatalogRowsForMerge(table, tokens) {
    const cfg = MERGE_BILINGUAL_CONFIG[table];
    if (!cfg) return [];

    const rowsById = new Map();
    const uniqueTokens = [...new Set(tokens.map((token) => String(token || "").trim()).filter(Boolean))];

    for (const token of uniqueTokens) {
        const { data: byId } = await supabase
            .from(table)
            .select(`${cfg.idCol}, ${cfg.nameCol}, ${cfg.nameColEn}`)
            .eq(cfg.idCol, token);
        (byId || []).forEach((row) => rowsById.set(row[cfg.idCol], row));

        for (const col of [cfg.nameCol, cfg.nameColEn]) {
            const { data } = await supabase
                .from(table)
                .select(`${cfg.idCol}, ${cfg.nameCol}, ${cfg.nameColEn}`)
                .eq(col, token);
            (data || []).forEach((row) => rowsById.set(row[cfg.idCol], row));
        }
    }

    return [...rowsById.values()];
}

function pickFirstNonEmpty(values) {
    return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function collectRowAliases(row, cfg) {
    return [row[cfg.idCol], row[cfg.nameCol], row[cfg.nameColEn]]
        .map((value) => String(value || "").trim())
        .filter(Boolean);
}

async function buildMergePlan(table, targetName, namesToMerge) {
    const cfg = MERGE_BILINGUAL_CONFIG[table];
    if (!cfg) return null;

    const trimmedTarget = String(targetName || "").trim();
    if (!trimmedTarget) return null;

    const lookupTokens = [
        ...new Set([
            trimmedTarget,
            ...namesToMerge.map((name) => String(name || "").trim()).filter(Boolean),
        ]),
    ];

    const rows = await fetchCatalogRowsForMerge(table, lookupTokens);
    if (!rows.length) return null;

    const survivor =
        rows.find(
            (row) =>
                row[cfg.idCol] === trimmedTarget ||
                row[cfg.nameCol] === trimmedTarget ||
                row[cfg.nameColEn] === trimmedTarget
        ) || rows[0];

    const survivorId = survivor[cfg.idCol];
    const otherIds = rows.map((row) => row[cfg.idCol]).filter((id) => id && id !== survivorId);

    const replacementAliases = [
        ...new Set(
            rows
                .flatMap((row) => collectRowAliases(row, cfg))
                .filter((alias) => alias !== survivorId)
        ),
    ];

    const arValues = rows.map((row) => row[cfg.nameCol]);
    const enValues = rows.map((row) => row[cfg.nameColEn]);
    const targetScript = getScriptType(trimmedTarget);

    let finalAr = pickFirstNonEmpty(arValues);
    let finalEn = pickFirstNonEmpty(enValues);

    if (targetScript === "arabic" || targetScript === "mixed") {
        finalAr = trimmedTarget;
    } else if (targetScript === "latin") {
        finalEn = trimmedTarget;
    } else {
        finalAr = trimmedTarget;
    }

    const updatePayload = {};
    if (finalAr) updatePayload[cfg.nameCol] = finalAr;
    if (finalEn) updatePayload[cfg.nameColEn] = finalEn;

    return {
        cfg,
        survivorId,
        otherIds,
        replacementAliases,
        updatePayload,
    };
}

/**
 * Delete duplicate catalog rows first, then save merged names on the survivor.
 */
async function finalizeMergedCatalogTarget(table, plan) {
    if (!plan) return { error: null };

    const { cfg, survivorId, otherIds, updatePayload } = plan;

    if (otherIds.length > 0) {
        const { error } = await supabase.from(table).delete().in(cfg.idCol, otherIds);
        if (error) return { error };
    }

    if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase.from(table).update(updatePayload).eq(cfg.idCol, survivorId);
        if (error) return { error };
    }

    return { error: null };
}

function refUpdate(tableName, column, survivorId, aliases) {
    if (!aliases.length) return null;
    return supabase.from(tableName).update({ [column]: survivorId }).in(column, aliases);
}

function buildCatalogReferenceUpdates(table, survivorId, aliases) {
    if (!aliases.length) return [];

    const refs = MERGE_CATALOG_REFERENCES[table] || [];
    return refs
        .map(([tableName, column]) => refUpdate(tableName, column, survivorId, aliases))
        .filter(Boolean);
}

function buildLegacyNameAliases(targetName, namesToMerge) {
    return namesToMerge
        .map((name) => String(name || "").trim())
        .filter((name) => name && name !== targetName);
}

export const DBManagementService = {
    /**
     * Merge duplicate catalog entities into one survivor ID.
     * Match/event tables are rewired by ID; the survivor row keeps the chosen display names.
     */
    async mergeEntities(table, targetName, namesToMerge) {
        try {
            const trimmedTarget = String(targetName || "").trim();
            console.log(`Merging ${namesToMerge.length} names in "${table}" into "${trimmedTarget}"...`);

            const mergePlan = MERGE_BILINGUAL_CONFIG[table]
                ? await buildMergePlan(table, trimmedTarget, namesToMerge)
                : null;

            let updatePromises = [];

            if (mergePlan) {
                updatePromises = buildCatalogReferenceUpdates(
                    table,
                    mergePlan.survivorId,
                    mergePlan.replacementAliases
                );
            } else if (MERGE_BILINGUAL_CONFIG[table]) {
                const legacyAliases = buildLegacyNameAliases(trimmedTarget, namesToMerge);
                if (legacyAliases.length === 0) return true;
                updatePromises = buildCatalogReferenceUpdates(table, trimmedTarget, legacyAliases);
            } else if (table === "db_COUNTRIES") {
                const sources = namesToMerge
                    .map((name) => String(name || "").trim())
                    .filter((name) => name && name !== trimmedTarget);
                if (sources.length === 0) return true;

                updatePromises = [
                    supabase.rpc("merge_countries", {
                        target_country: trimmedTarget,
                        source_countries: sources,
                    }),
                ];
            } else {
                return true;
            }

            if (updatePromises.length > 0) {
                const updateResults = await Promise.all(updatePromises);
                const updateErrors = updateResults.filter((r) => r && r.error).map((r) => r.error.message);
                if (updateErrors.length > 0) {
                    console.error("Merge partial fail (Updates):", updateErrors);
                    throw new Error("One or more tables failed to update during merge: " + updateErrors.join(", "));
                }
            }

            if (mergePlan) {
                const catalogResult = await finalizeMergedCatalogTarget(table, mergePlan);
                if (catalogResult?.error) {
                    console.error("Merge partial fail (Catalog):", catalogResult.error.message);
                    throw new Error(
                        "References updated but failed to finalize catalog merge: " + catalogResult.error.message
                    );
                }
            }

            console.log("Merge operation completed successfully.");
            return true;
        } catch (error) {
            console.error("Merge error:", error.message);
            throw error;
        }
    },
};
