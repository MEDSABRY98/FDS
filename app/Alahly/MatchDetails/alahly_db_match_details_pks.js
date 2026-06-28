"use client";

import { useCallback } from "react";
import MatchDetailsPksTab from "../../Database/MatchDetailsPksTab_db";
import { ALAHLY_MATCH_PKS_CONFIG } from "../../Database/match_details_pks_config";
import { AlAhlyService } from "../Service/alahly_db_service";

export default function AlAhlyMatchDetailsPksTab({ matchId, matchInfo }) {
    const fetchMatchPks = useCallback(async (id) => {
        const rows = await AlAhlyService.getPKsByMatchId(id);
        return AlAhlyService.enrichPksWithMatchDetails(rows);
    }, []);

    return (
        <MatchDetailsPksTab
            matchId={matchId}
            matchInfo={matchInfo}
            config={ALAHLY_MATCH_PKS_CONFIG}
            fetchMatchPks={fetchMatchPks}
        />
    );
}
