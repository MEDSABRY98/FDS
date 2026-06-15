"use client";

import { useState, useEffect } from "react";
import { AhlyVZamalekService } from "../Service/ahly_v_zamalek_service";
import { AhlyVZamalekExcelExport } from "../ExportExcel/ahly_v_zamalek_export_excel";
import "./ahly_v_zamalek_matches.css";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";



export default function AhlyVZamalekMatches({ derbyData, onSelectMatch }) {
    const [searchTerm, setSearchTerm] = useState("");



    const displayedMatches = derbyData.filter(m => {
        const searchStr = `${m.CHAMPION} ${m.ROUND} ${m.STAD} ${m.DATE} ${m.YEAR}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
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

                <div className="avz-search-box">
                    <SearchBar_db
                        placeholder="Search matches, champions, stadiums..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
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
