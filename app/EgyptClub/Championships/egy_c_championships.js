"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import { ChevronRight, ArrowLeft, Zap } from "lucide-react";
import { exportMatchesToExcel, exportSummaryToExcel } from "../ExcelExport/egy_c_excel_export";
import "../Seasons/egy_c_seasons.css";

export default function EgyptClubChampionships({ matches }) {
    const [selectedChampionship, setSelectedChampionship] = useState(null);
    const [currentPageOverview, setCurrentPageOverview] = useState(1);
    const [currentPageDetail, setCurrentPageDetail] = useState(1);

    useEffect(() => {
        setCurrentPageDetail(1);
    }, [selectedChampionship]);

    useEffect(() => {
        setCurrentPageOverview(1);
    }, [matches]);

    const championshipsData = useMemo(() => {
        const stats = {};
        matches.forEach((m) => {
            const name = m.CHAMPION;
            if (!name) return;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    csf: 0,
                    csa: 0,
                };
            }

            const row = stats[name];
            row.played++;
            if (m["W-D-L"] === "W") row.wins++;
            else if (m["W-D-L"] === "L") row.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) row.draws++;

            row.gf += Number(m.GF) || 0;
            row.ga += Number(m.GA) || 0;

            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") row.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") row.csa++;
        });

        return Object.values(stats).sort((a, b) => a.name.localeCompare(b.name, "ar"));
    }, [matches]);

    const championshipProfile = useMemo(() => {
        if (!selectedChampionship) return null;
        return matches.filter((m) => m.CHAMPION === selectedChampionship);
    }, [selectedChampionship, matches]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (selectedChampionship && championshipProfile) {
                exportMatchesToExcel(
                    championshipProfile,
                    `Championship_${selectedChampionship.replace(/[/\\?%*:|"<>]/g, "-")}_Matches`
                );
            } else {
                exportSummaryToExcel(championshipsData, "EgyptClubs_Championships_Summary", "name", "CHAMPIONSHIP");
            }
        };
        window.addEventListener("egypt-club-export-excel", handleGlobalExport);
        return () => window.removeEventListener("egypt-club-export-excel", handleGlobalExport);
    }, [championshipsData, selectedChampionship, championshipProfile]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    if (selectedChampionship && championshipProfile) {
        return (
            <div className="detail-wrap fade-in">
                <div className="detail-back-header">
                    <button onClick={() => setSelectedChampionship(null)} className="back-button">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="detail-title">
                            {selectedChampionship} <span className="accent">CHAMPIONSHIP MATCHES</span>
                        </h2>
                    </div>
                </div>

                <div className="gold-line" style={{ margin: "-10px 0 30px" }}></div>

                <div className="detail-matches-card">
                    <div className="detail-matches-title">
                        <Zap size={18} style={{ color: "var(--gold, #c9a84c)" }} /> Championship Fixtures ({championshipProfile.length} Matches)
                    </div>
                    {(() => {
                        const pageSize = 50;
                        const paginatedMatches = championshipProfile.slice(
                            (currentPageDetail - 1) * pageSize,
                            currentPageDetail * pageSize
                        );
                        const totalPages = Math.ceil(championshipProfile.length / pageSize);
                        return (
                            <div>
                                <table className="detail-matches-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "10%" }}>DATE</th>
                                            <th style={{ width: "22%" }}>CHAMPION</th>
                                            <th style={{ width: "14%" }}>SEASON</th>
                                            <th style={{ width: "8%" }}>ROUND</th>
                                            <th style={{ width: "14%" }}>EGYPT CLUB</th>
                                            <th style={{ width: "10%" }}>SCORE</th>
                                            <th style={{ width: "14%" }}>OPPONENT CLUB</th>
                                            <th style={{ width: "6%" }}>H-A-N</th>
                                            <th style={{ width: "8%" }}>RESULT</th>
                                            <th style={{ width: "10%" }}>NOTE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedMatches.map((m, i) => (
                                            <tr key={i}>
                                                <td style={{ color: "#666", fontFamily: "Space Mono, monospace" }}>{formatDate(m.DATE)}</td>
                                                <td style={{ fontWeight: "600" }}>{m.CHAMPION}</td>
                                                <td style={{ color: "#666" }}>{m.SEASON}</td>
                                                <td style={{ color: "#666" }}>{m.ROUND}</td>
                                                <td style={{ fontWeight: "700" }}>🛡️ {m["EGYPT TEAM"]}</td>
                                                <td style={{ fontFamily: "Space Mono, monospace", fontWeight: "bold" }}>
                                                    {m.GF} - {m.GA} {m.PEN ? `(${m.PEN})` : ""}
                                                </td>
                                                <td>🚩 {m["OPPONENT TEAM"]}</td>
                                                <td style={{ fontFamily: "Space Mono, monospace" }}>{m["H-A-N"]}</td>
                                                <td
                                                    style={{
                                                        fontWeight: "bold",
                                                        color:
                                                            m["W-D-L"] === "W"
                                                                ? "#00c853"
                                                                : m["W-D-L"] === "L"
                                                                    ? "#ff4d4d"
                                                                    : "var(--gold, #c9a84c)",
                                                    }}
                                                >
                                                    {m["W-D-L"]}
                                                </td>
                                                <td style={{ color: "#888", fontSize: "11px" }}>
                                                    {m["W-L Q & F"] ? m["W-L Q & F"] : m.NOTE ? m.NOTE : ""}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
                                    <div className="pagination-container">
                                        <button
                                            disabled={currentPageDetail === 1}
                                            onClick={() => setCurrentPageDetail((p) => Math.max(1, p - 1))}
                                            className="page-btn"
                                        >
                                            ← PREV
                                        </button>
                                        <div className="page-info">
                                            PAGE {currentPageDetail} OF {totalPages}
                                        </div>
                                        <button
                                            disabled={currentPageDetail === totalPages}
                                            onClick={() => setCurrentPageDetail((p) => Math.min(totalPages, p + 1))}
                                            className="page-btn"
                                        >
                                            NEXT →
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content" id="tab-championships">
            <div className="seasons-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">
                        EGYPT CLUB <span className="accent">CHAMPIONSHIPS</span>
                    </div>
                </div>
                <div className="gold-line" style={{ margin: "15px 0 30px" }}></div>

                {championshipsData.length === 0 ? (
                    <NoData_db message="No championships data found." />
                ) : (
                    (() => {
                        const pageSize = 50;
                        const paginatedChampionships = championshipsData.slice(
                            (currentPageOverview - 1) * pageSize,
                            currentPageOverview * pageSize
                        );
                        const totalPages = Math.ceil(championshipsData.length / pageSize);

                        const totals = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
                        championshipsData.forEach((c) => {
                            totals.played += c.played;
                            totals.wins += c.wins;
                            totals.draws += c.draws;
                            totals.losses += c.losses;
                            totals.gf += c.gf;
                            totals.ga += c.ga;
                            totals.csf += c.csf;
                            totals.csa += c.csa;
                        });
                        const totalsWinRate = totals.played > 0 ? Math.round((totals.wins / totals.played) * 100) : 0;

                        return (
                            <div className="table-container">
                                <table className="seasons-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "25%" }}>CHAMPIONSHIP</th>
                                            <th style={{ width: "7.5%" }}>PLAYED</th>
                                            <th style={{ color: "#00c853", width: "7.5%" }}>WON</th>
                                            <th style={{ color: "var(--gold, #c9a84c)", width: "8%" }}>WIN %</th>
                                            <th style={{ color: "var(--gold, #c9a84c)", width: "7.5%" }}>DRAW</th>
                                            <th style={{ color: "#ff4d4d", width: "7.5%" }}>LOSE</th>
                                            <th style={{ width: "7.5%" }}>GF</th>
                                            <th style={{ width: "7.5%" }}>GA</th>
                                            <th style={{ width: "7.5%" }}>CSF</th>
                                            <th style={{ width: "7.5%" }}>CSA</th>
                                            <th style={{ width: "7%" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedChampionships.map((c) => {
                                            const winRate = c.played > 0 ? Math.round((c.wins / c.played) * 100) : 0;
                                            return (
                                                <tr
                                                    key={c.name}
                                                    onClick={() => setSelectedChampionship(c.name)}
                                                    className="season-table-row"
                                                >
                                                    <td className="season-name-cell">🏆 {c.name}</td>
                                                    <td style={{ fontFamily: "Space Mono, monospace" }}>{c.played}</td>
                                                    <td style={{ color: "#00c853", fontWeight: "600", fontFamily: "Space Mono, monospace" }}>
                                                        {c.wins}
                                                    </td>
                                                    <td style={{ fontWeight: "bold", color: "var(--gold, #c9a84c)" }}>{winRate}%</td>
                                                    <td style={{ color: "var(--gold, #c9a84c)", fontFamily: "Space Mono, monospace" }}>
                                                        {c.draws}
                                                    </td>
                                                    <td style={{ color: "#ff4d4d", fontFamily: "Space Mono, monospace" }}>{c.losses}</td>
                                                    <td style={{ fontFamily: "Space Mono, monospace" }}>{c.gf}</td>
                                                    <td style={{ fontFamily: "Space Mono, monospace" }}>{c.ga}</td>
                                                    <td style={{ fontFamily: "Space Mono, monospace" }}>{c.csf}</td>
                                                    <td style={{ fontFamily: "Space Mono, monospace" }}>{c.csa}</td>
                                                    <td>
                                                        <ChevronRight size={18} style={{ color: "#888" }} />
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        <tr className="season-totals-row">
                                            <td className="totals-label">TOTAL ({championshipsData.length} Championships)</td>
                                            <td style={{ fontFamily: "Space Mono, monospace" }}>{totals.played}</td>
                                            <td style={{ color: "#00c853", fontFamily: "Space Mono, monospace" }}>{totals.wins}</td>
                                            <td style={{ color: "var(--gold, #c9a84c)" }}>{totalsWinRate}%</td>
                                            <td style={{ color: "var(--gold, #c9a84c)", fontFamily: "Space Mono, monospace" }}>
                                                {totals.draws}
                                            </td>
                                            <td style={{ color: "#ff4d4d", fontFamily: "Space Mono, monospace" }}>{totals.losses}</td>
                                            <td style={{ fontFamily: "Space Mono, monospace" }}>{totals.gf}</td>
                                            <td style={{ fontFamily: "Space Mono, monospace" }}>{totals.ga}</td>
                                            <td style={{ fontFamily: "Space Mono, monospace" }}>{totals.csf}</td>
                                            <td style={{ fontFamily: "Space Mono, monospace" }}>{totals.csa}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
                                    <div className="pagination-container">
                                        <button
                                            disabled={currentPageOverview === 1}
                                            onClick={() => setCurrentPageOverview((p) => Math.max(1, p - 1))}
                                            className="page-btn"
                                        >
                                            ← PREV
                                        </button>
                                        <div className="page-info">
                                            PAGE {currentPageOverview} OF {totalPages}
                                        </div>
                                        <button
                                            disabled={currentPageOverview === totalPages}
                                            onClick={() => setCurrentPageOverview((p) => Math.min(totalPages, p + 1))}
                                            className="page-btn"
                                        >
                                            NEXT →
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
}
