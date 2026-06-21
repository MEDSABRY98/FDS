"use client";

import { useState, useEffect } from "react";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import {
    buildScoringClubStats,
    buildPlayerClubStats
} from "./egypt_nt_db_club_stats_utils";
import EgyptNTClubStatsClubs from "./egypt_nt_db_club_stats_clubs";
import EgyptNTClubStatsPlayers from "./egypt_nt_db_club_stats_players";
import "../Squad/egypt_nt_db_squad.css";
import "../SquadDetails/egypt_nt_db_squad_details.css";
import "./egypt_nt_db_club_stats.css";

export default function EgyptNTClubStats({ playerDetails, filteredMatches }) {
    const [activeSubTab, setActiveSubTab] = useState("clubs");
    const [isClubDetailsOpen, setIsClubDetailsOpen] = useState(false);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (activeSubTab === "clubs") {
                const rows = buildScoringClubStats(playerDetails, filteredMatches);
                const exportData = rows.map((row, idx) => ({
                    Rank: idx + 1,
                    "Club Name": row.club,
                    Scorers: row.scorersCount,
                    "G+A": row.ga,
                    Goals: row.goals,
                    Assists: row.assists,
                    "Penalty Goals": row.penGoals,
                    Tournaments: row.championshipCount,
                    First: row.firstDate || "—",
                    Last: row.lastDate || "—"
                }));
                EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Club_Stats_Clubs");
            } else {
                const rows = buildPlayerClubStats(playerDetails, filteredMatches);
                const exportData = rows.map((row, idx) => ({
                    Rank: idx + 1,
                    "Club Name": row.club,
                    "Player Name": row.player,
                    "G+A": row.ga,
                    Goals: row.goals,
                    Assists: row.assists,
                    "Penalty Goals": row.penGoals
                }));
                EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Club_Stats_Players");
            }
        };

        window.addEventListener("egyptnt-export-excel", handleGlobalExport);
        return () => window.removeEventListener("egyptnt-export-excel", handleGlobalExport);
    }, [activeSubTab, playerDetails, filteredMatches]);

    return (
        <div className="tab-content" id="tab-club-stats">
            <div className="squad-wrap" style={{ maxWidth: "1400px", width: "95%", margin: "0 auto" }}>
                <div
                    className="section-header"
                    style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "flex-start" }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            flexWrap: "wrap",
                            gap: "30px",
                            direction: "ltr"
                        }}
                    >
                        <div
                            className="section-title"
                            style={{ margin: 0, display: "flex", alignItems: "center", gap: "15px" }}
                        >
                            EGYPT NT <span className="accent">CLUB STATS</span>
                        </div>

                        {!isClubDetailsOpen && (
                            <div className="squad-subtabs-switcher">
                                <button
                                    type="button"
                                    className={`subtab-btn ${activeSubTab === "clubs" ? "active" : ""}`}
                                    onClick={() => setActiveSubTab("clubs")}
                                >
                                    Clubs List
                                </button>
                                <button
                                    type="button"
                                    className={`subtab-btn ${activeSubTab === "players" ? "active" : ""}`}
                                    onClick={() => setActiveSubTab("players")}
                                >
                                    Players by Club
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="gold-line" />
                </div>

                <div style={{ marginTop: "10px" }}>
                    {activeSubTab === "clubs" && (
                        <EgyptNTClubStatsClubs
                            playerDetails={playerDetails}
                            filteredMatches={filteredMatches}
                            onDetailsViewChange={setIsClubDetailsOpen}
                        />
                    )}
                    {activeSubTab === "players" && (
                        <EgyptNTClubStatsPlayers
                            playerDetails={playerDetails}
                            filteredMatches={filteredMatches}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
