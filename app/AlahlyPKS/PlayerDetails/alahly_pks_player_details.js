"use client";

import { useState, useEffect } from "react";
import "../../lib/Filters_db.css";
import "./alahly_pks_player_details.css";
import AlAhlyPKsPlayerDetailsDashboard from "./alahly_pks_player_details_dashboard";
import AlAhlyPKsPlayerDetailsMatches from "./alahly_pks_player_details_matches";
import AlAhlyPKsPlayerDetailsWithTeams from "./alahly_pks_player_details_with_teams";
import AlAhlyPKsPlayerDetailsVsTeams from "./alahly_pks_player_details_vs_teams";

export default function AlAhlyPKsPlayerDetails({ playerName, pksData, playerStats, onBack }) {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'matches' | 'with-teams' | 'vs-teams'

    const [selectedTeams, setSelectedTeams] = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [activeTab]);

    if (!playerName) return null;

    // Filter player specific matches
    const allPlayerPks = (pksData || []).filter(p => 
        p["AHLY PLAYER"] === playerName || p["OPPONENT PLAYER"] === playerName
    );

    // Get unique teams the player played for or against in these matches
    const uniqueTeams = [...new Set(allPlayerPks.map(pk => (pk["AHLY PLAYER"] === playerName ? pk["AHLY TEAM"] : pk["OPPONENT TEAM"])).filter(Boolean))].sort();

    // Final filtered data based on selected teams
    const playerPks = selectedTeams.length > 0 
        ? allPlayerPks.filter(pk => selectedTeams.includes(pk["AHLY PLAYER"] === playerName ? pk["AHLY TEAM"] : pk["OPPONENT TEAM"]))
        : allPlayerPks;

    // Recalculate stats based on filtered data
    const filteredStats = {
        total: playerPks.length,
        goals: playerPks.filter(pk => {
            const isAhly = pk["AHLY PLAYER"] === playerName;
            const status = isAhly ? pk["AHLY STATUS"] : pk["OPPONENT STATUS"];
            return String(status || "").toUpperCase().includes("GOAL");
        }).length
    };

    const toggleTeam = (team) => {
        setSelectedTeams(prev => 
            prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
        );
    };

    return (
        <div className="player-details-container fade-in">
            {/* Header Section (Premium Hero) */}
            <div className="player-hero">
                <div className="hero-content-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse' }}>
                    <div className="hero-right-side" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="name-and-teams" style={{ textAlign: 'right' }}>
                            <h1 className="player-main-name">
                                {playerName.split(' ').slice(0, -1).join(' ')} <span>{playerName.split(' ').slice(-1)}</span>
                            </h1>
                        </div>
                        <button 
                            className={`filter-icon-btn ${selectedTeams.length > 0 ? 'active' : ''}`} 
                            onClick={() => setShowFilterModal(true)}
                            title="Filter by Team"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            {selectedTeams.length > 0 && <span className="filter-badge">{selectedTeams.length}</span>}
                        </button>
                    </div>

                    <button className="back-btn-modern" onClick={onBack}>
                        <span>←</span> BACK TO LIST
                    </button>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="filter-popup-overlay" onClick={() => setShowFilterModal(false)}>
                    <div className="filter-modal" onClick={e => e.stopPropagation()}>
                        <div className="filter-modal-header">
                            <h3>FILTER BY TEAM</h3>
                            <button className="close-modal" onClick={() => setShowFilterModal(false)}>&times;</button>
                        </div>
                        <div className="filter-modal-body">
                            <div className="teams-checkbox-list">
                                {uniqueTeams.map(team => (
                                    <label key={team} className="team-checkbox-item">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedTeams.includes(team)} 
                                            onChange={() => toggleTeam(team)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span className="team-name-label">{team}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-modal-footer">
                            <button className="reset-btn" onClick={() => setSelectedTeams([])}>RESET</button>
                            <button className="apply-btn" onClick={() => setShowFilterModal(false)}>APPLY</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Equal Width Tabs Navigation */}
            <div className="player-details-tabs" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className={`player-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    <span className="tab-title">DASHBOARD</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
                    <span className="tab-title">MATCHES</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'with-teams' ? 'active' : ''}`} onClick={() => setActiveTab('with-teams')}>
                    <span className="tab-title">WITH TEAMS</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'vs-teams' ? 'active' : ''}`} onClick={() => setActiveTab('vs-teams')}>
                    <span className="tab-title">VS TEAMS</span>
                </div>
            </div>

            {/* Content Section (White Card) */}
            <div className="history-section shadow-lux">
                {activeTab === 'dashboard' && <AlAhlyPKsPlayerDetailsDashboard playerName={playerName} pksData={playerPks} stats={filteredStats} />}
                {activeTab === 'matches' && <AlAhlyPKsPlayerDetailsMatches pksData={playerPks} playerName={playerName} />}
                {activeTab === 'with-teams' && <AlAhlyPKsPlayerDetailsWithTeams pksData={playerPks} playerName={playerName} />}
                {activeTab === 'vs-teams' && <AlAhlyPKsPlayerDetailsVsTeams pksData={playerPks} playerName={playerName} />}
            </div>
        </div>
    );
}
