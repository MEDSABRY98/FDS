"use client";

import NoData_db from "../../../lib/NoData_db";

export default function ClubDetailsDashboard({ clubStats }) {
    if (!clubStats || clubStats.totalCallups === 0) {
        return <NoData_db message="NO DATA AVAILABLE FOR THIS CLUB" height="240px" />;
    }

    const { highlights } = clubStats;

    const cards = [
        { label: "Total Call-ups", value: clubStats.totalCallups, color: "var(--gold)" },
        { label: "Unique Players", value: clubStats.uniquePlayers, color: "#0066cc" },
        { label: "Unique Tournaments", value: clubStats.uniqueChampions, color: "var(--gold)" },
        { label: "Unique Seasons", value: clubStats.uniqueSeasons, color: "#111" },
        {
            label: "Top Player",
            value: highlights.topPlayer?.callups ?? "—",
            sub: highlights.topPlayer?.name || "—",
            color: "var(--gold)"
        },
        {
            label: "Top Tournament",
            value: highlights.topChampion?.callups ?? "—",
            sub: highlights.topChampion?.name || "—",
            color: "var(--gold)"
        },
        {
            label: "First Season",
            value: highlights.firstSeason,
            color: "#444",
            small: true
        },
        {
            label: "Latest Season",
            value: highlights.lastSeason,
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
