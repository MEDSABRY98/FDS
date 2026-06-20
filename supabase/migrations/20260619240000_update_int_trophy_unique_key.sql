DROP INDEX IF EXISTS int_trophy_general_business_key_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS int_trophy_general_business_key_uidx
  ON "int_TROPHY_GENERAL" ("TYPE", "GAME", "COMPETITION", "SEASON", "PLACE", "RUNNER-UP")
  WHERE "TYPE" IS NOT NULL AND btrim("TYPE") <> ''
    AND "GAME" IS NOT NULL AND btrim("GAME") <> ''
    AND "COMPETITION" IS NOT NULL AND btrim("COMPETITION") <> ''
    AND "SEASON" IS NOT NULL AND btrim("SEASON") <> '';
