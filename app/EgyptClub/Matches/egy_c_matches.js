"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { exportMatchesToExcel } from "../ExcelExport/egy_c_excel_export";
import "./egy_c_matches.css";

function SearchScopeSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const rawOptions = [
        { value: "all", label: "All Fields" },
        { value: "egypt_team", label: "Egypt Team" },
        { value: "opponent_team", label: "Opponent Team" },
        { value: "champion", label: "Champion" },
        { value: "season", label: "Season" },
        { value: "round", label: "Round" },
        { value: "place", label: "Place" }
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

export default function EgyptClubMatches({ matches, onMatchClick }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchScope, setSearchScope] = useState("all");
    const pageSize = 50;

    const filteredBySearch = useMemo(() => {
        if (!searchTerm) return matches || [];
        const lowSearch = searchTerm.toLowerCase().trim();
        return (matches || []).filter(m => {
            if (searchScope === "all") {
                return (
                    String(m["EGYPT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["CHAMPION"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["SEASON"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["ROUND"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["PLACE"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["W-L Q & F"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["NOTE"] || "").toLowerCase().includes(lowSearch)
                );
            }

            const scopeMap = {
                egypt_team: "EGYPT TEAM",
                opponent_team: "OPPONENT TEAM",
                champion: "CHAMPION",
                season: "SEASON",
                round: "ROUND",
                place: "PLACE"
            };

            const colName = scopeMap[searchScope];
            if (!colName) return false;
            return String(m[colName] || "").toLowerCase().includes(lowSearch);
        });
    }, [matches, searchTerm, searchScope]);

    useEffect(() => {
        const handleGlobalExport = () => {
            exportMatchesToExcel(filteredBySearch, "EgyptClubs_Matches");
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [filteredBySearch]);

    const groupMatchesByMonth = (matchList) => {
        const groups = {};
        matchList.forEach(m => {
            if (!m.DATE) {
                const grp = "Unknown Date";
                if (!groups[grp]) groups[grp] = [];
                groups[grp].push(m);
                return;
            }
            const date = new Date(m.DATE);
            if (isNaN(date.getTime())) {
                const grp = "Unknown Date";
                if (!groups[grp]) groups[grp] = [];
                groups[grp].push(m);
                return;
            }
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const grp = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!groups[grp]) groups[grp] = [];
            groups[grp].push(m);
        });
        return groups;
    };

    const totalPages = Math.ceil(filteredBySearch.length / pageSize);
    const paginatedMatches = useMemo(() => {
        return filteredBySearch.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredBySearch, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchScope, matches]);

    const groupedMatches = useMemo(() => {
        return groupMatchesByMonth(paginatedMatches);
    }, [paginatedMatches]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const getResultColor = (wdl) => {
        if (wdl === "W") return "#10b981"; // Emerald
        if (wdl === "L") return "#ef4444"; // Red
        return "#f59e0b"; // Gold/Orange for Draw
    };

    const formatPenalties = (pen) => {
        if (!pen) return null;
        return `(PEN: ${pen})`;
    };

    const getVenueText = (han) => {
        const v = String(han || 'N').trim().toUpperCase();
        if (v === 'H') return 'H';
        if (v === 'A') return 'A';
        return 'N';
    };

    return (
        <div className="tab-content" id="tab-matches">
            <div className="matches-wrap">
                <div className="matches-header">
                    <div className="header-tabs-container">
                        <div className="section-title">EGYPT CLUBS <span className="accent">MATCHES</span></div>
                    </div>
                    <div className="gold-line"></div>

                    <div className="match-search-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
                        <div style={{ width: '200px', flexShrink: 0 }}>
                            <SearchScopeSelect
                                value={searchScope}
                                onChange={setSearchScope}
                            />
                        </div>
                        <div className="match-search-box" style={{ width: '100%', maxWidth: '350px' }}>
                            <SearchBar_db
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Type search term..."
                            />
                        </div>
                    </div>
                </div>

                {Object.keys(groupedMatches).length === 0 ? (
                    <NoData_db message="No matches found for current filters." />
                ) : (
                    Object.keys(groupedMatches).map(monthYear => (
                        <div key={monthYear} className="month-section fade-in">
                            <div className="luxury-month-divider">
                                <span className="m-text">{monthYear}</span>
                                <div className="m-line"></div>
                            </div>

                            <div className="match-list-vertical">
                                {groupedMatches[monthYear].map(m => (
                                    <div 
                                        key={m.ROW_ID || m.MATCH_ID} 
                                        className="modern-match-row-h" 
                                        onClick={() => onMatchClick && onMatchClick(m)}
                                    >
                                        <div 
                                            className="match-result-indicator"
                                            style={{ background: getResultColor(m["W-D-L"]) }}
                                        ></div>

                                        <div className="match-meta-left">
                                            <div className="match-date">
                                                {formatDate(m.DATE)}
                                            </div>
                                            <div className="match-meta-divider"></div>
                                            <div className="match-season">
                                                📅 {m.SEASON}
                                            </div>
                                            <div className="match-meta-divider"></div>
                                            <div className="match-round">
                                                ⚔️ {m.ROUND}
                                            </div>
                                        </div>

                                        <div className="match-board-center">
                                            <div className="match-team-name-left">
                                                {m["EGYPT TEAM"]}
                                            </div>

                                            <div className="match-score-box">
                                                <div className="match-score-value">
                                                    {m.GF} <span style={{ color: 'var(--gold, #c9a84c)' }}>-</span> {m.GA}
                                                </div>
                                                {m.PEN && (
                                                    <div className="match-penalties">
                                                        {formatPenalties(m.PEN)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="match-team-name-right">
                                                {m["OPPONENT TEAM"]}
                                            </div>
                                        </div>

                                        <div className="match-meta-right">
                                            <div 
                                                className="match-venue-badge"
                                                title={m.PLACE ? `Place: ${m.PLACE}` : ""}
                                            >
                                                {getVenueText(m["H-A-N"])}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {totalPages > 1 && (
                    <div className="pagination-matches">
                        <button 
                            className="page-btn prev-btn" 
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }} 
                            disabled={currentPage === 1}
                        >
                            ← PREV
                        </button>
                        <div className="page-info">
                            PAGE <span className="current-page">{currentPage}</span> OF <span className="total-pages">{totalPages}</span>
                        </div>
                        <button 
                            className="page-btn next-btn" 
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); }} 
                            disabled={currentPage === totalPages}
                        >
                            NEXT →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
