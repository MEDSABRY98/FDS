"use client";

import "../Leaderboard/int_trophy_leaderboard.css";
import "./int_trophy_team_details.css";

export default function IntTrophyTeamDetailsBreakdownTable({ rows, totals, columns, rowKey, totalsLabel }) {
    return (
        <div className="int-trophy-table-wrap">
            <table className="int-trophy-table int-trophy-team-breakdown-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={rowKey(row)}>
                            {columns.map((col) => (
                                <td key={col.key} className={col.className || ""}>
                                    {row[col.key] ?? "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                    <tr className="int-trophy-team-totals-row">
                        {columns.map((col, index) => (
                            <td key={col.key} className={col.className || ""}>
                                {index === 0 ? totalsLabel : (totals[col.key] ?? "—")}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
