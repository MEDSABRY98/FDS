"use client";

import NoData_db from "../../lib/NoData_db";

export default function ClubStatsDetailsDashboard({ clubStats }) {
    if (!clubStats || clubStats.goals === 0 && clubStats.assists === 0) {
        return <NoData_db message="NO SCORING DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    const { highlights } = clubStats;

    const cards = [
        { label: "Total Goals", value: clubStats.goals, color: "#2ecc71" },
        { label: "Total Assists", value: clubStats.assists, color: "#3498db" },
        { label: "Goals + Assists", value: clubStats.ga, color: "var(--gold)" },
        { label: "Penalty Goals", value: clubStats.penGoals, color: "#e74c3c" },
        { label: "Unique Scorers", value: clubStats.scorersCount, color: "#0066cc" },
        { label: "Contributors", value: clubStats.contributorsCount, color: "#111" },
        { label: "Matches", value: clubStats.matchCount, color: "var(--gold)" },
        { label: "Tournaments", value: clubStats.championshipCount, color: "var(--gold)" },
        {
            label: "Top Scorer",
            value: highlights.topScorer?.goals ?? "—",
            sub: highlights.topScorer?.name || "—",
            color: "var(--gold)"
        },
        {
            label: "First Goal",
            value: highlights.firstDate || "—",
            color: "#444",
            small: true
        },
        {
            label: "Latest Goal",
            value: highlights.lastDate || "—",
            color: "#444",
            small: true
        }
    ];

    return (
        <div className="club-details-kpi-grid fade-in">
            {cards.map(card => (
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
    );
}
