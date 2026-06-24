"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import SearchBar_db from "../../../lib/SearchBar_db";
import NoData_db from "../../../lib/NoData_db";
import Loading_db from "../../../lib/Loading_db";
import DropDownList_db from "../../../lib/DropDownList_db";
import { buildPlayerSeasonStatsMap, isGkPosition } from "./egypt_nt_db_squad_club_details";

const SORT_COLUMNS = [
    { key: "club", label: "CLUB" },
    { key: "name", label: "PLAYER NAME" },
    { key: "position", label: "POSITION" },
    { key: "season", label: "SEASON" },
    { key: "mp", label: "MP" },
    { key: "mins", label: "MINS" },
    { key: "g_plus_a", label: "G+A" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "ga", label: "GA" },
    { key: "cs", label: "CS" }
];

function emptySeasonStats() {
    return { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, gkCaps: 0 };
}

function getSeasonStatsKey(playerName, season) {
    return `${String(playerName || "").trim()}|${String(season || "").trim()}`;
}

function resolvePlayerSeasonStats(playerName, season, position, seasonStatsMap) {
    const raw = seasonStatsMap[getSeasonStatsKey(playerName, season)] || emptySeasonStats();
    const isGk = isGkPosition(position) || raw.gkCaps > 0;

    return {
        isGk,
        mp: isGk ? raw.gkCaps : raw.mp,
        mins: raw.mins,
        goals: raw.goals,
        assists: raw.assists,
        ga: isGk ? raw.ga : null,
        cs: isGk ? raw.cs : null
    };
}

function StatCell({ value, isGkOnly = false, active = true }) {
    if (isGkOnly && !active) {
        return <td className="club-stat-cell muted">—</td>;
    }

    return <td className="club-stat-cell">{value ?? 0}</td>;
}

function getSortValue(player, key) {
    const stats = player.ntStats || {};

    switch (key) {
        case "club":
            return String(player.club || "").toLowerCase();
        case "name":
            return String(player.name || "").toLowerCase();
        case "position":
            return String(player.position || "").toLowerCase();
        case "season":
            return String(player.season || "").toLowerCase();
        case "mp":
            return stats.mp ?? 0;
        case "mins":
            return stats.mins ?? 0;
        case "g_plus_a":
            return (stats.goals ?? 0) + (stats.assists ?? 0);
        case "goals":
            return stats.goals ?? 0;
        case "assists":
            return stats.assists ?? 0;
        case "ga":
            return stats.isGk ? (stats.ga ?? 0) : -1;
        case "cs":
            return stats.isGk ? (stats.cs ?? 0) : -1;
        default:
            return 0;
    }
}

function sortPlayers(players, sortConfig) {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    return [...players].sort((a, b) => {
        const valueA = getSortValue(a, key);
        const valueB = getSortValue(b, key);

        let primaryDiff = 0;
        if (typeof valueA === "number" && typeof valueB === "number") {
            primaryDiff = (valueA - valueB) * multiplier;
        } else {
            primaryDiff = valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: "base" }) * multiplier;
        }

        if (primaryDiff !== 0) return primaryDiff;

        // Fallbacks
        const gaA = (a.ntStats?.goals ?? 0) + (a.ntStats?.assists ?? 0);
        const gaB = (b.ntStats?.goals ?? 0) + (b.ntStats?.assists ?? 0);
        if (gaA !== gaB) return gaB - gaA;

        const minsA = a.ntStats?.mins ?? 0;
        const minsB = b.ntStats?.mins ?? 0;
        if (minsA !== minsB) return minsB - minsA;

        return a.name.localeCompare(b.name);
    });
}

function SeasonPlayersTable({ players }) {
    const [sortConfig, setSortConfig] = useState({ key: "g_plus_a", direction: "desc" });

    const sortedPlayers = useMemo(
        () => sortPlayers(players, sortConfig),
        [players, sortConfig]
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    return (
        <div className="squad-table-container club-season-table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
            <table className="luxury-squad-table club-season-stats-table">
                <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "6%" }} />
                </colgroup>
                <thead>
                    <tr>
                        <th>#</th>
                        {SORT_COLUMNS.map(column => (
                            <th
                                key={column.key}
                                className="club-sortable-header"
                                onClick={() => handleSort(column.key)}
                            >
                                {column.label} <span className="club-sort-icon">{getSortIcon(column.key)}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((player, idx) => {
                        const stats = player.ntStats || {};
                        return (
                            <tr key={`${player.club}-${player.name}-${player.season}-${player.position}-${idx}`}>
                                <td className="row-num club-row-num">{idx + 1}</td>
                                <td className="highlight-blue">{player.club}</td>
                                <td className="player-name-cell">{player.name}</td>
                                <td>{player.position}</td>
                                <td>{player.season}</td>
                                <StatCell value={stats.mp} />
                                <StatCell value={stats.mins} />
                                <StatCell value={(stats.goals ?? 0) + (stats.assists ?? 0)} />
                                <StatCell value={stats.goals} />
                                <StatCell value={stats.assists} />
                                <StatCell value={stats.ga} isGkOnly active={stats.isGk} />
                                <StatCell value={stats.cs} isGkOnly active={stats.isGk} />
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function EgyptNTSquadClubSeason({ squadData, matches, lineupDetails, playerDetails, gkDetails }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTournamentState, setSelectedTournamentState] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const tablesPerPage = 5;

    const uniqueTournaments = useMemo(() => {
        if (!squadData) return [];
        const champs = new Set();
        squadData.forEach(item => {
            const champ = String(item.CHAMPION || "").trim();
            if (champ) champs.add(champ);
        });
        return [...champs].sort();
    }, [squadData]);

    const tournamentOptions = useMemo(() => {
        return uniqueTournaments.map(champ => ({ value: champ, label: champ }));
    }, [uniqueTournaments]);

    const selectedTournament = selectedTournamentState || (uniqueTournaments.length > 0 ? uniqueTournaments[0] : "");

    const [seasonStatsMap, setSeasonStatsMap] = useState(null);
    const [isCalculating, setIsCalculating] = useState(true);
    const bgDataRef = useRef({ matches, lineupDetails, playerDetails, gkDetails });

    // Effect 1: Show loading for 1 second on mount, then display data from cache
    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            // Use whatever is in cache (or compute first time) - instant if cache hit
            const map = buildPlayerSeasonStatsMap(
                bgDataRef.current.matches,
                bgDataRef.current.lineupDetails,
                bgDataRef.current.playerDetails,
                bgDataRef.current.gkDetails
            );
            setSeasonStatsMap(map);
            setIsCalculating(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []); // Only on mount

    // Effect 2: Silent background revalidation - if data changed, update without freeze
    useEffect(() => {
        bgDataRef.current = { matches, lineupDetails, playerDetails, gkDetails };

        if (isCalculating) return; // Still in initial load, skip

        // Run silently in background after a tick - cache handles dedup, returns instantly if no change
        const bgTimer = setTimeout(() => {
            const newMap = buildPlayerSeasonStatsMap(matches, lineupDetails, playerDetails, gkDetails);
            // Only trigger re-render if we got a genuinely new map object (cache miss = new data)
            setSeasonStatsMap(prev => (prev === newMap ? prev : newMap));
        }, 200);
        return () => clearTimeout(bgTimer);
    }, [matches, lineupDetails, playerDetails, gkDetails, isCalculating]);

    const seasonGroups = useMemo(() => {
        if (!squadData || squadData.length === 0 || !selectedTournament || !seasonStatsMap) return [];

        const seasonGroupsRaw = {};

        squadData.forEach(item => {
            const champion = String(item.CHAMPION || "Unknown").trim();
            if (champion !== selectedTournament) return;

            const name = String(item.PLAYERNAME || "").trim();
            const club = String(item.CLUB || "Unknown").trim();
            const position = String(item.POSITION || "—").trim();
            const season = String(item.SEASON || "Unknown").trim();

            if (!name) return;

            if (!seasonGroupsRaw[season]) {
                seasonGroupsRaw[season] = {
                    callups: 0,
                    players: [],
                    playerKeys: new Set(),
                    champions: new Set(),
                    clubs: new Set()
                };
            }

            seasonGroupsRaw[season].callups += 1;
            seasonGroupsRaw[season].champions.add(champion);
            seasonGroupsRaw[season].clubs.add(club);

            const rowKey = `${club}|${name}|${position}|${season}`;
            if (!seasonGroupsRaw[season].playerKeys.has(rowKey)) {
                seasonGroupsRaw[season].playerKeys.add(rowKey);
                seasonGroupsRaw[season].players.push({
                    name,
                    club,
                    position: position || "—",
                    season,
                    ntStats: resolvePlayerSeasonStats(name, season, position, seasonStatsMap)
                });
            }
        });

        return Object.entries(seasonGroupsRaw)
            .map(([season, group]) => ({
                season,
                callups: group.callups,
                players: group.players.sort((a, b) => a.club.localeCompare(b.club) || a.name.localeCompare(b.name)),
                champions: [...group.champions].sort(),
                clubs: [...group.clubs].sort()
            }))
            .sort((a, b) => b.season.localeCompare(a.season, undefined, { numeric: true }));
    }, [squadData, selectedTournament, seasonStatsMap]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return seasonGroups;

        const query = searchTerm.toLowerCase().trim();
        return seasonGroups
            .map(group => {
                const seasonMatch = group.season.toLowerCase().includes(query);
                const players = seasonMatch
                    ? group.players
                    : group.players.filter(player =>
                        player.name.toLowerCase().includes(query) ||
                        player.club.toLowerCase().includes(query) ||
                        String(player.position || "").toLowerCase().includes(query) ||
                        player.season.toLowerCase().includes(query)
                    );

                if (players.length === 0) return null;
                return { ...group, players };
            })
            .filter(Boolean);
    }, [seasonGroups, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedTournament]);

    const totalPages = Math.ceil(filteredGroups.length / tablesPerPage);
    const paginatedGroups = filteredGroups.slice(
        (currentPage - 1) * tablesPerPage,
        currentPage * tablesPerPage
    );

    if (!selectedTournament) {
        return <NoData_db message="NO TOURNAMENT SELECTED" height="240px" />;
    }

    if (isCalculating || !seasonStatsMap) {
        return <Loading_db title="EGYPT NT" subtitle="SQUAD STATS" message="CALCULATING SEASON STATS..." inline={true} />;
    }

    if (seasonGroups.length === 0) {
        return <NoData_db message="NO SEASON DATA AVAILABLE FOR THIS TOURNAMENT" height="240px" />;
    }

    return (
        <div className="fade-in">
            <div className="squad-search-wrap" style={{ marginBottom: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ minWidth: "250px", width: "300px" }}>
                    <DropDownList_db
                        options={tournamentOptions}
                        value={selectedTournament}
                        onChange={setSelectedTournamentState}
                        searchable={true}
                        placeholder="Select Tournament..."
                    />
                </div>

                <div style={{ width: "350px", maxWidth: "400px" }}>
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search season, club, player, position..."
                    />
                </div>
            </div>

            {filteredGroups.length === 0 ? (
                <NoData_db message="No season details found matching your query." height="200px" />
            ) : (
                <>
                    {paginatedGroups.map(group => (
                        <div key={group.season} className="club-season-block" style={{ marginBottom: "30px", background: "#fff", borderRadius: "12px", border: "1px solid #eee", overflow: "hidden" }}>
                            <div className="club-season-block-header" style={{ background: "#f8f9fa", padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div className="club-season-block-title" style={{ fontSize: "20px", fontWeight: "700", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px", color: "#111" }}>
                                    {group.season}
                                </div>
                                <div className="club-season-block-meta" style={{ fontSize: "14px", color: "#666", display: "flex", gap: "20px" }}>
                                    <span><strong style={{ color: "#c9a84c" }}>{group.players.length}</strong> players</span>
                                    <span><strong style={{ color: "#c9a84c" }}>{group.clubs.length}</strong> clubs</span>
                                    <span><strong style={{ color: "#c9a84c" }}>{group.champions.length}</strong> tournaments</span>
                                </div>
                            </div>
                            <SeasonPlayersTable players={group.players} />
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="club-season-pagination" style={{ marginTop: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 150, behavior: 'smooth' }); }}>←</button>
                            <span>PAGE {currentPage} OF {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 150, behavior: 'smooth' }); }}>→</button>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                .club-season-pagination button { 
                    background: rgba(201, 168, 76, 0.15); 
                    border: 1px solid rgba(201, 168, 76, 0.3); 
                    color: var(--player-gold, #c9a84c); 
                    padding: 8px 18px; 
                    border-radius: 10px; 
                    font-family: 'Space Mono', monospace; 
                    font-weight: 700;
                    font-size: 13px; 
                    cursor: pointer; 
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .club-season-pagination button:hover:not(:disabled) { 
                    background: var(--player-gold, #c9a84c); 
                    color: #000; 
                    border-color: var(--player-gold, #c9a84c);
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.3);
                    transform: translateY(-1px);
                }
                .club-season-pagination button:disabled { 
                    opacity: 0.3; 
                    cursor: not-allowed; 
                    border-color: rgba(0,0,0,0.1);
                    color: #666;
                }
                .club-season-pagination span { 
                    font-family: 'Space Mono', monospace; 
                    font-size: 14px; 
                    color: var(--player-gold, #c9a84c); 
                    letter-spacing: 2px; 
                    font-weight: 800;
                }
            `}</style>
        </div>
    );
}
