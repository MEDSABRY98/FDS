/**
 * Classify and migrate bilingual catalog names.
 *
 * Usage:
 *   node scripts/migrate-bilingual-names.mjs           # dry-run + CSV report
 *   node scripts/migrate-bilingual-names.mjs --apply   # write updates to Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
    CATALOG_BILINGUAL_TABLES,
    getScriptType,
    splitNameCountry,
} from "../app/lib/catalogBilingual.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const supabaseUrl = "https://wsygeerxfdaavdtvogvy.supabase.co";
const supabaseAnonKey = "sb_publishable_Y2kr-reraWveea23ykKViw_8Z3AbtOk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AR_TO_LAT = {
    "ا": "a", "أ": "a", "إ": "i", "آ": "a", "ء": "",
    "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h",
    "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
    "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t",
    "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "q",
    "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h",
    "و": "w", "ؤ": "w", "ي": "y", "ى": "a", "ئ": "y",
    "ة": "h",
};

function transliterateArabic(text) {
    let out = "";
    for (const ch of String(text || "")) {
        out += AR_TO_LAT[ch] ?? ch;
    }
    return out
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase())
        .replace(/\bA\b/g, "a");
}

function titleCaseLatin(text) {
    return String(text || "")
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

async function fetchAllRows(table, select) {
    let all = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
        if (error) throw error;
        if (!data?.length) break;
        all = all.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }
    return all;
}

function buildCountryMaps(countries) {
    const arToEn = new Map();
    const enToAr = new Map();
    countries.forEach((row) => {
        const ar = String(row.COUNTRY_NAME || "").trim();
        const en = String(row.COUNTRY_NAME_EN || "").trim();
        if (ar && en) arToEn.set(ar, en);
        if (ar && en) enToAr.set(en.toLowerCase(), ar);
        if (en) enToAr.set(en, ar);
    });
    return { arToEn, enToAr };
}

function translateCountry(country, countryMaps, toLang) {
    const value = String(country || "").trim();
    if (!value) return "";
    if (toLang === "en") return countryMaps.arToEn.get(value) || value;
    return countryMaps.enToAr.get(value) || countryMaps.enToAr.get(value.toLowerCase()) || value;
}

function buildPersonName(table, rawName, countryMaps, withCountry) {
    const type = getScriptType(rawName);
    const split = splitNameCountry(rawName);
    const core = split.core || rawName;
    const country = split.country;

    let ar = "";
    let en = "";

    if (type === "arabic") {
        ar = withCountry && country ? `${core} - ${country}` : core;
        const coreEn = titleCaseLatin(transliterateArabic(core));
        const countryEn = country ? translateCountry(country, countryMaps, "en") : "";
        en = withCountry && countryEn ? `${coreEn} - ${countryEn}` : coreEn;
    } else if (type === "latin" || type === "mixed") {
        en = withCountry && country ? `${titleCaseLatin(core)} - ${translateCountry(country, countryMaps, "en") || country}` : titleCaseLatin(core);
        ar = withCountry && country
            ? `${core} - ${translateCountry(country, countryMaps, "ar") || country}`
            : core;
    } else {
        ar = String(rawName || "").trim();
        en = ar;
    }

    return { ar: ar.trim(), en: en.trim() };
}

function classifyRow(table, row, countryMaps) {
    const { idCol, nameColAr, nameColEn } = CATALOG_BILINGUAL_TABLES[table];
    const currentAr = String(row[nameColAr] || "").trim();
    const currentEn = String(row[nameColEn] || "").trim();
    const withCountry = table === "db_MANAGERS" || table === "db_REFEREES";

    let targetAr = currentAr;
    let targetEn = currentEn;
    let action = "noop";

    if (!currentAr && !currentEn) {
        return { id: row[idCol], action: "skip_empty", targetAr, targetEn };
    }

    if (currentAr && currentEn) {
        return { id: row[idCol], action: "already_bilingual", targetAr, targetEn };
    }

    if (!currentEn && currentAr) {
        const built = buildPersonName(table, currentAr, countryMaps, withCountry);
        targetEn = built.en;
        targetAr = built.ar;
        if (getScriptType(currentAr) === "latin") {
            action = "moved_latin_to_en";
            targetEn = built.en || titleCaseLatin(currentAr);
            if (getScriptType(targetAr) === "latin") targetAr = "";
        } else {
            action = "filled_en";
        }
    } else if (!currentAr && currentEn) {
        const built = buildPersonName(table, currentEn, countryMaps, withCountry);
        targetAr = built.ar;
        targetEn = built.en;
        action = "filled_ar";
    }

    if (targetAr === currentAr && targetEn === currentEn) {
        action = "noop";
    }

    return {
        id: row[idCol],
        action,
        currentAr,
        currentEn,
        targetAr,
        targetEn,
    };
}

function toCsv(rows) {
    const header = ["table", "id", "action", "current_ar", "current_en", "target_ar", "target_en"];
    const lines = [header.join(",")];
    rows.forEach((row) => {
        lines.push([
            row.table,
            row.id,
            row.action,
            JSON.stringify(row.currentAr || ""),
            JSON.stringify(row.currentEn || ""),
            JSON.stringify(row.targetAr || ""),
            JSON.stringify(row.targetEn || ""),
        ].join(","));
    });
    return lines.join("\n");
}

async function applyUpdatesWithPg(updates) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required for --apply.");
    }

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();

    let applied = 0;
    let failed = 0;

    try {
        await client.query("BEGIN");

        for (const update of updates) {
            const { table, idCol, nameColAr, nameColEn, id, targetAr, targetEn } = update;
            try {
                await client.query(
                    `UPDATE "${table}" SET "${nameColAr}" = $1, "${nameColEn}" = $2 WHERE "${idCol}" = $3`,
                    [targetAr || null, targetEn || null, id]
                );
                applied += 1;
            } catch (error) {
                failed += 1;
                console.error(`Failed ${table} ${id}: ${error.message}`);
            }
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        await client.end();
    }

    return { applied, failed };
}

async function main() {
    const apply = process.argv.includes("--apply");
    const countries = await fetchAllRows("db_COUNTRIES", "COUNTRY_ID, COUNTRY_NAME, COUNTRY_NAME_EN");
    const countryMaps = buildCountryMaps(countries);

    const report = [];
    const updates = [];

    for (const table of Object.keys(CATALOG_BILINGUAL_TABLES)) {
        if (table === "db_COUNTRIES") continue;

        const { idCol, nameColAr, nameColEn } = CATALOG_BILINGUAL_TABLES[table];
        let rows;
        try {
            rows = await fetchAllRows(table, `${idCol}, ${nameColAr}, ${nameColEn}`);
        } catch (error) {
            console.warn(`Skipping ${table}: ${error.message}`);
            rows = await fetchAllRows(table, `${idCol}, ${nameColAr}`);
        }

        rows.forEach((row) => {
            const result = classifyRow(table, row, countryMaps);
            report.push({
                table,
                id: result.id,
                action: result.action,
                currentAr: result.currentAr,
                currentEn: result.currentEn,
                targetAr: result.targetAr,
                targetEn: result.targetEn,
            });

            if (result.action !== "noop" && result.action !== "skip_empty" && result.action !== "already_bilingual") {
                updates.push({
                    table,
                    idCol,
                    nameColAr,
                    nameColEn,
                    id: result.id,
                    targetAr: result.targetAr,
                    targetEn: result.targetEn,
                });
            }
        });
    }

    const csvPath = join(rootDir, "scripts", "migrate-bilingual-names-report.csv");
    writeFileSync(csvPath, toCsv(report), "utf8");

    const summary = report.reduce((acc, row) => {
        acc[row.action] = (acc[row.action] || 0) + 1;
        return acc;
    }, {});

    console.log("Bilingual catalog migration report");
    console.log(JSON.stringify(summary, null, 2));
    console.log(`CSV: ${csvPath}`);
    console.log(`Pending updates: ${updates.length}`);

    if (!apply) {
        console.log("Dry run only. Re-run with --apply to write changes.");
        return;
    }

    const { applied, failed } = await applyUpdatesWithPg(updates);
    console.log(`Applied updates: ${applied}`);
    if (failed > 0) console.log(`Failed updates: ${failed}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
