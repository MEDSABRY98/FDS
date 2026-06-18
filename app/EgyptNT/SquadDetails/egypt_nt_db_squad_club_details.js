"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import ClubDetailsDashboard from "./egypt_nt_db_squad_club_details_dashboard";
import ClubDetailsPlayers from "./egypt_nt_db_squad_club_details_players";
import ClubDetailsSeasonDetails from "./egypt_nt_db_squad_club_details_season_details";
import ClubDetailsChampionships from "./egypt_nt_db_squad_club_details_championships";
import ClubDetailsSeasons from "./egypt_nt_db_squad_club_details_seasons";
import "../Squad/egypt_nt_db_squad.css";

const CLUB_TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "players", label: "Players" },
    { id: "season_details", label: "Season Details" },
    { id: "championships", label: "Championships" },
    { id: "seasons", label: "Seasons" }
];

const isEgyptTeam = (team) => {
    if (!team) return false;
    const value = String(team).trim();
    return value === "مصر" || value === "Egypt" || value === "منتخب مصر" || value === "المنتخب المصري";
};

export function isGkPosition(position) {
    const value = String(position || "").trim().toLowerCase();
    return value.includes("gk") || value.includes("goalkeeper") || value.includes("حارس") || value.includes("حراس");
}

function emptySeasonStats() {
    return { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, gkCaps: 0 };
}

function getSeasonStatsKey(playerName, season) {
    return `${String(playerName || "").trim()}|${String(season || "").trim()}`;
}

function isOwnGoal(type, subType) {
    const goalType = String(type || "").trim().toUpperCase();
    const goalSubType = String(subType || "").trim().toUpperCase();
    return goalType === "OG" || goalSubType === "OG";
}

function isCountablePlayerGoal(type, subType) {
    if (isOwnGoal(type, subType)) return false;

    const goalType = String(type || "").trim();
    const goalSubType = String(subType || "").trim();
    return goalType === "GOAL" || goalType === "هدف" || goalSubType === "PENGOAL" || goalSubType === "هدف جزاء";
}

export function buildPlayerSeasonStatsMap(matches, lineupDetails, playerDetails, gkDetails) {
    const statsMap = {};
    const matchContextMap = {};
    const gkCountByMatchTeam = {};

    (gkDetails || []).forEach(row => {
        const matchId = String(row.MATCH_ID || "");
        const team = String(row.TEAM || "").trim();
        if (!matchId || !team) return;

        const teamKey = `${matchId}|${team}`;
        gkCountByMatchTeam[teamKey] = (gkCountByMatchTeam[teamKey] || 0) + 1;
    });

    (matches || []).forEach(match => {
        const matchId = String(match.MATCH_ID || "");
        if (!matchId) return;

        matchContextMap[matchId] = {
            season: String(match.SEASON || match["SEASON - NAME"] || "Unknown").trim(),
            gf: parseInt(match.GF || 0, 10) || 0,
            ga: parseInt(match.GA || 0, 10) || 0
        };
    });

    const getOrCreate = (playerName, season) => {
        const key = getSeasonStatsKey(playerName, season);
        if (!statsMap[key]) statsMap[key] = emptySeasonStats();
        return statsMap[key];
    };

    (lineupDetails || []).forEach(row => {
        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName) return;

        const ctx = matchContextMap[String(row.MATCH_ID || "")];
        if (!ctx || !ctx.season || ctx.season === "Unknown") return;

        const stats = getOrCreate(playerName, ctx.season);
        stats.mp += 1;
        stats.mins += parseInt(row["TOTAL MINUTE"] || 0, 10) || 0;
    });

    (playerDetails || []).forEach(row => {
        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName) return;

        const ctx = matchContextMap[String(row.MATCH_ID || "")];
        if (!ctx || !ctx.season || ctx.season === "Unknown") return;

        const stats = getOrCreate(playerName, ctx.season);
        const type = String(row.TYPE || "").trim();
        const subType = String(row.TYPE_SUB || "").trim();
        const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";

        if (isCountablePlayerGoal(type, subType)) stats.goals += 1;
        if (isAssist) stats.assists += 1;
    });

    (gkDetails || []).forEach(row => {
        const playerName = String(row["PLAYER NAME"] || "").trim();
        if (!playerName) return;

        const matchId = String(row.MATCH_ID || "");
        const ctx = matchContextMap[matchId];
        if (!ctx || !ctx.season || ctx.season === "Unknown") return;

        const stats = getOrCreate(playerName, ctx.season);
        const team = String(row.TEAM || "").trim();
        const goalsConceded = parseInt(row["GOALS CONCEDED"] || 0, 10) || 0;
        const isStarter = String(row.STATU || "").trim() === "اساسي";
        const stayedAllMatch = !row["OUT MINUTE"] || String(row["OUT MINUTE"]).trim() === "";

        stats.gkCaps += 1;
        stats.ga += goalsConceded;

        const teamGkCount = gkCountByMatchTeam[`${matchId}|${team}`] || 0;
        const isSoleTeamGk = teamGkCount === 1;

        if (isStarter && stayedAllMatch && isSoleTeamGk && goalsConceded === 0) {
            if (isEgyptTeam(team) && ctx.ga === 0) stats.cs += 1;
            else if (!isEgyptTeam(team) && ctx.gf === 0) stats.cs += 1;
        }
    });

    return statsMap;
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

export function buildClubPlayerPerformance(squadData, matchData = {}) {
    const seasonStatsMap = buildPlayerSeasonStatsMap(
        matchData.matches,
        matchData.lineupDetails,
        matchData.playerDetails,
        matchData.gkDetails
    );

    const entries = {};

    (squadData || []).forEach(item => {
        const name = String(item.PLAYERNAME || "").trim();
        const club = String(item.CLUB || "").trim();
        const season = String(item.SEASON || "").trim();
        const position = String(item.POSITION || "").trim();
        if (!name || !club) return;

        const key = `${name}|${club}`;
        if (!entries[key]) {
            entries[key] = { name, club, seasons: {}, positions: new Set() };
        }

        if (season) {
            if (!entries[key].seasons[season]) entries[key].seasons[season] = new Set();
            if (position) entries[key].seasons[season].add(position);
        }
        if (position) entries[key].positions.add(position);
    });

    return Object.values(entries)
        .map(entry => {
            let mp = 0;
            let mins = 0;
            let goals = 0;
            let assists = 0;
            let ga = 0;
            let cs = 0;
            let isGk = false;

            Object.entries(entry.seasons).forEach(([season, positionsSet]) => {
                const positions = [...positionsSet];
                const seasonPosition = positions.length === 1
                    ? positions[0]
                    : positions.length > 1
                        ? positions.join(" / ")
                        : "";
                const resolved = resolvePlayerSeasonStats(entry.name, season, seasonPosition, seasonStatsMap);

                isGk = isGk || resolved.isGk;
                mp += resolved.mp;
                mins += resolved.mins;
                goals += resolved.goals;
                assists += resolved.assists;

                if (resolved.isGk) {
                    ga += resolved.ga || 0;
                    cs += resolved.cs || 0;
                }
            });

            const allPositions = [...entry.positions];
            const position = allPositions.length === 1
                ? allPositions[0]
                : allPositions.length > 1
                    ? allPositions.join(" / ")
                    : "—";

            return {
                name: entry.name,
                club: entry.club,
                position,
                ntStats: {
                    mp,
                    mins,
                    goals,
                    assists,
                    ga: isGk ? ga : null,
                    cs: isGk ? cs : null,
                    isGk
                }
            };
        })
        .sort((a, b) =>
            b.ntStats.mp - a.ntStats.mp ||
            b.ntStats.goals - a.ntStats.goals ||
            a.club.localeCompare(b.club) ||
            a.name.localeCompare(b.name)
        );
}

export function buildClubOnlyPerformance(squadData, matchData = {}) {
    const playerRows = buildClubPlayerPerformance(squadData, matchData);
    const clubs = {};

    playerRows.forEach(row => {
        if (!clubs[row.club]) {
            clubs[row.club] = {
                club: row.club,
                playerCount: 0,
                ntStats: { mp: 0, mins: 0, goals: 0, assists: 0, ga: 0, cs: 0, hasGk: false }
            };
        }

        const entry = clubs[row.club];
        entry.playerCount += 1;
        entry.ntStats.mp += row.ntStats.mp;
        entry.ntStats.mins += row.ntStats.mins;
        entry.ntStats.goals += row.ntStats.goals;
        entry.ntStats.assists += row.ntStats.assists;

        if (row.ntStats.isGk) {
            entry.ntStats.hasGk = true;
            entry.ntStats.ga += row.ntStats.ga || 0;
            entry.ntStats.cs += row.ntStats.cs || 0;
        }
    });

    return Object.values(clubs)
        .map(entry => ({
            club: entry.club,
            playerCount: entry.playerCount,
            ntStats: {
                mp: entry.ntStats.mp,
                mins: entry.ntStats.mins,
                goals: entry.ntStats.goals,
                assists: entry.ntStats.assists,
                ga: entry.ntStats.hasGk ? entry.ntStats.ga : null,
                cs: entry.ntStats.hasGk ? entry.ntStats.cs : null,
                isGk: entry.ntStats.hasGk
            }
        }))
        .sort((a, b) =>
            b.ntStats.mp - a.ntStats.mp ||
            b.ntStats.goals - a.ntStats.goals ||
            a.club.localeCompare(b.club)
        );
}

export function buildClubStats(clubName, squadData, matchData = {}) {
    const rows = (squadData || []).filter(
        item => String(item.CLUB || "").trim() === clubName
    );

    const seasonStatsMap = buildPlayerSeasonStatsMap(
        matchData.matches,
        matchData.lineupDetails,
        matchData.playerDetails,
        matchData.gkDetails
    );

    const playerMap = {};
    const seasonGroupsRaw = {};
    const championMap = {};
    const seasonMap = {};

    rows.forEach(item => {
        const name = String(item.PLAYERNAME || "").trim();
        const position = String(item.POSITION || "").trim();
        const season = String(item.SEASON || "").trim();
        const champion = String(item.CHAMPION || "Unknown").trim();

        if (name) {
            if (!playerMap[name]) {
                playerMap[name] = {
                    name,
                    callups: 0,
                    positions: new Set(),
                    champions: {},
                    seasonsByChamp: {}
                };
            }
            playerMap[name].callups += 1;
            if (position) playerMap[name].positions.add(position);
            playerMap[name].champions[champion] = (playerMap[name].champions[champion] || 0) + 1;
            if (season) {
                if (!playerMap[name].seasonsByChamp[champion]) {
                    playerMap[name].seasonsByChamp[champion] = new Set();
                }
                playerMap[name].seasonsByChamp[champion].add(season);
            }
        }

        if (season) {
            if (!seasonGroupsRaw[season]) {
                seasonGroupsRaw[season] = {
                    callups: 0,
                    players: [],
                    playerKeys: new Set(),
                    champions: new Set()
                };
            }
            seasonGroupsRaw[season].callups += 1;
            seasonGroupsRaw[season].champions.add(champion);
            const rowKey = `${name}|${position}|${champion}`;
            if (name && !seasonGroupsRaw[season].playerKeys.has(rowKey)) {
                seasonGroupsRaw[season].playerKeys.add(rowKey);
                seasonGroupsRaw[season].players.push({
                    name,
                    position: position || "—",
                    champion,
                    ntStats: resolvePlayerSeasonStats(name, season, position, seasonStatsMap)
                });
            }
        }

        if (!championMap[champion]) {
            championMap[champion] = { name: champion, callups: 0, players: new Set(), seasons: new Set() };
        }
        championMap[champion].callups += 1;
        if (name) championMap[champion].players.add(name);
        if (season) championMap[champion].seasons.add(season);

        if (season) {
            if (!seasonMap[season]) {
                seasonMap[season] = { name: season, callups: 0, players: new Set(), champions: new Set() };
            }
            seasonMap[season].callups += 1;
            if (name) seasonMap[season].players.add(name);
            seasonMap[season].champions.add(champion);
        }
    });

    const players = Object.values(playerMap)
        .map(p => {
            const seasonsByChamp = {};
            for (const champ in p.seasonsByChamp) {
                seasonsByChamp[champ] = [...p.seasonsByChamp[champ]].sort((a, b) =>
                    b.localeCompare(a, undefined, { numeric: true })
                );
            }
            const positions = [...p.positions];
            return {
                name: p.name,
                callups: p.callups,
                position: positions.length === 1
                    ? positions[0]
                    : positions.length > 1
                        ? positions.join(" / ")
                        : "—",
                champions: p.champions,
                seasonsByChamp
            };
        })
        .sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));

    const champions = Object.values(championMap)
        .map(c => ({
            name: c.name,
            callups: c.callups,
            playerCount: c.players.size,
            seasonCount: c.seasons.size
        }))
        .sort((a, b) => b.callups - a.callups || a.name.localeCompare(b.name));

    const seasons = Object.values(seasonMap)
        .map(s => ({
            name: s.name,
            callups: s.callups,
            playerCount: s.players.size,
            championCount: s.champions.size
        }))
        .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));

    const seasonGroups = Object.entries(seasonGroupsRaw)
        .map(([season, group]) => ({
            season,
            callups: group.callups,
            players: group.players.sort((a, b) => a.name.localeCompare(b.name)),
            champions: [...group.champions].sort()
        }))
        .sort((a, b) => b.season.localeCompare(a.season, undefined, { numeric: true }));

    const sortedSeasonNames = seasons.map(s => s.name).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    return {
        totalCallups: rows.length,
        uniquePlayers: players.length,
        uniqueSeasons: seasons.length,
        uniqueChampions: champions.length,
        players,
        seasonGroups,
        champions,
        seasons,
        highlights: {
            topPlayer: players[0] || null,
            topChampion: champions[0] || null,
            firstSeason: sortedSeasonNames[0] || "—",
            lastSeason: sortedSeasonNames[sortedSeasonNames.length - 1] || "—"
        }
    };
}

export default function EgyptNTSquadClubDetails({
    clubName,
    squadData,
    matches,
    lineupDetails,
    playerDetails,
    gkDetails,
    onBack
}) {
    const [activeTab, setActiveTab] = useState("dashboard");

    const clubStats = useMemo(
        () => buildClubStats(clubName, squadData, { matches, lineupDetails, playerDetails, gkDetails }),
        [clubName, squadData, matches, lineupDetails, playerDetails, gkDetails]
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [clubName, activeTab]);

    return (
        <div className="club-details-wrap fade-in">
            <div className="club-details-header">
                <button type="button" className="club-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Back to Clubs
                </button>
                <div className="club-details-title">
                    CLUB <span className="accent">{clubName}</span>
                </div>
            </div>

            <div className="gold-line" style={{ marginBottom: "20px" }} />

            <div className="squad-subtabs-switcher club-details-tabs">
                {CLUB_TABS.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`subtab-btn ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="club-details-tab-body">
                {activeTab === "dashboard" && <ClubDetailsDashboard clubStats={clubStats} />}
                {activeTab === "players" && <ClubDetailsPlayers clubStats={clubStats} />}
                {activeTab === "season_details" && <ClubDetailsSeasonDetails clubStats={clubStats} />}
                {activeTab === "championships" && <ClubDetailsChampionships clubStats={clubStats} />}
                {activeTab === "seasons" && <ClubDetailsSeasons clubStats={clubStats} />}
            </div>
        </div>
    );
}
