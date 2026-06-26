"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import NoData_db from "../../lib/NoData_db";
import Loading_db from "../../lib/Loading_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { buildPlayerSeasonStatsMap, isGkPosition, getGroupKey, getGroupColumnLabel, GROUPING_MODES } from "./egypt_nt_db_clubs_utils";

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
        case "players_count":
            return player.playerCount ?? 0;
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
            primaryDiff = String(valueA).localeCompare(String(valueB), undefined, { numeric: true, sensitivity: "base" }) * multiplier;
        }

        if (primaryDiff !== 0) return primaryDiff;

        // Fallbacks
        const gaA = (a.ntStats?.goals ?? 0) + (a.ntStats?.assists ?? 0);
        const gaB = (b.ntStats?.goals ?? 0) + (b.ntStats?.assists ?? 0);
        if (gaA !== gaB) return gaB - gaA;

        const minsA = a.ntStats?.mins ?? 0;
        const minsB = b.ntStats?.mins ?? 0;
        if (minsA !== minsB) return minsB - minsA;

        return String(a.name || "").localeCompare(String(b.name || ""));
    });
}

function SeasonPlayersTable({ players, viewMode = "player", groupColumnLabel = "CLUB" }) {
    const [sortConfig, setSortConfig] = useState({ key: "g_plus_a", direction: "desc" });

    const clubGroupedPlayers = useMemo(() => {
        if (viewMode === "player") return players;

        const groups = {};
        players.forEach(p => {
            const key = p.club;
            if (!groups[key]) {
                groups[key] = {
                    club: p.club,
                    season: p.season,
                    playersSet: new Set(),
                    mp: 0,
                    mins: 0,
                    goals: 0,
                    assists: 0,
                    ga: 0,
                    cs: 0,
                    hasGk: false
                };
            }
            if (p.name) {
                groups[key].playersSet.add(p.name);
            }
            const stats = p.ntStats || {};
            groups[key].mp += stats.mp ?? 0;
            groups[key].mins += stats.mins ?? 0;
            groups[key].goals += stats.goals ?? 0;
            groups[key].assists += stats.assists ?? 0;
            if (stats.isGk) {
                groups[key].ga += stats.ga ?? 0;
                groups[key].cs += stats.cs ?? 0;
                groups[key].hasGk = true;
            }
        });

        return Object.values(groups).map(g => ({
            club: g.club,
            season: g.season,
            playerCount: g.playersSet.size,
            ntStats: {
                mp: g.mp,
                mins: g.mins,
                goals: g.goals,
                assists: g.assists,
                ga: g.hasGk ? g.ga : null,
                cs: g.hasGk ? g.cs : null,
                isGk: g.hasGk
            }
        }));
    }, [players, viewMode]);

    const sortedPlayers = useMemo(
        () => sortPlayers(clubGroupedPlayers, sortConfig),
        [clubGroupedPlayers, sortConfig]
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

    const activeColumns = useMemo(() => {
        const baseColumns = SORT_COLUMNS.map(column => (
            column.key === "club" ? { ...column, label: groupColumnLabel } : column
        ));

        if (viewMode === "player") {
            return baseColumns;
        }
        const filtered = baseColumns.filter(col => col.key !== "name" && col.key !== "position");
        const clubIdx = filtered.findIndex(col => col.key === "club");
        if (clubIdx !== -1) {
            filtered.splice(clubIdx + 1, 0, { key: "players_count", label: "PLAYERS" });
        }
        return filtered;
    }, [viewMode, groupColumnLabel]);

    const totals = useMemo(() => {
        const acc = {
            playerCount: 0,
            mp: 0,
            mins: 0,
            goals: 0,
            assists: 0,
            ga: 0,
            cs: 0,
            hasGk: false
        };

        sortedPlayers.forEach(p => {
            const stats = p.ntStats || {};
            acc.mp += stats.mp ?? 0;
            acc.mins += stats.mins ?? 0;
            acc.goals += stats.goals ?? 0;
            acc.assists += stats.assists ?? 0;
            if (viewMode === "club") {
                acc.playerCount += p.playerCount ?? 0;
            }
            if (stats.isGk) {
                acc.ga += stats.ga ?? 0;
                acc.cs += stats.cs ?? 0;
                acc.hasGk = true;
            }
        });

        return acc;
    }, [sortedPlayers, viewMode]);

    return (
        <div className="squad-table-container club-season-table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
            <table className="luxury-squad-table club-season-stats-table">
                <colgroup>
                    {viewMode === "player" ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <col style={{ width: "4%" }} />
                            <col style={{ width: "16%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                        </>
                    )}
                </colgroup>
                <thead>
                    <tr>
                        <th>#</th>
                        {activeColumns.map(column => (
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
                            <tr key={`${player.club}-${player.name || ""}-${player.season}-${player.position || ""}-${idx}`}>
                                <td className="row-num club-row-num">{idx + 1}</td>
                                <td className="highlight-blue">{player.club}</td>
                                {viewMode === "player" ? (
                                    <>
                                        <td className="player-name-cell">{player.name}</td>
                                        <td>{player.position}</td>
                                    </>
                                ) : (
                                    <td className="club-stat-cell">{player.playerCount}</td>
                                )}
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
                    {sortedPlayers.length > 0 && (
                        <tr className="club-stats-total-row">
                            <td />
                            <td className="player-name-cell">TOTAL</td>
                            {viewMode === "player" ? (
                                <>
                                    <td>—</td>
                                    <td>—</td>
                                </>
                            ) : (
                                <td className="club-stat-cell">{totals.playerCount}</td>
                            )}
                            <td>—</td>
                            <StatCell value={totals.mp} />
                            <StatCell value={totals.mins} />
                            <StatCell value={totals.goals + totals.assists} />
                            <StatCell value={totals.goals} />
                            <StatCell value={totals.assists} />
                            <StatCell value={totals.ga} isGkOnly active={totals.hasGk} />
                            <StatCell value={totals.cs} isGkOnly active={totals.hasGk} />
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default function EgyptNTClubsSeasons({ squadData, matches, lineupDetails, playerDetails, gkDetails, groupingMode = GROUPING_MODES.CLUB }) {
    const [viewMode, setViewMode] = useState("player"); // "player" | "club"
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTournamentState, setSelectedTournamentState] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const tablesPerPage = 5;
    const groupColumnLabel = getGroupColumnLabel(groupingMode);
    const isCountryMode = groupingMode === GROUPING_MODES.COUNTRY;

    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm("");
    }, [groupingMode]);

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

        const bgTimer = setTimeout(() => {
            const newMap = buildPlayerSeasonStatsMap(matches, lineupDetails, playerDetails, gkDetails);
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
            const clubRaw = String(item.CLUB || "Unknown").trim();
            const groupKey = getGroupKey(clubRaw, groupingMode) || "Unknown";
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
            seasonGroupsRaw[season].clubs.add(groupKey);

            const rowKey = `${groupKey}|${name}|${position}|${season}`;
            if (!seasonGroupsRaw[season].playerKeys.has(rowKey)) {
                seasonGroupsRaw[season].playerKeys.add(rowKey);
                seasonGroupsRaw[season].players.push({
                    name,
                    club: groupKey,
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
    }, [squadData, selectedTournament, seasonStatsMap, groupingMode]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return seasonGroups;

        const query = searchTerm.toLowerCase().trim();
        return seasonGroups
            .map(group => {
                const seasonMatch = group.season.toLowerCase().includes(query);
                const players = seasonMatch
                    ? group.players
                    : group.players.filter(player =>
                        player.club.toLowerCase().includes(query) ||
                        player.season.toLowerCase().includes(query) ||
                        (viewMode === "player" && (
                            player.name.toLowerCase().includes(query) ||
                            String(player.position || "").toLowerCase().includes(query)
                        ))
                    );

                if (players.length === 0) return null;
                return { ...group, players };
            })
            .filter(Boolean);
    }, [seasonGroups, searchTerm, viewMode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedTournament, viewMode]);

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
            {/* Sub-tab switcher */}
            <div className="squad-subtabs-switcher" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', width: 'fit-content', margin: '0 auto 20px auto' }}>
                <button
                    className={`subtab-btn ${viewMode === "player" ? "active" : ""}`}
                    onClick={() => { setViewMode("player"); setCurrentPage(1); setSearchTerm(""); }}
                >
                    👤 By Player
                </button>
                <button
                    className={`subtab-btn ${viewMode === "club" ? "active" : ""}`}
                    onClick={() => { setViewMode("club"); setCurrentPage(1); setSearchTerm(""); }}
                >
                    🏢 By {isCountryMode ? "Country" : "Club"}
                </button>
            </div>

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
                        placeholder={viewMode === "player" ? `Search season, ${groupColumnLabel.toLowerCase()}, player, position...` : `Search season, ${groupColumnLabel.toLowerCase()}...`}
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
                                    {viewMode === "player" && (
                                        <span><strong style={{ color: "#c9a84c" }}>{group.players.length}</strong> players</span>
                                    )}
                                    <span><strong style={{ color: "#c9a84c" }}>{group.clubs.length}</strong> {isCountryMode ? "countries" : "clubs"}</span>
                                    <span><strong style={{ color: "#c9a84c" }}>{group.champions.length}</strong> tournaments</span>
                                </div>
                            </div>
                            <SeasonPlayersTable players={group.players} viewMode={viewMode} groupColumnLabel={groupColumnLabel} />
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
