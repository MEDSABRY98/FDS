"use client";

import { useState, useEffect, useMemo } from "react";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import { buildClubPlayerPerformance, buildPlayerSeasonStatsMap, getGroupKey, getGroupColumnLabel, GROUPING_MODES } from "./egypt_nt_db_clubs_utils";
import { Filter, X, ArrowLeft, Users, Building2, TrendingUp, Calendar, Database, Trophy } from "lucide-react";
import "../../lib/Filters_db.css";
import "./egypt_nt_db_clubs.css";

import EgyptNTClubsList from "./egypt_nt_db_clubs_list";
import EgyptNTClubsPlayers from "./egypt_nt_db_clubs_players";
import EgyptNTClubsSeasons from "./egypt_nt_db_clubs_seasons";
import EgyptNTClubsChampionships from "./egypt_nt_db_clubs_championships";
import EgyptNTSquadEditor from "./SquadEditor/egypt_nt_db_squad_editor";

export default function EgyptNTClubs({ squadData, filteredMatches, lineupDetails, playerDetails, gkDetails }) {
    const [activeSubTab, setActiveSubTab] = useState("menu"); // "menu" | "editor" | "clubs" | "players" | "club_season"
    const [isClubDetailsOpen, setIsClubDetailsOpen] = useState(false);

    const [selectedChampionships, setSelectedChampionships] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [groupingMode, setGroupingMode] = useState(GROUPING_MODES.CLUB);

    const isStatsSubTab = ["clubs", "players", "club_championships", "club_season"].includes(activeSubTab);
    const groupColumnLabel = getGroupColumnLabel(groupingMode);
    const isCountryMode = groupingMode === GROUPING_MODES.COUNTRY;

    const handleGroupingModeChange = (mode) => {
        setGroupingMode(mode);
        setIsClubDetailsOpen(false);
    };

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

                    const clubRaw = String(item.CLUB || "Unknown").trim();
                    const groupKey = getGroupKey(clubRaw, groupingMode) || "Unknown";
                    stats[name].clubs[groupKey] = (stats[name].clubs[groupKey] || 0) + 1;

                    const champ = String(item.CHAMPION || "Unknown").trim();
                    stats[name].champions[champ] = (stats[name].champions[champ] || 0) + 1;
                });

                const playerStats = Object.values(stats).sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));
                const exportData = playerStats.map((p, idx) => ({
                    "Rank": idx + 1,
                    "Player Name": p.name,
                    "Call-ups Count": p.callups,
                    [`${isCountryMode ? "Countries" : "Clubs"} Summary`]: Object.entries(p.clubs).map(([c, count]) => `${c} (${count} times)`).join(", "),
                    "Tournaments Summary": Object.entries(p.champions).map(([c, count]) => `${c} (${count} times)`).join(", ")
                }));
                EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Squad_Players_List");
            } else if (activeSubTab === "clubs") {
                const stats = {};
                (filteredSquadData || []).forEach(item => {
                    const clubRaw = String(item.CLUB || "").trim();
                    if (!clubRaw) return;

                    const groupKey = getGroupKey(clubRaw, groupingMode);
                    if (!groupKey) return;

                    if (!stats[groupKey]) {
                        stats[groupKey] = {
                            name: groupKey,
                            players: new Set(),
                            champions: new Set(),
                            seasons: new Set()
                        };
                    }

                    if (item.PLAYERNAME) {
                        stats[groupKey].players.add(String(item.PLAYERNAME).trim());
                    }

                    if (item.CHAMPION) {
                        stats[groupKey].champions.add(String(item.CHAMPION).trim());
                    }

                    if (item.SEASON) {
                        stats[groupKey].seasons.add(String(item.SEASON).trim());
                    }
                });

                const clubStats = Object.values(stats)
                    .map(c => ({
                        name: c.name,
                        playerCount: c.players.size,
                        championCount: c.champions.size,
                        seasonCount: c.seasons.size
                    }))
                    .sort((a, b) =>
                        b.playerCount - a.playerCount ||
                        b.championCount - a.championCount ||
                        b.seasonCount - a.seasonCount ||
                        a.name.localeCompare(b.name)
                    );

                const exportData = clubStats.map((c, idx) => ({
                    "Rank": idx + 1,
                    [groupColumnLabel]: c.name,
                    "Number of Players": c.playerCount,
                    "Number of Tournaments": c.championCount,
                    "Number of Seasons": c.seasonCount
                }));
                EgyptNTExcelExport.exportToExcel(exportData, isCountryMode ? "EgyptNT_Squad_Countries_List" : "EgyptNT_Squad_Clubs_List");
            } else if (activeSubTab === "club_championships") {
                const seasonStatsMap = buildPlayerSeasonStatsMap(filteredMatches, lineupDetails, playerDetails, gkDetails);
                const uniqueKeys = new Set();
                const exportDataRaw = [];

                (filteredSquadData || []).forEach(item => {
                    const name = String(item.PLAYERNAME || "").trim();
                    const clubRaw = String(item.CLUB || "Unknown").trim();
                    const groupKey = getGroupKey(clubRaw, groupingMode) || "Unknown";
                    const position = String(item.POSITION || "—").trim();
                    const season = String(item.SEASON || "Unknown").trim();
                    const champion = String(item.CHAMPION || "Unknown").trim();

                    if (!name) return;

                    const rowKey = `${champion}|${season}|${groupKey}|${name}|${position}`;
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
                        [groupColumnLabel]: groupKey,
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

                EgyptNTExcelExport.exportToExcel(finalExportData, "EgyptNT_Squad_Club_Tournament");
            } else if (activeSubTab === "club_season") {
                const seasonStatsMap = buildPlayerSeasonStatsMap(filteredMatches, lineupDetails, playerDetails, gkDetails);
                const uniqueKeys = new Set();
                const exportDataRaw = [];

                (filteredSquadData || []).forEach(item => {
                    const name = String(item.PLAYERNAME || "").trim();
                    const clubRaw = String(item.CLUB || "Unknown").trim();
                    const groupKey = getGroupKey(clubRaw, groupingMode) || "Unknown";
                    const position = String(item.POSITION || "—").trim();
                    const season = String(item.SEASON || "Unknown").trim();
                    const champion = String(item.CHAMPION || "Unknown").trim();

                    if (!name) return;

                    const rowKey = `${champion}|${season}|${groupKey}|${name}|${position}`;
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
                        [groupColumnLabel]: groupKey,
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
    }, [filteredSquadData, activeSubTab, filteredMatches, lineupDetails, playerDetails, gkDetails, groupingMode, groupColumnLabel, isCountryMode]);

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
                                title="Filter Clubs Data"
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

                        {isStatsSubTab && !isClubDetailsOpen && (
                            <div className="squad-subtabs-switcher club-grouping-switcher">
                                <button
                                    type="button"
                                    className={`subtab-btn ${groupingMode === GROUPING_MODES.CLUB ? "active" : ""}`}
                                    onClick={() => handleGroupingModeChange(GROUPING_MODES.CLUB)}
                                >
                                    By Club
                                </button>
                                <button
                                    type="button"
                                    className={`subtab-btn ${groupingMode === GROUPING_MODES.COUNTRY ? "active" : ""}`}
                                    onClick={() => handleGroupingModeChange(GROUPING_MODES.COUNTRY)}
                                >
                                    By Country
                                </button>
                            </div>
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
                            <div className="dashboard-card" onClick={() => setActiveSubTab("clubs")}>
                                <Building2 size={40} className="card-icon" />
                                <h3>CLUBS DIRECTORY</h3>
                                <p>Overview of clubs, player selections, tournaments, and scoring metrics.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("club_championships")}>
                                <Trophy size={40} className="card-icon" />
                                <h3>CLUB TOURNAMENTS</h3>
                                <p>Tournament-by-tournament breakdown of player performances by club.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("club_season")}>
                                <Calendar size={40} className="card-icon" />
                                <h3>CLUB SEASONS</h3>
                                <p>Season-by-season breakdown of player performances by club.</p>
                            </div>
                            <div className="dashboard-card" onClick={() => setActiveSubTab("players")}>
                                <Users size={40} className="card-icon" />
                                <h3>PLAYERS DIRECTORY</h3>
                                <p>View player call-ups counts and detailed goal scoring statistics by club.</p>
                            </div>
                        </div>
                    )}
                    {activeSubTab === "editor" && (
                        <EgyptNTSquadEditor />
                    )}
                    {activeSubTab === "clubs" && (
                        <EgyptNTClubsList
                            squadData={filteredSquadData}
                            matches={filteredMatches}
                            lineupDetails={lineupDetails}
                            playerDetails={playerDetails}
                            gkDetails={gkDetails}
                            groupingMode={groupingMode}
                            onDetailsViewChange={setIsClubDetailsOpen}
                        />
                    )}
                    {activeSubTab === "players" && (
                        <EgyptNTClubsPlayers
                            squadData={filteredSquadData}
                            playerDetails={playerDetails}
                            filteredMatches={filteredMatches}
                            groupingMode={groupingMode}
                        />
                    )}
                    {activeSubTab === "club_championships" && (
                        <EgyptNTClubsChampionships
                            squadData={filteredSquadData}
                            matches={filteredMatches}
                            lineupDetails={lineupDetails}
                            playerDetails={playerDetails}
                            gkDetails={gkDetails}
                            groupingMode={groupingMode}
                        />
                    )}
                    {activeSubTab === "club_season" && (
                        <EgyptNTClubsSeasons
                            squadData={filteredSquadData}
                            matches={filteredMatches}
                            lineupDetails={lineupDetails}
                            playerDetails={playerDetails}
                            gkDetails={gkDetails}
                            groupingMode={groupingMode}
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
