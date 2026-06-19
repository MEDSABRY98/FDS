"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AlAhlyService } from "../../Alahly/Service/alahly_db_service";
import { AlAhlyPksExcelExport } from "../ExportExcel/alahly_pks_export_excel";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import "./alahly_pks_matches.css";

function SearchScopeSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const rawOptions = [
        { value: "all", label: "All Fields" },
        { value: "opponent_team", label: "Opponent Team" },
        { value: "season", label: "Season" },
        { value: "match_id", label: "PKS ID / Match ID" },
        { value: "round", label: "Round" }
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

export default function AlAhlyPKsMatches({ pksData, onSelectMatch }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchScope, setSearchScope] = useState("all");
    const pageSize = 50;

    // Ensure only one row per PKS_ID and sort it
    const sortedUniquePksData = useMemo(() => {
        const seen = new Set();
        const unique = (pksData || []).filter(item => {
            const id = item.PKS_ID || item.MATCH_ID;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        // Numeric sort by PKS_ID (extract number from "PK-123" patterns)
        return unique.sort((a, b) => {
            const idA = String(a.PKS_ID || a.MATCH_ID || "");
            const idB = String(b.PKS_ID || b.MATCH_ID || "");
            const numA = parseInt(idA.replace(/\D/g, "") || "0");
            const numB = parseInt(idB.replace(/\D/g, "") || "0");
            return numB - numA; // Newest PKs first
        });
    }, [pksData]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return sortedUniquePksData;
        const lowSearch = searchTerm.toLowerCase().trim();
        return sortedUniquePksData.filter(item => {
            if (searchScope === "all") {
                return (
                    String(item["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["SEASON"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["PKS_ID"] || item["MATCH_ID"] || "").toLowerCase().includes(lowSearch) ||
                    String(item["ROUND"] || "").toLowerCase().includes(lowSearch)
                );
            }

            if (searchScope === "match_id") {
                return String(item["PKS_ID"] || item["MATCH_ID"] || "").toLowerCase().includes(lowSearch);
            }

            const scopeMap = {
                opponent_team: "OPPONENT TEAM",
                season: "SEASON",
                round: "ROUND"
            };

            const colName = scopeMap[searchScope];
            if (!colName) return false;
            return String(item[colName] || "").toLowerCase().includes(lowSearch);
        });
    }, [sortedUniquePksData, searchTerm, searchScope]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleExport = () => {
        const exportData = filteredData.map((pk, i) => ({
            "#": i + 1,
            "DATE": pk.DATE,
            "SEASON": pk.SEASON,
            "PLAYER": pk["PLAYER NAME"],
            "GK": pk["GK NAME"],
            "RESULT": pk.RESULT,
            "OPPONENT": pk["OPPONENT TEAM"],
            "NOTE": pk.NOTE
        }));
        AlAhlyPksExcelExport.exportToExcel(exportData, "AlAhly_PKs_Record");
    };

    useEffect(() => {
        const handleGlobalExport = () => {
            handleExport();
        };
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [filteredData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchScope]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "N/A";
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch (e) {
            return "N/A";
        }
    };

    const formatPenalties = (item) => {
        // Priority to new columns if they exist
        if (item["G-AHLY"] !== undefined && item["G-OPPONENT"] !== undefined) {
            return `${item["G-AHLY"]} - ${item["G-OPPONENT"]}`;
        }
        
        const penString = item["PKS RESULT"] || item.PKS_RESULT || item.RESULT;
        if (!penString) return "";
        const ps = String(penString).toUpperCase();
        const numbers = ps.match(/\d+/g);
        if (!numbers || numbers.length < 2) return penString;
        let n1 = parseInt(numbers[0]);
        let n2 = parseInt(numbers[1]);
        const low = Math.min(n1, n2);
        const high = Math.max(n1, n2);

        // Return scores only: High-Low for Win (if W present or assumed), or Low-High
        if (ps.includes('L')) return `${low}-${high}`;
        return `${high}-${low}`;
    };

    return (
        <div className="pks-matches-container">
            <div className="pks-header-section">
                <h1 className="pks-title">AL AHLY <span className="gold-text">PKs MATCHES</span></h1>

                <div className="match-search-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
                    <div style={{ width: '200px', flexShrink: 0 }}>
                        <SearchScopeSelect
                            value={searchScope}
                            onChange={setSearchScope}
                        />
                    </div>
                    <div className="pks-search-box" style={{ width: '100%', maxWidth: '350px' }}>
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Type search term..."
                        />
                    </div>
                </div>
            </div>

            <div className="pks-list-wrapper">
                {paginatedData.length === 0 ? (
                    <NoData_db message="No penalty shootout matches found." />
                ) : (
                    <div className="pks-table-lux">
                        <div className="pks-table-header">
                            <div className="col-match">#</div>
                            <div className="col-pks-id">PKS ID</div>
                            <div className="col-date">DATE</div>
                            <div className="col-champion">CHAMPION</div>
                            <div className="col-season">SEASON</div>
                            <div className="col-round">ROUND</div>
                            <div className="col-team-ahly">AL AHLY</div>
                            <div className="col-result">PKS RESULT</div>
                            <div className="col-team-opp">OPPONENT</div>
                        </div>

                        <div className="pks-table-body">
                            {paginatedData.map((pk, index) => (
                                <div key={index} className="pk-row-modern fade-in">
                                    <div className="col-match">
                                        <span className="id-badge">{(currentPage - 1) * pageSize + index + 1}</span>
                                    </div>
                                    <div
                                        className="col-pks-id"
                                        onClick={() => onSelectMatch(pk.PKS_ID)}
                                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--gold)' }}
                                    >
                                        <span className="pks-id-txt">{pk.PKS_ID}</span>
                                    </div>
                                    <div className="col-date">
                                        {pk.MATCH_ID ? formatDate(pk.DATE) : <span className="unlinked-badge">غير مربوط</span>}
                                    </div>
                                    <div className="col-champion">{pk.MATCH_ID ? (pk.CHAMPION || "—") : "—"}</div>
                                    <div className="col-season">
                                        <span className="season-txt">🏆 {pk.SEASON || pk["SEASON - NAME"]}</span>
                                    </div>
                                    <div className="col-round">
                                        <span className="round-badge">{pk.ROUND || "N/A"}</span>
                                    </div>
                                    <div className="col-team-ahly">الأهلي</div>
                                    <div className="col-result">
                                        <div className={`pks-score-pill ${String(pk["PKS RESULT"] || pk.PKS_RESULT || pk.RESULT).includes('W') ? 'win' :
                                                String(pk["PKS RESULT"] || pk.PKS_RESULT || pk.RESULT).includes('L') ? 'loss' :
                                                    'neutral'
                                            }`}>
                                            {formatPenalties(pk)}
                                        </div>
                                    </div>
                                    <div className="col-team-opp">{pk["OPPONENT TEAM"] || pk.OPPONENT}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pks-pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                        PREV
                    </button>
                    <span className="page-info">PAGE {currentPage} OF {totalPages}</span>
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
