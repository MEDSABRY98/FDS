"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import IntTrophyTeamDetailsFinals from "./int_trophy_team_details_finals";
import IntTrophyTeamDetailsByGame from "./int_trophy_team_details_by_game";
import IntTrophyTeamDetailsByPlace from "./int_trophy_team_details_by_place";
import IntTrophyTeamDetailsByCompetition from "./int_trophy_team_details_by_competition";
import IntTrophyTeamDetailsBySeason from "./int_trophy_team_details_by_season";
import IntTrophyTeamDetailsByOpponent from "./int_trophy_team_details_by_opponent";
import { buildTeamSummary, FINAL_OUTCOME_OPTIONS } from "./int_trophy_team_details_utils";
import "./int_trophy_team_details.css";

const TABS = [
    { id: "finals", label: "FINALS LOG" },
    { id: "by_place", label: "BY PLACE" },
    { id: "by_opponent", label: "BY OPPONENT" },
    { id: "by_game", label: "BY GAME" },
    { id: "by_competition", label: "BY COMPETITION" },
    { id: "by_season", label: "BY SEASON" },
];

export default function IntTrophyTeamDetails({ championName, trophies, typeFilter = "All", onBack }) {
    const [activeTab, setActiveTab] = useState("finals");
    const [outcomeFilter, setOutcomeFilter] = useState("all");

    useEffect(() => {
        setActiveTab("finals");
        setOutcomeFilter("all");
    }, [championName, typeFilter]);

    const summary = useMemo(
        () => buildTeamSummary(trophies, championName, typeFilter),
        [trophies, championName, typeFilter]
    );

    if (!summary.wins && !summary.losses) {
        return (
            <div className="int-trophy-team-details">
                <button type="button" className="int-trophy-team-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <NoData_db message="NO DATA FOR THIS TEAM" />
            </div>
        );
    }

    return (
        <div className="int-trophy-team-details">
            <div className="int-trophy-team-details-header">
                <div className="int-trophy-team-details-back">
                    <button type="button" className="int-trophy-team-details-back-btn" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="int-trophy-team-details-title-wrap">
                        <h1 className="int-trophy-team-details-title">
                            {championName} <span className="gold">TROPHIES</span>
                        </h1>
                        <div className="int-trophy-team-details-outcome-toggle">
                            {FINAL_OUTCOME_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={outcomeFilter === opt.id ? "active" : ""}
                                    onClick={() => setOutcomeFilter(opt.id)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="int-trophy-team-details-summary">
                    <div className="int-trophy-team-details-stat"><span>WINS</span>{summary.wins}</div>
                    <div className="int-trophy-team-details-stat"><span>LOSSES</span>{summary.losses}</div>
                    <div className="int-trophy-team-details-stat"><span>FINALS</span>{summary.finals}</div>
                </div>
            </div>

            <div className="int-trophy-team-details-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`int-trophy-team-details-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "finals" && (
                <IntTrophyTeamDetailsFinals
                    trophies={trophies}
                    teamName={championName}
                    typeFilter={typeFilter}
                    outcomeFilter={outcomeFilter}
                />
            )}
            {activeTab === "by_place" && (
                <IntTrophyTeamDetailsByPlace trophies={trophies} teamName={championName} typeFilter={typeFilter} />
            )}
            {activeTab === "by_opponent" && (
                <IntTrophyTeamDetailsByOpponent trophies={trophies} teamName={championName} typeFilter={typeFilter} />
            )}
            {activeTab === "by_game" && (
                <IntTrophyTeamDetailsByGame trophies={trophies} teamName={championName} typeFilter={typeFilter} />
            )}
            {activeTab === "by_competition" && (
                <IntTrophyTeamDetailsByCompetition trophies={trophies} teamName={championName} typeFilter={typeFilter} />
            )}
            {activeTab === "by_season" && (
                <IntTrophyTeamDetailsBySeason trophies={trophies} teamName={championName} typeFilter={typeFilter} />
            )}
        </div>
    );
}
