"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";
import "./intl_competitions.css";

export default function IntlClubCompetitions({ matches }) {
    const rows = useMemo(() => {
        const map = {};
        (matches || []).forEach((m) => {
            const key = `${m.GAME || "?"}|${m.KIND || "?"}|${m.Edition || "?"}`;
            if (!map[key]) map[key] = { game: m.GAME, kind: m.KIND, edition: m.Edition, count: 0 };
            map[key].count++;
        });
        return Object.values(map).sort((a, b) => String(b.edition).localeCompare(String(a.edition), undefined, { numeric: true }) || b.count - a.count);
    }, [matches]);

    if (!rows.length) return <NoData_db message="NO COMPETITION DATA" />;

    return (
        <div className="intl-competitions">
            <div className="intl-competitions-header">
                <h1>COMPETITIONS</h1>
            </div>
            <div className="intl-competitions-table-wrap">
                <table className="intl-competitions-table">
                    <thead>
                        <tr>
                            <th>GAME</th>
                            <th>KIND</th>
                            <th>Edition</th>
                            <th>MATCHES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={`${r.game}-${r.kind}-${r.edition}`}>
                                <td>{r.game}</td>
                                <td>{r.kind}</td>
                                <td>{r.edition}</td>
                                <td className="count">{r.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
