"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { buildScoringClubDetailStats } from "../egypt_nt_db_club_stats_utils";
import ClubStatsDetailsDashboard from "./egypt_nt_db_club_stats_details_dashboard";
import ClubStatsDetailsPlayers from "./egypt_nt_db_club_stats_details_players";
import ClubStatsDetailsMatches from "./egypt_nt_db_club_stats_details_matches";
import ClubStatsDetailsChampionships from "./egypt_nt_db_club_stats_details_championships";
import ClubStatsDetailsVsTeams from "./egypt_nt_db_club_stats_details_vs_teams";
import ClubStatsDetailsSeasons from "./egypt_nt_db_club_stats_details_seasons";
import "../../egypt_nt_db_squad.css";
import "../../SquadStats/egypt_nt_db_squad_details.css";

const CLUB_TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "players", label: "Players" },
    { id: "matches", label: "Matches" },
    { id: "vs_teams", label: "Vs Teams" },
    { id: "championships", label: "Championships" },
    { id: "seasons", label: "Seasons" }
];

export default function EgyptNTClubStatsDetails({
    clubName,
    playerDetails,
    filteredMatches,
    onBack
}) {
    const [activeTab, setActiveTab] = useState("dashboard");

    const clubStats = useMemo(
        () => buildScoringClubDetailStats(clubName, playerDetails, filteredMatches),
        [clubName, playerDetails, filteredMatches]
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [clubName, activeTab]);

    return (
        <div className="club-details-wrap fade-in">
            <div className="club-details-header">
                <button type="button" className="club-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Back to Clubs
                </button>
                <div className="club-details-title">
                    SCORING CLUB <span className="accent">{clubName}</span>
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
                {activeTab === "dashboard" && <ClubStatsDetailsDashboard clubStats={clubStats} />}
                {activeTab === "players" && <ClubStatsDetailsPlayers clubStats={clubStats} />}
                {activeTab === "matches" && <ClubStatsDetailsMatches clubStats={clubStats} />}
                {activeTab === "vs_teams" && <ClubStatsDetailsVsTeams clubStats={clubStats} />}
                {activeTab === "championships" && <ClubStatsDetailsChampionships clubStats={clubStats} />}
                {activeTab === "seasons" && <ClubStatsDetailsSeasons clubStats={clubStats} />}
            </div>
        </div>
    );
}
