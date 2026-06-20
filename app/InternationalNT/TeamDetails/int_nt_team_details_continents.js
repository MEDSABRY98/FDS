"use client";

import { useMemo } from "react";
import IntNtTeamDetailsStatsTable from "./int_nt_team_details_stats_table";
import { buildContinentStats } from "./int_nt_team_details_utils";

export default function IntNtTeamDetailsContinents({ teamName, matches }) {
    const rows = useMemo(() => buildContinentStats(matches, teamName), [matches, teamName]);
    return (
        <IntNtTeamDetailsStatsTable
            rows={rows}
            labelColumn="CONTINENT"
            totalsSuffix="continents"
            searchPlaceholder="Search continents..."
            noDataMessage="NO CONTINENT DATA"
            searchEmptyMessage="NO CONTINENTS MATCH YOUR SEARCH"
        />
    );
}
