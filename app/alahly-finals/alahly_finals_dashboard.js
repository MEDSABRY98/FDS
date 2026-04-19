"use client";

import { useMemo } from "react";
import { Trophy, Target, AlertCircle, TrendingUp, TrendingDown, Swords, Star } from "lucide-react";
import "./alahly_finals_dashboard.css";

export default function AlAhlyFinalsDashboard({ finalsData }) {
    const stats = useMemo(() => {
        if (!finalsData || finalsData.length === 0) return null;

        // --- Finals Stats (Grouped by FINAL_ID) ---
        const uniqueFinals = new Map();
        finalsData.forEach(match => {
            const fId = match.FINAL_ID || match.MATCH_ID || `temp-${Math.random()}`;
            // Use the first occurrence to represent the final's overall result
            if (!uniqueFinals.has(fId)) {
                uniqueFinals.set(fId, match);
            }
        });

        let finalsWins = 0;
        let finalsLosses = 0;
        uniqueFinals.forEach(final => {
            const outcome = String(final["W-D-L FINAL"] || "").toUpperCase();
            if (outcome.includes("W") || outcome === "CHAMPION") finalsWins++;
            else if (outcome.includes("L") || outcome === "RUNNER-UP") finalsLosses++;
        });

        const totalFinalsCount = uniqueFinals.size;
        const finalsWinRate = totalFinalsCount > 0 ? ((finalsWins / totalFinalsCount) * 100).toFixed(1) : 0;

        // --- Match Stats (Every Row) ---
        let matchWins = 0;
        let matchDraws = 0;
        let matchLosses = 0;
        let totalGF = 0;
        let totalGA = 0;
        let ahlyCS = 0;
        let oppCS = 0;

        finalsData.forEach(match => {
            const wdl = String(match["W-D-L MATCH"] || "N/A").toUpperCase();
            if (wdl.includes("W")) matchWins++;
            else if (wdl.includes("D")) matchDraws++;
            else if (wdl.includes("L")) matchLosses++;

            const gf = parseInt(match.GF) || 0;
            const ga = parseInt(match.GA) || 0;
            totalGF += gf;
            totalGA += ga;

            if (match.GA !== undefined && ga === 0) ahlyCS++;
            if (match.GF !== undefined && gf === 0) oppCS++;
        });

        return {
            finals: {
                total: totalFinalsCount,
                wins: finalsWins,
                losses: finalsLosses,
                rate: finalsWinRate
            },
            matches: {
                total: finalsData.length,
                wins: matchWins,
                draws: matchDraws,
                losses: matchLosses,
                gf: totalGF,
                ga: totalGA,
                ahlyCS,
                oppCS
            }
        };
    }, [finalsData]);

    if (!stats) return null;

    return (
        <div className="finals-dashboard-container fade-in">
            <div className="dashboard-header">
                <h1 className="dashboard-title">AL AHLY FINALS <span className="gold-text">DASHBOARD</span></h1>
            </div>
            
            <div className="stats-unified-grid">
                {/* --- Finals Group --- */}
                <div className="stat-card luxury-card main-id">
                    <span className="card-label">TOTAL FINALS</span>
                    <span className="card-value">{stats.finals.total}</span>
                </div>
                <div className="stat-card luxury-card win">
                    <span className="card-label">TROPHIES WON</span>
                    <span className="card-value">{stats.finals.wins}</span>
                </div>
                <div className="stat-card luxury-card success-rate">
                    <span className="card-label">SUCCESS RATE</span>
                    <span className="card-value success">{stats.finals.rate}%</span>
                </div>
                <div className="stat-card luxury-card loss">
                    <span className="card-label">RUNNERS-UP</span>
                    <span className="card-value">{stats.finals.losses}</span>
                </div>
                <div className="stat-card luxury-card loss-rate">
                    <span className="card-label">LOSS RATE</span>
                    <span className="card-value danger">{(100 - stats.finals.rate).toFixed(1)}%</span>
                </div>

                {/* --- Matches Group --- */}
                <div className="stat-card luxury-card total">
                    <span className="card-label">TOTAL MATCHES</span>
                    <span className="card-value">{stats.matches.total}</span>
                </div>
                <div className="stat-card luxury-card win">
                    <span className="card-label">MATCH WINS</span>
                    <span className="card-value">{stats.matches.wins}</span>
                </div>
                <div className="stat-card luxury-card draw">
                    <span className="card-label">MATCH DRAWS</span>
                    <span className="card-value">{stats.matches.draws}</span>
                </div>
                <div className="stat-card luxury-card loss">
                    <span className="card-label">MATCH LOSSES</span>
                    <span className="card-value">{stats.matches.losses}</span>
                </div>
                
                <div className="stat-card luxury-card goals">
                    <span className="card-label">GOALS FOR</span>
                    <span className="card-value">{stats.matches.gf}</span>
                </div>
                <div className="stat-card luxury-card ga">
                    <span className="card-label">GOALS AGAINST</span>
                    <span className="card-value">{stats.matches.ga}</span>
                </div>
                <div className="stat-card luxury-card clean-sheet">
                    <span className="card-label">AHLY CLEAN SHEETS</span>
                    <span className="card-value">{stats.matches.ahlyCS}</span>
                </div>
                <div className="stat-card luxury-card clean-sheet-opp">
                    <span className="card-label">OPPONENT CLEAN SHEETS</span>
                    <span className="card-value">{stats.matches.oppCS}</span>
                </div>
            </div>
        </div>
    );
}
