"use client";

import "../Leaderboard/int_trophy_leaderboard.css";
import "./int_trophy_aggregate_tables.css";

export default function IntTrophyAggregateMatrixTable({
    columns,
    rows,
    totalsByColumn,
    grandTotal,
    columnHeaderClass = "int-trophy-agg-game-header",
    totalsLabel = "items",
}) {
    if (!columns.length || !rows.length) return null;

    return (
        <div className="int-trophy-agg-table-wrap">
            <table className="int-trophy-agg-table">
                <thead>
                    <tr>
                        <th className="int-trophy-agg-team-header">TEAM</th>
                        {columns.map((col) => (
                            <th key={col} className={columnHeaderClass}>{col}</th>
                        ))}
                        <th className="int-trophy-agg-total-header">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.team} className="int-trophy-agg-row">
                            <td className="int-trophy-agg-team-cell">{row.team}</td>
                            {columns.map((col) => {
                                const count = row.cells[col] || 0;
                                return (
                                    <td
                                        key={col}
                                        className={`int-trophy-agg-cell ${count ? "has-value" : "empty"}`}
                                    >
                                        {count || "—"}
                                    </td>
                                );
                            })}
                            <td className="int-trophy-agg-cell int-trophy-agg-row-total">{row.total}</td>
                        </tr>
                    ))}
                    <tr className="int-trophy-agg-totals-row">
                        <td className="int-trophy-agg-team-cell">TOTAL</td>
                        {columns.map((col) => (
                            <td key={col} className="int-trophy-agg-cell">
                                {totalsByColumn[col] || "—"}
                            </td>
                        ))}
                        <td className="int-trophy-agg-cell int-trophy-agg-row-total">{grandTotal}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
