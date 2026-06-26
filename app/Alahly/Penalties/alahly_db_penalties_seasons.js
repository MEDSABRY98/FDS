"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import {
    sumPenaltyRows,
    compareSeasonNameRows,
    compareSeasonNumberRows,
} from "./alahly_db_penalties_utils";

function SortableTh({ label, sortKey, sortConfig, onSort }) {
    const active = sortConfig.key === sortKey;
    return (
        <th
            className="sortable"
            style={{ color: active ? "var(--gold)" : undefined, cursor: "pointer", textAlign: "center" }}
            onClick={() => onSort(sortKey)}
        >
            {label} {active ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
        </th>
    );
}

export default function AlAhlyPenaltiesSeasons({ rowsName, rowsNumber }) {
    const [seasonMode, setSeasonMode] = useState("name");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "season", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const rows = seasonMode === "number" ? rowsNumber : rowsName;

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
        }));
    };

    const handleModeChange = (mode) => {
        setSeasonMode(mode);
        setSortConfig({ key: "season", direction: "desc" });
        setCurrentPage(1);
    };

    const filtered = useMemo(() => {
        let list = (rows || []).filter((r) =>
            String(r.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );

        const { key, direction } = sortConfig;

        if (key === "season") {
            const compare = seasonMode === "number" ? compareSeasonNumberRows : compareSeasonNameRows;
            list = [...list].sort((a, b) => compare(a, b, direction));
            return list;
        }

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
    }, [rows, searchTerm, sortConfig, seasonMode]);

    const totals = useMemo(() => sumPenaltyRows(rows), [rows]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (!rows || rows.length === 0) {
        return <NoData_db message="NO PENALTY DATA IN CURRENT FILTER" />;
    }

    return (
        <>
            <div className="penalties-controls">
                <SearchBar_db value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="Search season..." />
                <div className="penalties-season-toggle">
                    <button type="button" className={seasonMode === "name" ? "active" : ""} onClick={() => handleModeChange("name")}>Season Name</button>
                    <button type="button" className={seasonMode === "number" ? "active" : ""} onClick={() => handleModeChange("number")}>Season Number</button>
                </div>
            </div>
            <div className="table-container-premium">
                <table className="modern-h2h-table penalties-table penalties-seasons-table">
                    <thead>
                        <tr>
                            <th style={{ width: "50px", textAlign: "center" }}>#</th>
                            <SortableTh label="SEASON" sortKey="season" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="ATT(F)" sortKey="attFor" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SCORED" sortKey="scored" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MISS" sortKey="missed" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="SAVED" sortKey="saved" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="WON(G)" sortKey="wonGoal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="WON(M)" sortKey="wonMiss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="CONC(G)" sortKey="concGoal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="CONC(M)" sortKey="concMiss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MAKE(G)" sortKey="makeGoal" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="MAKE(M)" sortKey="makeMiss" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="CONV%" sortKey="conversion" sortConfig={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((row, idx) => (
                            <tr key={row.name}>
                                <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + idx + 1}</span></td>
                                <td className="season-cell">{row.name}</td>
                                <td>{row.attFor || "-"}</td>
                                <td className="pen-scored">{row.scored || "-"}</td>
                                <td className="pen-missed">{row.missed || "-"}</td>
                                <td className="pen-saved">{row.saved || "-"}</td>
                                <td>{row.wonGoal || "-"}</td>
                                <td>{row.wonMiss || "-"}</td>
                                <td className="pen-missed">{row.concGoal || "-"}</td>
                                <td>{row.concMiss || "-"}</td>
                                <td>{row.makeGoal || "-"}</td>
                                <td>{row.makeMiss || "-"}</td>
                                <td style={{ color: "var(--gold)" }}>{row.conversion}%</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row-premium">
                            <td colSpan="2">TOTALS</td>
                            <td>{totals.attFor}</td>
                            <td className="pen-scored">{totals.scored}</td>
                            <td className="pen-missed">{totals.missed}</td>
                            <td className="pen-saved">{totals.saved}</td>
                            <td>{totals.wonGoal}</td>
                            <td>{totals.wonMiss}</td>
                            <td className="pen-missed">{totals.concGoal}</td>
                            <td>{totals.concMiss}</td>
                            <td>{totals.makeGoal}</td>
                            <td>{totals.makeMiss}</td>
                            <td style={{ color: "var(--gold)" }}>{totals.conversion}%</td>
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
