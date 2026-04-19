"use client";

import { useMemo, useState, useEffect } from "react";
import { AlAhlyFinalsService } from "../alahly/alahly_finals_service";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import "./alahly_finals_matches.css";

export default function AlAhlyFinalsMatches({ finalsData, onSelectMatch }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const pageSize = 50;

    const sortedData = useMemo(() => {
        if (!finalsData) return [];
        return [...finalsData].sort((a, b) => {
            const parseDate = (d) => {
                if (!d) return 0;
                const parts = String(d).split('/');
                if (parts.length === 3) {
                    // Try DD/MM/YYYY
                    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                }
                const dt = new Date(d).getTime();
                return isNaN(dt) ? 0 : dt;
            };
            return parseDate(b.DATE) - parseDate(a.DATE);
        });
    }, [finalsData]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return sortedData;
        const lowSearch = searchTerm.toLowerCase().trim();
        return sortedData.filter(item => {
            return (
                String(item["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                String(item["CHAMPION"] || "").toLowerCase().includes(lowSearch) ||
                String(item["SEASON - NAME"] || "").toLowerCase().includes(lowSearch) ||
                String(item["FINAL_ID"] || "").toLowerCase().includes(lowSearch) ||
                String(item["AHLY MANAGER"] || "").toLowerCase().includes(lowSearch)
            );
        });
    }, [sortedData, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleExport = () => {
        const exportData = filteredData.map((f, i) => ({
            "#": i + 1,
            "DATE": f.DATE,
            "COMPETITION": f.CHAMPION,
            "SEASON": f["SEASON - NAME"],
            "AL AHLY": "Al Ahly",
            "RESULT": `${f.GF} - ${f.GA}`,
            "OPPONENT": f["OPPONENT TEAM"],
            "W-D-L": f["W-D-L MATCH"],
            "OUTCOME": f["W-D-L FINAL"],
            "MANAGER": f["AHLY MANAGER"]
        }));
        AlAhlyFinalsService.exportToExcel(exportData, "AlAhly_Finals_Record");
    };

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [filteredData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return dateStr; // Table data already has preferred format usually
    };

    return (
        <div className="finals-matches-page">
            <div className="finals-matches-header">
                <h1 className="matches-title">AL AHLY FINALS <span className="gold-text">MATCHES</span></h1>

                <div className="matches-search-box">
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search finals by team, competition, manager, or season..."
                    />
                </div>
            </div>

            <div className="finals-list-container">
                {paginatedData.length === 0 ? (
                    <NoData_db message="No championship finals records found for this criteria." />
                ) : (
                    <div className="finals-table-wrapper">
                        <div className="finals-table-header">
                            <div className="f-col-index">#</div>
                            <div className="f-col-id">FINAL ID</div>
                            <div className="f-col-date">DATE</div>
                            <div className="f-col-season">SEASON</div>
                            <div className="f-col-team">AL AHLY</div>
                            <div className="f-col-score">SCORE</div>
                            <div className="f-col-pks">PKS SCORE</div>
                            <div className="f-col-team">OPPONENT</div>
                            <div className="f-col-outcome">W/L</div>
                        </div>

                        <div className="finals-table-body">
                            {paginatedData.map((match, index) => {
                                const outcome = String(match["W-D-L FINAL"] || "").toUpperCase();
                                const isWin = outcome.includes("W") || outcome === "CHAMPION";
                                const isLoss = outcome.includes("L") || outcome === "RUNNER-UP";

                                return (
                                    <div key={index} className="f-row fade-in">
                                        <div className="f-col-index">
                                            <span className="idx-badge">{(currentPage - 1) * pageSize + index + 1}</span>
                                        </div>
                                        <div className="f-col-id">{match.FINAL_ID || "N/A"}</div>
                                        <div className="f-col-date">{formatDate(match.DATE)}</div>
                                        <div className="f-col-season">{match["SEASON - NAME"]}</div>
                                        <div className="f-col-team">الأهلي</div>
                                        <div className="f-col-score">
                                            <div className="score-pill">
                                                {match.GF} - {match.GA}
                                            </div>
                                        </div>
                                        <div className="f-col-pks">
                                            {match.PEN ? <div className="pks-pill">{match.PEN}</div> : <span style={{ color: '#ddd' }}>—</span>}
                                        </div>
                                        <div className="f-col-team">{match["OPPONENT TEAM"]}</div>
                                        <div className="f-col-outcome">
                                            <span
                                                className={`outcome-status ${isWin ? 'win' : isLoss ? 'loss' : 'neutral'}`}
                                            >
                                                {outcome}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="finals-pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                        PREV
                    </button>
                    <div className="page-nums">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i);
                            if (p <= 0 || p > totalPages) return null;
                            return (
                                <button
                                    key={p}
                                    className={currentPage === p ? 'active' : ''}
                                    onClick={() => setCurrentPage(p)}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                        NEXT
                    </button>
                </div>
            )}
        </div>
    );
}
