"use client";

import { useMemo } from "react";
import IntNtTeamDetailsStatsTable from "./int_nt_team_details_stats_table";
import { buildOpponentStats } from "./int_nt_team_details_utils";

export default function IntNtTeamDetailsOpponents({ teamName, matches }) {
    const rows = useMemo(() => buildOpponentStats(matches, teamName), [matches, teamName]);
    return (
        <IntNtTeamDetailsStatsTable
            rows={rows}
            labelColumn="OPPONENT"
            totalsSuffix="opponents"
            searchPlaceholder="Search opponents..."
            noDataMessage="NO OPPONENT DATA"
            searchEmptyMessage="NO OPPONENTS MATCH YOUR SEARCH"
        />
    );
}
