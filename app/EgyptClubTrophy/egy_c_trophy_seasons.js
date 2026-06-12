"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, LayoutGrid, Table2 } from "lucide-react";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
import { EgyptClubTrophyService } from "./egy_c_trophy_service";
import COLUMN_ORDER from "./column_order.json";
import * as XLSX from "xlsx";
import "./egy_c_trophy_seasons.css";

export default function EgyptClubTrophySeasons({ trophies, activeTab }) {
    const [innerTab, setInnerTab] = useState("season"); // "season" | "pivot"
    const [selectedSeason, setSelectedSeason] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pivotSearch, setPivotSearch] = useState("");

    const itemsPerPage = 50;

    // ── Unique seasons list ──────────────────────────────────────────────────
    const seasonsList = useMemo(() => {
        return EgyptClubTrophyService.getSeasons(trophies);
    }, [trophies]);

    // Set default season
    useEffect(() => {
        if (seasonsList.length > 0 && !selectedSeason) {
            setSelectedSeason(seasonsList[0]);
        }
    }, [seasonsList, selectedSeason]);

    // Reset pagination on filter changes
    useEffect(() => { setCurrentPage(1); }, [selectedSeason, searchTerm]);

    // ── Season View data ────────────────────────────────────────────────────
    const seasonTrophies = useMemo(() => {
        if (!selectedSeason) return [];
        return trophies.filter(t => t.SEASON === selectedSeason);
    }, [selectedSeason, trophies]);

    const filteredTrophies = useMemo(() => {
        if (!searchTerm.trim()) return seasonTrophies;
        const q = searchTerm.toLowerCase();
        return seasonTrophies.filter(t =>
            (t.COMPETITION && t.COMPETITION.toLowerCase().includes(q)) ||
            (t.CHAMPION && t.CHAMPION.toLowerCase().includes(q)) ||
            (t.PLACE && t.PLACE.toLowerCase().includes(q)) ||
            (t.RESULT && t.RESULT.toLowerCase().includes(q)) ||
            (t.PEN && t.PEN.toLowerCase().includes(q)) ||
            (t["RUNNER-UP"] && t["RUNNER-UP"].toLowerCase().includes(q)) ||
            (t.NOTE && t.NOTE.toLowerCase().includes(q))
        );
    }, [seasonTrophies, searchTerm]);

    const stats = useMemo(() => {
        const uniqueChampions = new Set(seasonTrophies.map(t => t.CHAMPION).filter(Boolean));
        return { total: seasonTrophies.length, championsCount: uniqueChampions.size };
    }, [seasonTrophies]);

    const paginatedTrophies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTrophies.slice(start, start + itemsPerPage);
    }, [filteredTrophies, currentPage]);

    const totalPages = Math.ceil(filteredTrophies.length / itemsPerPage);

    // ── Pivot Table data ─────────────────────────────────────────────────────
    // All unique competitions sorted by pivot_column_order.json, then alphabetically for any unlisted ones
    const pivotCompetitions = useMemo(() => {
        const all = [...new Set(trophies.map(t => t.COMPETITION).filter(Boolean))];
        const orderMap = {};
        COLUMN_ORDER.forEach((name, idx) => { orderMap[name] = idx; });
        return all.sort((a, b) => {
            const ia = orderMap[a] !== undefined ? orderMap[a] : 9999;
            const ib = orderMap[b] !== undefined ? orderMap[b] : 9999;
            if (ia !== ib) return ia - ib;
            return a.localeCompare(b);
        });
    }, [trophies]);

    // All unique seasons (rows), sorted descending (newest first)
    const pivotSeasons = useMemo(() => {
        return [...new Set(trophies.map(t => t.SEASON).filter(Boolean))].sort().reverse();
    }, [trophies]);

    // Filtered pivot seasons based on search
    const filteredPivotSeasons = useMemo(() => {
        if (!pivotSearch.trim()) return pivotSeasons;
        const q = pivotSearch.toLowerCase();
        return pivotSeasons.filter(s => {
            if (s.toLowerCase().includes(q)) return true;
            // also match if any champion in this season matches
            return trophies.some(t => t.SEASON === s && t.CHAMPION && t.CHAMPION.toLowerCase().includes(q));
        });
    }, [pivotSeasons, pivotSearch, trophies]);

    // Build lookup map: "SEASON|COMPETITION" -> CHAMPION
    const pivotMap = useMemo(() => {
        const map = {};
        trophies.forEach(t => {
            if (t.SEASON && t.COMPETITION) {
                map[`${t.SEASON}|${t.COMPETITION}`] = t.CHAMPION || null;
            }
        });
        return map;
    }, [trophies]);

    // Champion color helper
    const getChampionStyle = (champion) => {
        if (!champion) return {};
        const c = champion.toLowerCase();
        if (c.includes("ahly")) return { background: "rgba(204,0,0,0.08)", color: "#cc0000", fontWeight: 700 };
        if (c.includes("zamalek")) return { background: "rgba(0,80,160,0.08)", color: "#0050a0", fontWeight: 700 };
        if (c.includes("tersana")) return { background: "rgba(0,140,180,0.08)", color: "#008cb4", fontWeight: 700 };
        if (c.includes("sekka") || c.includes("seka")) return { background: "rgba(100,60,200,0.08)", color: "#643cc8", fontWeight: 700 };
        return { fontWeight: 600, color: "#333" };
    };

    // ── Excel Export ─────────────────────────────────────────────────────────
    useEffect(() => {
        const handleExport = () => {
            if (activeTab !== "seasons") return;
            const workbook = XLSX.utils.book_new();

            if (innerTab === "pivot") {
                // Export pivot table
                const headers = ["SEASON", ...pivotCompetitions];
                const rows = filteredPivotSeasons.map(season => {
                    const row = { SEASON: season };
                    pivotCompetitions.forEach(comp => {
                        row[comp] = pivotMap[`${season}|${comp}`] || "---";
                    });
                    return row;
                });
                const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
                XLSX.utils.book_append_sheet(workbook, sheet, "Pivot");
                XLSX.writeFile(workbook, "EgyptClubs_Trophies_Pivot.xlsx");
            } else {
                if (!selectedSeason) return;
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
                const wb2 = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb2, worksheet, `Season_${selectedSeason}`);
                XLSX.writeFile(wb2, `EgyptClubs_Season_${selectedSeason.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`);
            }
        };

        window.addEventListener("egypt-club-trophy-export-excel", handleExport);
        return () => window.removeEventListener("egypt-club-trophy-export-excel", handleExport);
    }, [activeTab, innerTab, selectedSeason, filteredTrophies, filteredPivotSeasons, pivotCompetitions, pivotMap]);

    if (trophies.length === 0) {
        return <NoData_db message="NO TROPHY RECORDS FOUND IN DATABASE" />;
    }

    return (
        <div className="tab-content" id="tab-seasons">
            <div className="seasons-wrap">

                {/* Page Header */}
                <div className="header-tabs-container">
                    <div className="section-title">EGYPT CLUBS <span className="accent">SEASONS TROPHIES</span></div>
                </div>
                <div className="gold-line" style={{ margin: "15px 0 24px" }}></div>

                {/* ── Inner Sub-Tabs ───────────────────────────────────────── */}
                <div className="seasons-inner-tabs">
                    <button
                        className={`seasons-inner-tab-btn ${innerTab === "season" ? "active" : ""}`}
                        onClick={() => setInnerTab("season")}
                    >
                        <Table2 size={14} /> Season View
                    </button>
                    <button
                        className={`seasons-inner-tab-btn ${innerTab === "pivot" ? "active" : ""}`}
                        onClick={() => setInnerTab("pivot")}
                    >
                        <LayoutGrid size={14} /> Pivot Table
                    </button>
                </div>

                {/* ══════════════════════════════════════════════════════════ */}
                {/*  SEASON VIEW                                               */}
                {/* ══════════════════════════════════════════════════════════ */}
                {innerTab === "season" && (
                    <>
                        {/* Toolbar */}
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
                                    placeholder="Search trophies, champions..."
                                />
                            </div>
                        </div>

                        {/* Quick Stats */}
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

                        {/* Table */}
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
                                                    <td style={{ fontWeight: "700" }}>🏆 {t.COMPETITION}</td>
                                                    <td style={{ color: "#555" }}>{t.PLACE || "---"}</td>
                                                    <td style={{ fontWeight: "800", color: "var(--gold)" }}>
                                                        🛡️ {t.CHAMPION || "---"}
                                                    </td>
                                                    <td style={{ fontFamily: "monospace" }}>{t.RESULT || "---"}</td>
                                                    <td style={{ fontFamily: "monospace", color: "var(--gold)" }}>{t.PEN || "---"}</td>
                                                    <td style={{ fontWeight: "600", color: "#333" }}>{t["RUNNER-UP"] || "---"}</td>
                                                    <td style={{ color: "#666" }}>{t.NOTE || "---"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {totalPages > 1 && (
                                        <div className="pagination-container">
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="page-btn">← PREV</button>
                                            <span className="page-info">PAGE {currentPage} OF {totalPages}</span>
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="page-btn">NEXT →</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/*  PIVOT TABLE                                               */}
                {/* ══════════════════════════════════════════════════════════ */}
                {innerTab === "pivot" && (
                    <>
                        {/* Pivot Toolbar */}
                        <div className="seasons-control-toolbar" style={{ marginBottom: "20px" }}>
                            <div className="pivot-meta">
                                <span className="pivot-meta-badge">{filteredPivotSeasons.length} Seasons</span>
                                <span className="pivot-meta-badge">{pivotCompetitions.length} Competitions</span>
                            </div>
                            <div className="season-search-wrapper">
                                <SearchBar_db
                                    value={pivotSearch}
                                    onChange={setPivotSearch}
                                    placeholder="Filter by season or champion..."
                                />
                            </div>
                        </div>

                        {/* Pivot Table */}
                        <div className="pivot-table-container">
                            <table className="pivot-table">
                                <colgroup>
                                    <col style={{ width: `${100 / (pivotCompetitions.length + 1)}%` }} />
                                    {pivotCompetitions.map(comp => (
                                        <col key={comp} style={{ width: `${100 / (pivotCompetitions.length + 1)}%` }} />
                                    ))}
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th className="pivot-season-header">SEASON</th>
                                        {pivotCompetitions.map(comp => (
                                            <th key={comp} className="pivot-comp-header">{comp}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPivotSeasons.length === 0 ? (
                                        <tr>
                                            <td colSpan={pivotCompetitions.length + 1} style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                                No matching seasons found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPivotSeasons.map(season => (
                                            <tr key={season} className="pivot-row">
                                                <td className="pivot-season-cell">{season}</td>
                                                {pivotCompetitions.map(comp => {
                                                    const champion = pivotMap[`${season}|${comp}`];
                                                    const isMatch = pivotSearch.trim() &&
                                                        champion &&
                                                        champion.toLowerCase().includes(pivotSearch.toLowerCase());
                                                    return (
                                                        <td
                                                            key={comp}
                                                            className={`pivot-champion-cell${isMatch ? " pivot-cell-highlight" : ""}`}
                                                        >
                                                            {champion || <span className="pivot-empty">—</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
