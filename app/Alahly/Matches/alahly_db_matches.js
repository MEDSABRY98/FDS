"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AlAhlyService } from "../Service/alahly_db_service";
import { AlAhlyExcelExport } from "../ExportExcel/alahly_export_excel";
import "./alahly_db_matches.css";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import {
    MATCH_EVENT_FILTER_OPTIONS,
    buildMatchEventIndex,
    matchPassesEventFilter,
} from "./alahly_db_matches_event_utils";

const SEARCH_SCOPE_OPTIONS = [
    { value: "all", label: "All Fields" },
    { value: "opponent_team", label: "Opponent Team" },
    { value: "opponent_manager", label: "Opponent Manager" },
    { value: "ahly_manager", label: "Ahly Manager" },
    { value: "season", label: "Season" },
    { value: "match_id", label: "Match ID" },
    { value: "stad", label: "Stadium" },
    { value: "referee", label: "Referee" },
];

function FilterDropdown({ value, onChange, options, width = "200px", sortRestAlphabetically = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const sortedOptions = useMemo(() => {
        if (!sortRestAlphabetically) return options;
        const [first, ...rest] = options;
        if (!first) return options;
        return [first, ...[...rest].sort((a, b) => a.label.localeCompare(b.label))];
    }, [options, sortRestAlphabetically]);

    const currentLabel = sortedOptions.find(o => o.value === value)?.label || sortedOptions[0]?.label || "";

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
        <div className="search-scope-container" ref={containerRef} style={{ width }}>
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
                        {sortedOptions.map((opt) => (
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

export default function AlAhlyMatches({ matches, playerDetails, onMatchClick }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchScope, setSearchScope] = useState("all");
    const [eventFilter, setEventFilter] = useState("all");
    const pageSize = 50;

    const matchEventIndex = useMemo(
        () => buildMatchEventIndex(playerDetails),
        [playerDetails]
    );

    const filteredBySearch = useMemo(() => {
        let list = matches || [];
        if (searchTerm) {
        const lowSearch = searchTerm.toLowerCase().trim();
        list = list.filter(m => {
            if (searchScope === "all") {
                return (
                    String(m["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["OPPONENT MANAGER"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["AHLY MANAGER"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["SEASON - NAME"] || "").toLowerCase().includes(lowSearch) ||
                    String(m.MATCH_ID || "").toLowerCase().includes(lowSearch) ||
                    String(m.STAD || "").toLowerCase().includes(lowSearch) ||
                    String(m.REFREE || "").toLowerCase().includes(lowSearch)
                );
            }

            const scopeMap = {
                opponent_team: "OPPONENT TEAM",
                opponent_manager: "OPPONENT MANAGER",
                ahly_manager: "AHLY MANAGER",
                season: "SEASON - NAME",
                match_id: "MATCH_ID",
                stad: "STAD",
                referee: "REFREE"
            };

            const colName = scopeMap[searchScope];
            if (!colName) return false;
            return String(m[colName] || "").toLowerCase().includes(lowSearch);
        });
        }

        if (eventFilter !== "all") {
            list = list.filter((m) => matchPassesEventFilter(m.MATCH_ID, matchEventIndex, eventFilter));
        }

        return list;
    }, [matches, searchTerm, searchScope, eventFilter, matchEventIndex]);

    const groupMatchesByMonth = (matchList) => {
        const groups = {};
        matchList.forEach(m => {
            if (!m.DATE) return;
            const date = new Date(m.DATE);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
            if (!groups[monthYear]) groups[monthYear] = [];
            groups[monthYear].push(m);
        });
        return groups;
    };

    const paginatedMatches = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredBySearch.slice(start, start + pageSize);
    }, [filteredBySearch, currentPage]);

    const groupedMatches = useMemo(() => groupMatchesByMonth(paginatedMatches), [paginatedMatches]);
    const totalPages = Math.ceil(filteredBySearch.length / pageSize);

    useEffect(() => {
        const handleGlobalExport = () => {
            handleExport();
        };
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [filteredBySearch]);

    const handleExport = () => {
        const exportData = filteredBySearch.map((m, i) => ({
            "#": i + 1,
            "DATE": m.DATE,
            "CHAMPION": m.CHAMPION,
            "SEASON": m["SEASON - NAME"],
            "VENUE": m["H-A-N"],
            "STADIUM": m.STAD,
            "REFEREE": m.REFREE,
            "AHLY MANAGER": m["AHLY MANAGER"],
            "OPPONENT MANAGER": m["OPPONENT MANAGER"],
            "TEAM A": m["AHLY TEAM"],
            "GF": m.GF,
            "GA": m.GA,
            "TEAM B": m["OPPONENT TEAM"]
        }));
        AlAhlyExcelExport.exportToExcel(exportData, "AlAhly_Matches_History");
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [matches, searchTerm, searchScope, eventFilter]);

    const getResultColor = (wdl) => {
        if (wdl === "W") return "#10b981"; // Emerald
        if (wdl === "L") return "#ef4444"; // Red
        return "#f59e0b"; // Gold/Orange for Draw
    };

    const getVenueText = (han) => {
        const v = String(han || 'N').trim().toUpperCase();
        if (v === 'H') return 'H';
        if (v === 'A') return 'A';
        return 'N';
    };

    const formatPenalties = (penString) => {
        if (!penString) return "";
        const isLoss = penString.toUpperCase().includes('L');
        const isWin = penString.toUpperCase().includes('W');
        const numbers = penString.match(/\d+/g);
        if (!numbers || numbers.length < 2) return `(${penString})`;
        let n1 = parseInt(numbers[0]);
        let n2 = parseInt(numbers[1]);
        const low = Math.min(n1, n2);
        const high = Math.max(n1, n2);
        return isLoss ? `(L ${low}-${high})` : `(W ${high}-${low})`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    return (
        <div className="tab-content" id="tab-matches">
            <div className="matches-wrap">
                <div className="matches-header">
                    <div className="header-tabs-container">
                        <div className="section-title">AL AHLY <span className="accent">MATCHES</span></div>
                    </div>
                    <div className="gold-line"></div>

                    <div className="match-search-container">
                        <div className="search-scope-wrapper">
                            <FilterDropdown
                                value={searchScope}
                                onChange={setSearchScope}
                                options={SEARCH_SCOPE_OPTIONS}
                            />
                        </div>
                        <div className="search-scope-wrapper event-filter-wrapper">
                            <FilterDropdown
                                value={eventFilter}
                                onChange={setEventFilter}
                                options={MATCH_EVENT_FILTER_OPTIONS}
                                width="220px"
                                sortRestAlphabetically={false}
                            />
                        </div>
                        <div className="match-search-box">
                            <SearchBar_db
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Type search term..."
                            />
                        </div>
                        <div className="match-count-badge" title="Matches matching current filters">
                            <span className="match-count-num">{filteredBySearch.length}</span>
                            <span className="match-count-label">MATCHES</span>
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
                                        key={m.MATCH_ID} 
                                        className="modern-match-row-h" 
                                        onClick={() => onMatchClick && onMatchClick(m.MATCH_ID, filteredBySearch)}
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
                                                📅 {m["SEASON - NAME"]}
                                            </div>
                                            {m.ROUND && (
                                                <>
                                                    <div className="match-meta-divider"></div>
                                                    <div className="match-round">
                                                        ⚔️ {m.ROUND}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="match-board-center">
                                            <div className="match-team-name-left">
                                                {m["AHLY TEAM"] || 'النادي الأهلي'}
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
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            disabled={currentPage === 1}
                        >
                            ← PREV
                        </button>
                        <div className="page-info">
                            PAGE <span className="current-page">{currentPage}</span> OF <span className="total-pages">{totalPages}</span>
                        </div>
                        <button 
                            className="page-btn next-btn" 
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            disabled={currentPage === totalPages}
                        >
                            NEXT →
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .matches-wrap {
                    max-width: 1400px;
                    width: 95%;
                    margin: 0 auto;
                }
                .matches-header {
                    padding-bottom: 10px;
                }
                .header-tabs-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 5px;
                }
                .gold-line {
                    height: 2px;
                    background: var(--gold, #c9a84c);
                    margin: 15px 0 20px;
                }
                .match-search-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    margin-top: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .search-scope-wrapper {
                    width: 200px;
                    flex-shrink: 0;
                }
                .event-filter-wrapper {
                    width: 220px;
                }
                .match-search-box {
                    width: 100%;
                    max-width: 350px;
                }
                .match-count-badge {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-width: 72px;
                    height: 52px;
                    padding: 0 14px;
                    border-radius: 12px;
                    border: 2px solid rgba(201, 168, 76, 0.35);
                    background: rgba(201, 168, 76, 0.08);
                    box-sizing: border-box;
                }
                .match-count-num {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 22px;
                    line-height: 1;
                    letter-spacing: 1px;
                    color: #0a0a0a;
                }
                .match-count-label {
                    font-family: 'Space Mono', monospace;
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: #888;
                    margin-top: 2px;
                }
                .month-section {
                    margin-bottom: 30px;
                }
                .luxury-month-divider {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin: 30px 0 15px;
                }
                .m-text {
                    font-family: 'Space Mono', monospace;
                    font-weight: 800;
                    font-size: 12px;
                    color: #fff;
                    background: var(--gold, #c9a84c);
                    padding: 4px 15px;
                    border-radius: 50px;
                }
                .m-line {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(to right, rgba(201, 168, 76, 0.3), transparent);
                }
                .match-list-vertical {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .modern-match-row-h {
                    cursor: pointer;
                    background: #fff;
                    border-radius: 8px;
                    padding: 12px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid #eef0f2;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
                    position: relative;
                    overflow: hidden;
                }
                .modern-match-row-h:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
                    border-color: rgba(201, 168, 76, 0.3);
                }
                .match-result-indicator {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                }
                .match-meta-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    width: 430px;
                    flex-shrink: 0;
                }
                .match-date {
                    font-size: 11px;
                    color: #888;
                    width: 85px;
                    font-family: 'Space Mono', monospace;
                }
                .match-meta-divider {
                    height: 15px;
                    width: 1px;
                    background: #eee;
                }
                .match-season {
                    font-size: 13px;
                    font-weight: 700;
                    color: #333;
                    width: 240px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .match-round {
                    font-size: 13px;
                    font-weight: 500;
                    color: #666;
                    width: 70px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .match-board-center {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    padding: 0 15px;
                }
                .match-team-name-left {
                    flex: 1;
                    text-align: right;
                    font-weight: 800;
                    font-size: 15px;
                    color: #000;
                }
                .match-team-name-right {
                    flex: 1;
                    text-align: left;
                    font-weight: 800;
                    font-size: 15px;
                    color: #0d0d0d;
                }
                .match-score-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 80px;
                }
                .match-score-value {
                    font-size: 18px;
                    font-weight: 900;
                    font-family: 'Space Mono', monospace;
                    color: #fff;
                    background: #0d0d0d;
                    padding: 3px 12px;
                    border-radius: 4px;
                    border: 1px solid var(--gold, #c9a84c);
                    letter-spacing: 0px;
                }
                .match-penalties {
                    font-size: 10px;
                    color: var(--gold, #c9a84c);
                    font-weight: 700;
                    margin-top: 3px;
                }
                .match-meta-right {
                    width: 160px;
                    text-align: right;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 12px;
                    flex-shrink: 0;
                }
                .match-venue-badge {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 900;
                    font-family: 'Space Mono', monospace;
                    background: #0d0d0d;
                    color: var(--gold, #c9a84c);
                    border: 1px solid var(--gold, #c9a84c);
                }
                .pagination-matches {
                    margin-top: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 30px;
                    padding: 20px 0;
                }
                .page-btn {
                    background: rgba(201, 168, 76, 0.1);
                    border: 1px solid rgba(201, 168, 76, 0.2);
                    padding: 8px 20px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.2s;
                    color: var(--gold, #c9a84c);
                    font-family: 'Space Mono', monospace;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .page-btn:hover:not(:disabled) {
                    background: var(--gold, #c9a84c);
                    color: #000;
                    border-color: var(--gold, #c9a84c);
                }
                .page-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .page-info {
                    font-family: 'Space Mono', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    color: #888;
                }
                .page-info .current-page {
                    color: #000;
                }
                .fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 1000px) {
                    .modern-match-row-h {
                        flex-direction: column;
                        gap: 15px;
                        padding: 20px;
                        text-align: center;
                    }
                    .modern-match-row-h > div {
                        width: 100% !important;
                        justify-content: center !important;
                        text-align: center !important;
                    }
                }
            `}</style>
        </div>
    );
}
