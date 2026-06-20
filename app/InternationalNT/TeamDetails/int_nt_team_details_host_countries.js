"use client";

import { useMemo } from "react";
import IntNtTeamDetailsStatsTable from "./int_nt_team_details_stats_table";
import { buildHostCountryStats } from "./int_nt_team_details_utils";

export default function IntNtTeamDetailsHostCountries({ teamName, matches }) {
    const rows = useMemo(() => buildHostCountryStats(matches, teamName), [matches, teamName]);
    return (
        <IntNtTeamDetailsStatsTable
            rows={rows}
            labelColumn="HOST COUNTRY"
            totalsSuffix="countries"
            searchPlaceholder="Search host countries..."
            noDataMessage="NO HOST COUNTRY DATA"
            searchEmptyMessage="NO HOST COUNTRIES MATCH YOUR SEARCH"
        />
    );
}
