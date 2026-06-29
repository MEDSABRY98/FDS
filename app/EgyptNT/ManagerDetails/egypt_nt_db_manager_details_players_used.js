"use client";

import { useMemo, useState, useCallback } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { SortIndicator } from "./egypt_nt_manager_details_utils";

export default function Manager_PlayersUsed_Module({ stats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "apps", direction: "desc" });

    const requestSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
        }));
    }, []);

    const playersList = useMemo(() => {
        let items = Object.values(stats.playerUsedStats || {})
            .map((p) => ({ ...p, ga: (p.goals || 0) + (p.assists || 0) }))
            .filter((p) => String(p.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase()));

        items.sort((a, b) => {
            const key = sortConfig.key;
            const aVal = key === "name" ? String(a.name || "") : (a[key] || 0);
            const bVal = key === "name" ? String(b.name || "") : (b[key] || 0);

            if (typeof aVal === "string") {
                const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
                return sortConfig.direction === "asc" ? cmp : -cmp;
            }

            return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        });

        return items;
    }, [stats.playerUsedStats, searchTerm, sortConfig]);

    const totals = useMemo(() => (
        playersList.reduce((acc, p) => ({
            apps: acc.apps + (p.apps || 0),
            mins: acc.mins + (p.mins || 0),
            ga: acc.ga + (p.ga || 0),
            goals: acc.goals + (p.goals || 0),
            assists: acc.assists + (p.assists || 0),
        }), { apps: 0, mins: 0, ga: 0, goals: 0, assists: 0 })
    ), [playersList]);

    const renderSortTh = (key, label, extraClass = "") => (
        <th
            key={key}
            className={`mgr-sortable${extraClass ? ` ${extraClass}` : ""}`}
            onClick={() => requestSort(key)}
        >
            {label}
            <SortIndicator sortConfig={sortConfig} columnKey={key} />
        </th>
    );

    return (
        <div className="fade-in">
            <div className="mgr-stats-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search player name..."
                />
            </div>

            <div style={{ overflowX: "auto" }}>
                {playersList.length === 0 ? (
                    <NoData_db message="No players found for this manager." />
                ) : (
                    <table className="player-match-table mgr-matches-table mgr-stats-table" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "28%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "14%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                {renderSortTh("name", "PLAYER NAME", "mgr-season-col")}
                                {renderSortTh("apps", "APPEARANCES")}
                                {renderSortTh("mins", "MINUTES")}
                                {renderSortTh("ga", "G+A")}
                                {renderSortTh("goals", "GOALS")}
                                {renderSortTh("assists", "ASSISTS")}
                            </tr>
                        </thead>
                        <tbody>
                            {playersList.map((p, idx) => (
                                <tr key={p.name}>
                                    <td className="mgr-rank-cell">{idx + 1}</td>
                                    <td className="mgr-season-col">{p.name}</td>
                                    <td className="mgr-mp-cell">{p.apps}</td>
                                    <td>{p.mins}&apos;</td>
                                    <td className="mgr-ga-cell">{p.ga}</td>
                                    <td className="mgr-goals-cell">{p.goals}</td>
                                    <td className="mgr-assists-cell">{p.assists}</td>
                                </tr>
                            ))}
                            <tr className="mgr-stats-total-row">
                                <td className="mgr-rank-cell">—</td>
                                <td className="mgr-season-col">TOTAL</td>
                                <td className="mgr-mp-cell">{totals.apps}</td>
                                <td>{totals.mins}&apos;</td>
                                <td className="mgr-ga-cell">{totals.ga}</td>
                                <td className="mgr-goals-cell">{totals.goals}</td>
                                <td className="mgr-assists-cell">{totals.assists}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
