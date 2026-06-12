"use client";

import { useState, useMemo, useEffect } from "react";
import { Trophy, Award, Search, ArrowLeft, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import { EgyptClubTrophyService } from "./egy_c_trophy_service";
import * as XLSX from "xlsx";
import "./egy_c_trophy_dashboard.css";

export default function EgyptClubTrophyDashboard({ trophies, activeTab }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClub, setSelectedClub] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentDetailPage, setCurrentDetailPage] = useState(1);
    const [detailSearchTerm, setDetailSearchTerm] = useState("");

    const itemsPerPage = 50;
    const detailsPerPage = 50;

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentDetailPage(1);
    }, [selectedClub, detailSearchTerm]);

    // Leaderboard calculation
    const leaderboard = useMemo(() => {
        return EgyptClubTrophyService.getLeaderboard(trophies);
    }, [trophies]);

    // Filtered leaderboard
    const filteredLeaderboard = useMemo(() => {
        if (!searchTerm.trim()) return leaderboard;
        return leaderboard.filter(item =>
            item.champion.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [leaderboard, searchTerm]);

    // Top 3 for Podium
    const podiumClubs = useMemo(() => {
        return leaderboard.slice(0, 3);
    }, [leaderboard]);

    // Paginated leaderboard
    const paginatedLeaderboard = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLeaderboard.slice(start, start + itemsPerPage);
    }, [filteredLeaderboard, currentPage]);

    const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);

    // Selected club's trophies
    const clubTrophies = useMemo(() => {
        if (!selectedClub) return [];
        const record = leaderboard.find(l => l.champion === selectedClub);
        return record ? record.trophies : [];
    }, [selectedClub, leaderboard]);

    // Filtered selected club's trophies
    const filteredClubTrophies = useMemo(() => {
        if (!detailSearchTerm.trim()) return clubTrophies;
        return clubTrophies.filter(t =>
            (t.COMPETITION && t.COMPETITION.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
            (t.SEASON && t.SEASON.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
            (t.PLACE && t.PLACE.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
            (t.RESULT && t.RESULT.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
            (t.PEN && t.PEN.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
            (t["RUNNER-UP"] && t["RUNNER-UP"].toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
            (t.NOTE && t.NOTE.toLowerCase().includes(detailSearchTerm.toLowerCase()))
        );
    }, [clubTrophies, detailSearchTerm]);

    // Paginated club trophies
    const paginatedClubTrophies = useMemo(() => {
        const start = (currentDetailPage - 1) * detailsPerPage;
        return filteredClubTrophies.slice(start, start + detailsPerPage);
    }, [filteredClubTrophies, currentDetailPage]);

    const totalDetailPages = Math.ceil(filteredClubTrophies.length / detailsPerPage);

    // Export to Excel handler
    useEffect(() => {
        const handleExport = () => {
            if (activeTab !== "leaderboard") return;

            const workbook = XLSX.utils.book_new();

            if (selectedClub) {
                // Export single club trophies
                const data = filteredClubTrophies.map((t, idx) => ({
                    "Index": idx + 1,
                    "Competition": t.COMPETITION || "---",
                    "Place": t.PLACE || "---",
                    "Season": t.SEASON || "---",
                    "Result": t.RESULT || "---",
                    "Penalties": t.PEN || "---",
                    "Runner-Up": t["RUNNER-UP"] || "---",
                    "Note": t.NOTE || "---"
                }));
                const sheet = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, sheet, "Trophies");
                XLSX.writeFile(workbook, `${selectedClub}_Trophies.xlsx`);
            } else {
                // Export leaderboard
                const data = filteredLeaderboard.map((item, idx) => ({
                    "Rank": idx + 1,
                    "Club": item.champion,
                    "Trophies": item.count
                }));
                const sheet = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, sheet, "Leaderboard");
                XLSX.writeFile(workbook, "EgyptClubs_Trophies_Leaderboard.xlsx");
            }
        };

        window.addEventListener("egypt-club-trophy-export-excel", handleExport);
        return () => window.removeEventListener("egypt-club-trophy-export-excel", handleExport);
    }, [activeTab, selectedClub, filteredLeaderboard, filteredClubTrophies]);

    if (trophies.length === 0) {
        return <NoData_db message="NO TROPHY RECORDS FOUND IN DATABASE" />;
    }

    if (selectedClub) {
        return (
            <div className="detail-wrap fade-in">
                {/* Back Header */}
                <div className="detail-back-header">
                    <button onClick={() => setSelectedClub(null)} className="back-button">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="detail-title">
                            {selectedClub} <span className="accent">TROPHIES LOG</span>
                        </h2>
                    </div>
                </div>

                <div className="gold-line" style={{ margin: "-10px 0 30px" }}></div>

                {/* Search / Stats toolbar */}
                <div className="trophy-search-bar-row">
                    <SearchBar_db
                        value={detailSearchTerm}
                        onChange={setDetailSearchTerm}
                        placeholder="Search trophies, seasons, notes..."
                        className="trophy-search"
                    />
                    <div className="trophy-stat-pill">
                        Total Won: <span>{clubTrophies.length} Trophies</span>
                    </div>
                </div>

                {/* Trophies Table */}
                <div className="table-container" style={{ marginTop: "20px" }}>
                    {filteredClubTrophies.length === 0 ? (
                        <NoData_db message="NO MATCHING TROPHIES FOUND" />
                    ) : (
                        <>
                            <table className="seasons-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "5%" }}>#</th>
                                        <th style={{ width: "20%" }}>COMPETITION</th>
                                        <th style={{ width: "15%" }}>PLACE</th>
                                        <th style={{ width: "12%" }}>SEASON</th>
                                        <th style={{ width: "10%" }}>RESULT</th>
                                        <th style={{ width: "10%" }}>PEN</th>
                                        <th style={{ width: "13%" }}>RUNNER-UP</th>
                                        <th style={{ width: "15%" }}>NOTE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedClubTrophies.map((t, i) => (
                                        <tr key={t.ROW_ID || i} className="season-table-row">
                                            <td style={{ color: "#666", fontFamily: "monospace" }}>
                                                {(currentDetailPage - 1) * detailsPerPage + i + 1}
                                            </td>
                                            <td style={{ fontWeight: "700" }}>
                                                🏆 {t.COMPETITION}
                                            </td>
                                            <td style={{ color: "#555" }}>
                                                {t.PLACE || "---"}
                                            </td>
                                            <td style={{ fontWeight: "600", color: "var(--gold)" }}>
                                                {t.SEASON}
                                            </td>
                                            <td style={{ fontFamily: "monospace" }}>
                                                {t.RESULT || "---"}
                                            </td>
                                            <td style={{ fontFamily: "monospace", color: "var(--gold)" }}>
                                                {t.PEN || "---"}
                                            </td>
                                            <td style={{ fontWeight: "600", color: "#333" }}>
                                                {t["RUNNER-UP"] || "---"}
                                            </td>
                                            <td style={{ color: "#666" }}>
                                                {t.NOTE || "---"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalDetailPages > 1 && (
                                <div className="pagination-container">
                                    <button
                                        disabled={currentDetailPage === 1}
                                        onClick={() => setCurrentDetailPage(p => p - 1)}
                                        className="page-btn"
                                    >
                                        ← PREV
                                    </button>
                                    <span className="page-info">
                                        PAGE {currentDetailPage} OF {totalDetailPages}
                                    </span>
                                    <button
                                        disabled={currentDetailPage === totalDetailPages}
                                        onClick={() => setCurrentDetailPage(p => p + 1)}
                                        className="page-btn"
                                    >
                                        NEXT →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content" id="tab-dashboard">
            <div className="dashboard-wrap">
                <div className="section-header">
                    <div className="section-title">EGYPT CLUBS <span className="accent">TROPHIES COUNT</span></div>
                </div>
                <div className="gold-line" style={{ margin: "15px 0 30px" }}></div>

                {/* KPI Cards */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <span className="kpi-label">TOTAL TROPHIES</span>
                        <span className="kpi-value">{trophies.length}</span>
                        <div className="kpi-icon"><Trophy size={40} /></div>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">CHAMPION CLUBS</span>
                        <span className="kpi-value">{leaderboard.length}</span>
                        <div className="kpi-icon"><Award size={40} /></div>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">LEADER</span>
                        <span className="kpi-value" style={{ fontSize: "22px", fontFamily: "inherit" }}>
                            {podiumClubs[0]?.champion || "---"} ({podiumClubs[0]?.count || 0})
                        </span>
                        <div className="kpi-icon"><Zap size={40} style={{ color: "var(--gold)" }} /></div>
                    </div>
                </div>

                {/* Podium Visual */}
                {podiumClubs.length > 0 && (
                    <div className="trophy-podium-container">
                        <h3 className="podium-section-title">TOP CHAMPIONS PODIUM</h3>
                        <div className="trophy-podium">
                            {/* 2nd Place */}
                            {podiumClubs[1] && (
                                <div className="podium-step step-2">
                                    <div className="podium-avatar">🥈</div>
                                    <div className="podium-name">{podiumClubs[1].champion}</div>
                                    <div className="podium-count">{podiumClubs[1].count} Trophies</div>
                                    <div className="podium-bar">
                                        <span className="podium-number">2</span>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {podiumClubs[0] && (
                                <div className="podium-step step-1">
                                    <div className="podium-avatar highlight">🏆</div>
                                    <div className="podium-name">{podiumClubs[0].champion}</div>
                                    <div className="podium-count">{podiumClubs[0].count} Trophies</div>
                                    <div className="podium-bar">
                                        <span className="podium-number">1</span>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {podiumClubs[2] && (
                                <div className="podium-step step-3">
                                    <div className="podium-avatar">🥉</div>
                                    <div className="podium-name">{podiumClubs[2].champion}</div>
                                    <div className="podium-count">{podiumClubs[2].count} Trophies</div>
                                    <div className="podium-bar">
                                        <span className="podium-number">3</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Search and Table */}
                <div className="trophy-search-bar-row">
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search clubs..."
                    />
                </div>

                <div className="table-container" style={{ marginTop: "20px" }}>
                    {filteredLeaderboard.length === 0 ? (
                        <NoData_db message="NO CHAMPIONS MATCHING YOUR SEARCH" />
                    ) : (
                        <>
                            <table className="seasons-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "15%" }}>RANK</th>
                                        <th style={{ width: "45%" }}>CLUB NAME</th>
                                        <th style={{ width: "25%" }}>TROPHIES</th>
                                        <th style={{ width: "15%", textAlign: "center" }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLeaderboard.map((item, i) => {
                                        const rank = (currentPage - 1) * itemsPerPage + i + 1;
                                        return (
                                            <tr key={item.champion} className="season-table-row">
                                                <td className="rank-cell">
                                                    <span className={`rank-badge rank-${rank}`}>
                                                        #{rank}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: "700" }}>
                                                    🛡️ {item.champion}
                                                </td>
                                                <td style={{ fontWeight: "bold", color: "var(--gold)" }}>
                                                    {item.count} Trophies
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    <button
                                                        onClick={() => setSelectedClub(item.champion)}
                                                        className="trophy-action-btn"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="page-btn"
                                    >
                                        ← PREV
                                    </button>
                                    <span className="page-info">
                                        PAGE {currentPage} OF {totalPages}
                                    </span>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="page-btn"
                                    >
                                        NEXT →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
