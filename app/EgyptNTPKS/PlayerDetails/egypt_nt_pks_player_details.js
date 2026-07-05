"use client";

import { useMemo, useState, useEffect } from "react";
import "../MatchDetails/egypt_nt_pks_match_details.css";
import "./egypt_nt_pks_player_details.css";
import EgyptNTPKSPlayerDetailsDashboard from "./egypt_nt_pks_player_details_dashboard";
import EgyptNTPKSPlayerDetailsMatches from "./egypt_nt_pks_player_details_matches";
import EgyptNTPKSPlayerDetailsChampions from "./egypt_nt_pks_player_details_champions";
import EgyptNTPKSPlayerDetailsSeasons from "./egypt_nt_pks_player_details_seasons";
import EgyptNTPKSPlayerDetailsVsGks from "./egypt_nt_pks_player_details_vs_gks";
import EgyptNTPKSPlayerDetailsVsTeams from "./egypt_nt_pks_player_details_vs_teams";

export default function EgyptNTPKSPlayerDetails({ playerName, pksData, onBack }) {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'matches' | 'champions' | 'seasons'

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [activeTab]);

    const playerKicks = useMemo(() => {
        const kicks = [];
        (pksData || []).forEach(kick => {
            if (kick["Egypt PLAYER"] === playerName) {
                kicks.push({
                    ...kick,
                    side: "EGYPT",
                    status: kick["Egypt STATUS"],
                    howMiss: kick["EGYPT HOW MISS"],
                    gk: kick["OPPONENT GK"],
                });
            }
            if (kick["OPPONENT PLAYER"] === playerName) {
                kicks.push({
                    ...kick,
                    side: "OPPONENT",
                    status: kick["OPPONENT STATUS"],
                    howMiss: kick["OPPONENT HOW MISS"],
                    gk: kick["EGYPT GK"],
                });
            }
        });
        return kicks;
    }, [pksData, playerName]);

    const stats = useMemo(() => {
        let total = 0, goals = 0, misses = 0;
        playerKicks.forEach(k => {
            total++;
            const s = String(k.status || "").toUpperCase();
            if (s.includes("GOAL") || s === "G") goals++;
            else misses++;
        });
        return { total, goals, misses, successRate: total > 0 ? ((goals / total) * 100).toFixed(1) : "0.0" };
    }, [playerKicks]);

    return (
        <div className="pks-details-container fade-in">
            <div className="pks-details-header">
                <button className="back-btn-lux" onClick={onBack}>
                    <span className="back-icon">←</span> BACK TO PLAYERS
                </button>
                <div className="match-title-premium">
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '36px', fontWeight: '800', textTransform: 'uppercase' }}>
                        {playerName}
                    </h1>
                </div>
            </div>

            <div className="player-details-tabs">
                <div 
                    className={`player-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('dashboard')}
                >
                    <span className="tab-title">DASHBOARD</span>
                </div>
                <div 
                    className={`player-tab-item ${activeTab === 'matches' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('matches')}
                >
                    <span className="tab-title">MATCHES</span>
                </div>
                <div 
                    className={`player-tab-item ${activeTab === 'champions' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('champions')}
                >
                    <span className="tab-title">CHAMPIONSHIPS</span>
                </div>
                <div 
                    className={`player-tab-item ${activeTab === 'seasons' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('seasons')}
                >
                    <span className="tab-title">SEASONS</span>
                </div>
                <div 
                    className={`player-tab-item ${activeTab === 'vs_gks' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('vs_gks')}
                >
                    <span className="tab-title">VS GKs</span>
                </div>
                <div 
                    className={`player-tab-item ${activeTab === 'vs_teams' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('vs_teams')}
                >
                    <span className="tab-title">VS TEAMS</span>
                </div>
            </div>

            <div className="history-section shadow-lux">
                {activeTab === 'dashboard' && <EgyptNTPKSPlayerDetailsDashboard stats={stats} />}
                {activeTab === 'matches' && <EgyptNTPKSPlayerDetailsMatches playerKicks={playerKicks} />}
                {activeTab === 'champions' && <EgyptNTPKSPlayerDetailsChampions playerKicks={playerKicks} />}
                {activeTab === 'seasons' && <EgyptNTPKSPlayerDetailsSeasons playerKicks={playerKicks} />}
                {activeTab === 'vs_gks' && <EgyptNTPKSPlayerDetailsVsGks playerKicks={playerKicks} />}
                {activeTab === 'vs_teams' && <EgyptNTPKSPlayerDetailsVsTeams playerKicks={playerKicks} />}
            </div>
        </div>
    );
}
