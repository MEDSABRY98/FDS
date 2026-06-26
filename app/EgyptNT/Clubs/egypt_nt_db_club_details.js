"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { buildClubStats, buildScoringClubDetailStats, getGroupDetailTitle, GROUPING_MODES } from "./egypt_nt_db_clubs_utils";

import ClubDetailsDashboard from "./egypt_nt_db_club_details_dashboard";
import ClubDetailsPlayers from "./egypt_nt_db_club_details_players";
import ClubDetailsSeasonDetails from "./egypt_nt_db_club_details_season_details";
import ClubDetailsMatches from "./egypt_nt_db_club_details_matches";
import ClubDetailsVsTeams from "./egypt_nt_db_club_details_vs_teams";
import ClubDetailsChampionships from "./egypt_nt_db_club_details_championships";
import ClubDetailsSeasons from "./egypt_nt_db_club_details_seasons";

import "./egypt_nt_db_clubs.css";

const CLUB_TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "players", label: "Players" },
    { id: "matches", label: "Matches" },
    { id: "vs_teams", label: "Vs Teams" },
    { id: "championships", label: "Championships" },
    { id: "seasons", label: "Seasons" },
    { id: "season_details", label: "Season Details" }
];

export default function EgyptNTClubDetails({
    groupKey,
    clubName,
    groupingMode = GROUPING_MODES.CLUB,
    squadData,
    matches,
    lineupDetails,
    playerDetails,
    gkDetails,
    onBack
}) {
    const resolvedGroupKey = String(groupKey || clubName || "").trim();
    const [activeTab, setActiveTab] = useState("dashboard");
    const detailTitle = getGroupDetailTitle(groupingMode);

    // 1. Build squad/callups stats for this club
    const squadClubStats = useMemo(
        () => buildClubStats(resolvedGroupKey, squadData, { matches, lineupDetails, playerDetails, gkDetails }, groupingMode),
        [resolvedGroupKey, squadData, matches, lineupDetails, playerDetails, gkDetails, groupingMode]
    );

    // 2. Build scoring stats for this club
    const scoringClubStats = useMemo(
        () => buildScoringClubDetailStats(resolvedGroupKey, playerDetails, matches, squadData, groupingMode),
        [resolvedGroupKey, playerDetails, matches, squadData, groupingMode]
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [resolvedGroupKey, activeTab, groupingMode]);

    return (
        <div className="club-details-wrap fade-in">
            <div className="club-details-header">
                <button type="button" className="club-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Back to Clubs
                </button>
                <div className="club-details-title">
                    {detailTitle} <span className="accent">{resolvedGroupKey}</span>
                </div>
            </div>

            <div className="gold-line" style={{ marginBottom: "20px" }} />

            <div className="squad-subtabs-switcher club-details-tabs">
                {CLUB_TABS.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`subtab-btn ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="club-details-tab-body">
                {activeTab === "dashboard" && (
                    <ClubDetailsDashboard 
                        squadClubStats={squadClubStats} 
                        scoringClubStats={scoringClubStats} 
                    />
                )}
                {activeTab === "players" && (
                    <ClubDetailsPlayers 
                        squadClubStats={squadClubStats} 
                        scoringClubStats={scoringClubStats} 
                    />
                )}
                {activeTab === "season_details" && (
                    <ClubDetailsSeasonDetails 
                        clubStats={squadClubStats} 
                    />
                )}
                {activeTab === "matches" && (
                    <ClubDetailsMatches 
                        clubStats={scoringClubStats} 
                    />
                )}
                {activeTab === "vs_teams" && (
                    <ClubDetailsVsTeams 
                        clubStats={scoringClubStats} 
                    />
                )}
                {activeTab === "championships" && (
                    <ClubDetailsChampionships 
                        squadClubStats={squadClubStats} 
                        scoringClubStats={scoringClubStats} 
                    />
                )}
                {activeTab === "seasons" && (
                    <ClubDetailsSeasons 
                        squadClubStats={squadClubStats} 
                        scoringClubStats={scoringClubStats} 
                    />
                )}
            </div>
        </div>
    );
}
