"use client";

import { useMemo } from "react";
import { Manager_StatsSummary_Table } from "./egypt_nt_manager_details_utils";

export default function Manager_VsTeams_Module({ stats }) {
    const combined = useMemo(
        () => ({ ...stats.statsByOpponent, ...stats.statsAsOpponentMgr }),
        [stats.statsByOpponent, stats.statsAsOpponentMgr]
    );

    const rows = useMemo(
        () => Object.keys(combined).map((name) => ({ name, ...combined[name] })),
        [combined]
    );

    return (
        <Manager_StatsSummary_Table
            rows={rows}
            labelHeader="OPPONENT TEAM"
            labelKey="name"
            searchPlaceholder="Search opponent team..."
        />
    );
}
