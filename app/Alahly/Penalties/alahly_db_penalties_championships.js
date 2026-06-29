"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { sumPenaltyRows } from "./alahly_db_penalties_utils";

function SortableTh({ label, sortKey, sortConfig, onSort, style }) {
    const active = sortConfig.key === sortKey;
    return (
        <th
            className="sortable"
            style={{ ...style, color: active ? "var(--gold)" : undefined, cursor: "pointer" }}
            onClick={() => onSort(sortKey)}
        >
            {label} {active ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
        </th>
    );
}

export default function AlAhlyPenaltiesChampionships({ rows }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "attFor", direction: "desc" });
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

    const totals = useMemo(() => sumPenaltyRows(rows), [rows]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (!rows || rows.length === 0) {
        return <NoData_db message="NO PENALTY DATA IN CURRENT FILTER" />;
    }

    return (
        <>
            <div className="penalties-controls">
                <SearchBar_db value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="Search competition..." />
            </div>
            <div className="table-container-premium">
                <table className="modern-h2h-table penalties-table penalties-championships-table">
                    <thead>
                        <tr>
                            <th style={{ width: "50px" }}>#</th>
                            <SortableTh label="COMPETITION" sortKey="name" sortConfig={sortConfig} onSort={handleSort} style={{ textAlign: "center" }} />
                            <SortableTh label="ATT" sortKey="attFor" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SCORED" sortKey="scored" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="CONV%" sortKey="conversion" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MISS" sortKey="missed" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SAVED" sortKey="saved" sortConfig={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((row, idx) => (
                            <tr key={row.name}>
                                <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + idx + 1}</span></td>
                                <td className="champion-cell">{row.name}</td>
                                <td>{row.attFor || "-"}</td>
                                <td className="pen-scored">{row.scored || "-"}</td>
                                <td style={{ color: "var(--gold)" }}>{row.conversion}%</td>
                                <td className="pen-missed">{row.missed || "-"}</td>
                                <td className="pen-saved">{row.saved || "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row-premium">
                            <td colSpan="2" style={{ textAlign: "center" }}>TOTALS</td>
                            <td>{totals.attFor}</td>
                            <td className="pen-scored">{totals.scored}</td>
                            <td style={{ color: "var(--gold)" }}>{totals.conversion}%</td>
                            <td className="pen-missed">{totals.missed}</td>
                            <td className="pen-saved">{totals.saved}</td>
                        </tr>
                    </tfoot>
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
