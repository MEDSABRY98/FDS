"use client";

import { useMemo } from "react";
import { buildOpponentStats } from "./intl_club_details_utils";
import IntlClubDetailsStatsTable from "./intl_club_details_stats_table";

export default function IntlClubDetailsOpponents({ clubName, matches }) {
    const rows = useMemo(() => buildOpponentStats(matches, clubName), [matches, clubName]);

    return (
        <IntlClubDetailsStatsTable
            rows={rows}
            labelColumn="OPPONENT"
            totalsSuffix="opponents"
            searchPlaceholder="Search opponents..."
            noDataMessage="NO OPPONENT STATS AVAILABLE"
            searchEmptyMessage="NO OPPONENTS MATCH YOUR SEARCH"
        />
    );
}
