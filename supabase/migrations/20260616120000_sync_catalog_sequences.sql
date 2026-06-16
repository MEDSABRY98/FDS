-- Sync catalog ID sequences after bulk imports (prevents duplicate ROW_ID on insert)
DO $$
DECLARE
  max_val integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING("ROW_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_PLAYERS";
  PERFORM setval('db_players_row_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("PLAYER_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_PLAYERS";
  PERFORM setval('db_players_player_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("ROW_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_MANAGERS";
  PERFORM setval('db_managers_row_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("MANAGER_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_MANAGERS";
  PERFORM setval('db_managers_manager_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("ROW_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_TEAMS";
  PERFORM setval('db_teams_row_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("TEAM_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_TEAMS";
  PERFORM setval('db_teams_team_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("ROW_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_STADIUMS";
  PERFORM setval('db_stadiums_row_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("STADIUM_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_STADIUMS";
  PERFORM setval('db_stadiums_stadium_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("ROW_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_REFEREES";
  PERFORM setval('db_referees_row_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("REFEREE_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_REFEREES";
  PERFORM setval('db_referees_referee_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("ROW_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_COUNTRIES";
  PERFORM setval('db_countries_row_id_seq', max_val, true);

  SELECT COALESCE(MAX(CAST(SUBSTRING("COUNTRY_ID" FROM '[0-9]+$') AS INTEGER)), 0)
    INTO max_val FROM "db_COUNTRIES";
  PERFORM setval('db_countries_country_id_seq', max_val, true);
END $$;
