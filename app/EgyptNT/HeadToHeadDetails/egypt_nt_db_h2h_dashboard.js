"use client";

import { useMemo } from "react";
import knockoutRounds from "../knockout_rounds.json";

export default function EgyptNTH2HDashboard({ opponent, matches }) {
    const stats = useMemo(() => {
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let gf = 0;
        let ga = 0;
        let csFor = 0;
        let csAgainst = 0;
        let maxWinStreak = 0;
        let currentWinStreak = 0;
        let maxLossStreak = 0;
        let currentLossStreak = 0;

        // Knockout ties tracking
        const koTies = {};

        // Sort chronologically (oldest first) to calculate streaks
        const sortedMatches = [...matches].sort((a, b) => {
            const dateA = a.DATE ? new Date(a.DATE.split('/').reverse().join('-')) : new Date(0);
            const dateB = b.DATE ? new Date(b.DATE.split('/').reverse().join('-')) : new Date(0);
            return dateA - dateB;
        });

        sortedMatches.forEach(m => {
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            if (wdl.includes('W')) {
                wins++;
                currentWinStreak++;
                currentLossStreak = 0;
                if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
            } else if (wdl.includes('L')) {
                losses++;
                currentLossStreak++;
                currentWinStreak = 0;
                if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
            } else if (wdl.includes('D')) {
                draws++;
                currentWinStreak = 0;
                currentLossStreak = 0;
            }

            gf += Number(m.GF) || 0;
            ga += Number(m.GA) || 0;

            if ((Number(m.GA) || 0) === 0) csFor++;
            if ((Number(m.GF) || 0) === 0) csAgainst++;

            // Track Knockout Ties
            const round = String(m.ROUND || "").trim();
            if (round && knockoutRounds.includes(round)) {
                const champion = String(m.CHAMPION || "").trim();
                const season = String(m.SEASON || "").trim();
                const tieKey = `${champion}|${season}|${round}`;
                if (!koTies[tieKey]) {
                    koTies[tieKey] = { gf: 0, ga: 0, penWin: false, penLoss: false };
                }
                koTies[tieKey].gf += Number(m.GF) || 0;
                koTies[tieKey].ga += Number(m.GA) || 0;
                const pen = String(m.PEN || "").toUpperCase();
                if (pen.startsWith('W')) koTies[tieKey].penWin = true;
                if (pen.startsWith('L')) koTies[tieKey].penLoss = true;
            }
        });

        // Calculate Knockout Advancements
        let koEgyptAdvanced = 0;
        let koOppAdvanced = 0;

        Object.values(koTies).forEach(tie => {
            if (tie.penWin) {
                koEgyptAdvanced++;
            } else if (tie.penLoss) {
                koOppAdvanced++;
            } else if (tie.gf > tie.ga) {
                koEgyptAdvanced++;
            } else if (tie.ga > tie.gf) {
                koOppAdvanced++;
            }
            // If gf == ga and no pen, it might be an away goal win or unknown. We skip it as 'undecided' for simplicity, 
            // unless we have specific away goal data, which we don't.
        });

        const total = wins + draws + losses;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

        return { total, wins, draws, losses, gf, ga, csFor, csAgainst, winRate, maxWinStreak, maxLossStreak, koEgyptAdvanced, koOppAdvanced };
    }, [matches]);

    return (
        <div className="h2h-dashboard-wrap fade-in">
            <div className="h2h-dashboard-grid">
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">Total Matches</span>
                    <span className="h2h-stat-value">{stats.total}</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">W - D - L</span>
                    <span className="h2h-stat-value">
                        <span style={{color: '#2ecc71'}}>{stats.wins}</span> - {stats.draws} - <span style={{color: '#e74c3c'}}>{stats.losses}</span>
                    </span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">Win Rate</span>
                    <span className="h2h-stat-value gold">{stats.winRate}%</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">Goals For / Against</span>
                    <span className="h2h-stat-value">
                        <span style={{color: '#2ecc71'}}>{stats.gf}</span> / <span style={{color: '#e74c3c'}}>{stats.ga}</span>
                    </span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">CLEAN SHEETS (FOR)</span>
                    <span className="h2h-stat-value">{stats.csFor}</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">CLEAN SHEETS (AG)</span>
                    <span className="h2h-stat-value">{stats.csAgainst}</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">LONGEST WIN STREAK (EGYPT)</span>
                    <span className="h2h-stat-value" style={{color: '#2ecc71'}}>{stats.maxWinStreak}</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">LONGEST WIN STREAK (OPP)</span>
                    <span className="h2h-stat-value" style={{color: '#e74c3c'}}>{stats.maxLossStreak}</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">KNOCKOUTS ADVANCED (EGYPT)</span>
                    <span className="h2h-stat-value" style={{color: '#2ecc71'}}>{stats.koEgyptAdvanced}</span>
                </div>
                <div className="h2h-stat-card">
                    <span className="h2h-stat-label">KNOCKOUTS ADVANCED (OPP)</span>
                    <span className="h2h-stat-value" style={{color: '#e74c3c'}}>{stats.koOppAdvanced}</span>
                </div>
            </div>
        </div>
    );
}
