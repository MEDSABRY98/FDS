"use client";

import { useState, useEffect, useMemo } from "react";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import EgyptNTSquadPlayers from "../SquadDetails/egypt_nt_db_squad_players";
import EgyptNTSquadClubs from "../SquadDetails/egypt_nt_db_squad_clubs";
import { Filter, X } from "lucide-react";
import "../../lib/Filters_db.css";
import "./egypt_nt_db_squad.css";

export default function EgyptNTSquad({ squadData }) {
    const [activeSubTab, setActiveSubTab] = useState("players"); // "players" or "clubs"

    const [selectedChampionships, setSelectedChampionships] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Temp state for editing filters inside modal before applying
    const [tempChampionships, setTempChampionships] = useState([]);
    const [tempSeasons, setTempSeasons] = useState([]);

    // Unique options
    const uniqueTournaments = useMemo(() => {
        const champs = (squadData || []).map(item => String(item.CHAMPION || "").trim()).filter(Boolean);
        return [...new Set(champs)].sort();
    }, [squadData]);

    const uniqueSeasons = useMemo(() => {
        const seasons = (squadData || []).map(item => String(item.SEASON || "").trim()).filter(Boolean);
        return [...new Set(seasons)].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }, [squadData]);

    const hasActiveFilters = selectedChampionships.length > 0 || selectedSeasons.length > 0;

    // Filtered data
    const filteredSquadData = useMemo(() => {
        return (squadData || []).filter(item => {
            const champMatch = selectedChampionships.length === 0 || selectedChampionships.includes(String(item.CHAMPION || "").trim());
            const seasonMatch = selectedSeasons.length === 0 || selectedSeasons.includes(String(item.SEASON || "").trim());
            return champMatch && seasonMatch;
        });
    }, [squadData, selectedChampionships, selectedSeasons]);

    // Popup handlers
    const handleOpenFilter = () => {
        setTempChampionships([...selectedChampionships]);
        setTempSeasons([...selectedSeasons]);
        setIsFilterOpen(true);
    };

    const handleToggleTempChampionship = (champ) => {
        if (tempChampionships.includes(champ)) {
            setTempChampionships(tempChampionships.filter(c => c !== champ));
        } else {
            setTempChampionships([...tempChampionships, champ]);
        }
    };

    const handleToggleTempSeason = (season) => {
        if (tempSeasons.includes(season)) {
            setTempSeasons(tempSeasons.filter(s => s !== season));
        } else {
            setTempSeasons([...tempSeasons, season]);
        }
    };

    const handleApplyFilters = () => {
        setSelectedChampionships(tempChampionships);
        setSelectedSeasons(tempSeasons);
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setTempChampionships([]);
        setTempSeasons([]);
        setSelectedChampionships([]);
        setSelectedSeasons([]);
        setIsFilterOpen(false);
    };

    useEffect(() => {
        const handleGlobalExport = () => {
            if (activeSubTab === "players") {
                const stats = {};
                (filteredSquadData || []).forEach(item => {
                    const name = String(item.PLAYERNAME || "").trim();
                    if (!name) return;

                    if (!stats[name]) {
                        stats[name] = {
                            name,
                            callups: 0,
                            clubs: {},
                            champions: {}
                        };
                    }

                    stats[name].callups += 1;
                    
                    const club = String(item.CLUB || "Unknown").trim();
                    stats[name].clubs[club] = (stats[name].clubs[club] || 0) + 1;

                    const champ = String(item.CHAMPION || "Unknown").trim();
                    stats[name].champions[champ] = (stats[name].champions[champ] || 0) + 1;
                });

                const playerStats = Object.values(stats).sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));
                const exportData = playerStats.map((p, idx) => ({
                    "Rank": idx + 1,
                    "Player Name": p.name,
                    "Call-ups Count": p.callups,
                    "Clubs Summary": Object.entries(p.clubs).map(([c, count]) => `${c} (${count} times)`).join(", "),
                    "Tournaments Summary": Object.entries(p.champions).map(([c, count]) => `${c} (${count} times)`).join(", ")
                }));
                EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Squad_Players_List");
            } else {
                const stats = {};
                (filteredSquadData || []).forEach(item => {
                    const club = String(item.CLUB || "").trim();
                    if (!club) return;

                    if (!stats[club]) {
                        stats[club] = {
                            name: club,
                            players: new Set(),
                            champions: new Set()
                        };
                    }

                    if (item.PLAYERNAME) {
                        stats[club].players.add(String(item.PLAYERNAME).trim());
                    }

                    if (item.CHAMPION) {
                        stats[club].champions.add(String(item.CHAMPION).trim());
                    }
                });

                const clubStats = Object.values(stats)
                    .map(c => ({
                        name: c.name,
                        playerCount: c.players.size,
                        championCount: c.champions.size
                    }))
                    .sort((a, b) => b.playerCount - a.playerCount || b.championCount - a.championCount || a.name.localeCompare(b.name));

                const exportData = clubStats.map((c, idx) => ({
                    "Rank": idx + 1,
                    "Club Name": c.name,
                    "Number of Players": c.playerCount,
                    "Number of Tournaments": c.championCount
                }));
                EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Squad_Clubs_List");
            }
        };

        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [filteredSquadData, activeSubTab]);

    return (
        <div className="tab-content" id="tab-squad">
            <div className="squad-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '30px', direction: 'ltr' }}>
                        <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            EGYPT NT <span className="accent">SQUAD</span>
                            <button 
                                className={`squad-filter-btn ${hasActiveFilters ? 'active' : ''}`}
                                onClick={handleOpenFilter}
                                title="Filter Squad"
                            >
                                <Filter size={18} />
                                {hasActiveFilters && <span className="filter-badge-dot"></span>}
                            </button>
                            {hasActiveFilters && (
                                <button 
                                    className="squad-clear-filter-btn"
                                    onClick={() => { setSelectedChampionships([]); setSelectedSeasons([]); }}
                                    title="Clear Filters"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Nested Sub-Tabs Switcher */}
                        <div className="squad-subtabs-switcher">
                            <button 
                                className={`subtab-btn ${activeSubTab === 'players' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('players')}
                            >
                                Players List
                            </button>
                            <button 
                                className={`subtab-btn ${activeSubTab === 'clubs' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('clubs')}
                            >
                                Clubs List
                            </button>
                        </div>
                    </div>
                    
                    <div className="gold-line"></div>
                </div>

                {/* Sub-tab content render */}
                <div style={{ marginTop: '10px' }}>
                    {activeSubTab === "players" ? (
                        <EgyptNTSquadPlayers squadData={filteredSquadData} />
                    ) : (
                        <EgyptNTSquadClubs squadData={filteredSquadData} />
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterOpen && (
                <div className="filter-popup-overlay" onClick={() => setIsFilterOpen(false)}>
                    <div className="filter-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚡ FILTER EGYPT NT SQUAD</h3>
                            <button className="close-modal-btn" onClick={() => setIsFilterOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="filter-sections-wrap">
                            
                            {/* Championships Section */}
                            {uniqueTournaments.length > 0 && (
                                <div className="filter-section">
                                    <div className="filter-section-title">Tournaments / Championships</div>
                                    <div className="filter-options-grid">
                                        {uniqueTournaments.map(champ => {
                                            const isSelected = tempChampionships.includes(champ);
                                            return (
                                                <div 
                                                    key={champ} 
                                                    className={`filter-pill ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleToggleTempChampionship(champ)}
                                                >
                                                    {champ}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Seasons Section */}
                            {uniqueSeasons.length > 0 && (
                                <div className="filter-section">
                                    <div className="filter-section-title">Seasons / Years</div>
                                    <div className="filter-options-grid">
                                        {uniqueSeasons.map(season => {
                                            const isSelected = tempSeasons.includes(season);
                                            return (
                                                <div 
                                                    key={season} 
                                                    className={`filter-pill ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleToggleTempSeason(season)}
                                                >
                                                    {season}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="filter-modal-actions">
                            <button className="filter-action-btn reset" onClick={handleResetFilters}>Reset All</button>
                            <button className="filter-action-btn apply" onClick={handleApplyFilters}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
