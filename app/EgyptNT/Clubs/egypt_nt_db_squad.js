"use client";

import { useState, useEffect, useMemo } from "react";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import EgyptNTSquadPlayers from "./SquadStats/egypt_nt_db_squad_players";
import EgyptNTSquadClubs from "./SquadStats/egypt_nt_db_squad_clubs";
import EgyptNTSquadClubPerformance from "./SquadStats/egypt_nt_db_squad_club_performance";
import EgyptNTSquadClubSeason from "./SquadStats/egypt_nt_db_squad_club_season";
import { buildClubPlayerPerformance, buildPlayerSeasonStatsMap } from "./SquadStats/egypt_nt_db_squad_club_details";
import { Filter, X, ArrowLeft, Users, Building2, TrendingUp, Calendar, Target, Medal, Database } from "lucide-react";
import "../../lib/Filters_db.css";
import "./SquadStats/egypt_nt_db_squad_details.css";
import "./egypt_nt_db_squad.css";
import EgyptNTClubStatsClubs from "./ClubStats/egypt_nt_db_club_stats_clubs";
import EgyptNTClubStatsPlayers from "./ClubStats/egypt_nt_db_club_stats_players";
import EgyptNTSquadEditor from "./SquadEditor/egypt_nt_db_squad_editor";

export default function EgyptNTSquad({ squadData, filteredMatches, lineupDetails, playerDetails, gkDetails }) {
    const [activeSubTab, setActiveSubTab] = useState("menu"); // "menu" | "editor" | "players" | "clubs" | "club_performance" | "club_season" | "club_stats_clubs" | "club_stats_players"
    const [isClubDetailsOpen, setIsClubDetailsOpen] = useState(false);

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
            } else if (activeSubTab === "clubs") {
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
            } else if (activeSubTab === "club_performance") {
                const rows = buildClubPlayerPerformance(filteredSquadData, {
                    matches: filteredMatches,
                    lineupDetails,
                    playerDetails,
                    gkDetails
                });
                const exportData = rows.map((row, idx) => ({
                    "Rank": idx + 1,
                    "Club Name": row.club,
                    "Player Name": row.name,
                    "Position": row.position,
                    "Matches": row.ntStats.mp,
                    "Minutes": row.ntStats.mins,
                    "Goals": row.ntStats.goals,
                    "Assists": row.ntStats.assists,
                    "Goals Conceded": row.ntStats.isGk ? row.ntStats.ga : "—",
                    "Clean Sheets": row.ntStats.isGk ? row.ntStats.cs : "—"
                }));
                EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Squad_Club_Performance");
            } else if (activeSubTab === "club_season") {
                const seasonStatsMap = buildPlayerSeasonStatsMap(filteredMatches, lineupDetails, playerDetails, gkDetails);
                const uniqueKeys = new Set();
                const exportDataRaw = [];

                (filteredSquadData || []).forEach(item => {
                    const name = String(item.PLAYERNAME || "").trim();
                    const club = String(item.CLUB || "Unknown").trim();
                    const position = String(item.POSITION || "—").trim();
                    const season = String(item.SEASON || "Unknown").trim();
                    const champion = String(item.CHAMPION || "Unknown").trim();

                    if (!name) return;

                    const rowKey = `${champion}|${season}|${club}|${name}|${position}`;
                    if (uniqueKeys.has(rowKey)) return;
                    uniqueKeys.add(rowKey);

                    const raw = seasonStatsMap[`${name}|${season}`] || { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, gkCaps: 0 };
                    
                    const valuePos = position.toLowerCase();
                    const isGk = valuePos.includes("gk") || valuePos.includes("goalkeeper") || valuePos.includes("حارس") || valuePos.includes("حراس") || raw.gkCaps > 0;

                    const mp = isGk ? raw.gkCaps : raw.mp;
                    const ga = isGk ? raw.ga : "—";
                    const cs = isGk ? raw.cs : "—";
                    const gPlusA = (raw.goals ?? 0) + (raw.assists ?? 0);

                    exportDataRaw.push({
                        "Tournament": champion,
                        "Season": season,
                        "Club Name": club,
                        "Player Name": name,
                        "Position": position,
                        "MP": mp,
                        "MINS": raw.mins ?? 0,
                        "G+A": gPlusA,
                        "Goals": raw.goals ?? 0,
                        "Assists": raw.assists ?? 0,
                        "Goals Conceded": ga,
                        "Clean Sheets": cs
                    });
                });

                exportDataRaw.sort((a, b) => 
                    a.Tournament.localeCompare(b.Tournament) || 
                    b.Season.localeCompare(a.Season, undefined, { numeric: true }) ||
                    b["G+A"] - a["G+A"] ||
                    b.MINS - a.MINS ||
                    a["Player Name"].localeCompare(b["Player Name"])
                );

                const finalExportData = exportDataRaw.map((row, idx) => ({
                    "Rank": idx + 1,
                    ...row
                }));

                EgyptNTExcelExport.exportToExcel(finalExportData, "EgyptNT_Squad_Club_Season");
            }
        };

        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [filteredSquadData, activeSubTab, filteredMatches, lineupDetails, playerDetails, gkDetails]);

    return (
        <div className="tab-content" id="tab-squad">
            <div className="squad-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div className="section-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '30px', direction: 'ltr' }}>
                        <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            EGYPT NT <span className="accent">CLUBS</span>
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

                        {activeSubTab !== "menu" && !isClubDetailsOpen && (
                            <button 
                                className="back-to-menu-btn"
                                onClick={() => setActiveSubTab("menu")}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', background: '#111',
                                    border: '1px solid #111', color: '#fff', padding: '8px 15px',
                                    borderRadius: '5px', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '18px', letterSpacing: '1px', transition: '0.3s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#C8102E'; e.currentTarget.style.borderColor = '#C8102E'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = '#111'; }}
                            >
                                <ArrowLeft size={18} />
                                BACK TO MENU
                            </button>
                        )}
                    </div>
                    
                    <div className="gold-line"></div>
                </div>

                {/* Sub-tab content render */}
                <div style={{ marginTop: '10px' }}>
                    {activeSubTab === "menu" && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '20px',
                            marginTop: '30px'
                        }}>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("editor")}>
                                <Database size={40} className="card-icon" />
                                <h3>SQUAD EDITOR</h3>
                                <p>Add, edit, or manage squad records in the database.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("players")}>
                                <Users size={40} className="card-icon" />
                                <h3>SQUAD PLAYERS</h3>
                                <p>View all call-ups sorted by player name or total call-up count.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("clubs")}>
                                <Building2 size={40} className="card-icon" />
                                <h3>SQUAD CLUBS</h3>
                                <p>Overview of clubs and how many players they contributed to the NT.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("club_performance")}>
                                <TrendingUp size={40} className="card-icon" />
                                <h3>CLUB PERFORMANCE</h3>
                                <p>Detailed minutes, goals, and assists of players grouped by their clubs.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("club_season")}>
                                <Calendar size={40} className="card-icon" />
                                <h3>CLUB SEASONS</h3>
                                <p>Season-by-season breakdown of player performances by club.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("club_stats_clubs")}>
                                <Target size={40} className="card-icon" />
                                <h3>SCORING CLUBS</h3>
                                <p>Ranking of clubs based on goals and assists produced by their players.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("club_stats_players")}>
                                <Medal size={40} className="card-icon" />
                                <h3>SCORERS BY CLUB</h3>
                                <p>Detailed goal contributions (G+A) for every player under each club.</p>
                            </div>
                        </div>
                    )}
                    {activeSubTab === "editor" && (
                        <EgyptNTSquadEditor />
                    )}
                    {activeSubTab === "players" && (
                        <EgyptNTSquadPlayers squadData={filteredSquadData} />
                    )}
                    {activeSubTab === "clubs" && (
                        <EgyptNTSquadClubs
                            squadData={filteredSquadData}
                            matches={filteredMatches}
                            lineupDetails={lineupDetails}
                            playerDetails={playerDetails}
                            gkDetails={gkDetails}
                            onDetailsViewChange={setIsClubDetailsOpen}
                        />
                    )}
                    {activeSubTab === "club_performance" && (
                        <EgyptNTSquadClubPerformance
                            squadData={filteredSquadData}
                            matches={filteredMatches}
                            lineupDetails={lineupDetails}
                            playerDetails={playerDetails}
                            gkDetails={gkDetails}
                        />
                    )}
                    {activeSubTab === "club_season" && (
                        <EgyptNTSquadClubSeason
                            squadData={filteredSquadData}
                            matches={filteredMatches}
                            lineupDetails={lineupDetails}
                            playerDetails={playerDetails}
                            gkDetails={gkDetails}
                        />
                    )}
                    {activeSubTab === "club_stats_clubs" && (
                        <EgyptNTClubStatsClubs
                            playerDetails={playerDetails}
                            filteredMatches={filteredMatches}
                            onDetailsViewChange={setIsClubDetailsOpen}
                        />
                    )}
                    {activeSubTab === "club_stats_players" && (
                        <EgyptNTClubStatsPlayers
                            playerDetails={playerDetails}
                            filteredMatches={filteredMatches}
                        />
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterOpen && (
                <div className="filter-popup-overlay" onClick={() => setIsFilterOpen(false)}>
                    <div className="filter-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚡ FILTER EGYPT NT CLUBS</h3>
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
