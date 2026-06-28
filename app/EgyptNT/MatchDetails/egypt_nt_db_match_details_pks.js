"use client";

import { useCallback } from "react";
import MatchDetailsPksTab from "../../Database/MatchDetailsPksTab_db";
import { EGYPT_NT_MATCH_PKS_CONFIG } from "../../Database/match_details_pks_config";
import { EgyptNTPKSService } from "../../EgyptNTPKS/Service/egypt_nt_pks_service";

export default function EgyptNTMatchDetailsPksTab({ matchId, matchInfo }) {
    const fetchMatchPks = useCallback(async (id) => {
        const rows = await EgyptNTPKSService.getPKsByMatchId(id);
        return EgyptNTPKSService.enrichPksWithMatchDetails(rows);
    }, []);

    return (
        <MatchDetailsPksTab
            matchId={matchId}
            matchInfo={matchInfo}
            config={EGYPT_NT_MATCH_PKS_CONFIG}
            fetchMatchPks={fetchMatchPks}
        />
    );
}
