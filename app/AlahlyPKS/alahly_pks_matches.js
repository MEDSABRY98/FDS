"use client";

import { useMemo, useState, useEffect } from "react";
import { AlAhlyService } from "../Alahly/alahly_db_service";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import "./alahly_pks_matches.css";

export default function AlAhlyPKsMatches({ pksData, onSelectMatch }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
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
            return (
                String(item["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                String(item["SEASON"] || "").toLowerCase().includes(lowSearch) ||
                String(item["MATCH_ID"] || "").toLowerCase().includes(lowSearch) ||
                String(item["ROUND"] || "").toLowerCase().includes(lowSearch)
            );
        });
    }, [sortedUniquePksData, searchTerm]);

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
        AlAhlyService.exportToExcel(exportData, "AlAhly_PKs_Record");
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
    }, [searchTerm]);

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

                <div className="pks-search-box" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search shootout matches (ID, Team, Season, Round...)"
                    />
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
                                    <div className="col-date">{formatDate(pk.DATE)}</div>
                                    <div className="col-champion">{pk.CHAMPION}</div>
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
