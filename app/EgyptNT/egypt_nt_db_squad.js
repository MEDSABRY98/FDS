"use client";

import { useState, useEffect } from "react";
import { EgyptNTService } from "./egypt_nt_db_service";
import EgyptNTSquadPlayers from "./egypt_nt_db_squad_players";
import EgyptNTSquadClubs from "./egypt_nt_db_squad_clubs";
import "./egypt_nt_db_squad.css";

export default function EgyptNTSquad({ squadData }) {
    const [activeSubTab, setActiveSubTab] = useState("players"); // "players" or "clubs"

    useEffect(() => {
        const handleGlobalExport = () => {
            if (activeSubTab === "players") {
                const stats = {};
                (squadData || []).forEach(item => {
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
                EgyptNTService.exportToExcel(exportData, "EgyptNT_Squad_Players_List");
            } else {
                const stats = {};
                (squadData || []).forEach(item => {
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
                EgyptNTService.exportToExcel(exportData, "EgyptNT_Squad_Clubs_List");
            }
        };

        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [squadData, activeSubTab]);

    return (
        <div className="tab-content" id="tab-squad">
            <div className="squad-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '30px', direction: 'ltr' }}>
                        <div className="section-title" style={{ margin: 0 }}>
                            EGYPT NT <span className="accent">SQUAD</span>
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
                <div style={{ marginTop: '20px' }}>
                    {activeSubTab === "players" ? (
                        <EgyptNTSquadPlayers squadData={squadData} />
                    ) : (
                        <EgyptNTSquadClubs squadData={squadData} />
                    )}
                </div>
            </div>
        </div>
    );
}
