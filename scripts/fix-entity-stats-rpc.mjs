import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();

const APPLY = process.argv.includes("--apply");

const SQL = `
CREATE OR REPLACE FUNCTION public.get_entity_timeline_and_tables(p_table text, p_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id text;
    v_total_count int := 0;
    v_min_date date := null;
    v_max_date date := null;
    v_tables jsonb := '[]'::jsonb;
    v_temp_min date;
    v_temp_max date;
    v_temp_count int;
BEGIN
    IF p_table = 'db_PLAYERS' THEN
        SELECT "PLAYER_ID" INTO v_id FROM "db_PLAYERS" WHERE "PLAYER_NAME" = p_name LIMIT 1;
    ELSIF p_table = 'db_MANAGERS' THEN
        SELECT "MANAGER_ID" INTO v_id FROM "db_MANAGERS" WHERE "MANAGER_NAME" = p_name LIMIT 1;
    ELSIF p_table = 'db_STADIUMS' THEN
        SELECT "STADIUM_ID" INTO v_id FROM "db_STADIUMS" WHERE "STADIUM_NAME" = p_name LIMIT 1;
    ELSIF p_table = 'db_REFEREES' THEN
        SELECT "REFEREE_ID" INTO v_id FROM "db_REFEREES" WHERE "REFEREE_NAME" = p_name LIMIT 1;
    ELSIF p_table = 'db_TEAMS' THEN
        SELECT "TEAM_ID" INTO v_id FROM "db_TEAMS" WHERE "TEAM_NAME" = p_name LIMIT 1;
    ELSIF p_table = 'db_COUNTRIES' THEN
        SELECT "COUNTRY_ID" INTO v_id FROM "db_COUNTRIES" WHERE "COUNTRY_NAME" = p_name LIMIT 1;
    END IF;

    IF v_id IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'Entity not found',
            'entity_name', p_name
        );
    END IF;

    CREATE TEMP TABLE IF NOT EXISTS temp_entity_occurrences (
        table_name text,
        table_label text,
        min_date date,
        max_date date,
        cnt int
    ) ON COMMIT DROP;

    TRUNCATE temp_entity_occurrences;

    IF p_table = 'db_PLAYERS' THEN
        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_LINEUPDETAILS" d
        JOIN "alahly_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."PLAYER NAME" = v_id OR d."PLAYER NAME OUT" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_LINEUPDETAILS', 'Al Ahly Lineups', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_PLAYERDETAILS" d
        JOIN "alahly_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."PLAYER NAME" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_PLAYERDETAILS', 'Al Ahly Player Details', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_GKSDETAILS" d
        JOIN "alahly_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."PLAYER NAME" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_GKSDETAILS', 'Al Ahly Goalkeeper Details', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_PKS" d
        JOIN "alahly_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."AHLY PLAYER" = v_id OR d."OPPONENT PLAYER" = v_id OR d."AHLY GK" = v_id OR d."OPPONENT GK" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_PKS', 'Al Ahly Penalty Shootouts', v_temp_min, v_temp_max, v_temp_count);
        END IF;


        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_LINEUPDETAILS" d
        JOIN "egy_NT_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."PLAYER NAME" = v_id OR d."PLAYER NAME OUT" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_LINEUPDETAILS', 'Egypt NT Lineups', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_PLAYERDETAILS" d
        JOIN "egy_NT_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."PLAYER NAME" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_PLAYERDETAILS', 'Egypt NT Player Details', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_GKSDETAILS" d
        JOIN "egy_NT_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."PLAYER NAME" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_GKSDETAILS', 'Egypt NT Goalkeeper Details', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN(m."DATE"), MAX(m."DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_PKS" d
        JOIN "egy_NT_MATCHDETAILS" m ON d."MATCH_ID" = m."MATCH_ID"
        WHERE d."Egypt PLAYER" = v_id OR d."OPPONENT PLAYER" = v_id OR d."EGYPT GK" = v_id OR d."OPPONENT GK" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_PKS', 'Egypt NT Penalty Shootouts', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT COUNT(*) INTO v_temp_count FROM "egy_NT_SQUAD" WHERE "PLAYERNAME" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_SQUAD', 'Egypt NT Squads', null, null, v_temp_count);
        END IF;

    ELSIF p_table = 'db_MANAGERS' THEN
        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_MATCHDETAILS"
        WHERE "AHLY MANAGER" = v_id OR "OPPONENT MANAGER" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_MATCHDETAILS', 'Al Ahly Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;


        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_MATCHDETAILS"
        WHERE "EGYPT MANAGER" = v_id OR "OPPONENT MANAGER" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_MATCHDETAILS', 'Egypt NT Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;

    ELSIF p_table = 'db_STADIUMS' THEN
        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_MATCHDETAILS"
        WHERE "STAD" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_MATCHDETAILS', 'Al Ahly Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_MATCHDETAILS"
        WHERE "PLACE" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_MATCHDETAILS', 'Egypt NT Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;

    ELSIF p_table = 'db_REFEREES' THEN
        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_MATCHDETAILS"
        WHERE "REFREE" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_MATCHDETAILS', 'Al Ahly Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;


        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_MATCHDETAILS"
        WHERE "REFREE" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_MATCHDETAILS', 'Egypt NT Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;

    ELSIF p_table = 'db_TEAMS' THEN
        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "alahly_MATCHDETAILS"
        WHERE "AHLY TEAM" = v_id OR "OPPONENT TEAM" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('alahly_MATCHDETAILS', 'Al Ahly Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;


        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_CLUB_MATCHDETAILS"
        WHERE "EGYPT TEAM" = v_id OR "OPPONENT TEAM" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_CLUB_MATCHDETAILS', 'Egypt Club Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT MIN("DATE"), MAX("DATE"), COUNT(*)
        INTO v_temp_min, v_temp_max, v_temp_count
        FROM "egy_NT_MATCHDETAILS"
        WHERE "Egypt TEAM" = v_id OR "OPPONENT TEAM" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_MATCHDETAILS', 'Egypt NT Matches', v_temp_min, v_temp_max, v_temp_count);
        END IF;

        SELECT COUNT(*) INTO v_temp_count FROM "egy_NT_SQUAD" WHERE "CLUB" = v_id;
        IF v_temp_count > 0 THEN
            INSERT INTO temp_entity_occurrences VALUES ('egy_NT_SQUAD', 'Egypt NT Squads', null, null, v_temp_count);
        END IF;

    ELSIF p_table = 'db_COUNTRIES' THEN
        NULL;
    END IF;

    SELECT MIN(min_date), MAX(max_date), COALESCE(SUM(cnt), 0)
    INTO v_min_date, v_max_date, v_total_count
    FROM temp_entity_occurrences;

    SELECT json_agg(json_build_object(
        'table_name', table_name,
        'table_label', table_label,
        'min_date', to_char(min_date, 'YYYY-MM-DD'),
        'max_date', to_char(max_date, 'YYYY-MM-DD'),
        'count', cnt
    ) ORDER BY cnt DESC)
    INTO v_tables
    FROM temp_entity_occurrences;

    RETURN jsonb_build_object(
        'entity_id', v_id,
        'entity_name', p_name,
        'first_appearance', to_char(v_min_date, 'YYYY-MM-DD'),
        'last_appearance', to_char(v_max_date, 'YYYY-MM-DD'),
        'total_occurrences', v_total_count,
        'tables', COALESCE(v_tables, '[]'::jsonb)
    );
END;
$function$;
`;

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

if (!APPLY) {
    console.log("Dry run: would replace get_entity_timeline_and_tables (removed alahly_vs_zamalek_* refs)");
    console.log("Pass --apply to update the function.");
    await client.end();
    process.exit(0);
}

await client.query(SQL);
console.log("Updated get_entity_timeline_and_tables");

const test = await client.query(`
    SELECT public.get_entity_timeline_and_tables('db_PLAYERS', (
        SELECT "PLAYER_NAME" FROM "db_PLAYERS" WHERE "PLAYER_ID" = 'P-0490' LIMIT 1
    )) AS result
`);
console.log(JSON.stringify(test.rows[0]?.result, null, 2));

const stillHasDerby = await client.query(`
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'get_entity_timeline_and_tables'
    LIMIT 1
`);
console.log("Still references derby tables:", /alahly_vs_zamalek/.test(stillHasDerby.rows[0]?.def || ""));

await client.end();
