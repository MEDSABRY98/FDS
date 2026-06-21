"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";
import IntTrophyTeamDetailsBreakdownTable from "./int_trophy_team_details_breakdown_table";
import { buildBreakdownByOpponent } from "./int_trophy_team_details_utils";

export default function IntTrophyTeamDetailsByOpponent({ trophies, teamName, typeFilter }) {
    const { rows, totals } = useMemo(
        () => buildBreakdownByOpponent(trophies, teamName, typeFilter),
        [trophies, teamName, typeFilter]
    );

    if (!rows.length) return <NoData_db message="NO FINAL DATA BY OPPONENT" />;

    return (
        <IntTrophyTeamDetailsBreakdownTable
            rows={rows}
            totals={totals}
            columns={[
                { key: "opponent", label: "OPPONENT" },
                { key: "finals", label: "FINALS" },
                { key: "wins", label: "WINS", className: "result-w" },
                { key: "losses", label: "LOSSES", className: "result-l" },
            ]}
            rowKey={(row) => row.opponent}
            totalsLabel={`TOTAL (${rows.length} opponents)`}
        />
    );
}
