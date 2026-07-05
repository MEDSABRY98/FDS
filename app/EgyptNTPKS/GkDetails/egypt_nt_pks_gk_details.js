"use client";

import { useMemo, useState, useEffect } from "react";
import "../MatchDetails/egypt_nt_pks_match_details.css";
import "./egypt_nt_pks_gk_details.css";
import EgyptNTPKSGkDetailsDashboard from "./egypt_nt_pks_gk_details_dashboard";
import EgyptNTPKSGkDetailsMatches from "./egypt_nt_pks_gk_details_matches";
import EgyptNTPKSGkDetailsChampions from "./egypt_nt_pks_gk_details_champions";
import EgyptNTPKSGkDetailsSeasons from "./egypt_nt_pks_gk_details_seasons";
import EgyptNTPKSGkDetailsVsPlayers from "./egypt_nt_pks_gk_details_vs_players";
import EgyptNTPKSGkDetailsVsTeams from "./egypt_nt_pks_gk_details_vs_teams";

export default function EgyptNTPKSGkDetails({ gkName, pksData, onBack }) {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'matches' | 'champions' | 'seasons' | 'vs_players'

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [activeTab]);

    const gkKicks = useMemo(() => {
        const kicks = [];
        (pksData || []).forEach(kick => {
            if (kick["EGYPT GK"] === gkName) {
                const isSave = String(kick["OPPONENT HOW MISS"] || "").includes("حارس") || String(kick["OPPONENT HOW MISS"] || "").includes("الحارس") || String(kick["OPPONENT HOW MISS"] || "").includes("صد") || String(kick["OPPONENT STATUS"] || "").includes("SAVED") || String(kick["OPPONENT STATUS"] || "") === "S";
                kicks.push({
                    ...kick,
                    side: "EGYPT",
                    taker: kick["OPPONENT PLAYER"],
                    opponentTeam: kick["OPPONENT TEAM"],
                    status: kick["OPPONENT STATUS"],
                    howMiss: kick["OPPONENT HOW MISS"],
                    isSave: isSave
                });
            }
            if (kick["OPPONENT GK"] === gkName) {
                const isSave = String(kick["EGYPT HOW MISS"] || "").includes("حارس") || String(kick["EGYPT HOW MISS"] || "").includes("الحارس") || String(kick["EGYPT HOW MISS"] || "").includes("صد") || String(kick["Egypt STATUS"] || "").includes("SAVED") || String(kick["Egypt STATUS"] || "") === "S";
                kicks.push({
                    ...kick,
                    side: "OPPONENT",
                    taker: kick["Egypt PLAYER"],
                    opponentTeam: "مصر",
                    status: kick["Egypt STATUS"],
                    howMiss: kick["EGYPT HOW MISS"],
                    isSave: isSave
                });
            }
        });
        return kicks;
    }, [pksData, gkName]);

    const stats = useMemo(() => {
        let faced = 0, saved = 0, missed = 0, conceded = 0;
        gkKicks.forEach(k => {
            faced++;
            const s = String(k.status || "").toUpperCase();
            if (s.includes("GOAL") || s === "G") conceded++;
            else if (k.isSave) saved++;
            else missed++;
        });
        return { faced, saved, missed, conceded, saveRate: faced > 0 ? ((saved / faced) * 100).toFixed(1) : "0.0" };
    }, [gkKicks]);

    return (
        <div className="pks-details-container fade-in">
            <div className="pks-details-header">
                <button className="back-btn-lux" onClick={onBack}>
                    <span className="back-icon">←</span> BACK TO GOALKEEPERS
                </button>
                <div className="match-title-premium">
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '36px', fontWeight: '800', textTransform: 'uppercase' }}>
                        {gkName}
                    </h1>
                </div>
            </div>

            <div className="gk-details-tabs">
                <div 
                    className={`gk-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('dashboard')}
                >
                    <span className="tab-title">DASHBOARD</span>
                </div>
                <div 
                    className={`gk-tab-item ${activeTab === 'matches' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('matches')}
                >
                    <span className="tab-title">MATCHES</span>
                </div>
                <div 
                    className={`gk-tab-item ${activeTab === 'champions' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('champions')}
                >
                    <span className="tab-title">CHAMPIONSHIPS</span>
                </div>
                <div 
                    className={`gk-tab-item ${activeTab === 'seasons' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('seasons')}
                >
                    <span className="tab-title">SEASONS</span>
                </div>
                <div 
                    className={`gk-tab-item ${activeTab === 'vs_players' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('vs_players')}
                >
                    <span className="tab-title">VS PLAYERS</span>
                </div>
                <div 
                    className={`gk-tab-item ${activeTab === 'vs_teams' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('vs_teams')}
                >
                    <span className="tab-title">VS TEAMS</span>
                </div>
            </div>

            <div className="history-section shadow-lux">
                {activeTab === 'dashboard' && <EgyptNTPKSGkDetailsDashboard stats={stats} />}
                {activeTab === 'matches' && <EgyptNTPKSGkDetailsMatches gkKicks={gkKicks} />}
                {activeTab === 'champions' && <EgyptNTPKSGkDetailsChampions gkKicks={gkKicks} />}
                {activeTab === 'seasons' && <EgyptNTPKSGkDetailsSeasons gkKicks={gkKicks} />}
                {activeTab === 'vs_players' && <EgyptNTPKSGkDetailsVsPlayers gkKicks={gkKicks} />}
                {activeTab === 'vs_teams' && <EgyptNTPKSGkDetailsVsTeams gkKicks={gkKicks} />}
            </div>
        </div>
    );
}
