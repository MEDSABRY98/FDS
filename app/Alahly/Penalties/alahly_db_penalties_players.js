"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";

function SortableTh({ label, sortKey, sortConfig, onSort }) {
    const active = sortConfig.key === sortKey;
    return (
        <th
            className="sortable"
            onClick={() => onSort(sortKey)}
            style={{ color: active ? "var(--gold)" : "" }}
        >
            {label}
        </th>
    );
}

export default function AlAhlyPenaltiesPlayers({ rows, teamFilter, onTeamFilterChange, teamFilterLabels }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "total", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
        }));
    };

    const filtered = useMemo(() => {
        let list = (rows || []).filter((r) =>
            String(r.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        const { key, direction } = sortConfig;
        list = [...list].sort((a, b) => {
            const aVal = a[key] ?? 0;
            const bVal = b[key] ?? 0;
            if (typeof aVal === "string") {
                return direction === "asc"
                    ? String(aVal).localeCompare(String(bVal))
                    : String(bVal).localeCompare(String(aVal));
            }
            return direction === "asc" ? aVal - bVal : bVal - aVal;
        });
        return list;
    }, [rows, searchTerm, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const emptyMessage = !rows?.length
        ? "NO PENALTY DATA IN CURRENT FILTER"
        : searchTerm.trim()
            ? "NO PLAYERS MATCH YOUR SEARCH"
            : "NO PLAYERS IN CURRENT FILTER";

    return (
        <>
            <div className="penalties-controls">
                <DropDownList_db
                    options={Object.keys(teamFilterLabels).map((key) => ({
                        value: key,
                        label: teamFilterLabels[key],
                    }))}
                    value={teamFilter}
                    onChange={onTeamFilterChange}
                    placeholder="Select Category"
                />
                <SearchBar_db
                    value={searchTerm}
                    onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
                    placeholder="Search player..."
                />
            </div>
            <div className="player-table-container">
                <table className="modern-player-table fade-in penalties-players-table">
                    <colgroup>
                        <col style={{ width: "60px" }} />
                        <col style={{ width: "250px" }} />
                        <col style={{ width: "120px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "90px" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <SortableTh label="PLAYER" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="TOTAL" sortKey="total" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SCORE" sortKey="goal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MISS" sortKey="miss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SAVED" sortKey="saved" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="WON(G)" sortKey="wonGoal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="WON(M)" sortKey="wonMiss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MAKE(G)" sortKey="makeGoal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MAKE(M)" sortKey="makeMiss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="CONV%" sortKey="conversion" sortConfig={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="penalties-players-empty">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginated.map((r, i) => (
                                <tr key={r.name}>
                                    <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                                    <td className="p-name">{r.name}</td>
                                    <td style={{ fontWeight: 800 }}>{r.total}</td>
                                    <td className="g-val">{r.goal}</td>
                                    <td className="p-val">{r.miss}</td>
                                    <td className="pen-saved">{r.saved}</td>
                                    <td>{r.wonGoal}</td>
                                    <td>{r.wonMiss}</td>
                                    <td>{r.makeGoal}</td>
                                    <td>{r.makeMiss}</td>
                                    <td style={{ color: "var(--gold)" }}>{r.conversion}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {filtered.length > pageSize && (
                <div className="pagination-premium">
                    <button type="button" className="page-btn prev-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>PREV</button>
                    <span className="page-info">Page {currentPage} of {totalPages}</span>
                    <button type="button" className="page-btn next-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>NEXT</button>
                </div>
            )}
        </>
    );
}
