"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { EgyptNTService } from "./egypt_nt_db_service";
import { EgyptNTExcelExport } from "./egypt_nt_export_excel";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";

function SearchScopeSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const options = [
        { value: "all", label: "All Fields" },
        { value: "opponent_team", label: "Opponent Team" },
        { value: "opponent_manager", label: "Opponent Manager" },
        { value: "egypt_manager", label: "Egypt Manager" },
        { value: "season", label: "Season" },
        { value: "match_id", label: "Match ID" },
        { value: "stad", label: "Stadium" },
        { value: "referee", label: "Referee" },
        { value: "place", label: "Place" }
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

export default function EgyptNTMatches({ matches, onMatchClick }) {
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
                    String(m["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["OPPONENT MANAGER"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["EGYPT MANAGER"] || "").toLowerCase().includes(lowSearch) ||
                    String(m["SEASON"] || "").toLowerCase().includes(lowSearch) ||
                    String(m.MATCH_ID || "").toLowerCase().includes(lowSearch) ||
                    String(m.STAD || "").toLowerCase().includes(lowSearch) ||
                    String(m.REFREE || "").toLowerCase().includes(lowSearch) ||
                    String(m.PLACE || "").toLowerCase().includes(lowSearch)
                );
            }

            const scopeMap = {
                opponent_team: "OPPONENT TEAM",
                opponent_manager: "OPPONENT MANAGER",
                egypt_manager: "EGYPT MANAGER",
                season: "SEASON",
                match_id: "MATCH_ID",
                stad: "STAD",
                referee: "REFREE",
                place: "PLACE"
            };

            const colName = scopeMap[searchScope];
            if (!colName) return false;
            return String(m[colName] || "").toLowerCase().includes(lowSearch);
        });
    }, [matches, searchTerm, searchScope]);

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
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [filteredBySearch]);

    const handleExport = () => {
        const exportData = filteredBySearch.map((m, i) => ({
            "#": i + 1,
            "DATE": m.DATE,
            "CHAMPION": m.CHAMPION,
            "SEASON": m["SEASON"],
            "VENUE": m["H-A-N"],
            "STADIUM": m.STAD,
            "PLACE": m.PLACE,
            "REFEREE": m.REFREE,
            "EGYPT MANAGER": m["EGYPT MANAGER"],
            "OPPONENT MANAGER": m["OPPONENT MANAGER"],
            "TEAM A": m["Egypt TEAM"] || m["EGYPT TEAM"] || "منتخب مصر",
            "GF": m.GF,
            "GA": m.GA,
            "TEAM B": m["OPPONENT TEAM"]
        }));
        EgyptNTExcelExport.exportToExcel(exportData, "Egypt_NT_Matches_History");
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [matches, searchTerm, searchScope]);

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

    const VenueIndicator = ({ venue, type }) => {
        const v = String(venue || 'N').replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase();
        return <div className={`venue-circle ${type}`}>{v}</div>;
    };

    return (
        <div className="tab-content" id="tab-matches">
            <div className="matches-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                <div style={{ paddingBottom: '10px' }}>
                    <div className="header-tabs-container">
                        <div className="section-title">EGYPT NT <span className="accent">MATCHES</span></div>
                    </div>
                    <div className="gold-line"></div>

                    <div className="match-search-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                        <div className="search-scope-wrapper" style={{ width: '200px', flexShrink: 0 }}>
                            <SearchScopeSelect
                                value={searchScope}
                                onChange={setSearchScope}
                            />
                        </div>
                        <div style={{ width: '100%', maxWidth: '350px' }}>
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
                                    <div key={m.MATCH_ID} className="modern-match-row-h" onClick={() => onMatchClick && onMatchClick(m.MATCH_ID)} style={{
                                        cursor: 'pointer',
                                        background: '#fff',
                                        marginBottom: '6px',
                                        borderRadius: '12px',
                                        padding: '10px 25px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        border: '1px solid #eee',
                                        transition: '0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}>
                                        {/* Date and Season cell */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '320px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '12px', color: '#888', width: '85px', fontFamily: 'Space Mono, monospace' }}>{formatDate(m.DATE)}</div>
                                            <div style={{ height: '15px', width: '1px', background: '#eee' }}></div>
                                            <div style={{ fontSize: '15px', color: 'var(--gold)', fontWeight: '800', flex: 1 }}>🏆 {m["SEASON"]}</div>
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '0 20px' }}>
                                            <div style={{ flex: 1, textAlign: 'right', fontWeight: '800', fontSize: '18px', color: m["H-A-N"] === 'A' ? '#aaa' : '#000' }}>{m["Egypt TEAM"] || 'Egypt'}</div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Space Mono', letterSpacing: '-1px', color: '#000' }}>
                                                    {m.GF} <span style={{ color: 'var(--gold)' }}>—</span> {m.GA}
                                                </div>
                                                {m.PEN && <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '700', marginTop: '-3px' }}>{formatPenalties(m.PEN)}</div>}
                                            </div>

                                            <div style={{ flex: 1, textAlign: 'left', fontWeight: '800', fontSize: '16px', color: m["H-A-N"] === 'H' ? '#999' : '#000' }}>{m["OPPONENT TEAM"]}</div>
                                        </div>

                                        {/* Venue indicator on the right */}
                                        <div style={{ width: '60px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                                            <VenueIndicator venue={m["H-A-N"]} type="egyptnt" />
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
                            ←
                        </button>
                        <div className="page-info">
                            PAGE <span className="p-num">{currentPage}</span> OF <span className="p-num">{totalPages}</span>
                        </div>
                        <button 
                            className="page-btn next-btn" 
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            disabled={currentPage === totalPages}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .m-search-box:focus { border-color: var(--gold) !important; box-shadow: 0 10px 30px rgba(200,16,46,0.15) !important; }
                
                .luxury-month-divider { display: flex; align-items: center; gap: 20px; margin: 40px 0 20px; }
                .m-text { font-family: 'Space Mono', monospace; font-weight: 800; font-size: 14px; color: #555; background: #f0f0f0; padding: 4px 15px; border-radius: 50px; }
                .m-line { flex: 1; height: 1px; background: linear-gradient(to right, #ddd, transparent); }

                .match-list-vertical { display: flex; flex-direction: column; gap: 4px; }

                .modern-match-row-h:hover { transform: translateX(5px); border-color: var(--gold); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                
                .pagination-matches { margin-top: 50px; display: flex; align-items: center; justify-content: center; gap: 30px; padding: 30px 0; }
                .page-btn { 
                    background: rgba(200, 16, 46, 0.1); 
                    border: 1px solid rgba(200, 16, 46, 0.2); 
                    padding: 10px 25px; 
                    border-radius: 10px; 
                    font-size: 12px; 
                    font-weight: 800; 
                    cursor: pointer; 
                    transition: all 0.3s; 
                    color: var(--gold); 
                    letter-spacing: 1px; 
                    font-family: 'Space Mono', monospace;
                }
                .page-btn:hover:not(:disabled) { 
                    background: var(--gold); 
                    color: #fff;
                    border-color: var(--gold);
                    box-shadow: 0 5px 15px rgba(200,16,46,0.15); 
                }
                .page-btn:disabled { opacity: 0.15; cursor: not-allowed; }
                .page-info { 
                    font-family: 'Space Mono', monospace; 
                    font-size: 13px; 
                    font-weight: 800; 
                    color: var(--gold); 
                    transition: 0.3s;
                    cursor: default;
                }
                .page-info:hover {
                    text-shadow: 0 0 10px rgba(200, 16, 46, 0.3);
                }
                .p-num { color: var(--gold); font-weight: 900; padding: 0 4px; }

                .venue-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; font-family: 'Space Mono', monospace; flex-shrink: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .venue-circle.egyptnt { background: #000; color: var(--gold); border: 2px solid var(--gold); }
                
                .header-tabs-container { display: flex; align-items: center; justify-content: flex-start; gap: 30px; margin-bottom: 5px; }

                .empty-state-lux { text-align: center; padding: 100px; opacity: 0.4; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 1000px) {
                    .modern-match-row-h { flex-direction: column; gap: 15px; padding: 20px; text-align: center; }
                    .modern-match-row-h > div { width: 100% !important; justify-content: center !important; text-align: center !important; }
                }
            `}</style>
        </div>
    );
}
