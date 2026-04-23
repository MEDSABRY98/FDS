"use client";

import { useMemo, useState, useEffect } from "react";
import { AhlyVZamalekService } from "./ahly_v_zamalek_service";
import "./ahly_v_zamalek_players.css";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";




export default function AhlyVZamalekPlayers({ playersData, matchesData, lineupsData }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [teamFilter, setTeamFilter] = useState("All");
    const [sortConfig, setSortConfig] = useState({ key: "gPlusA", direction: "desc" });
    



    // Assuming playersData has EVENT_ID, MATCH_ID, PLAYER NAME, TEAM, TYPE (Goal, Yellow Card, Red Card, etc.), MINUTE
    const playerStats = useMemo(() => {
        const statsMap = new Map();

        // 1. Process Lineups to get Matches and Minutes
        if (lineupsData && lineupsData.length > 0) {
            lineupsData.forEach(line => {
                if (!line["PLAYER NAME"]) return;
                const playerName = line["PLAYER NAME"].trim();
                const team = (line.TEAM || "").toUpperCase();
                const minutes = parseInt(line["TOTAL MINUTE"]) || 0;
                const matchId = line.MATCH_ID;
                const key = `${playerName}_${team}`;

                if (!statsMap.has(key)) {
                    statsMap.set(key, {
                        name: playerName,
                        team: team,
                        matchesCount: 0,
                        matchesSet: new Set(),
                        totalMinutes: 0,
                        goals: 0,
                        assists: 0,
                        penGoals: 0,
                        gPlusA: 0,
                        yellowCards: 0,
                        redCards: 0
                    });
                }

                const pStat = statsMap.get(key);
                pStat.totalMinutes += minutes;
                if (matchId) pStat.matchesSet.add(matchId);
            });
        }

        // 2. Process Player Events (Goals, Assists, Cards)
        if (playersData && playersData.length > 0) {
            playersData.forEach(event => {
                if (!event["PLAYER NAME"]) return;
                const playerName = event["PLAYER NAME"].trim();
                const team = (event.TEAM || "").toUpperCase();
                const type = String(event.TYPE || "").toUpperCase();
                const matchId = event.MATCH_ID;
                const key = `${playerName}_${team}`;

                if (!statsMap.has(key)) {
                    statsMap.set(key, {
                        name: playerName,
                        team: team,
                        matchesCount: 0,
                        matchesSet: new Set(),
                        totalMinutes: 0,
                        goals: 0,
                        assists: 0,
                        penGoals: 0,
                        gPlusA: 0,
                        yellowCards: 0,
                        redCards: 0
                    });
                }

                const pStat = statsMap.get(key);
                if (matchId) pStat.matchesSet.add(matchId);

                if (type.includes("GOAL")) {
                    pStat.goals++;
                    if (type.includes("PEN")) {
                        pStat.penGoals++;
                    }
                } else if (type.includes("ASSIST")) {
                    pStat.assists++;
                } else if (type.includes("YELLOW")) {
                    pStat.yellowCards++;
                } else if (type.includes("RED")) {
                    pStat.redCards++;
                }

                pStat.gPlusA = pStat.goals + pStat.assists;
            });
        }

        // Finalize matches count and convert to array
        let statsArray = Array.from(statsMap.values()).map(s => {
            s.matchesCount = s.matchesSet.size;
            // No need to delete matchesSet here as it's not used in rendering, but good for memory if array is huge
            return s;
        });

        // Sort by goals/G+A, but keep placeholders at the very end
        statsArray.sort((a, b) => {
            const isPlaceholder = (n) => !n || n.trim() === "" || /^[\?\s؟]+$/.test(n.trim());
            const aIsEnd = isPlaceholder(a.name);
            const bIsEnd = isPlaceholder(b.name);

            if (aIsEnd && !bIsEnd) return 1;
            if (bIsEnd && !aIsEnd) return -1;
            return (b.gPlusA - a.gPlusA) || (b.goals - a.goals) || (b.matchesCount - a.matchesCount);
        });


        return statsArray;
    }, [playersData, lineupsData]);


    const displayedPlayers = useMemo(() => {
        let filtered = playerStats;
        
        // 1. Initial Filtering
        if (teamFilter !== "All") {
            filtered = playerStats.filter(p => p.team === teamFilter);
        }

        // 2. Search filtering
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 3. Merge by Name if "All" is selected (players who played for both)
        if (teamFilter === "All") {
            const mergedMap = new Map();
            filtered.forEach(p => {
                if (!mergedMap.has(p.name)) {
                    // Create a copy to avoid mutating playerStats
                    mergedMap.set(p.name, { ...p });
                } else {
                    const existing = mergedMap.get(p.name);
                    existing.totalMinutes += p.totalMinutes;
                    existing.goals += p.goals;
                    existing.assists += p.assists;
                    existing.penGoals += p.penGoals;
                    existing.yellowCards += p.yellowCards;
                    existing.redCards += p.redCards;
                    existing.gPlusA = existing.goals + existing.assists;
                    
                    // Merge match sets to get unique count across both teams
                    // Re-calculate matchesCount based on combined sets
                    const combinedSet = new Set([...existing.matchesSet, ...(p.matchesSet || [])]);
                    existing.matchesSet = combinedSet;
                    existing.matchesCount = combinedSet.size;
                }
            });
            filtered = Array.from(mergedMap.values());
        }

        // 4. Sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const isPlaceholder = (n) => !n || n.trim() === "" || /^[\?\s؟]+$/.test(n.trim());
                const aIsEnd = isPlaceholder(a.name);
                const bIsEnd = isPlaceholder(b.name);

                if (aIsEnd && !bIsEnd) return 1;
                if (bIsEnd && !aIsEnd) return -1;

                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [playerStats, searchQuery, teamFilter, sortConfig]);

    useEffect(() => {
        const handleExport = () => {
            if (displayedPlayers.length > 0) {
                // Prepare data for export (remove sets and unnecessary fields)
                const exportData = displayedPlayers.map((p, idx) => ({
                    "#": idx + 1,
                    "PLAYER NAME": p.name,
                    "TEAM": p.team,
                    "MATCHES": p.matchesCount,
                    "MINUTES": p.totalMinutes,
                    "G+A": p.gPlusA,
                    "GOALS": p.goals,
                    "PENALTIES": p.penGoals,
                    "ASSISTS": p.assists
                }));
                AhlyVZamalekService.exportToExcel(exportData, `Ahly_vs_Zamalek_Players_${teamFilter}`);
            }
        };

        window.addEventListener('avz-export-excel', handleExport);
        return () => window.removeEventListener('avz-export-excel', handleExport);
    }, [displayedPlayers, teamFilter]);

    const handleSort = (key) => {
        let direction = "desc";
        if (sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    const teamOptions = [
        { value: "All", label: "ALL PLAYERS" },
        { value: "AHLY", label: "AHLY PLAYERS" },
        { value: "ZAMALEK", label: "ZAMALEK PLAYERS" }
    ];


    return (
        <div className="avz-players-container fade-in">
            <div className="avz-players-header">
                <h1 className="avz-players-title">DERBY <span className="avz-gold-text">PLAYERS</span></h1>

                <div className="avz-players-controls">
                    <div className="avz-search-box">
                        <SearchBar_db
                            placeholder="Search player name..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                    </div>

                    <div className="avz-team-filter-box">
                        <DropDownList_db
                            options={teamOptions}
                            value={teamFilter}
                            onChange={setTeamFilter}
                            placeholder="Select Team..."
                        />
                    </div>
                </div>


            </div>

            <div className="avz-table-wrapper">
                <table className="avz-data-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort(null)} style={{ cursor: 'default' }}>#</th>
                            <th onClick={() => handleSort('name')} className="sortable-header">PLAYER {getSortIcon('name')}</th>
                            <th onClick={() => handleSort('matchesCount')} className="sortable-header">MATCHES {getSortIcon('matchesCount')}</th>
                            <th onClick={() => handleSort('totalMinutes')} className="sortable-header">MINUTES {getSortIcon('totalMinutes')}</th>
                            <th onClick={() => handleSort('gPlusA')} className="sortable-header">G + A {getSortIcon('gPlusA')}</th>
                            <th onClick={() => handleSort('goals')} className="sortable-header">GOALS {getSortIcon('goals')}</th>
                            <th onClick={() => handleSort('penGoals')} className="sortable-header">PENALTIES {getSortIcon('penGoals')}</th>
                            <th onClick={() => handleSort('assists')} className="sortable-header">ASSISTS {getSortIcon('assists')}</th>
                        </tr>
                    </thead>


                    <tbody>
                        {displayedPlayers.length > 0 ? (
                            displayedPlayers.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td className="avz-text-bold">{p.name}</td>
                                    <td className="avz-highlight-stat">{p.matchesCount > 0 ? p.matchesCount : "-"}</td>
                                    <td>{p.totalMinutes > 0 ? p.totalMinutes : "-"}</td>
                                    <td className="avz-highlight-stat" style={{ color: '#c9a84c' }}>{p.gPlusA > 0 ? p.gPlusA : "-"}</td>
                                    <td className="avz-highlight-stat">{p.goals > 0 ? p.goals : "-"}</td>
                                    <td>{p.penGoals > 0 ? p.penGoals : "-"}</td>
                                    <td>{p.assists > 0 ? p.assists : "-"}</td>
                                </tr>


                            ))
                        ) : (
                            <NoData_db message="NO PLAYERS LOGGED FOR THIS FILTER" isTable={true} colSpan={8} />



                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
}
