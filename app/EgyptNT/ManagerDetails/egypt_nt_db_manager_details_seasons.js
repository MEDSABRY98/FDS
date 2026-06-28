"use client";

import { useMemo } from "react";
import { Manager_StatsSummary_Table, compareSeasonLabels } from "./egypt_nt_manager_details_utils";

export default function Manager_Seasons_Module({ stats }) {
    const rows = useMemo(
        () => Object.keys(stats.seasonalStats || {}).map((name) => ({ name, ...stats.seasonalStats[name] })),
        [stats.seasonalStats]
    );

    return (
        <Manager_StatsSummary_Table
            rows={rows}
            labelHeader="SEASON"
            labelKey="name"
            searchPlaceholder="Search season..."
            compareLabels={compareSeasonLabels}
        />
    );
}
