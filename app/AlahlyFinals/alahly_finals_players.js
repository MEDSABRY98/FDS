"use client";

import { useMemo, useState } from "react";
import { User, Award, Percent, Target, Trophy, XCircle, Footprints, Zap, ArrowUpDown } from "lucide-react";
import SearchBar_db from "../lib/SearchBar_db";
import NoData_db from "../lib/NoData_db";
import "./alahly_finals_players.css";


export default function AlAhlyFinalsPlayers({ playersData, matchesData, lineupsData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'totalFinals', direction: 'desc' });

    const playerStats = useMemo(() => {
        if (!lineupsData || lineupsData.length === 0) return [];

        const statsMap = new Map();

        // Helper to normalize DD/MM/YYYY to YYYY-MM-DD
        const normalizeDate = (d) => {
            if (!d) return "";
            if (d.includes("/")) {
                const parts = d.split("/");
                if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            return d;
        };

        // 1. Pre-calculate final results by FINAL_ID
        // A player gets a Win/Loss if they participated in ANY match of a Final Ahly won/lost
        const finalOutcomes = {};
        if (matchesData) {
            matchesData.forEach(m => {
                const fId = m.FINAL_ID;
                if (!fId) return;
                const status = String(m["W-D-L FINAL"] || "").toUpperCase();
                if (status.includes("W") || status === "CHAMPION") {
                    finalOutcomes[fId] = "W";
                } else if (status.includes("L") || status === "RUNNER-UP") {
                    finalOutcomes[fId] = "L";
                }
            });
        }

        lineupsData.forEach(row => {
            const name = row["PLAYER NAME"];
            if (!name || name.toLowerCase() === "unknown") return;

            if (!statsMap.has(name)) {
                statsMap.set(name, {
                    name,
                    finalIds: new Set(),
                    matchDates: new Set(),
                    wins: 0,
                    losses: 0,
                    goals: 0,
                    assists: 0,
                    penalties: 0,
                    totalMatches: 0
                });
            }

            const p = statsMap.get(name);
            const finalId = row.FINAL_ID;
            const matchDate = normalizeDate(row.DATE);
            const matchKey = `${finalId}_${matchDate}`;

            p.totalMatches++;
            p.matchDates.add(matchKey);

            // Only attribute Win/Loss once per FINAL_ID
            if (!p.finalIds.has(finalId)) {
                p.finalIds.add(finalId);
                const outcome = finalOutcomes[finalId];
                if (outcome === "W") {
                    p.wins++;
                } else if (outcome === "L") {
                    p.losses++;
                }
            }
        });

        if (playersData) {
            playersData.forEach(event => {
                const name = event["PLAYER NAME"];
                if (!statsMap.has(name)) return;

                const p = statsMap.get(name);
                const type = String(event.TYPE || "").toUpperCase();
                const isPenalty = type.includes("PENALTY") || type.includes("ضربة جزاء") || type.includes("P");
                const isGoal = type.includes("GOAL") || type.includes("هدف") || isPenalty;
                const isAssist = type.includes("ASSIST") || type.includes("صنع");

                if (isPenalty) p.penalties++;
                if (isGoal) p.goals++;
                if (isAssist) p.assists++;
            });
        }

        let results = Array.from(statsMap.values())
            .map(s => {
                const totalFinals = s.finalIds.size;
                const winRate = totalFinals > 0 ? (s.wins / totalFinals) * 100 : 0;
                return {
                    ...s,
                    totalFinals,
                    winRate: parseFloat(winRate.toFixed(1)),
                    ga: s.goals + s.assists
                };
            });

        // Apply Sorting
        if (sortConfig.key) {
            results.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === bVal) return 0;
                if (sortConfig.direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        } else {
            // Default sort
            results.sort((a, b) => b.totalFinals - a.totalFinals || b.ga - a.ga);
        }

        return results;
    }, [playersData, matchesData, lineupsData, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const filteredPlayers = useMemo(() => {
        if (!searchTerm) return playerStats;
        const lowSearch = searchTerm.toLowerCase().trim();
        return playerStats.filter(p => p.name.toLowerCase().includes(lowSearch));
    }, [playerStats, searchTerm]);

    const totals = useMemo(() => {
        const stats = filteredPlayers.reduce((acc, p) => {
            acc.totalFinals += p.totalFinals || 0;
            acc.wins += p.wins || 0;
            acc.losses += p.losses || 0;
            acc.totalMatches += p.totalMatches || 0;
            acc.ga += p.ga || 0;
            acc.goals += p.goals || 0;
            acc.assists += p.assists || 0;
            acc.penalties += p.penalties || 0;
            return acc;
        }, {
            totalFinals: 0, wins: 0, losses: 0, totalMatches: 0, ga: 0, goals: 0, assists: 0, penalties: 0
        });

        stats.winRate = stats.totalFinals > 0 ? parseFloat(((stats.wins / stats.totalFinals) * 100).toFixed(1)) : 0;
        return stats;
    }, [filteredPlayers]);

    const SortIcon = ({ colKey }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown size={10} style={{ marginLeft: '4px', opacity: 0.3 }} />;
        return <ArrowUpDown size={10} style={{ marginLeft: '4px', color: '#c9a84c' }} />;
    };

    return (
        <div className="finals-players-container fade-in">
            <div className="finals-players-header">
                <h1 className="finals-players-title">AL AHLY FINALS <span className="gold-text">PLAYERS</span></h1>
                <div className="finals-players-search-wrapper">
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search for a champion player..."
                    />
                </div>
            </div>

            <div className="players-grid-stats">
                <div className="stats-table-wrapper shadow-premium">
                    <div className="players-table-header">
                        <div className="col-rank">#</div>
                        <div className="col-name sortable" onClick={() => handleSort('name')}>PLAYER NAME <SortIcon colKey="name" /></div>
                        <div className="col-num sortable" onClick={() => handleSort('totalFinals')}>FINALS <SortIcon colKey="totalFinals" /></div>
                        <div className="col-num win-col sortable" onClick={() => handleSort('wins')}>WINS <SortIcon colKey="wins" /></div>
                        <div className="col-num loss-col sortable" onClick={() => handleSort('losses')}>LOSS <SortIcon colKey="losses" /></div>
                        <div className="col-num perc-col sortable" onClick={() => handleSort('winRate')}>% <SortIcon colKey="winRate" /></div>
                        <div className="col-num sortable" onClick={() => handleSort('totalMatches')}>MTCH <SortIcon colKey="totalMatches" /></div>
                        <div className="col-num ga-col sortable" onClick={() => handleSort('ga')}>G+A <SortIcon colKey="ga" /></div>
                        <div className="col-num goal-col sortable" onClick={() => handleSort('goals')}>G <SortIcon colKey="goals" /></div>
                        <div className="col-num assist-col sortable" onClick={() => handleSort('assists')}>A <SortIcon colKey="assists" /></div>
                        <div className="col-num pen-col sortable" onClick={() => handleSort('penalties')}>PEN <SortIcon colKey="penalties" /></div>
                    </div>

                    <div className="stats-table-body">
                        {filteredPlayers.length === 0 ? (
                            <NoData_db isTable={false} height="200px" />

                        ) : (
                            <>
                                {filteredPlayers.map((player, idx) => (
                                    <div key={player.name} className="player-stats-row">
                                        <div className="col-rank">
                                            <span className="rank-badge">{idx + 1}</span>
                                        </div>
                                        <div className="col-name">{player.name}</div>
                                        <div className="col-num font-bold">{player.totalFinals}</div>
                                        <div className="col-num win-text">{player.wins}</div>
                                        <div className="col-num loss-text">{player.losses}</div>
                                        <div className="col-num perc-text">{player.winRate}%</div>
                                        <div className="col-num text-muted">{player.totalMatches}</div>
                                        <div className="col-num ga-text">{player.ga}</div>
                                        <div className="col-num goal-text">{player.goals}</div>
                                        <div className="col-num assist-text">{player.assists}</div>
                                        <div className="col-num pen-text">{player.penalties}</div>
                                    </div>
                                ))}

                                <div className="player-stats-row total-row-premium">
                                    <div className="col-rank">∑</div>
                                    <div className="col-name">TOTALS</div>
                                    <div className="col-num">{totals.totalFinals}</div>
                                    <div className="col-num">{totals.wins}</div>
                                    <div className="col-num">{totals.losses}</div>
                                    <div className="col-num">{totals.winRate}%</div>
                                    <div className="col-num">{totals.totalMatches}</div>
                                    <div className="col-num">{totals.ga}</div>
                                    <div className="col-num">{totals.goals}</div>
                                    <div className="col-num">{totals.assists}</div>
                                    <div className="col-num">{totals.penalties}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
