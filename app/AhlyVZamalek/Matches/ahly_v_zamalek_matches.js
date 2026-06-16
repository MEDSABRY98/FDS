"use client";

import { useState, useEffect, useRef } from "react";
import { AhlyVZamalekService } from "../Service/ahly_v_zamalek_service";
import { AhlyVZamalekExcelExport } from "../ExportExcel/ahly_v_zamalek_export_excel";
import "./ahly_v_zamalek_matches.css";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

function SearchScopeSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const rawOptions = [
        { value: "all", label: "All Fields" },
        { value: "champion", label: "Champion" },
        { value: "round", label: "Round" },
        { value: "stad", label: "Stadium" },
        { value: "date", label: "Date/Year" },
        { value: "season", label: "Season" },
        { value: "referee", label: "Referee" }
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

export default function AhlyVZamalekMatches({ derbyData, onSelectMatch }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchScope, setSearchScope] = useState("all");

    const displayedMatches = derbyData.filter(m => {
        const lowSearch = searchTerm.toLowerCase().trim();
        if (!lowSearch) return true;

        if (searchScope === "all") {
            const searchStr = `${m.CHAMPION} ${m.ROUND} ${m.STAD} ${m.DATE} ${m.YEAR} ${m["SEASON - NAME"]} ${m.REFEREE}`.toLowerCase();
            return searchStr.includes(lowSearch);
        }

        const scopeMap = {
            champion: "CHAMPION",
            round: "ROUND",
            stad: "STAD",
            season: "SEASON - NAME",
            referee: "REFEREE"
        };

        if (searchScope === "date") {
            return String(m.DATE || m.YEAR || "").toLowerCase().includes(lowSearch);
        }

        const colName = scopeMap[searchScope];
        if (!colName) return false;
        return String(m[colName] || "").toLowerCase().includes(lowSearch);
    });

    useEffect(() => {
        const handleExport = () => {
            if (displayedMatches.length > 0) {
                const exportData = displayedMatches.map((m, idx) => ({
                    "#": idx + 1,
                    "DATE": m.DATE || m.YEAR,
                    "CHAMPION": m.CHAMPION,
                    "SEASON": m["SEASON - NAME"],
                    "ROUND": m.ROUND,
                    "STADIUM": m.STAD,
                    "REFEREE": m.REFEREE,
                    "AHLY": m.AHLY || "الأهلي",
                    "GF": m.GF,
                    "GA": m.GA,
                    "ZAMALEK": m.ZAMALEK || "الزمالك",
                    "RESULT": m["W-D-L"] === "W" ? "Ahly Win" : (m["W-D-L"] === "L" ? "Zamalek Win" : "Draw")
                }));
                AhlyVZamalekExcelExport.exportToExcel(exportData, "Ahly_vs_Zamalek_Matches");
            }
        };

        window.addEventListener('avz-export-excel', handleExport);
        return () => window.removeEventListener('avz-export-excel', handleExport);
    }, [displayedMatches]);

    return (
        <div className="avz-matches-container fade-in">
            <div className="avz-matches-header">
                <h1 className="avz-matches-title">DERBY <span className="avz-gold-text">MATCHES</span></h1>

                <div className="match-search-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', marginBottom: '20px' }}>
                    <div style={{ width: '200px', flexShrink: 0 }}>
                        <SearchScopeSelect
                            value={searchScope}
                            onChange={setSearchScope}
                        />
                    </div>
                    <div style={{ width: '100%', maxWidth: '350px' }}>
                        <SearchBar_db
                            placeholder="Type search term..."
                            value={searchTerm}
                            onChange={setSearchTerm}
                        />
                    </div>
                </div>

            </div>

            <div className="avz-matches-list">
                {displayedMatches.length > 0 ? (
                    displayedMatches.map((match, idx) => (
                        <div key={match.ROW_ID || idx} className="avz-match-card" onClick={() => onSelectMatch && onSelectMatch(match.MATCH_ID)}>
                            <div className="avz-match-teams">
                                <span className={`avz-team ${match["W-D-L"] === "W" ? "winner" : ""}`}>
                                    {match.AHLY || "الأهلي"} <span className="avz-score">{match.GF}</span>
                                </span>
                                <span className="avz-vs">VS</span>
                                <span className={`avz-team ${match["W-D-L"] === "L" ? "winner" : ""}`}>
                                    <span className="avz-score">{match.GA}</span> {match.ZAMALEK || "الزمالك"}
                                </span>
                            </div>

                            <div className="avz-match-meta">
                                <span className="avz-meta-date">{match.DATE || match.YEAR}</span>

                                {match.CHAMPION && (
                                    <>
                                        <span className="avz-divider">•</span>
                                        <span className="avz-meta-champion">{match.CHAMPION}</span>
                                    </>
                                )}

                                {match["SEASON - NAME"] && (
                                    <>
                                        <span className="avz-divider">•</span>
                                        <span>{match["SEASON - NAME"]}</span>
                                    </>
                                )}

                                {match.ROUND && (
                                    <>
                                        <span className="avz-divider">•</span>
                                        <span>{match.ROUND}</span>
                                    </>
                                )}

                                {match.STAD && (
                                    <>
                                        <span className="avz-divider">•</span>
                                        <span>{match.STAD}</span>
                                    </>
                                )}

                                {match.REFEREE && (
                                    <>
                                        <span className="avz-divider">•</span>
                                        <span className="avz-meta-referee">{match.REFEREE}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))

                ) : (
                    <NoData_db message="NO MATCHES FOUND FOR THIS FILTER" />
                )}
            </div>

        </div>
    );
}
