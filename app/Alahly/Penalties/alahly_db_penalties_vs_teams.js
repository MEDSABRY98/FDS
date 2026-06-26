"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { sumPenaltyRows } from "./alahly_db_penalties_utils";

function SortableTh({ label, sortKey, sortConfig, onSort, rowSpan = 1, colSpan = 1 }) {
    const active = sortConfig.key === sortKey;
    return (
        <th
            className="sortable"
            rowSpan={rowSpan}
            colSpan={colSpan}
            style={{ color: active ? "var(--gold)" : undefined, cursor: "pointer" }}
            onClick={() => onSort(sortKey)}
        >
            {label}
        </th>
    );
}

export default function AlAhlyPenaltiesVsTeams({ rows }) {
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
                    ? String(aVal).localeCompare(String(bVal), "ar")
                    : String(bVal).localeCompare(String(aVal), "ar");
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

    const cell = (value, className = "") => (
        <td className={className}>{value || "-"}</td>
    );

    return (
        <>
            <div className="penalties-controls">
                <SearchBar_db
                    value={searchTerm}
                    onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
                    placeholder="Search opponent..."
                />
            </div>
            <div className="table-container-premium">
                <table className="modern-h2h-table penalties-table penalties-vs-teams-table">
                    <thead>
                        <tr className="penalties-vs-teams-group-row">
                            <th rowSpan={2} style={{ width: "50px" }}>#</th>
                            <th rowSpan={2}>TEAM</th>
                            <th colSpan={4}>FOR AHLY</th>
                            <th colSpan={4}>AGAINST AHLY</th>
                        </tr>
                        <tr className="penalties-vs-teams-subhead">
                            <SortableTh label="ATT" sortKey="attFor" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="G" sortKey="scored" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MISS" sortKey="missed" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SAVED" sortKey="saved" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="ATT" sortKey="concAtt" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="G" sortKey="concGoal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MISS" sortKey="concMiss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SAVED" sortKey="concSaved" sortConfig={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((row, idx) => (
                            <tr key={row.name}>
                                <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + idx + 1}</span></td>
                                <td className="opponent-cell">{row.name}</td>
                                {cell(row.attFor)}
                                {cell(row.scored, "pen-scored")}
                                {cell(row.missed, "pen-missed")}
                                {cell(row.saved, "pen-saved")}
                                {cell(row.concAtt)}
                                {cell(row.concGoal, "pen-missed")}
                                {cell(row.concMiss)}
                                {cell(row.concSaved, "pen-saved")}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row-premium">
                            <td colSpan={2} style={{ textAlign: "center" }}>TOTALS</td>
                            <td>{totals.attFor}</td>
                            <td className="pen-scored">{totals.scored}</td>
                            <td className="pen-missed">{totals.missed}</td>
                            <td className="pen-saved">{totals.saved}</td>
                            <td>{totals.concAtt}</td>
                            <td className="pen-missed">{totals.concGoal}</td>
                            <td>{totals.concMiss}</td>
                            <td className="pen-saved">{totals.concSaved}</td>
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
