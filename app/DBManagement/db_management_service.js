import { supabase } from "../Database";
import { getScriptType } from "../Database/CatalogBilingual_db";

const MERGE_BILINGUAL_CONFIG = {
    db_PLAYERS: { idCol: "PLAYER_ID", nameCol: "PLAYER_NAME", nameColEn: "PLAYER_NAME_EN" },
    db_MANAGERS: { idCol: "MANAGER_ID", nameCol: "MANAGER_NAME", nameColEn: "MANAGER_NAME_EN" },
    db_REFEREES: { idCol: "REFEREE_ID", nameCol: "REFEREE_NAME", nameColEn: "REFEREE_NAME_EN" },
    db_TEAMS: { idCol: "TEAM_ID", nameCol: "TEAM_NAME", nameColEn: "TEAM_NAME_EN" },
    db_STADIUMS: { idCol: "STADIUM_ID", nameCol: "STADIUM_NAME", nameColEn: "STADIUM_NAME_EN" },
};

async function fetchCatalogRowsByNames(table, names) {
    const cfg = MERGE_BILINGUAL_CONFIG[table];
    if (!cfg) return [];

    const rowsById = new Map();
    for (const name of names) {
        const trimmed = String(name || "").trim();
        if (!trimmed) continue;

        for (const col of [cfg.nameCol, cfg.nameColEn]) {
            const { data } = await supabase
                .from(table)
                .select(`${cfg.idCol}, ${cfg.nameCol}, ${cfg.nameColEn}`)
                .eq(col, trimmed);
            (data || []).forEach((row) => rowsById.set(row[cfg.idCol], row));
        }
    }

    return [...rowsById.values()];
}

function pickFirstNonEmpty(values) {
    return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

/**
 * Keep one catalog row, set Arabic/English names from the merge target + merged rows,
 * then delete duplicate catalog rows.
 */
async function finalizeMergedCatalogTarget(table, targetName, namesToMerge) {
    const cfg = MERGE_BILINGUAL_CONFIG[table];
    if (!cfg) return { error: null };

    const trimmedTarget = String(targetName || "").trim();
    if (!trimmedTarget) return { error: null };

    const lookupNames = [
        ...new Set([
            trimmedTarget,
            ...namesToMerge.map((name) => String(name || "").trim()).filter(Boolean),
        ]),
    ];
    const rows = await fetchCatalogRowsByNames(table, lookupNames);
    if (!rows.length) return { error: null };

    const survivor =
        rows.find(
            (row) => row[cfg.nameCol] === trimmedTarget || row[cfg.nameColEn] === trimmedTarget
        ) || rows[0];

    const survivorId = survivor[cfg.idCol];
    const otherIds = rows.map((row) => row[cfg.idCol]).filter((id) => id && id !== survivorId);

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

    if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase.from(table).update(updatePayload).eq(cfg.idCol, survivorId);
        if (error) return { error };
    }

    if (otherIds.length > 0) {
        const { error } = await supabase.from(table).delete().in(cfg.idCol, otherIds);
        if (error) return { error };
    }

    return { error: null };
}

export const DBManagementService = {
    /**
     * Merge multiple entity names (Players, Managers, or Stadiums) into one.
     * This updates all references across all tables and cleans up the duplicates.
     */
    async mergeEntities(table, targetName, namesToMerge) {
        try {
            console.log(`Merging ${namesToMerge.length} names in "${table}" into "${targetName}"...`);

            const sources = namesToMerge.filter(n => n !== targetName);
            if (sources.length === 0) return true;

            let updatePromises = [];

            if (table === "db_PLAYERS") {
                updatePromises = [
                    // Al Ahly Tables
                    supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('alahly_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('alahly_PKS').update({ "AHLY PLAYER": targetName }).in('AHLY PLAYER', sources),
                    supabase.from('alahly_PKS').update({ "OPPONENT PLAYER": targetName }).in('OPPONENT PLAYER', sources),
                    supabase.from('alahly_PKS').update({ "AHLY GK": targetName }).in('AHLY GK', sources),
                    supabase.from('alahly_PKS').update({ "OPPONENT GK": targetName }).in('OPPONENT GK', sources),

                    // Al Ahly Finals

                    // Egypt NT Tables
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "PLAYER NAME OUT": targetName }).in('PLAYER NAME OUT', sources),
                    supabase.from('egy_NT_GKSDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_PLAYERDETAILS').update({ "PLAYER NAME": targetName }).in('PLAYER NAME', sources),
                    supabase.from('egy_NT_SQUAD').update({ "PLAYERNAME": targetName }).in('PLAYERNAME', sources),
                    supabase.from('egy_NT_PKS').update({ "Egypt PLAYER": targetName }).in('Egypt PLAYER', sources),
                    supabase.from('egy_NT_PKS').update({ "OPPONENT PLAYER": targetName }).in('OPPONENT PLAYER', sources),
                    supabase.from('egy_NT_PKS').update({ "EGYPT GK": targetName }).in('EGYPT GK', sources),
                    supabase.from('egy_NT_PKS').update({ "OPPONENT GK": targetName }).in('OPPONENT GK', sources)
                ];
            }
            else if (table === "db_MANAGERS") {
                updatePromises = [
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "AHLY MANAGER": targetName }).in('AHLY MANAGER', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources),

                    // Al Ahly Finals Match Details

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "EGYPT MANAGER": targetName }).in('EGYPT MANAGER', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "OPPONENT MANAGER": targetName }).in('OPPONENT MANAGER', sources)
                ];
            }
            else if (table === "db_STADIUMS") {
                updatePromises = [
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "STAD": targetName }).in('STAD', sources),

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "PLACE": targetName }).in('PLACE', sources),

                    // Egypt Club Match Details
                    supabase.from('egy_CLUB_MATCHDETAILS').update({ "PLACE": targetName }).in('PLACE', sources)
                ];
            }
            else if (table === "db_REFEREES") {
                updatePromises = [
                    // Al Ahly Match Details
                    supabase.from('alahly_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources),

                    // Al Ahly Finals Match Details

                    // Egypt NT Match Details
                    supabase.from('egy_NT_MATCHDETAILS').update({ "REFREE": targetName }).in('REFREE', sources)
                ];
            }
            else if (table === "db_TEAMS") {
                updatePromises = [
                    // Al Ahly Finals

                    // Al Ahly
                    supabase.from('alahly_GKSDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('alahly_HOWPENMISSED').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('alahly_LINEUPDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "AHLY TEAM": targetName }).in('AHLY TEAM', sources),
                    supabase.from('alahly_MATCHDETAILS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),
                    supabase.from('alahly_PLAYERDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),

                    // Egypt Club
                    supabase.from('egy_CLUB_MATCHDETAILS').update({ "EGYPT TEAM": targetName }).in('EGYPT TEAM', sources),
                    supabase.from('egy_CLUB_MATCHDETAILS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),

                    // Egypt NT
                    supabase.from('egy_NT_GKSDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_HOWPENMISSED').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_LINEUPDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "Egypt TEAM": targetName }).in('Egypt TEAM', sources),
                    supabase.from('egy_NT_MATCHDETAILS').update({ "OPPONENT TEAM": targetName }).in('OPPONENT TEAM', sources),
                    supabase.from('egy_NT_PLAYERDETAILS').update({ "TEAM": targetName }).in('TEAM', sources),
                    supabase.from('egy_NT_SQUAD').update({ "CLUB": targetName }).in('CLUB', sources)
                ];
            }
            else if (table === "db_COUNTRIES") {
                updatePromises = [
                    supabase.rpc('merge_countries', { 
                        target_country: targetName, 
                        source_countries: sources 
                    })
                ];
            }

            // 1. Run updates on referencing tables first to ensure ID mapping succeeds before deletion
            if (updatePromises && updatePromises.length > 0) {
                const updateResults = await Promise.all(updatePromises);
                const updateErrors = updateResults.filter(r => r && r.error).map(r => r.error.message);
                if (updateErrors.length > 0) {
                    console.error("Merge partial fail (Updates):", updateErrors);
                    throw new Error("One or more tables failed to update during merge: " + updateErrors.join(", "));
                }
            }

            // 2. Update the surviving catalog row with the merged target name, then delete duplicates
            if (MERGE_BILINGUAL_CONFIG[table]) {
                const catalogResult = await finalizeMergedCatalogTarget(table, targetName, namesToMerge);
                if (catalogResult?.error) {
                    console.error("Merge partial fail (Catalog):", catalogResult.error.message);
                    throw new Error("Updates succeeded but failed to save merged catalog name: " + catalogResult.error.message);
                }
            }

            console.log("Merge operation completed successfully.");
            return true;
        } catch (error) {
            console.error("Merge error:", error.message);
            throw error;
        }
    }
};
