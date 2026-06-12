"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar } from "lucide-react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
import { EgyptClubTrophyService } from "./egy_c_trophy_service";
import * as XLSX from "xlsx";
import "./egy_c_trophy_seasons.css";

export default function EgyptClubTrophySeasons({ trophies, activeTab }) {
    const [selectedSeason, setSelectedSeason] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 50;

    // Get unique seasons
    const seasonsList = useMemo(() => {
        return EgyptClubTrophyService.getSeasons(trophies);
    }, [trophies]);

    // Set default season
    useEffect(() => {
        if (seasonsList.length > 0 && !selectedSeason) {
            setSelectedSeason(seasonsList[0]);
        }
    }, [seasonsList, selectedSeason]);

    // Reset pagination when season or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSeason, searchTerm]);

    // Trophies for selected season
    const seasonTrophies = useMemo(() => {
        if (!selectedSeason) return [];
        return trophies.filter(t => t.SEASON === selectedSeason);
    }, [selectedSeason, trophies]);

    // Filtered trophies
    const filteredTrophies = useMemo(() => {
        if (!searchTerm.trim()) return seasonTrophies;
        return seasonTrophies.filter(t =>
            (t.COMPETITION && t.COMPETITION.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.CHAMPION && t.CHAMPION.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.PLACE && t.PLACE.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.RESULT && t.RESULT.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.PEN && t.PEN.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t["RUNNER-UP"] && t["RUNNER-UP"].toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.NOTE && t.NOTE.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [seasonTrophies, searchTerm]);

    // Stats for current season
    const stats = useMemo(() => {
        const uniqueChampions = new Set(seasonTrophies.map(t => t.CHAMPION).filter(Boolean));
        return {
            total: seasonTrophies.length,
            championsCount: uniqueChampions.size
        };
    }, [seasonTrophies]);

    // Paginated trophies list
    const paginatedTrophies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTrophies.slice(start, start + itemsPerPage);
    }, [filteredTrophies, currentPage]);

    const totalPages = Math.ceil(filteredTrophies.length / itemsPerPage);

    // Export to Excel handler
    useEffect(() => {
        const handleExport = () => {
            if (activeTab !== "seasons" || !selectedSeason) return;

            const data = filteredTrophies.map((t, idx) => ({
                "Index": idx + 1,
                "Competition": t.COMPETITION || "---",
                "Place": t.PLACE || "---",
                "Season": t.SEASON || "---",
                "Champion": t.CHAMPION || "---",
                "Result": t.RESULT || "---",
                "Penalties": t.PEN || "---",
                "Runner-Up": t["RUNNER-UP"] || "---",
                "Note": t.NOTE || "---"
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `Season_${selectedSeason}`);
            XLSX.writeFile(workbook, `EgyptClubs_Trophies_Season_${selectedSeason.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`);
        };

        window.addEventListener("egypt-club-trophy-export-excel", handleExport);
        return () => window.removeEventListener("egypt-club-trophy-export-excel", handleExport);
    }, [activeTab, selectedSeason, filteredTrophies]);

    if (trophies.length === 0) {
        return <NoData_db message="NO TROPHY RECORDS FOUND IN DATABASE" />;
    }

    return (
        <div className="tab-content" id="tab-seasons">
            <div className="seasons-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">EGYPT CLUBS <span className="accent">SEASONS TROPHIES</span></div>
                </div>
                <div className="gold-line" style={{ margin: "15px 0 30px" }}></div>

                {/* Header controls */}
                <div className="seasons-control-toolbar">
                    <div className="season-selector-wrapper">
                        <label className="selector-label">
                            <Calendar size={14} style={{ color: "var(--gold, #c9a84c)" }} /> SELECT SEASON
                        </label>
                        <DropDownList_db
                            options={seasonsList.map(s => ({ value: s, label: s }))}
                            value={selectedSeason}
                            onChange={(val) => setSelectedSeason(val)}
                            placeholder="Select Season..."
                            searchable={true}
                            className="season-dropdown-unified"
                        />
                    </div>

                    <div className="season-search-wrapper">
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search trophies, champions, etc..."
                        />
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="season-stats-grid">
                    <div className="season-stat-card">
                        <span className="stat-card-title">TROPHIES AWARDED</span>
                        <span className="stat-card-value">{stats.total}</span>
                    </div>
                    <div className="season-stat-card">
                        <span className="stat-card-title">UNIQUE CHAMPIONS</span>
                        <span className="stat-card-value">{stats.championsCount}</span>
                    </div>
                </div>

                {/* Table Area */}
                <div className="table-container" style={{ marginTop: "20px" }}>
                    {filteredTrophies.length === 0 ? (
                        <NoData_db message="NO TROPHIES FOUND FOR SELECTED SEASON" />
                    ) : (
                        <>
                            <table className="seasons-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "5%" }}>#</th>
                                        <th style={{ width: "20%" }}>COMPETITION</th>
                                        <th style={{ width: "15%" }}>PLACE</th>
                                        <th style={{ width: "15%" }}>CHAMPION</th>
                                        <th style={{ width: "10%" }}>RESULT</th>
                                        <th style={{ width: "10%" }}>PEN</th>
                                        <th style={{ width: "12%" }}>RUNNER-UP</th>
                                        <th style={{ width: "13%" }}>NOTE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTrophies.map((t, i) => (
                                        <tr key={t.ROW_ID || i} className="season-table-row">
                                            <td style={{ color: "#666", fontFamily: "monospace" }}>
                                                {(currentPage - 1) * itemsPerPage + i + 1}
                                            </td>
                                            <td style={{ fontWeight: "700" }}>
                                                🏆 {t.COMPETITION}
                                            </td>
                                            <td style={{ color: "#555" }}>
                                                {t.PLACE || "---"}
                                            </td>
                                            <td style={{ fontWeight: "800", color: "var(--gold)" }}>
                                                🛡️ {t.CHAMPION}
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
