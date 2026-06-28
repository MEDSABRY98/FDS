"use client";

import { useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";

export default function ClubDetailsDashboard({ squadClubStats, scoringClubStats }) {
    const hasSquadData = squadClubStats && squadClubStats.totalCallups > 0;
    const hasScoringData = scoringClubStats && (scoringClubStats.goals > 0 || scoringClubStats.assists > 0);

    const [activeTab, setActiveTab] = useState("callups");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    if (!hasSquadData && !hasScoringData) {
        return <NoData_db message="NO DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    const resolvedTab = (activeTab === "callups" && !hasSquadData) ? "scoring" : 
                        (activeTab === "scoring" && !hasScoringData) ? "callups" : 
                        activeTab;

    // Process squad highlights
    const squadCards = hasSquadData ? [
        { label: "Total Call-ups", value: squadClubStats.totalCallups, color: "var(--gold)" },
        { label: "Unique Players", value: squadClubStats.uniquePlayers, color: "#0066cc" },
        { label: "Unique Tournaments", value: squadClubStats.uniqueChampions, color: "var(--gold)" },
        { label: "Unique Seasons", value: squadClubStats.uniqueSeasons, color: "#111" },
        {
            label: "Top Player",
            value: squadClubStats.highlights.topPlayer?.callups ?? "—",
            sub: squadClubStats.highlights.topPlayer?.name || "—",
            color: "var(--gold)"
        },
        {
            label: "Top Tournament",
            value: squadClubStats.highlights.topChampion?.callups ?? "—",
            sub: squadClubStats.highlights.topChampion?.name || "—",
            color: "var(--gold)"
        },
        {
            label: "First Season",
            value: squadClubStats.highlights.firstSeason,
            color: "#444",
            small: true
        },
        {
            label: "Latest Season",
            value: squadClubStats.highlights.lastSeason,
            color: "#444",
            small: true
        }
    ] : [];

    // Process scoring highlights
    const scoringCards = hasScoringData ? [
        { label: "Goals + Assists", value: scoringClubStats.ga, color: "var(--gold)" },
        { label: "Total Goals", value: scoringClubStats.goals, color: "#2ecc71" },
        { label: "Total Assists", value: scoringClubStats.assists, color: "#3498db" },
        { label: "Penalty Goals", value: scoringClubStats.penGoals, color: "#e74c3c" },
        { label: "Unique Scorers", value: scoringClubStats.scorersCount, color: "#0066cc" },
        { label: "Tournaments Scored In", value: scoringClubStats.championshipCount, color: "var(--gold)" },
        { label: "Seasons Scored In", value: scoringClubStats.seasons?.length || 0, color: "var(--gold)" },
        {
            label: "Top Scorer",
            value: scoringClubStats.highlights.topScorer?.goals ?? "—",
            sub: scoringClubStats.highlights.topScorer?.name || "—",
            color: "var(--gold)"
        },
        {
            label: "First Goal",
            value: scoringClubStats.highlights.firstDate || "—",
            color: "#444",
            small: true
        },
        {
            label: "Latest Goal",
            value: scoringClubStats.highlights.lastDate || "—",
            color: "#444",
            small: true
        }
    ] : [];

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {hasSquadData && hasScoringData && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <div className="squad-subtabs-switcher">
                        <button
                            type="button"
                            className={`subtab-btn ${resolvedTab === "callups" ? "active" : ""}`}
                            onClick={() => setActiveTab("callups")}
                        >
                            📋 Call-up Stats
                        </button>
                        <button
                            type="button"
                            className={`subtab-btn ${resolvedTab === "scoring" ? "active" : ""}`}
                            onClick={() => setActiveTab("scoring")}
                        >
                            ⚽ Goal Scoring
                        </button>
                    </div>
                </div>
            )}

            {resolvedTab === "callups" && hasSquadData && (
                <div>
                    <h3 className="club-details-section-title" style={{ color: 'var(--gold)', letterSpacing: '1px', fontSize: '20px', marginBottom: '15px' }}>
                        📋 CALL-UP STATS OVERVIEW
                    </h3>
                    <div className="club-details-kpi-grid">
                        {squadCards.map(card => (
                            <div key={card.label} className="club-details-kpi-card">
                                <span className="club-details-kpi-label">{card.label}</span>
                                <div
                                    className="club-details-kpi-value"
                                    style={{
                                        color: card.color,
                                        fontSize: card.small ? "28px" : undefined
                                    }}
                                >
                                    {card.value}
                                </div>
                                {card.sub && <div className="club-details-kpi-sub">{card.sub}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {resolvedTab === "scoring" && hasScoringData && (
                <div>
                    <h3 className="club-details-section-title" style={{ color: '#2ecc71', letterSpacing: '1px', fontSize: '20px', marginBottom: '15px' }}>
                        ⚽ GOAL SCORING OVERVIEW
                    </h3>
                    <div className="club-details-kpi-grid">
                        {scoringCards.map(card => (
                            <div key={card.label} className="club-details-kpi-card">
                                <span className="club-details-kpi-label">{card.label}</span>
                                <div
                                    className="club-details-kpi-value"
                                    style={{
                                        color: card.color,
                                        fontSize: card.small ? "28px" : undefined
                                    }}
                                >
                                    {card.value}
                                </div>
                                {card.sub && <div className="club-details-kpi-sub">{card.sub}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
