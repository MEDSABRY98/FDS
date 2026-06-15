"use client";

import { useMemo, useState, useEffect } from "react";
import "./ahly_v_zamalek_player_details.css";
import PlayerOverview from "./ahly_v_zamalek_player_details_overview";
import PlayerMatchesTable from "./ahly_v_zamalek_player_details_matches";
import PlayerEventsTable from "./ahly_v_zamalek_player_details_events";
import PlayerSeasonsTable from "./ahly_v_zamalek_player_details_seasons";
import PlayerVsTeamsTable from "./ahly_v_zamalek_player_details_vs_teams";
import PlayerChampionshipsTable from "./ahly_v_zamalek_player_details_championships";
import PlayerWithPlayerTable from "./ahly_v_zamalek_player_details_player_with_player";
import PlayerWithAgainstTable from "./ahly_v_zamalek_player_details_with_against_player";
import PlayerGoalImpactTable from "./ahly_v_zamalek_player_details_goal_impact";
import PlayerAssistImpactTable from "./ahly_v_zamalek_player_details_assist_impact";
import PlayerPresenceTable from "./ahly_v_zamalek_player_details_squad_influence";
import PlayerTimingTable from "./ahly_v_zamalek_player_details_timing";
import { AhlyVZamalekService } from "../Service/ahly_v_zamalek_service";
import { AhlyVZamalekExcelExport } from "../ExportExcel/ahly_v_zamalek_export_excel";

export default function AhlyVZamalekPlayerDetails({ playerName, playerDetails, lineupDetails, masterMatches, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedComps, setSelectedComps] = useState([]);
    const [selectedSYs, setSelectedSYs] = useState([]);
    const [selectedOpps, setSelectedOpps] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 1. Calculate Player Specific Career Stats from all raw data
    const { stats, playerTeams, playerComps, playerSYs, playerOpps } = useMemo(() => {
        const summary = {
            caps: 0,
            mins: 0,
            goals: 0,
            assists: 0,
            penGoals: 0,
            penMissed: 0,
            penSaved: 0, // In derby, we treat general misses under penMissed, penSaved defaults to 0 as we don't have howPenMissed detail
            wonGoal: 0,
            wonMiss: 0,
            makeGoal: 0,
            makeMiss: 0,
            braceG: 0,
            braceA: 0,
            hatG: 0,
            hatA: 0,
            superG: 0,
            superA: 0,
            matchHistory: [],
            matchEventsHistory: [],
            seasonalStats: {},
            compStats: {},
            statsByChampSeason: {},
            statsBySY: {},
            statsByOpponent: {},
            playerWithPlayerStats: { assistsFrom: {}, assistsTo: {} },
            withPlayer: [],
            againstPlayer: [],
            impactStats: {
                presence: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cleanSheets: 0, failedToScore: 0 },
                absence: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cleanSheets: 0, failedToScore: 0 },
                careerRange: { start: "—", end: "—" }
            },
            statsByMinute: {},
            assistsByMinute: {}
        };

        if (!playerName) return { stats: summary, playerTeams: [], playerSYs: [], playerComps: [], playerOpps: [] };

        const isAhly = (t) => {
            if (!t) return false;
            const s = String(t).trim().toUpperCase();
            return s === "AHLY" || s === "الأهلي" || s === "الأهلى";
        };

        // Collect all unique teams the player represented from both appearances and events
        const teamSet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName) {
                const tv = l.TEAM || "";
                if (tv) teamSet.add(String(tv).trim());
            }
        });
        (playerDetails || []).forEach(p => {
            if (String(p["PLAYER NAME"] || "").trim() === playerName) {
                const tv = p.TEAM || "";
                if (tv) teamSet.add(String(tv).trim());
            }
        });
        const uniqueTeams = Array.from(teamSet).sort();

        const allAppearances = (lineupDetails || [])
            .filter(l => String(l["PLAYER NAME"] || "").trim() === playerName);

        // 2. Map Match Context (Champion, Season, SY)
        const matchContextMap = {};
        const allCompSet = new Set();
        (masterMatches || []).forEach(m => {
            const mId = String(m.MATCH_ID);
            const mType = String(m.CHAMPION || "Unknown").trim();
            matchContextMap[mId] = {
                champion: mType,
                season: String(m["SEASON - NAME"] || "Unknown").trim(),
                sy: String(m["SEASON - NUMBER"] || "Unknown").trim(),
                date: m.DATE || "—",
                dateVal: m.DATE ? new Date(m.DATE) : new Date(0),
                gf: parseInt(m.GF) || 0,
                ga: parseInt(m.GA) || 0,
                wdl: m["W-D-L"] || "D"
            };
            allCompSet.add(mType);
        });

        // 2.1 Calculate Dynamic Competition Options based on selected Teams
        const compSet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName && l.MATCH_ID) {
                const tv = String(l.TEAM || "").trim();
                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;

                const ct = matchContextMap[String(l.MATCH_ID)]?.champion;
                if (ct) compSet.add(ct);
            }
        });
        const uniqueComps = Array.from(compSet).sort();

        // 2.5 Extract Dynamic Seasons (SY) based on selected Teams AND Competitions
        const sySet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName && l.MATCH_ID) {
                const tv = String(l.TEAM || "").trim();
                const ctx = matchContextMap[String(l.MATCH_ID)];
                const ct = ctx?.champion;

                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;
                if (selectedComps.length > 0 && !selectedComps.includes(ct)) return;

                const sy = ctx?.sy;
                if (sy && sy !== "Unknown") sySet.add(sy);
            }
        });
        const uniqueSYs = Array.from(sySet).sort((a, b) => b.localeCompare(a));

        // 2.6 Extract Dynamic Opponents based on Team, Comp, and SY selections
        const opponentSet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName && l.MATCH_ID) {
                const tv = String(l.TEAM || "").trim();
                const ctx = matchContextMap[String(l.MATCH_ID)];
                if (!ctx) return;
                const ct = ctx.champion;
                const sy = ctx.sy;

                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;
                if (selectedComps.length > 0 && !selectedComps.includes(ct)) return;
                if (selectedSYs.length > 0 && !selectedSYs.includes(sy)) return;

                const opp = isAhly(tv) ? "ZAMALEK" : "AHLY";
                opponentSet.add(opp);
            }
        });
        const uniqueOpps = Array.from(opponentSet).sort();

        // 3. Filter Appearances & Events
        const appearances = (lineupDetails || []).filter(l => {
            if (String(l["PLAYER NAME"] || "").trim() !== playerName) return false;
            const ctx = matchContextMap[String(l.MATCH_ID)];
            if (!ctx) return false;

            if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
            if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.sy)) return false;

            const tv = String(l.TEAM || "").trim();
            if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return false;

            if (selectedOpps.length > 0) {
                const opp = isAhly(tv) ? "ZAMALEK" : "AHLY";
                if (!selectedOpps.includes(opp)) return false;
            }

            return true;
        });

        const playerEvents = (playerDetails || []).filter(p => {
            if (String(p["PLAYER NAME"] || "").trim() !== playerName) return false;
            const ctx = matchContextMap[String(p.MATCH_ID)];
            if (!ctx) return false;

            if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
            if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.sy)) return false;

            const tv = String(p.TEAM || "").trim();
            if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return false;

            if (selectedOpps.length > 0) {
                const opp = isAhly(tv) ? "ZAMALEK" : "AHLY";
                if (!selectedOpps.includes(opp)) return false;
            }

            return true;
        });

        summary.caps = appearances.length;
        summary.mins = appearances.reduce((acc, curr) => acc + (parseInt(curr["TOTAL MINUTE"] || 0) || 0), 0);

        // Map Match IDs for historical grouping
        const appearanceMatchIds = new Set(appearances.map(a => String(a.MATCH_ID)));
        const eventMatchIds = new Set(playerEvents.map(e => String(e.MATCH_ID)));
        const allRelevantMatchIds = new Set([...appearanceMatchIds, ...eventMatchIds]);

        const buildMatchData = (mId, app, mEvents) => {
            const ctx = matchContextMap[String(mId)];

            const gCount = mEvents.filter(e => {
                const type = String(e.TYPE || "").toUpperCase().trim();
                const sub = String(e.TYPE_SUB || "").toUpperCase().trim();
                return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            }).length;

            const aCount = mEvents.filter(e => {
                const type = String(e.TYPE || "").toUpperCase().trim();
                return type === "ASSIST" || type === "اسيست" || type === "صنع";
            }).length;

            const pgCount = mEvents.filter(e => String(e.TYPE_SUB || "").toUpperCase().trim() === "PENGOAL").length;
            const pmCount = mEvents.filter(e => String(e.TYPE || "").toUpperCase().trim() === "PENMISSED").length;

            let opponent = "—";
            let dateVal = new Date(0);
            if (ctx) {
                dateVal = ctx.date ? new Date(ctx.date) : new Date(0);
                const playerTeam = (app?.TEAM || mEvents[0]?.TEAM || "").trim();
                if (playerTeam) {
                    opponent = isAhly(playerTeam) ? "ZAMALEK" : "AHLY";
                }
            }

            // Determine result based on player's side in this match
            let matchWDL = 'D';
            if (ctx) {
                const playerTeam = (app?.TEAM || mEvents[0]?.TEAM || "").trim();
                const isAhlySide = isAhly(playerTeam);
                if (ctx.gf > ctx.ga) {
                    matchWDL = isAhlySide ? 'W' : 'L';
                } else if (ctx.gf < ctx.ga) {
                    matchWDL = isAhlySide ? 'L' : 'W';
                }
            }

            return {
                id: mId,
                date: ctx?.date || "—",
                dateVal,
                season: ctx?.season || "Unknown",
                sy: ctx?.sy || "Unknown",
                champion: ctx?.champion || "Unknown",
                opponent: opponent,
                role: app ? app.STATU : "Actions Only",
                mins: app ? (parseInt(app["TOTAL MINUTE"]) || 0) : 0,
                goals: gCount,
                assists: aCount,
                penGoals: pgCount,
                penMissed: pmCount,
                penSaved: 0,
                wonGoal: mEvents.filter(e => String(e.TYPE || "").toUpperCase().trim() === "PENASSISTGOAL").length,
                wonMiss: mEvents.filter(e => String(e.TYPE || "").toUpperCase().trim() === "PENASSISTMISSED").length,
                makeGoal: mEvents.filter(e => String(e.TYPE || "").toUpperCase().trim() === "PENMAKEGOAL").length,
                makeMiss: 0,
                wdl: matchWDL,
                allEvents: mEvents
            };
        };

        // 4. Build Match Data Map and Aggregate Stats (One Single Loop)
        const matchDataMap = {};
        allRelevantMatchIds.forEach(mId => {
            const ctx = matchContextMap[String(mId)];
            const app = appearances.find(a => String(a.MATCH_ID) === String(mId));
            const mEvents = playerEvents.filter(e => String(e.MATCH_ID) === String(mId));
            const data = buildMatchData(mId, app, mEvents);
            matchDataMap[mId] = data;

            // --- Aggregate Minutes Tracking ---
            mEvents.forEach(e => {
                const type = String(e.TYPE || "").toUpperCase().trim();
                const sub = String(e.TYPE_SUB || "").toUpperCase().trim();
                const isGoal = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
                const isAssist = type === "ASSIST" || type === "اسيست" || type === "صنع";

                if (isGoal) {
                    const min = String(e.MINUTE || "").trim();
                    if (min) {
                        summary.statsByMinute[min] = (summary.statsByMinute[min] || 0) + 1;
                    }
                }
                if (isAssist) {
                    const min = String(e.MINUTE || "").trim();
                    if (min) {
                        summary.assistsByMinute[min] = (summary.assistsByMinute[min] || 0) + 1;
                    }
                }
            });

            // Global Totals
            summary.goals += data.goals;
            summary.assists += data.assists;
            summary.penGoals += data.penGoals;
            summary.penMissed += data.penMissed;
            summary.wonGoal += data.wonGoal;
            summary.wonMiss += data.wonMiss;
            summary.makeGoal += data.makeGoal;

            // Multiple goals/assists check
            if (data.goals === 2) summary.braceG += 1;
            else if (data.goals === 3) summary.hatG += 1;
            else if (data.goals >= 4) summary.superG += 1;

            if (data.assists === 2) summary.braceA += 1;
            else if (data.assists === 3) summary.hatA += 1;
            else if (data.assists >= 4) summary.superA += 1;

            // Aggregate by Season (SY) and Competition
            const syKey = data.sy || "Unknown";
            const sKey = data.season || "Unknown";
            const cKey = data.champion || "Unknown";

            if (!summary.seasonalStats[syKey]) summary.seasonalStats[syKey] = { apps: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
            const ss = summary.seasonalStats[syKey];
            if (app) ss.apps += 1;
            ss.goals += data.goals;
            ss.assists += data.assists;
            ss.penGoals += data.penGoals;
            ss.penMissed += data.penMissed;

            // Stats by Season Number (SY) for dedicated tab
            if (!summary.statsBySY[syKey]) summary.statsBySY[syKey] = { apps: 0, mins: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
            const syStats = summary.statsBySY[syKey];
            if (app) { syStats.apps += 1; syStats.mins += data.mins; }
            syStats.goals += data.goals;
            syStats.assists += data.assists;
            syStats.penGoals += data.penGoals;
            syStats.penMissed += data.penMissed;

            if (!summary.compStats[cKey]) summary.compStats[cKey] = { apps: 0, wins: 0, draws: 0, losses: 0, mins: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
            const csGlobal = summary.compStats[cKey];
            if (app) {
                csGlobal.apps += 1;
                csGlobal.mins += data.mins;
                if (data.wdl === 'W') csGlobal.wins += 1;
                else if (data.wdl === 'L') csGlobal.losses += 1;
                else csGlobal.draws += 1;
            }
            csGlobal.goals += data.goals;
            csGlobal.assists += data.assists;
            csGlobal.penGoals += data.penGoals;
            csGlobal.penMissed += data.penMissed;

            // Stats By Champ and Season
            if (!summary.statsByChampSeason[cKey]) summary.statsByChampSeason[cKey] = {};
            if (!summary.statsByChampSeason[cKey][sKey]) summary.statsByChampSeason[cKey][sKey] = { apps: 0, mins: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
            const cs = summary.statsByChampSeason[cKey][sKey];
            if (app) { cs.apps += 1; cs.mins += data.mins; }
            cs.goals += data.goals;
            cs.assists += data.assists;
            cs.penGoals += data.penGoals;
            cs.penMissed += data.penMissed;

            // Stats By Opponent
            if (data.opponent !== "—") {
                if (!summary.statsByOpponent[data.opponent]) summary.statsByOpponent[data.opponent] = { apps: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
                const opp = summary.statsByOpponent[data.opponent];
                if (app) opp.apps += 1;
                opp.goals += data.goals;
                opp.assists += data.assists;
                opp.penGoals += data.penGoals;
                opp.penMissed += data.penMissed;
            }

            // --- Player with Player (Assist Partnerships) ---
            const allMatchEvents = (playerDetails || []).filter(p => String(p.MATCH_ID) === String(mId));

            // 1. Assists TO current player
            mEvents.filter(e => {
                const type = String(e.TYPE || "").toUpperCase().trim();
                const sub = String(e.TYPE_SUB || "").toUpperCase().trim();
                return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            }).forEach(goal => {
                const gId = String(goal.EVENT_ID);
                const pId = String(goal.PARENT_EVENT_ID || "");

                const assistEvent = allMatchEvents.find(ae => {
                    const aeType = String(ae.TYPE || "").toUpperCase().trim();
                    const isAssist = aeType === "ASSIST" || aeType === "اسيست" || aeType === "صنع";
                    if (!isAssist || String(ae["PLAYER NAME"]).trim() === playerName) return false;

                    if (pId && String(ae.EVENT_ID) === pId) return true;
                    if (String(ae.PARENT_EVENT_ID) === gId) return true;
                    return false;
                });

                if (assistEvent) {
                    const partner = String(assistEvent["PLAYER NAME"] || "").trim();
                    summary.playerWithPlayerStats.assistsFrom[partner] = (summary.playerWithPlayerStats.assistsFrom[partner] || 0) + 1;
                }
            });

            // 2. Assists FROM current player
            mEvents.filter(e => {
                const type = String(e.TYPE || "").toUpperCase().trim();
                return type === "ASSIST" || type === "اسيست" || type === "صنع";
            }).forEach(assist => {
                const aId = String(assist.EVENT_ID);
                const pId = String(assist.PARENT_EVENT_ID || "");

                const goalEvent = allMatchEvents.find(ae => {
                    const aeType = String(ae.TYPE || "").toUpperCase().trim();
                    const aeSub = String(ae.TYPE_SUB || "").toUpperCase().trim();
                    const isGoal = aeType === "GOAL" || aeType === "هدف" || aeSub === "PENGOAL" || aeSub === "هدف جزاء";
                    if (!isGoal || String(ae["PLAYER NAME"]).trim() === playerName) return false;

                    if (pId && String(ae.EVENT_ID) === pId) return true;
                    if (String(ae.PARENT_EVENT_ID) === aId) return true;
                    return false;
                });

                if (goalEvent) {
                    const partner = String(goalEvent["PLAYER NAME"] || "").trim();
                    summary.playerWithPlayerStats.assistsTo[partner] = (summary.playerWithPlayerStats.assistsTo[partner] || 0) + 1;
                }
            });

            // --- Presence Impact (Team Performance with Player) ---
            if (app) {
                const playerMatchTeam = (app?.TEAM || mEvents[0]?.TEAM || "").trim();
                const isAhlySide = isAhly(playerMatchTeam);

                const pSideGF = isAhlySide ? ctx.gf : ctx.ga;
                const pSideGA = isAhlySide ? ctx.ga : ctx.gf;

                summary.impactStats.presence.matches += 1;
                summary.impactStats.presence.gf += pSideGF;
                summary.impactStats.presence.ga += pSideGA;
                if (pSideGA === 0) summary.impactStats.presence.cleanSheets += 1;
                if (pSideGF === 0) summary.impactStats.presence.failedToScore += 1;

                if (pSideGF > pSideGA) summary.impactStats.presence.wins += 1;
                else if (pSideGF < pSideGA) summary.impactStats.presence.losses += 1;
                else summary.impactStats.presence.draws += 1;
            }
        });

        // --- Calculate Teammate (With Player) & Opponent (Against Player) statistics ---
        const withPlayerMap = {};
        const againstPlayerMap = {};

        appearances.forEach(app => {
            const mId = String(app.MATCH_ID);
            const playerTeam = String(app.TEAM || "").trim();
            const ctx = matchContextMap[mId];
            if (!ctx) return;

            // Determine outcome from our player's perspective
            let outcome = 'D';
            const isAhlySide = isAhly(playerTeam);
            if (ctx.gf > ctx.ga) {
                outcome = isAhlySide ? 'W' : 'L';
            } else if (ctx.gf < ctx.ga) {
                outcome = isAhlySide ? 'L' : 'W';
            }

            // Find all lineup players in this match
            const matchLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === mId);
            matchLineup.forEach(l => {
                const otherName = String(l["PLAYER NAME"] || "").trim();
                if (!otherName || otherName === playerName) return;

                const otherTeam = String(l.TEAM || "").trim();
                const isSameTeam = (isAhly(playerTeam) && isAhly(otherTeam)) || (!isAhly(playerTeam) && !isAhly(otherTeam));

                if (isSameTeam) {
                    if (!withPlayerMap[otherName]) {
                        withPlayerMap[otherName] = { name: otherName, matches: 0, wins: 0, draws: 0, losses: 0 };
                    }
                    withPlayerMap[otherName].matches += 1;
                    if (outcome === 'W') withPlayerMap[otherName].wins += 1;
                    else if (outcome === 'D') withPlayerMap[otherName].draws += 1;
                    else if (outcome === 'L') withPlayerMap[otherName].losses += 1;
                } else {
                    if (!againstPlayerMap[otherName]) {
                        againstPlayerMap[otherName] = { name: otherName, matches: 0, wins: 0, draws: 0, losses: 0 };
                    }
                    againstPlayerMap[otherName].matches += 1;
                    if (outcome === 'W') againstPlayerMap[otherName].wins += 1;
                    else if (outcome === 'D') againstPlayerMap[otherName].draws += 1;
                    else if (outcome === 'L') againstPlayerMap[otherName].losses += 1;
                }
            });
        });

        summary.withPlayer = Object.values(withPlayerMap);
        summary.againstPlayer = Object.values(againstPlayerMap);

        // --- Absence Impact (Team Performance within Career Range) ---
        const careerDates = allAppearances.map(l => {
            const ctx = matchContextMap[String(l.MATCH_ID)];
            return ctx && ctx.dateVal && ctx.dateVal.getTime() > 0 ? ctx.dateVal.getTime() : null;
        }).filter(Boolean);

        if (careerDates.length > 0) {
            const minDate = Math.min(...careerDates);
            const maxDate = Math.max(...careerDates);

            // Let's decide which team this player likely represented in the derby
            // If they played for AHLY in their appearances, their team is AHLY. Otherwise ZAMALEK.
            const primaryTeam = appearances[0]?.TEAM || "AHLY";

            (masterMatches || []).forEach(m => {
                const mctx = matchContextMap[String(m.MATCH_ID)];
                if (!mctx || !mctx.dateVal || mctx.dateVal.getTime() < minDate || mctx.dateVal.getTime() > maxDate) return;

                if (appearanceMatchIds.has(String(m.MATCH_ID))) return;

                if (selectedComps.length > 0 && !selectedComps.includes(mctx.champion)) return;
                if (selectedSYs.length > 0 && !selectedSYs.includes(mctx.sy)) return;

                const gfSide = isAhly(primaryTeam) ? mctx.gf : mctx.ga;
                const gaSide = isAhly(primaryTeam) ? mctx.ga : mctx.gf;

                summary.impactStats.absence.matches += 1;
                summary.impactStats.absence.gf += gfSide;
                summary.impactStats.absence.ga += gaSide;
                if (gaSide === 0) summary.impactStats.absence.cleanSheets += 1;
                if (gfSide === 0) summary.impactStats.absence.failedToScore += 1;

                if (gfSide > gaSide) summary.impactStats.absence.wins += 1;
                else if (gfSide < gaSide) summary.impactStats.absence.losses += 1;
                else summary.impactStats.absence.draws += 1;
            });

            const firstMatch = allAppearances.find(l => matchContextMap[String(l.MATCH_ID)]?.dateVal?.getTime() === minDate);
            const lastMatch = allAppearances.find(l => matchContextMap[String(l.MATCH_ID)]?.dateVal?.getTime() === maxDate);
            summary.impactStats.careerRange = {
                start: matchContextMap[String(firstMatch?.MATCH_ID)]?.date || "—",
                end: matchContextMap[String(lastMatch?.MATCH_ID)]?.date || "—"
            };
        }

        const rawHistory = Object.values(matchDataMap).filter(d => appearanceMatchIds.has(d.id));
        const matchEventsList = Object.values(matchDataMap).filter(d => eventMatchIds.has(d.id));

        summary.matchHistory = rawHistory.sort((a, b) => b.dateVal - a.dateVal);
        summary.matchEventsHistory = matchEventsList.sort((a, b) => b.dateVal - a.dateVal);

        summary.goalFreq = summary.goals > 0 ? Math.round(summary.mins / summary.goals) : 0;
        summary.gaContribution = summary.caps > 0 ? ((summary.goals + summary.assists) / summary.caps).toFixed(2) : 0;

        return { stats: summary, playerTeams: uniqueTeams, playerComps: uniqueComps, playerSYs: uniqueSYs, playerOpps: uniqueOpps };
    }, [playerName, playerDetails, lineupDetails, masterMatches, selectedTeams, selectedComps, selectedSYs, selectedOpps]);

    useEffect(() => {
        const handleGlobalExport = () => {
            handleExport();
        };
        window.addEventListener('avz-export-excel', handleGlobalExport);
        return () => window.removeEventListener('avz-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = async () => {
        let exportData = [];
        let filename = `Derby_${playerName}_${activeTab}`;

        switch (activeTab) {
            case 'overview':
                exportData = [
                    { "METRIC": "Matches", "VALUE": stats.caps },
                    { "METRIC": "Minutes", "VALUE": stats.mins },
                    { "METRIC": "Goals", "VALUE": stats.goals },
                    { "METRIC": "Assists", "VALUE": stats.assists },
                    { "METRIC": "G+A Contribution", "VALUE": stats.gaContribution },
                    { "METRIC": "Goal Frequency (Mins/G)", "VALUE": stats.goalFreq }
                ];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1,
                    "MATCH ID": m.id,
                    "DATE": m.date,
                    "SEASON": m.season,
                    "OPPONENT": m.opponent,
                    "STATUS": m.role === 'اساسي' ? 'Starter' : 'Sub',
                    "TIME": `${m.mins}'`,
                    "G": m.goals,
                    "A": m.assists,
                    "W-D-L": m.wdl
                }));
                break;
            case 'match_events':
                exportData = stats.matchEventsHistory.map((m, i) => ({
                    "#": i + 1,
                    "MATCH ID": m.id,
                    "DATE": m.date,
                    "SEASON": m.season,
                    "OPPONENT": m.opponent,
                    "STATUS": m.role === 'اساسي' ? 'Starter' : 'Sub',
                    "TIME": `${m.mins}'`,
                    "G": m.goals,
                    "A": m.assists,
                    "P-G": m.penGoals,
                    "P-M": m.penMissed,
                    "W-P(G)": m.wonGoal,
                    "W-P(M)": m.wonMiss,
                    "C-P(G)": m.makeGoal
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).sort().map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "APPS": s.apps, "MINS": s.mins, "W": s.wins, "D": s.draws, "L": s.losses, "G": s.goals, "A": s.assists, "P-G": s.penGoals };
                });
                break;
            case 'season_name':
                exportData = [];
                Object.keys(stats.statsByChampSeason).sort().forEach(comp => {
                    Object.keys(stats.statsByChampSeason[comp]).sort().forEach(season => {
                        const s = stats.statsByChampSeason[comp][season];
                        exportData.push({ "CHAMPION": comp, "SEASON": season, "APPS": s.apps, "MINS": s.mins, "G": s.goals, "A": s.assists, "P-G": s.penGoals });
                    });
                });
                break;
            case 'season_number':
                exportData = Object.keys(stats.statsBySY).sort((a, b) => b.localeCompare(a)).map((sy, i) => {
                    const s = stats.statsBySY[sy];
                    return { "#": i + 1, "SY": sy, "APPS": s.apps, "MINS": s.mins, "G": s.goals, "A": s.assists, "P-G": s.penGoals, "P-M": s.penMissed };
                });
                break;
            case 'vs_teams':
                exportData = Object.keys(stats.statsByOpponent).sort((a, b) => stats.statsByOpponent[b].apps - stats.statsByOpponent[a].apps).map((opp, i) => {
                    const s = stats.statsByOpponent[opp];
                    return { "#": i + 1, "OPPONENT": opp, "APPS": s.apps, "G": s.goals, "A": s.assists, "P-G": s.penGoals, "P-M": s.penMissed };
                });
                break;
             case 'player_with_player':
                const allPartners = Array.from(new Set([...Object.keys(stats.playerWithPlayerStats.assistsFrom), ...Object.keys(stats.playerWithPlayerStats.assistsTo)]));
                exportData = allPartners.map((p, i) => ({
                    "#": i + 1, "PARTNER NAME": p, "ASSISTS FROM": stats.playerWithPlayerStats.assistsFrom[p] || 0, "ASSISTS TO": stats.playerWithPlayerStats.assistsTo[p] || 0, "TOTAL": (stats.playerWithPlayerStats.assistsFrom[p] || 0) + (stats.playerWithPlayerStats.assistsTo[p] || 0)
                })).sort((a, b) => b.TOTAL - a.TOTAL);
                break;
            case 'with_player':
                exportData = stats.withPlayer.map((p, i) => ({
                    "#": i + 1,
                    "PLAYER NAME": p.name,
                    "MATCHES": p.matches,
                    "WINS": p.wins,
                    "DRAWS": p.draws,
                    "LOSSES": p.losses,
                    "WIN RATE (%)": p.matches > 0 ? ((p.wins / p.matches) * 100).toFixed(1) : 0
                })).sort((a, b) => b.MATCHES - a.MATCHES);
                break;
            case 'against_player':
                exportData = stats.againstPlayer.map((p, i) => ({
                    "#": i + 1,
                    "PLAYER NAME": p.name,
                    "MATCHES": p.matches,
                    "WINS": p.wins,
                    "DRAWS": p.draws,
                    "LOSSES": p.losses,
                    "WIN RATE (%)": p.matches > 0 ? ((p.wins / p.matches) * 100).toFixed(1) : 0
                })).sort((a, b) => b.MATCHES - a.MATCHES);
                break;
            case 'goal_impact':
                const gImpact = await AhlyVZamalekService.getPlayerGoalImpact(playerName);
                const gFilteredIds = new Set(stats.matchHistory.map(m => String(m.id).trim()));
                exportData = gImpact.impactMatches
                    .filter(item => gFilteredIds.has(String(item.match.MATCH_ID).trim()))
                    .map((item, i) => ({
                        "#": i + 1,
                        "DATE": item.match.DATE,
                        "SEASON NAME": item.match["SEASON - NAME"],
                        "OPPONENT": item.match.OPPONENT_TEAM || (isAhly(item.match.AHLY) ? "ZAMALEK" : "AHLY"),
                        "SCORE": `${item.match.GF} - ${item.match.GA}`,
                        "GOAL MINS": item.playerMins ? item.playerMins.join(", ") + "'" : "—",
                        "IMPACT TYPE": item.type,
                        "RESULT": item.match["W-D-L"] === 'W' ? 'WIN' : 'DRAW'
                    }));
                break;
            case 'assist_impact':
                const aImpact = await AhlyVZamalekService.getPlayerAssistImpact(playerName);
                const aFilteredIds = new Set(stats.matchHistory.map(m => String(m.id).trim()));
                exportData = aImpact.impactMatches
                    .filter(item => aFilteredIds.has(String(item.match.MATCH_ID).trim()))
                    .map((item, i) => ({
                        "#": i + 1,
                        "DATE": item.match.DATE,
                        "SEASON NAME": item.match["SEASON - NAME"],
                        "OPPONENT": item.match.OPPONENT_TEAM || (isAhly(item.match.AHLY) ? "ZAMALEK" : "AHLY"),
                        "SCORE": `${item.match.GF} - ${item.match.GA}`,
                        "ASSIST MINS": item.playerMins ? item.playerMins.join(", ") + "'" : "—",
                        "IMPACT TYPE": item.type,
                        "RESULT": item.match["W-D-L"] === 'W' ? 'WIN' : 'DRAW'
                    }));
                break;
            case 'presence':
                const pres = stats.impactStats.presence;
                const abs = stats.impactStats.absence;
                exportData = [
                    { "TYPE": "PRESENCE", "METRIC": "Matches", "VALUE": pres.matches },
                    { "TYPE": "PRESENCE", "METRIC": "Wins", "VALUE": pres.wins },
                    { "TYPE": "PRESENCE", "METRIC": "Draws", "VALUE": pres.draws },
                    { "TYPE": "PRESENCE", "METRIC": "Losses", "VALUE": pres.losses },
                    { "TYPE": "PRESENCE", "METRIC": "Win Rate (%)", "VALUE": pres.matches > 0 ? ((pres.wins / pres.matches) * 100).toFixed(1) : 0 },
                    { "TYPE": "ABSENCE", "METRIC": "Matches", "VALUE": abs.matches },
                    { "TYPE": "ABSENCE", "METRIC": "Wins", "VALUE": abs.wins },
                    { "TYPE": "ABSENCE", "METRIC": "Draws", "VALUE": abs.draws },
                    { "TYPE": "ABSENCE", "METRIC": "Losses", "VALUE": abs.losses },
                    { "TYPE": "ABSENCE", "METRIC": "Win Rate (%)", "VALUE": abs.matches > 0 ? ((abs.wins / abs.matches) * 100).toFixed(1) : 0 }
                ];
                break;
        }

        if (exportData.length > 0) {
            AhlyVZamalekExcelExport.exportToExcel(exportData, filename);
        }
    };

    if (!playerName) return null;


    const renderEventsCell = (m) => {
        const hasEvents = (m.goals > 0 || m.assists > 0 || m.penGoals > 0 || m.penMissed > 0 || m.wonGoal > 0 || m.wonMiss > 0 || m.makeGoal > 0);

        return (
            <div className="m-stats-cell" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                {m.goals > 0 && <div className="m-mini-pill mini-g" title="Goals">{m.goals}G</div>}
                {m.assists > 0 && <div className="m-mini-pill mini-a" title="Assists">{m.assists}A</div>}
                {m.penGoals > 0 && <div className="m-mini-pill" style={{ background: '#27ae60', color: '#fff' }} title="Penalty Goal">{m.penGoals} P-G</div>}
                {m.penMissed > 0 && <div className="m-mini-pill" style={{ background: '#e74c3c', color: '#fff' }} title="Penalty Missed">{m.penMissed} P-M</div>}
                {m.wonGoal > 0 && <div className="m-mini-pill" style={{ background: '#2ecc71', color: '#fff' }} title="Penalty Won (Scored)">{m.wonGoal} W-P(G)</div>}
                {m.wonMiss > 0 && <div className="m-mini-pill" style={{ border: '1px solid #2ecc71', color: '#2ecc71', background: 'transparent' }} title="Penalty Won (Missed)">{m.wonMiss} W-P(M)</div>}
                {m.makeGoal > 0 && <div className="m-mini-pill" style={{ background: '#9b59b6', color: '#fff' }} title="Penalty Committed (Scored)">{m.makeGoal} C-P(G)</div>}
                {!hasEvents && <span style={{ color: '#eee' }}>—</span>}
            </div>
        );
    };

    return (
        <div className="player-details-container">
            {/* Header Section */}
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}>
                        <span>←</span> All Players
                    </button>
                    <div className="name-and-teams" style={{ display: 'flex', alignItems: 'center', gap: '25px', flexWrap: 'wrap' }}>
                        <h1 className="player-main-name" style={{ margin: 0 }}>
                            {playerName.split(' ').slice(0, -1).join(' ')} <span>{playerName.split(' ').slice(-1)}</span>
                        </h1>
                    </div>
                </div>

                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button className="advanced-filter-btn" onClick={() => setIsFilterModalOpen(true)}>
                        ADVANCED FILTERS
                    </button>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--player-gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.caps}</div>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <div className="p-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="p-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-modal-header">
                            <h2>ADVANCED FILTERS</h2>
                            <button className="p-close-btn" onClick={() => setIsFilterModalOpen(false)}>×</button>
                        </div>
                        <div className="p-modal-body">
                            {/* Team Filters */}
                            <div className="filter-group">
                                <label>TEAMS REPRESENTED</label>
                                <div className="checkbox-grid">
                                    {playerTeams.map(team => (
                                        <div key={team} className={`check-item ${selectedTeams.includes(team) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedTeams.includes(team)) setSelectedTeams(selectedTeams.filter(t => t !== team));
                                                else setSelectedTeams([...selectedTeams, team]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{team}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Competition Filters */}
                            <div className="filter-group">
                                <label>COMPETITIONS</label>
                                <div className="checkbox-grid">
                                    {playerComps.map(comp => (
                                        <div key={comp} className={`check-item ${selectedComps.includes(comp) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedComps.includes(comp)) setSelectedComps(selectedComps.filter(c => c !== comp));
                                                else setSelectedComps([...selectedComps, comp]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{comp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Season Filters */}
                            <div className="filter-group">
                                <label>SEASONS (SY)</label>
                                <div className="checkbox-grid">
                                    {playerSYs.map(sy => (
                                        <div key={sy} className={`check-item ${selectedSYs.includes(sy) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedSYs.includes(sy)) setSelectedSYs(selectedSYs.filter(s => s !== sy));
                                                else setSelectedSYs([...selectedSYs, sy]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{sy}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Opponent Filters */}
                            <div className="filter-group">
                                <label>OPPONENTS FACED</label>
                                <div className="checkbox-grid">
                                    {playerOpps.map(opp => (
                                        <div key={opp} className={`check-item ${selectedOpps.includes(opp) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (selectedOpps.includes(opp)) setSelectedOpps(selectedOpps.filter(o => o !== opp));
                                                else setSelectedOpps([...selectedOpps, opp]);
                                            }}>
                                            <div className="custom-check"></div>
                                            <span>{opp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-modal-footer">
                            <button className="clear-btn" onClick={() => { setSelectedTeams([]); setSelectedComps([]); setSelectedSYs([]); setSelectedOpps([]); }}>CLEAR ALL</button>
                            <button className="apply-btn" onClick={() => setIsFilterModalOpen(false)}>APPLY FILTERS</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Equal Width Tabs Navigation */}
            <div className="player-details-tabs">
                <div className={`player-tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <span className="tab-title">OVERVIEW</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'presence' ? 'active' : ''}`} onClick={() => setActiveTab('presence')}>
                    <span className="tab-title">SQUAD INFLUENCE</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'goal_impact' ? 'active' : ''}`} onClick={() => setActiveTab('goal_impact')}>
                    <span className="tab-title">GOAL IMPACT</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'assist_impact' ? 'active' : ''}`} onClick={() => setActiveTab('assist_impact')}>
                    <span className="tab-title">ASSIST IMPACT</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'timing' ? 'active' : ''}`} onClick={() => setActiveTab('timing')}>
                    <span className="tab-title">TIMING</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
                    <span className="tab-title">MATCHES</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'match_events' ? 'active' : ''}`} onClick={() => setActiveTab('match_events')}>
                    <span className="tab-title">MATCH EVENTS</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'championships' ? 'active' : ''}`} onClick={() => setActiveTab('championships')}>
                    <span className="tab-title">CHAMPIONSHIPS</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'seasons' ? 'active' : ''}`} onClick={() => setActiveTab('seasons')}>
                    <span className="tab-title">SEASONS</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'vs_teams' ? 'active' : ''}`} onClick={() => setActiveTab('vs_teams')}>
                    <span className="tab-title">VS TEAMS</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'player_with_player' ? 'active' : ''}`} onClick={() => setActiveTab('player_with_player')}>
                    <span className="tab-title">P W P ASSISTS</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'with_player' ? 'active' : ''}`} onClick={() => setActiveTab('with_player')}>
                    <span className="tab-title">WITH PLAYER</span>
                </div>
                <div className={`player-tab-item ${activeTab === 'against_player' ? 'active' : ''}`} onClick={() => setActiveTab('against_player')}>
                    <span className="tab-title">AGAINST PLAYER</span>
                </div>
            </div>

            {activeTab === 'overview' && (
                <PlayerOverview
                    stats={stats}
                    goalFreq={stats.goalFreq}
                    gaContribution={stats.gaContribution}
                />
            )}


            {activeTab === 'matches' && (
                <PlayerMatchesTable
                    stats={stats}
                    playerName={playerName}
                    playerDetails={playerDetails}
                    renderEventsCell={renderEventsCell}
                />
            )}

            {activeTab === 'championships' && (
                <PlayerChampionshipsTable stats={stats} />
            )}

            {activeTab === 'match_events' && (
                <PlayerEventsTable
                    stats={stats}
                    renderEventsCell={renderEventsCell}
                />
            )}

            {activeTab === 'seasons' && (
                <PlayerSeasonsTable
                    stats={stats}
                />
            )}

            {activeTab === 'vs_teams' && (
                <PlayerVsTeamsTable
                    stats={stats}
                />
            )}

            {activeTab === 'player_with_player' && (
                <PlayerWithPlayerTable
                    stats={stats}
                />
            )}

            {activeTab === 'with_player' && (
                <PlayerWithAgainstTable
                    data={stats.withPlayer}
                    title="PLAYED ALONGSIDE (WITH PLAYER)"
                    isAgainst={false}
                />
            )}

            {activeTab === 'against_player' && (
                <PlayerWithAgainstTable
                    data={stats.againstPlayer}
                    title="PLAYED AGAINST (AGAINST PLAYER)"
                    isAgainst={true}
                />
            )}

            {activeTab === 'goal_impact' && (
                <PlayerGoalImpactTable
                    playerName={playerName}
                    filteredMatches={stats.matchHistory}
                />
            )}

            {activeTab === 'assist_impact' && (
                <PlayerAssistImpactTable
                    playerName={playerName}
                    filteredMatches={stats.matchHistory}
                />
            )}

            {activeTab === 'timing' && (
                <PlayerTimingTable
                    stats={stats}
                />
            )}

            {activeTab === 'presence' && (
                <PlayerPresenceTable
                    impactStats={stats.impactStats}
                    masterMatches={masterMatches}
                    lineupDetails={lineupDetails}
                    playerName={playerName}
                />
            )}

            <style jsx>{`
                .advanced-filter-btn { background: rgba(201, 168, 76, 0.1); border: 1px solid var(--player-gold); color: var(--player-gold); padding: 12px 24px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 700; font-size: 11px; cursor: pointer; transition: 0.3s; }
                .advanced-filter-btn:hover { background: var(--player-gold); color: #000; box-shadow: 0 0 20px rgba(201,168,76,0.2); }
                .p-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
                .p-modal-content { background: #fff; border: 1px solid #eee; width: 90%; max-width: 700px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.1); animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes modalPop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .p-modal-header { padding: 25px 35px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
                .p-modal-header h2 { font-family: 'Bebas Neue'; color: #000; letter-spacing: 2px; margin: 0; font-size: 24px; }
                .p-close-btn { background: none; border: none; color: #999; font-size: 32px; cursor: pointer; transition: 0.3s; }
                .p-close-btn:hover { color: #000; }
                .p-modal-body { padding: 35px; max-height: 60vh; overflow-y: auto; }
                .p-modal-body::-webkit-scrollbar { width: 5px; }
                .p-modal-body::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                .filter-group { margin-bottom: 35px; }
                .filter-group label { display: block; color: var(--player-gold); font-family: 'Space Mono'; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; opacity: 1; }
                .checkbox-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                .check-item { background: #f9f9f9; padding: 14px 20px; border-radius: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s; border: 1px solid #eee; }
                .check-item:hover { background: #f0f0f0; border-color: #ddd; }
                .check-item.active { background: rgba(201, 168, 76, 0.05); border-color: var(--player-gold); }
                .custom-check { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; position: relative; transition: 0.2s; background: #fff; }
                .check-item.active .custom-check { border-color: var(--player-gold); background: var(--player-gold); }
                .check-item.active .custom-check::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -52%); color: #000; font-size: 12px; font-weight: 900; }
                .check-item span { color: #333; font-size: 13px; font-weight: 600; font-family: 'Outfit'; }
                .p-modal-footer { padding: 25px 35px; background: #fafafa; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 20px; }
                .clear-btn { background: none; border: none; color: #999; font-family: 'Space Mono'; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .clear-btn:hover { color: #333; }
                .apply-btn { background: var(--player-gold); color: #000; border: none; padding: 12px 35px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .apply-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(201,168,76,0.15); }
            `}</style>
        </div>
    );
}
