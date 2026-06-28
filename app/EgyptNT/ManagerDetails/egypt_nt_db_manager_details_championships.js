"use client";

import { useMemo } from "react";
import { Manager_StatsSummary_Table } from "./egypt_nt_manager_details_utils";

export default function Manager_Championships_Module({ stats }) {
    const rows = useMemo(
        () => Object.keys(stats.compStats || {}).map((name) => ({ name, ...stats.compStats[name] })),
        [stats.compStats]
    );

    return (
        <Manager_StatsSummary_Table
            rows={rows}
            labelHeader="CHAMPIONSHIP"
            labelKey="name"
            searchPlaceholder="Search championship..."
        />
    );
}
