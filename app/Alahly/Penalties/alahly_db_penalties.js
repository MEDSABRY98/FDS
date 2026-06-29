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
    aggregateByPlayer,
    sumPenaltyRows,
} from "./alahly_db_penalties_utils";
import AlAhlyPenaltiesDashboard from "./alahly_db_penalties_dashboard";
import AlAhlyPenaltiesChampionships from "./alahly_db_penalties_championships";
import AlAhlyPenaltiesSeasons from "./alahly_db_penalties_seasons";
import AlAhlyPenaltiesVsTeams from "./alahly_db_penalties_vs_teams";
import AlAhlyPenaltiesPlayers from "./alahly_db_penalties_players";

const SUB_TABS = ["Dashboard", "Championships", "Seasons", "Vs Teams", "Players"];
const TEAM_FILTER_LABELS = { all: "All Players", ahly: "With Al Ahly", opponents: "Against Al Ahly" };

export default function AlAhlyPenalties({ playerDetails, filteredMatches }) {
    const [activeSubTab, setActiveSubTab] = useState(1);
    const [teamFilter, setTeamFilter] = useState("all");

    const { events } = useMemo(
        () => normalizePenaltyEvents(playerDetails, filteredMatches),
        [playerDetails, filteredMatches]
    );

    const teamStats = useMemo(() => aggregateTeamStats(events), [events]);
    const championRows = useMemo(() => aggregateByChampion(events), [events]);
    const seasonRowsName = useMemo(() => aggregateBySeason(events, "name"), [events]);
    const seasonRowsNumber = useMemo(() => aggregateBySeason(events, "number"), [events]);
    const opponentRows = useMemo(() => aggregateByOpponent(events), [events]);
    const playerRows = useMemo(() => aggregateByPlayer(events, teamFilter), [events, teamFilter]);

    const handleExport = () => {
        if (activeSubTab === 1) {
            const { forAhly, againstAhly } = teamStats;
            const againstAttempts = (againstAhly.concGoal || 0) + (againstAhly.concMiss || 0) + (againstAhly.concSaved || 0);
            const againstConversion = againstAttempts
                ? ((againstAhly.concGoal / againstAttempts) * 100).toFixed(1)
                : "0.0";
            AlAhlyExcelExport.exportToExcel([
                { SIDE: "FOR AHLY", ATTEMPTS: forAhly.attFor, SCORED: forAhly.scored, MISSED: forAhly.missed, SAVED: forAhly.saved, "CONV%": `${forAhly.conversion}%` },
                { SIDE: "AGAINST AHLY", ATTEMPTS: againstAttempts, SCORED: againstAhly.concGoal, MISSED: againstAhly.concMiss, SAVED: againstAhly.concSaved, "CONV%": `${againstConversion}%` },
            ], "AlAhly_Penalties_Dashboard");
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
                "FOR ATT": r.attFor,
                "FOR G": r.scored,
                "FOR MISS": r.missed,
                "FOR SAVED": r.saved,
                "AGAINST ATT": r.concAtt,
                "AGAINST G": r.concGoal,
                "AGAINST MISS": r.concMiss,
                "AGAINST SAVED": r.concSaved,
            }));
            exportData.push({
                "#": "TOTALS",
                TEAM: "",
                "FOR ATT": totals.attFor,
                "FOR G": totals.scored,
                "FOR MISS": totals.missed,
                "FOR SAVED": totals.saved,
                "AGAINST ATT": totals.concAtt,
                "AGAINST G": totals.concGoal,
                "AGAINST MISS": totals.concMiss,
                "AGAINST SAVED": totals.concSaved,
            });
            AlAhlyExcelExport.exportToExcel(exportData, "AlAhly_Penalties_Vs_Teams");
            return;
        }

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
            "AlAhly_Penalties_Players"
        );
    };

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener("alahly-export-excel", handleGlobalExport);
        return () => window.removeEventListener("alahly-export-excel", handleGlobalExport);
    }, [activeSubTab, teamStats, championRows, seasonRowsName, opponentRows, playerRows]);

    return (
        <div className="tab-content fade-in" id="tab-alahly-penalties">
            <div className="penalties-premium-wrap">
                <div className="penalties-header-block">
                    <div className="section-title">AL AHLY <span className="accent">PENALTIES</span></div>
                    <div className="gold-line"></div>
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

                {activeSubTab === 1 && <AlAhlyPenaltiesDashboard teamStats={teamStats} events={events} />}
                {activeSubTab === 2 && <AlAhlyPenaltiesChampionships rows={championRows} />}
                {activeSubTab === 3 && (
                    <AlAhlyPenaltiesSeasons rowsName={seasonRowsName} rowsNumber={seasonRowsNumber} />
                )}
                {activeSubTab === 4 && <AlAhlyPenaltiesVsTeams rows={opponentRows} />}
                {activeSubTab === 5 && (
                    <AlAhlyPenaltiesPlayers
                        rows={playerRows}
                        teamFilter={teamFilter}
                        onTeamFilterChange={setTeamFilter}
                        teamFilterLabels={TEAM_FILTER_LABELS}
                    />
                )}
            </div>
        </div>
    );
}
