"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AlAhlyFinalsService } from "../Service/alahly_finals_service";
import { AlAhlyFinalsExcelExport } from "../ExportExcel/alahly_finals_export_excel";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import "./alahly_finals_matches.css";

function SearchScopeSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const rawOptions = [
        { value: "all", label: "All Fields" },
        { value: "opponent_team", label: "Opponent Team" },
        { value: "champion", label: "Champion" },
        { value: "season", label: "Season" },
        { value: "final_id", label: "Final ID" },
        { value: "ahly_manager", label: "Ahly Manager" }
    ];

    const options = [
        rawOptions[0],
        ...rawOptions.slice(1).sort((a, b) => a.label.localeCompare(b.label))
    ];

    const currentLabel = options.find(o => o.value === value)?.label || "All Fields";

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="search-scope-container" ref={containerRef}>
            <div
                className={`search-scope-box ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{currentLabel}</span>
                <span className="select-arrow">▼</span>
            </div>

            {isOpen && (
                <div className="search-scope-dropdown">
                    <div className="options-list">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                className={`option-item ${value === opt.value ? 'active' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .search-scope-container {
                    position: relative;
                    width: 100%;
                }
                .search-scope-box {
                    background: #fdfdfd;
                    border: 2px solid #eee;
                    padding: 0 20px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 500;
                    color: #0a0a0a;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 52px;
                    box-sizing: border-box;
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
                }
                .search-scope-box:hover {
                    border-color: #c9a84c;
                }
                .search-scope-box.open {
                    border-color: #c9a84c;
                    background: #fff;
                    box-shadow: 0 10px 30px rgba(201, 168, 76, 0.08);
                }
                .select-arrow {
                    font-size: 10px;
                    color: #c9a84c;
                    opacity: 0.8;
                    transition: transform 0.3s;
                }
                .search-scope-box.open .select-arrow {
                    transform: rotate(180deg);
                }
                .search-scope-dropdown {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: calc(100% + 6px);
                    background: #fff;
                    border: 2px solid #c9a84c;
                    border-radius: 12px;
                    z-index: 10000;
                    box-shadow: 0 10px 30px rgba(201, 168, 76, 0.1);
                    overflow: hidden;
                    animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .options-list {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 6px;
                }
                .option-item {
                    padding: 10px 14px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }
                .option-item:hover {
                    background: #f9f9f9;
                    color: #c9a84c;
                }
                .option-item.active {
                    background: rgba(201, 168, 76, 0.1);
                    color: #c9a84c;
                    font-weight: 700;
                }
                .options-list::-webkit-scrollbar {
                    width: 4px;
                }
                .options-list::-webkit-scrollbar-thumb {
                    background: #c9a84c;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

export default function AlAhlyFinalsMatches({ finalsData, onSelectMatch }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchScope, setSearchScope] = useState("all");
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
            if (searchScope === "all") {
                return (
                    String(item["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["CHAMPION"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["SEASON - NAME"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["FINAL_ID"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["AHLY MANAGER"] || "").toLowerCase().includes(lowSearch)
                );
            }

            const scopeMap = {
                opponent_team: "OPPONENT TEAM",
                champion: "CHAMPION",
                season: "SEASON - NAME",
                final_id: "FINAL_ID",
                ahly_manager: "AHLY MANAGER"
            };

            const colName = scopeMap[searchScope];
            if (!colName) return false;
            return String(item[colName] || "").toLowerCase().includes(lowSearch);
        });
    }, [sortedData, searchTerm, searchScope]);

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
        AlAhlyFinalsExcelExport.exportToExcel(exportData, "AlAhly_Finals_Record");
    };

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [filteredData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchScope]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return dateStr; // Table data already has preferred format usually
    };

    return (
        <div className="finals-matches-page">
            <div className="finals-matches-header">
                <h1 className="matches-title">AL AHLY FINALS <span className="gold-text">MATCHES</span></h1>

                <div className="match-search-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
                    <div style={{ width: '200px', flexShrink: 0 }}>
                        <SearchScopeSelect
                            value={searchScope}
                            onChange={setSearchScope}
                        />
                    </div>
                    <div className="matches-search-box" style={{ width: '100%', maxWidth: '350px' }}>
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Type search term..."
                        />
                    </div>
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
                                    <div 
                                        key={index} 
                                        className="f-row fade-in"
                                        onClick={() => onSelectMatch && onSelectMatch(match.FINAL_ID)}
                                    >
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
