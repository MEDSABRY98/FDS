"use client";

import { useMemo } from "react";
import { buildContinentStats } from "./intl_club_details_utils";
import IntlClubDetailsStatsTable from "./intl_club_details_stats_table";

export default function IntlClubDetailsContinents({ clubName, matches }) {
    const rows = useMemo(() => buildContinentStats(matches, clubName), [matches, clubName]);

    return (
        <IntlClubDetailsStatsTable
            rows={rows}
            labelColumn="CONTINENT"
            totalsSuffix="continents"
            searchPlaceholder="Search continents..."
            noDataMessage="NO CONTINENT STATS AVAILABLE"
            searchEmptyMessage="NO CONTINENTS MATCH YOUR SEARCH"
        />
    );
}
