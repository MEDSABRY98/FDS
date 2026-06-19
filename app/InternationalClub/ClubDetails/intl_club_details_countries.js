"use client";

import { useMemo } from "react";
import { buildCountryStats } from "./intl_club_details_utils";
import IntlClubDetailsStatsTable from "./intl_club_details_stats_table";

export default function IntlClubDetailsCountries({ clubName, matches }) {
    const rows = useMemo(() => buildCountryStats(matches, clubName), [matches, clubName]);

    return (
        <IntlClubDetailsStatsTable
            rows={rows}
            labelColumn="COUNTRY"
            totalsSuffix="countries"
            searchPlaceholder="Search countries..."
            noDataMessage="NO COUNTRY STATS AVAILABLE"
            searchEmptyMessage="NO COUNTRIES MATCH YOUR SEARCH"
        />
    );
}
