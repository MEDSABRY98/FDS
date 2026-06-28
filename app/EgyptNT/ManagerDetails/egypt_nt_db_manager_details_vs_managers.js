"use client";

import { useMemo } from "react";
import { Manager_StatsSummary_Table } from "./egypt_nt_manager_details_utils";

export default function Manager_VsManagers_Module({ stats }) {
    const combined = useMemo(
        () => ({ ...stats.statsByOpponentManager, ...stats.statsAsFacingEgyptMgr }),
        [stats.statsByOpponentManager, stats.statsAsFacingEgyptMgr]
    );

    const rows = useMemo(
        () => Object.keys(combined).map((name) => ({ name, ...combined[name] })),
        [combined]
    );

    return (
        <Manager_StatsSummary_Table
            rows={rows}
            labelHeader="MANAGER"
            labelKey="name"
            searchPlaceholder="Search manager..."
        />
    );
}
