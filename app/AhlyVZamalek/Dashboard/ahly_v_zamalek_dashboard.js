"use client";

import { useMemo, useEffect } from "react";
import { AhlyVZamalekService } from "../Service/ahly_v_zamalek_service";
import { AhlyVZamalekExcelExport } from "../ExportExcel/ahly_v_zamalek_export_excel";
import "./ahly_v_zamalek_dashboard.css";

export default function AhlyVZamalekDashboard({ derbyData }) {


    const stats = useMemo(() => {
        let totalMatches = 0;
        let ahlyWins = 0;
        let draws = 0;
        let zamalekWins = 0;
        let ahlyGoals = 0;
        let zamalekGoals = 0;
        let ahlyCS = 0;
        let zamalekCS = 0;

        // Streak variables
        let maxAhlyWinStreak = 0, currentAhlyWinStreak = 0;
        let maxZamalekWinStreak = 0, currentZamalekWinStreak = 0;
        let maxAhlyLossStreak = 0, currentAhlyLossStreak = 0;
        let maxZamalekLossStreak = 0, currentZamalekLossStreak = 0;
        let maxDrawStreak = 0, currentDrawStreak = 0;

        if (derbyData && derbyData.length > 0) {
            totalMatches = derbyData.length;

            // Sort data by date for accurate streak calculation
            const sortedDerby = [...derbyData].sort((a, b) => {
                const dateA = a.DATE ? new Date(a.DATE) : new Date(a.YEAR, 0, 1);
                const dateB = b.DATE ? new Date(b.DATE) : new Date(b.YEAR, 0, 1);
                return dateA - dateB;
            });

            sortedDerby.forEach(match => {
                const wdl = String(match["W-D-L"] || "").toUpperCase();
                
                // Stats
                if (wdl === "W") ahlyWins++;
                else if (wdl === "D") draws++;
                else if (wdl === "L") zamalekWins++;

                const gf = parseInt(match.GF) || 0;
                const ga = parseInt(match.GA) || 0;
                ahlyGoals += gf;
                zamalekGoals += ga;

                const cs = String(match["CLEAN SHEET"] || "").toUpperCase();
                if (cs.includes("AHLY") || cs === "F" || cs === "BOTH") ahlyCS++;
                if (cs.includes("ZAMALEK") || cs === "A" || cs === "BOTH") zamalekCS++;

                // Streaks Logic
                if (wdl === "W") {
                    // Ahly Wins
                    currentAhlyWinStreak++;
                    currentAhlyLossStreak = 0;
                    currentDrawStreak = 0;
                    currentZamalekWinStreak = 0;
                    currentZamalekLossStreak++;
                } else if (wdl === "L") {
                    // Zamalek Wins (Ahly Losses)
                    currentAhlyWinStreak = 0;
                    currentAhlyLossStreak++;
                    currentDrawStreak = 0;
                    currentZamalekWinStreak++;
                    currentZamalekLossStreak = 0;
                } else {
                    // Draws
                    currentAhlyWinStreak = 0;
                    currentAhlyLossStreak = 0;
                    currentDrawStreak++;
                    currentZamalekWinStreak = 0;
                    currentZamalekLossStreak = 0;
                }

                maxAhlyWinStreak = Math.max(maxAhlyWinStreak, currentAhlyWinStreak);
                maxAhlyLossStreak = Math.max(maxAhlyLossStreak, currentAhlyLossStreak);
                maxZamalekWinStreak = Math.max(maxZamalekWinStreak, currentZamalekWinStreak);
                maxZamalekLossStreak = Math.max(maxZamalekLossStreak, currentZamalekLossStreak);
                maxDrawStreak = Math.max(maxDrawStreak, currentDrawStreak);
            });
        }

        const ahlyWinRate = totalMatches > 0 ? ((ahlyWins / totalMatches) * 100).toFixed(1) : 0;
        const zamalekWinRate = totalMatches > 0 ? ((zamalekWins / totalMatches) * 100).toFixed(1) : 0;
        
        const ahlyGPG = totalMatches > 0 ? (ahlyGoals / totalMatches).toFixed(2) : 0;
        const zamalekGPG = totalMatches > 0 ? (zamalekGoals / totalMatches).toFixed(2) : 0;
        
        const ahlyCSRate = totalMatches > 0 ? ((ahlyCS / totalMatches) * 100).toFixed(1) : 0;
        const zamalekCSRate = totalMatches > 0 ? ((zamalekCS / totalMatches) * 100).toFixed(1) : 0;

        return {
            total: totalMatches,
            ahlyWins,
            draws,
            zamalekWins,
            ahlyGoals,
            zamalekGoals,
            ahlyCS,
            zamalekCS,
            ahlyWinRate,
            zamalekWinRate,
            ahlyGPG,
            zamalekGPG,
            ahlyCSRate,
            zamalekCSRate,
            maxAhlyWinStreak,
            maxAhlyLossStreak,
            maxZamalekWinStreak,
            maxZamalekLossStreak,
            maxDrawStreak
        };
    }, [derbyData]);

    useEffect(() => {
        const handleExport = () => {
            if (stats.total > 0) {
                const summaryData = [
                    { "METRIC": "TOTAL MATCHES", "VALUE": stats.total },
                    { "METRIC": "AHLY WINS", "VALUE": `${stats.ahlyWins} (${stats.ahlyWinRate}%)` },
                    { "METRIC": "DRAWS", "VALUE": stats.draws },
                    { "METRIC": "ZAMALEK WINS", "VALUE": `${stats.zamalekWins} (${stats.zamalekWinRate}%)` },
                    { "METRIC": "AHLY GOALS", "VALUE": `${stats.ahlyGoals} (${stats.ahlyGPG} average)` },
                    { "METRIC": "ZAMALEK GOALS", "VALUE": `${stats.zamalekGoals} (${stats.zamalekGPG} average)` },
                    { "METRIC": "AHLY CLEAN SHEETS", "VALUE": `${stats.ahlyCS} (${stats.ahlyCSRate}%)` },
                    { "METRIC": "ZAMALEK CLEAN SHEETS", "VALUE": `${stats.zamalekCS} (${stats.zamalekCSRate}%)` },
                    { "METRIC": "AHLY MAX WIN STREAK", "VALUE": stats.maxAhlyWinStreak },
                    { "METRIC": "ZAMALEK MAX WIN STREAK", "VALUE": stats.maxZamalekWinStreak },
                    { "METRIC": "MAX DRAW STREAK", "VALUE": stats.maxDrawStreak }
                ];
                AhlyVZamalekExcelExport.exportToExcel(summaryData, "Ahly_vs_Zamalek_Dashboard_Summary");
            }
        };

        window.addEventListener('avz-export-excel', handleExport);
        return () => window.removeEventListener('avz-export-excel', handleExport);
    }, [stats]);

    return (
        <div className="avz-dashboard-container fade-in">
            <div className="avz-dashboard-header">
                <h1 className="avz-dashboard-title">DERBY <span className="avz-gold-text">DASHBOARD</span></h1>
            </div>
            
            <div className="avz-stats-unified-grid">
                {/* --- Main Stats --- */}
                <div className="avz-stat-card avz-luxury-card avz-main-id">
                    <span className="avz-card-label">TOTAL MATCHES</span>
                    <span className="avz-card-value">{stats.total}</span>
                </div>

                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">AHLY WINS</span>
                    <span className="avz-card-value">{stats.ahlyWins} <span className="avz-rate">({stats.ahlyWinRate}%)</span></span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">DRAWS</span>
                    <span className="avz-card-value">{stats.draws}</span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">ZAMALEK WINS</span>
                    <span className="avz-card-value">{stats.zamalekWins} <span className="avz-rate">({stats.zamalekWinRate}%)</span></span>
                </div>
                
                {/* --- Goals --- */}
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">AHLY GOALS</span>
                    <span className="avz-card-value">{stats.ahlyGoals} <span className="avz-rate">({stats.ahlyGPG} GPG)</span></span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">ZAMALEK GOALS</span>
                    <span className="avz-card-value">{stats.zamalekGoals} <span className="avz-rate">({stats.zamalekGPG} GPG)</span></span>
                </div>


                {/* --- Clean Sheets --- */}
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">AHLY CLEAN SHEETS</span>
                    <span className="avz-card-value">{stats.ahlyCS} <span className="avz-rate">({stats.ahlyCSRate}%)</span></span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">ZAMALEK CLEAN SHEETS</span>
                    <span className="avz-card-value">{stats.zamalekCS} <span className="avz-rate">({stats.zamalekCSRate}%)</span></span>
                </div>


                {/* --- Streaks --- */}
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">AHLY WIN STREAK</span>
                    <span className="avz-card-value avz-gold-text">{stats.maxAhlyWinStreak}</span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">AHLY LOSS STREAK</span>
                    <span className="avz-card-value avz-danger-text">{stats.maxAhlyLossStreak}</span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">ZAMALEK WIN STREAK</span>
                    <span className="avz-card-value avz-gold-text">{stats.maxZamalekWinStreak}</span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">ZAMALEK LOSS STREAK</span>
                    <span className="avz-card-value avz-danger-text">{stats.maxZamalekLossStreak}</span>
                </div>
                <div className="avz-stat-card avz-luxury-card">
                    <span className="avz-card-label">DRAW STREAK</span>
                    <span className="avz-card-value" style={{ color: '#888' }}>{stats.maxDrawStreak}</span>
                </div>

            </div>
        </div>
    );


}
