"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_penalties.css";
import "../Players/alahly_db_players.css";
import "../HeadToHead/alahly_db_h2h.css";
import "../Dashboard/alahly_db_dashboard.css";
import { AlAhlyExcelExport } from "../ExportExcel/alahly_export_excel";
import {
    normalizePenaltyEvents,
    aggregateTeamStats,
    aggregateByChampion,
    aggregateBySeason,
    aggregateByOpponent,
    aggregateByManager,
    aggregateByPlayer,
    sumPenaltyRows,
    aggregateAhlyGkPenalties,
} from "./alahly_db_penalties_utils";
import AlAhlyPenaltiesDashboard from "./alahly_db_penalties_dashboard";
import AlAhlyPenaltiesChampionships from "./alahly_db_penalties_championships";
import AlAhlyPenaltiesSeasons from "./alahly_db_penalties_seasons";
import AlAhlyPenaltiesVsTeams from "./alahly_db_penalties_vs_teams";
import AlAhlyPenaltiesPlayers from "./alahly_db_penalties_players";
import AlAhlyPenaltiesManagers from "./alahly_db_penalties_managers";
import AlAhlyPenaltiesGKs from "./alahly_db_penalties_gks";

const SUB_TABS = ["Dashboard", "Championships", "Seasons", "Vs Teams", "Managers", "Players", "GKs"];
const TEAM_FILTER_LABELS = { all: "All Players", ahly: "With Al Ahly", opponents: "Against Al Ahly" };
const MANAGER_TYPE_LABELS = { ahly: "Ahly Managers", opponent: "Opponent Managers" };

export default function AlAhlyPenalties({ playerDetails, filteredMatches, gkDetails }) {
    const [activeSubTab, setActiveSubTab] = useState(1);
    const [perspective, setPerspective] = useState("for"); // "for" or "against"
    const [managerType, setManagerType] = useState("ahly");

    const { events } = useMemo(
        () => normalizePenaltyEvents(playerDetails, filteredMatches),
        [playerDetails, filteredMatches]
    );

    const teamStats = useMemo(() => aggregateTeamStats(events), [events]);
    const championRows = useMemo(() => aggregateByChampion(events, perspective), [events, perspective]);
    const seasonRowsName = useMemo(() => aggregateBySeason(events, "name", perspective), [events, perspective]);
    const seasonRowsNumber = useMemo(() => aggregateBySeason(events, "number", perspective), [events, perspective]);
    const opponentRows = useMemo(() => aggregateByOpponent(events, perspective), [events, perspective]);
    const managerRows = useMemo(() => aggregateByManager(events, managerType, perspective), [events, managerType, perspective]);
    
    // Players team filter derived from perspective: "for" -> "ahly", "against" -> "opponents"
    const playerRows = useMemo(() => aggregateByPlayer(events, perspective === "for" ? "ahly" : "opponents"), [events, perspective]);

    // Ahly GKs facing opponent penalties (or Opponent GKs facing Ahly penalties, based on perspective)
    const gkRows = useMemo(() => aggregateAhlyGkPenalties({ playerDetails, gkDetails, filteredMatches, perspective }), [playerDetails, gkDetails, filteredMatches, perspective]);

    const handleExport = () => {
        if (activeSubTab === 1) {
            const { forAhly, againstAhly } = teamStats;
            const againstAttempts = (againstAhly.concGoal || 0) + (againstAhly.concMiss || 0) + (againstAhly.concSaved || 0);
            const againstConversion = againstAttempts
                ? ((againstAhly.concGoal / againstAttempts) * 100).toFixed(1)
                : "0.0";
            
            if (perspective === "against") {
                AlAhlyExcelExport.exportToExcel([
                    { SIDE: "AGAINST AHLY", ATTEMPTS: againstAttempts, SCORED: againstAhly.concGoal, MISSED: againstAhly.concMiss, SAVED: againstAhly.concSaved, "CONV%": `${againstConversion}%` },
                ], "AlAhly_Penalties_Dashboard_Against");
            } else {
                AlAhlyExcelExport.exportToExcel([
                    { SIDE: "FOR AHLY", ATTEMPTS: forAhly.attFor, SCORED: forAhly.scored, MISSED: forAhly.missed, SAVED: forAhly.saved, "CONV%": `${forAhly.conversion}%` },
                ], "AlAhly_Penalties_Dashboard_For");
            }
            return;
        }

        if (activeSubTab === 2) {
            const totals = sumPenaltyRows(championRows);
            const exportData = championRows.map((r, i) => ({
                "#": i + 1,
                COMPETITION: r.name,
                ATT: r.attFor,
                SCORED: r.scored,
                "CONV%": `${r.conversion}%`,
                MISS: r.missed,
                SAVED: r.saved,
            }));
            exportData.push({
                "#": "TOTALS",
                COMPETITION: "",
                ATT: totals.attFor,
                SCORED: totals.scored,
                "CONV%": `${totals.conversion}%`,
                MISS: totals.missed,
                SAVED: totals.saved,
            });
            AlAhlyExcelExport.exportToExcel(exportData, "AlAhly_Penalties_Championships");
            return;
        }

        if (activeSubTab === 3) {
            const totals = sumPenaltyRows(seasonRowsName);
            const exportData = seasonRowsName.map((r, i) => ({
                "#": i + 1,
                SEASON: r.name,
                ATT: r.attFor,
                SCORED: r.scored,
                "CONV%": `${r.conversion}%`,
                MISS: r.missed,
                SAVED: r.saved,
            }));
            exportData.push({
                "#": "TOTALS",
                SEASON: "",
                ATT: totals.attFor,
                SCORED: totals.scored,
                "CONV%": `${totals.conversion}%`,
                MISS: totals.missed,
                SAVED: totals.saved,
            });
            AlAhlyExcelExport.exportToExcel(exportData, "AlAhly_Penalties_Seasons");
            return;
        }

        if (activeSubTab === 4) {
            const totals = sumPenaltyRows(opponentRows);
            const exportData = opponentRows.map((r, i) => ({
                "#": i + 1,
                TEAM: r.name,
                "ATT": r.attFor,
                "G": r.scored,
                "MISS": r.missed,
                "SAVED": r.saved,
            }));
            exportData.push({
                "#": "TOTALS",
                TEAM: "",
                "ATT": totals.attFor,
                "G": totals.scored,
                "MISS": totals.missed,
                "SAVED": totals.saved,
            });
            AlAhlyExcelExport.exportToExcel(exportData, `AlAhly_Penalties_Vs_Teams_${perspective}`);
            return;
        }

        if (activeSubTab === 5) {
            const totals = sumPenaltyRows(managerRows);
            const exportData = managerRows.map((r, i) => ({
                "#": i + 1,
                MANAGER: r.name,
                "ATT": r.attFor,
                "G": r.scored,
                "MISS": r.missed,
                "SAVED": r.saved,
            }));
            exportData.push({
                "#": "TOTALS",
                MANAGER: "",
                "ATT": totals.attFor,
                "G": totals.scored,
                "MISS": totals.missed,
                "SAVED": totals.saved,
            });
            AlAhlyExcelExport.exportToExcel(exportData, `AlAhly_Penalties_${managerType === "opponent" ? "Opponent" : "Ahly"}_Managers_${perspective}`);
            return;
        }

        if (activeSubTab === 6) {
            AlAhlyExcelExport.exportToExcel(
                playerRows.map((r, i) => ({
                    "#": i + 1,
                    PLAYER: r.name,
                    TOTAL: r.total,
                    SCORE: r.goal,
                    MISS: r.miss,
                    SAVED: r.saved,
                    "WON(G)": r.wonGoal,
                    "WON(M)": r.wonMiss,
                    "MAKE(G)": r.makeGoal,
                    "MAKE(M)": r.makeMiss,
                    "CONV%": `${r.conversion}%`,
                })),
                `AlAhly_Penalties_Players_${perspective === "for" ? "Ahly" : "Opponents"}`
            );
            return;
        }

        if (activeSubTab === 7) {
            const exportData = gkRows.map((r, i) => ({
                "#": i + 1,
                GOALKEEPER: r.name,
                "TOTAL FACED": r.total,
                SAVED: r.saved,
                MISSED: r.missed,
                CONCEDED: r.goal,
                "SAVE%": `${r.savePct}%`,
            }));
            AlAhlyExcelExport.exportToExcel(exportData, "AlAhly_Penalties_Goalkeepers");
            return;
        }
    };

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener("alahly-export-excel", handleGlobalExport);
        return () => window.removeEventListener("alahly-export-excel", handleGlobalExport);
    }, [activeSubTab, teamStats, championRows, seasonRowsName, opponentRows, playerRows, managerRows, gkRows, managerType, perspective]);

    return (
        <div className="tab-content fade-in" id="tab-alahly-penalties">
            <div className="penalties-premium-wrap">
                <div className="penalties-header-block">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div className="section-title">AL AHLY <span className="accent">PENALTIES</span></div>
                            <div className="gold-line"></div>
                        </div>
                        <div className="penalties-season-toggle">
                            <button type="button" className={perspective === "for" ? "active" : ""} onClick={() => setPerspective("for")}>For Al Ahly</button>
                            <button type="button" className={perspective === "against" ? "active" : ""} onClick={() => setPerspective("against")}>Against Al Ahly</button>
                        </div>
                    </div>
                    <div className="penalties-sub-tabs-selection">
                        {SUB_TABS.map((label, index) => {
                            const num = index + 1;
                            return (
                                <div
                                    key={num}
                                    className={`sub-tab-box ${activeSubTab === num ? "active" : ""}`}
                                    onClick={() => setActiveSubTab(num)}
                                >
                                    {label}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {activeSubTab === 1 && <AlAhlyPenaltiesDashboard teamStats={teamStats} events={events} perspective={perspective} />}
                {activeSubTab === 2 && <AlAhlyPenaltiesChampionships rows={championRows} />}
                {activeSubTab === 3 && (
                    <AlAhlyPenaltiesSeasons rowsName={seasonRowsName} rowsNumber={seasonRowsNumber} />
                )}
                {activeSubTab === 4 && <AlAhlyPenaltiesVsTeams rows={opponentRows} />}
                {activeSubTab === 5 && (
                    <AlAhlyPenaltiesManagers
                        rows={managerRows}
                        managerType={managerType}
                        onManagerTypeChange={setManagerType}
                        managerTypeLabels={MANAGER_TYPE_LABELS}
                    />
                )}
                {activeSubTab === 6 && (
                    <AlAhlyPenaltiesPlayers
                        rows={playerRows}
                    />
                )}
                {activeSubTab === 7 && (
                    <AlAhlyPenaltiesGKs
                        rows={gkRows}
                    />
                )}
            </div>
        </div>
    );
}
