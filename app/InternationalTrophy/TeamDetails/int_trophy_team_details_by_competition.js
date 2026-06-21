"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";
import IntTrophyTeamDetailsBreakdownTable from "./int_trophy_team_details_breakdown_table";
import { buildBreakdownByCompetition } from "./int_trophy_team_details_utils";

export default function IntTrophyTeamDetailsByCompetition({ trophies, teamName, typeFilter }) {
    const { rows, totals } = useMemo(
        () => buildBreakdownByCompetition(trophies, teamName, typeFilter),
        [trophies, teamName, typeFilter]
    );

    if (!rows.length) return <NoData_db message="NO FINAL DATA BY COMPETITION" />;

    return (
        <IntTrophyTeamDetailsBreakdownTable
            rows={rows}
            totals={totals}
            columns={[
                { key: "game", label: "GAME" },
                { key: "competition", label: "COMPETITION" },
                { key: "finals", label: "FINALS" },
                { key: "wins", label: "WINS", className: "result-w" },
                { key: "losses", label: "LOSSES", className: "result-l" },
            ]}
            rowKey={(row) => `${row.game}|${row.competition}`}
            totalsLabel={`TOTAL (${rows.length} competitions)`}
        />
    );
}
