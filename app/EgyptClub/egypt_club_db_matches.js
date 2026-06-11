"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import { exportMatchesToExcel } from "./egypt_club_excel_export";
import "./egypt_club_db_matches.css";

export default function EgyptClubMatches({ matches, onMatchClick }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const pageSize = 50;

    const filteredBySearch = useMemo(() => {
        if (!searchTerm) return matches || [];
        const lowSearch = searchTerm.toLowerCase().trim();
        return (matches || []).filter(m => {
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
        });
    }, [matches, searchTerm]);

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
    }, [searchTerm, matches]);

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

                    <div className="match-search-container">
                        <div className="match-search-box">
                            <SearchBar_db
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Search matches (Team, Champ, Season, Round, Place...)"
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
                                            <span className="match-note">
                                                {m["W-L Q & F"] ? m["W-L Q & F"] : (m.NOTE ? m.NOTE : "")}
                                            </span>
                                            
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
