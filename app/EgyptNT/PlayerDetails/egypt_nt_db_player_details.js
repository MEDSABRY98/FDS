"use client";

import { useMemo, useState, useEffect } from "react";
import "../../Alahly/PlayerDetails/alahly_db_player_details.css"; // Reuse Al Ahly player details css styles
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import NoData_db from "../../lib/NoData_db";

// Import clean, modular subcomponents
import PlayerOverview from "./egypt_nt_db_player_details_overview";
import PlayerDashboard from "./egypt_nt_db_player_details_dashboard";
import PlayerMatchesTable from "./egypt_nt_db_player_details_matches";
import PlayerEventsTable from "./egypt_nt_db_player_details_events";
import PlayerSeasonsTable from "./egypt_nt_db_player_details_seasons";
import PlayerVsTeamsTable from "./egypt_nt_db_player_details_vs_teams";
import PlayerVsGksTable from "./egypt_nt_db_player_details_vs_gks";
import PlayerChampionshipsTable from "./egypt_nt_db_player_details_championships";
import PlayerWithPlayerTable from "./egypt_nt_db_player_details_player_with_player";
import PlayerGoalImpactTable from "./egypt_nt_db_player_details_goal_impact";
import PlayerAssistImpactTable from "./egypt_nt_db_player_details_assist_impact";
import PlayerPresenceTable from "./egypt_nt_db_player_details_squad_influence";
import PlayerTimingTable from "./egypt_nt_db_player_details_timing";
import { computePlayerGoalImpact } from "./egypt_nt_db_player_details_goal_impact";
import { computePlayerAssistImpact } from "./egypt_nt_db_player_details_assist_impact";
import { gkRowLinksEventId } from "../../Database";

export default function EgyptNTPlayerDetails({ playerName, playerDetails, lineupDetails, masterMatches, gkDetails, howPenMissed, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [seasonLimit, setSeasonLimit] = useState('');
    const [isCompOpen, setIsCompOpen] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedComps, setSelectedComps] = useState([]);
    const [selectedSYs, setSelectedSYs] = useState([]); // Selected seasons (using SEASON column)
    const [selectedOpps, setSelectedOpps] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 1. Calculate career stats
    const { stats, playerTeams, playerComps, playerSYs, playerOpps } = useMemo(() => {
        const summary = {
            caps: 0,
            mins: 0,
            goals: 0,
            assists: 0,
            penGoals: 0,
            penMissed: 0,
            penSaved: 0,
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
            goalImpact: { winImpact: 0, drawImpact: 0, impactMatches: [] },
            assistImpact: { winImpact: 0, drawImpact: 0, impactMatches: [] },
            opponentByMatchId: {},
            seasonalStats: {},
            compStats: {},
            statsByChampSeason: {},
            statsByOpponent: {},
            statsByGK: {},
            playerWithPlayerStats: { assistsFrom: {}, assistsTo: {} },
            impactStats: { 
                presence: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cleanSheets: 0, failedToScore: 0, playerGoals: 0, playerAssists: 0 },
                absence: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cleanSheets: 0, failedToScore: 0, playerGoals: 0, playerAssists: 0 },
                careerRange: { start: "—", end: "—" }
            },
            statsByMinute: {},
            assistsByMinute: {}
        };

        if (!playerName) return { stats: summary, playerTeams: [], playerComps: [], playerSYs: [], playerOpps: [] };

        const normalizeTeamLabel = (value) => String(value || "").trim().toLowerCase();

        const isEgyptSide = (teamValue, ctx) => {
            if (!ctx) return false;
            const name = String(teamValue || "").trim();
            if (!name) return false;

            const opponentTeam = String(ctx.oppT || "").trim();
            const egyptTeamName = String(ctx.egyptT || "منتخب مصر").trim();
            const normalizedName = normalizeTeamLabel(name);

            if (opponentTeam && normalizedName === normalizeTeamLabel(opponentTeam)) return false;
            if (normalizedName === "opponent" && opponentTeam) return false;

            const egyptIdentifiers = new Set(
                ["مصر", "egypt", "منتخب مصر", "المنتخب المصري", egyptTeamName]
                    .filter(Boolean)
                    .map(normalizeTeamLabel)
            );

            return egyptIdentifiers.has(normalizedName);
        };

        const getMatchSideTeam = (record) => {
            if (!record) return "";
            return String(record.TEAM || record["TEAM NAME"] || record.Team || "").trim();
        };

        const resolveOpponent = (ctx, sideTeam) => {
            if (!ctx) return "—";
            const team = String(sideTeam || "").trim();
            if (team) {
                return isEgyptSide(team, ctx) ? ctx.oppT : ctx.egyptT;
            }
            return ctx.oppT !== "—" ? ctx.oppT : ctx.egyptT;
        };

        // Collect player representation teams (includes CLUB for Egypt NT filters)
        const teamSet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName) {
                const tv = l.TEAM || l.CLUB || l["TEAM NAME"] || l.Team || "";
                if (tv) teamSet.add(String(tv).trim());
            }
        });
        (playerDetails || []).forEach(p => {
            if (String(p["PLAYER NAME"] || "").trim() === playerName) {
                const tv = p.TEAM || p.CLUB || p["TEAM NAME"] || p.Team || "";
                if (tv) teamSet.add(String(tv).trim());
            }
        });
        const uniqueTeams = Array.from(teamSet).sort();

        const allAppearances = (lineupDetails || [])
            .filter(l => String(l["PLAYER NAME"] || "").trim() === playerName);

        // Map match context
        const matchContextMap = {};
        const allCompSet = new Set();
        (masterMatches || []).forEach(m => {
            const mId = String(m.MATCH_ID);
            const mType = String(m.CHAMPION || "Unknown").trim();
            matchContextMap[mId] = {
                champion: mType,
                season: String(m["SEASON"] || "Unknown").trim(), // Using SEASON for Egypt NT
                date: m.DATE || "—",
                dateVal: m.DATE ? new Date(m.DATE.split('/').reverse().join('-')) : new Date(0),
                egyptT: String(m["Egypt TEAM"] || m["EGYPT TEAM"] || "منتخب مصر").trim(),
                oppT: String(m["OPPONENT TEAM"] || "—").trim(),
                gf: parseInt(m.GF) || 0,
                ga: parseInt(m.GA) || 0
            };
            allCompSet.add(mType);
        });

        // Filter comps by selected player team
        const compSet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName && l.MATCH_ID) {
                const tv = String(l.TEAM || l.CLUB || l["TEAM NAME"] || l.Team || "").trim();
                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;
                const ct = matchContextMap[String(l.MATCH_ID)]?.champion;
                if (ct) compSet.add(ct);
            }
        });
        const uniqueComps = Array.from(compSet).sort();

        // Filter seasons (SEASON) by teams & comps
        const sySet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName && l.MATCH_ID) {
                const tv = String(l.TEAM || l.CLUB || l["TEAM NAME"] || l.Team || "").trim();
                const ctx = matchContextMap[String(l.MATCH_ID)];
                const ct = ctx?.champion;
                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;
                if (selectedComps.length > 0 && !selectedComps.includes(ct)) return;
                const sy = ctx?.season;
                if (sy && sy !== "Unknown") sySet.add(sy);
            }
        });
        const uniqueSYs = Array.from(sySet).sort((a, b) => b.localeCompare(a));

        // Filter opponents
        const opponentSet = new Set();
        (lineupDetails || []).forEach(l => {
            if (String(l["PLAYER NAME"] || "").trim() === playerName && l.MATCH_ID) {
                const tv = String(l.TEAM || l.CLUB || l["TEAM NAME"] || l.Team || "").trim();
                const ctx = matchContextMap[String(l.MATCH_ID)];
                const sideTeam = getMatchSideTeam(l);
                if (!ctx) return;
                const ct = ctx.champion;
                const sy = ctx.season;

                if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;
                if (selectedComps.length > 0 && !selectedComps.includes(ct)) return;
                if (selectedSYs.length > 0 && !selectedSYs.includes(sy)) return;

                const opp = resolveOpponent(ctx, sideTeam);
                if (opp && opp !== "—") opponentSet.add(opp);
            }
        });
        const uniqueOpps = Array.from(opponentSet).sort();

        // Filtered apps and events
        const appearances = (lineupDetails || []).filter(l => {
            if (String(l["PLAYER NAME"] || "").trim() !== playerName) return false;
            const ctx = matchContextMap[String(l.MATCH_ID)];
            if (!ctx) return false;

            if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
            if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.season)) return false;

            const tv = String(l.TEAM || l.CLUB || l["TEAM NAME"] || l.Team || "").trim();
            if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return false;

            if (selectedOpps.length > 0) {
                const opp = resolveOpponent(ctx, getMatchSideTeam(l));
                if (!selectedOpps.includes(opp)) return false;
            }
            return true;
        });

        const playerEvents = (playerDetails || []).filter(p => {
            if (String(p["PLAYER NAME"] || "").trim() !== playerName) return false;
            const ctx = matchContextMap[String(p.MATCH_ID)];
            if (!ctx) return false;

            if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
            if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.season)) return false;

            const tv = String(p.TEAM || p.CLUB || p["TEAM NAME"] || p.Team || "").trim();
            if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return false;

            if (selectedOpps.length > 0) {
                const opp = resolveOpponent(ctx, getMatchSideTeam(p));
                if (!selectedOpps.includes(opp)) return false;
            }
            return true;
        });

        summary.caps = appearances.length;
        summary.mins = appearances.reduce((acc, curr) => acc + (parseInt(curr["TOTAL MINUTE"] || 0) || 0), 0);

        const appearanceMatchIds = new Set(appearances.map(a => String(a.MATCH_ID)));
        const eventMatchIds = new Set(playerEvents.map(e => String(e.MATCH_ID)));
        const allRelevantMatchIds = new Set([...appearanceMatchIds, ...eventMatchIds]);

        const buildMatchData = (mId, app, mEvents) => {
            const ctx = matchContextMap[String(mId)];
            const gCount = mEvents.filter(e => {
                const type = String(e.TYPE || "").trim();
                const sub = String(e.TYPE_SUB || "").trim();
                return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            }).length;

            const aCount = mEvents.filter(e => {
                const type = String(e.TYPE || "").trim();
                return type === "ASSIST" || type === "اسيست" || type === "صنع";
            }).length;

            const pgCount = mEvents.filter(e => String(e.TYPE_SUB || "").trim() === "PENGOAL").length;

            let pmCount = 0;
            let psCount = 0;
            mEvents.filter(e => String(e.TYPE).trim() === "PENMISSED").forEach(e => {
                const detail = (howPenMissed || []).find(d => String(d.MATCH_ID) === String(mId) && String(d.EVENT_ID) === String(e.EVENT_ID));
                if (detail) {
                    const desc = String(detail["HOW MISSED?"] || "").trim();
                    const isActualMiss = ["برا المرمى", "القائم", "العارضة", "؟"].includes(desc);
                    if (isActualMiss) pmCount++; else psCount++;
                } else {
                    pmCount++;
                }
            });

            let opponent = "—";
            let dateVal = new Date(0);
            if (ctx) {
                dateVal = ctx.date ? new Date(ctx.date.split('/').reverse().join('-')) : new Date(0);
                const playerTeam = getMatchSideTeam(app) || getMatchSideTeam(mEvents[0]);
                opponent = resolveOpponent(ctx, playerTeam);
            }

            return {
                id: mId,
                date: ctx?.date || "—",
                dateVal,
                season: ctx?.season || "Unknown",
                champion: ctx?.champion || "Unknown",
                opponent: opponent,
                role: app ? app.STATU : "Actions Only",
                mins: app ? (parseInt(app["TOTAL MINUTE"]) || 0) : 0,
                goals: gCount,
                assists: aCount,
                penGoals: pgCount,
                penMissed: pmCount,
                penSaved: psCount,
                wonGoal: mEvents.filter(e => String(e.TYPE).trim() === "PENASSISTGOAL").length,
                wonMiss: mEvents.filter(e => String(e.TYPE).trim() === "PENASSISTMISSED").length,
                makeGoal: mEvents.filter(e => String(e.TYPE).trim() === "PENMAKEGOAL").length,
                makeMiss: mEvents.filter(e => String(e.TYPE).trim() === "PENMAKEMISSED").length,
                wdl: (ctx?.gf > ctx?.ga) ? 'W' : (ctx?.gf < ctx?.ga) ? 'L' : 'D',
                allEvents: mEvents
            };
        };

        const matchDataMap = {};
        allRelevantMatchIds.forEach(mId => {
            const ctx = matchContextMap[String(mId)];
            const app = appearances.find(a => String(a.MATCH_ID) === String(mId));
            const mEvents = playerEvents.filter(e => String(e.MATCH_ID) === String(mId));
            const data = buildMatchData(mId, app, mEvents);
            matchDataMap[mId] = data;

            mEvents.forEach(e => {
                const type = String(e.TYPE || "").trim();
                const sub = String(e.TYPE_SUB || "").trim();
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

            summary.goals += data.goals;
            summary.assists += data.assists;
            summary.penGoals += data.penGoals;
            summary.penMissed += data.penMissed;
            summary.penSaved += data.penSaved;
            summary.wonGoal += data.wonGoal;
            summary.wonMiss += data.wonMiss;
            summary.makeGoal += data.makeGoal;
            summary.makeMiss += data.makeMiss;

            if (data.goals === 2) summary.braceG += 1;
            else if (data.goals === 3) summary.hatG += 1;
            else if (data.goals >= 4) summary.superG += 1;

            if (data.assists === 2) summary.braceA += 1;
            else if (data.assists === 3) summary.hatA += 1;
            else if (data.assists >= 4) summary.superA += 1;

            const syKey = data.season || "Unknown";
            const cKey = data.champion || "Unknown";

            if (!summary.seasonalStats[syKey]) summary.seasonalStats[syKey] = { apps: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
            const ss = summary.seasonalStats[syKey];
            if (app) ss.apps += 1;
            ss.goals += data.goals;
            ss.assists += data.assists;
            ss.penGoals += data.penGoals;
            ss.penMissed += data.penMissed;
            ss.penSaved += data.penSaved;

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
            csGlobal.penSaved += data.penSaved;

            // Stats By Champ and Season
            if (!summary.statsByChampSeason[cKey]) summary.statsByChampSeason[cKey] = {};
            if (!summary.statsByChampSeason[cKey][syKey]) summary.statsByChampSeason[cKey][syKey] = { apps: 0, mins: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
            const cs = summary.statsByChampSeason[cKey][syKey];
            if (app) { cs.apps += 1; cs.mins += data.mins; }
            cs.goals += data.goals;
            cs.assists += data.assists;
            cs.penGoals += data.penGoals;
            cs.penMissed += data.penMissed;
            cs.penSaved += data.penSaved;

            // Stats By Opponent
            if (data.opponent !== "—") {
                if (!summary.statsByOpponent[data.opponent]) summary.statsByOpponent[data.opponent] = { apps: 0, goals: 0, assists: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
                const opp = summary.statsByOpponent[data.opponent];
                if (app) opp.apps += 1;
                opp.goals += data.goals;
                opp.assists += data.assists;
                opp.penGoals += data.penGoals;
                opp.penMissed += data.penMissed;
                opp.penSaved += data.penSaved;
            }

            // Stats By GK
            const playerMatchTeam = getMatchSideTeam(app) || getMatchSideTeam(mEvents[0]);
            const opponentTeam = resolveOpponent(ctx, playerMatchTeam);
            const matchGKs = (gkDetails || []).filter(gk => String(gk.MATCH_ID) === String(mId) && String(gk.TEAM).trim() === opponentTeam);

            const initGK = (name, team) => {
                if (!summary.statsByGK[name]) {
                    summary.statsByGK[name] = { totalGoals: 0, totalPenGoals: 0, totalPenMissed: 0, totalPenSaved: 0, teams: {} };
                }
                if (!summary.statsByGK[name].teams[team]) {
                    summary.statsByGK[name].teams[team] = { goals: 0, penGoals: 0, penMissed: 0, penSaved: 0 };
                }
            };

            const addStats = (name, team, g, pg, pm, ps) => {
                initGK(name, team);
                const gk = summary.statsByGK[name];
                const tStats = gk.teams[team];
                gk.totalGoals += g;
                gk.totalPenGoals += pg;
                gk.totalPenMissed += pm;
                gk.totalPenSaved += ps;
                tStats.goals += g;
                tStats.penGoals += pg;
                tStats.penMissed += pm;
                tStats.penSaved += ps;
            };

            if (matchGKs.length === 1) {
                const gk = matchGKs[0];
                const gkName = String(gk["PLAYER NAME"]).trim();
                addStats(gkName, opponentTeam, data.goals, data.penGoals, data.penMissed, data.penSaved);
            } else if (matchGKs.length > 1) {
                mEvents.forEach(e => {
                    const eId = String(e.EVENT_ID).trim();
                    const type = String(e.TYPE || "").trim();
                    const sub = String(e.TYPE_SUB || "").trim();
                    const isGoalEvent = type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";

                    if (isGoalEvent) {
                        const gkMatch = matchGKs.find((gk) => gkRowLinksEventId(gk, eId));
                        if (gkMatch) {
                            const gkName = String(gkMatch["PLAYER NAME"]).trim();
                            addStats(gkName, opponentTeam, 1, sub === "PENGOAL" ? 1 : 0, 0);
                        }
                    }
                });
                const matchPenMisses = (howPenMissed || []).filter(pm => String(pm.MATCH_ID) === String(mId) && String(pm["PLAYER NAME"]).trim() === playerName);
                matchPenMisses.forEach(pm => {
                    const eId = String(pm.EVENT_ID).trim();
                    const gkMatch = matchGKs.find((gk) => gkRowLinksEventId(gk, eId));
                    if (gkMatch) {
                        const gkName = String(gkMatch["PLAYER NAME"]).trim();
                        const desc = String(pm["HOW MISSED?"] || "").trim();
                        const isActualMiss = ["برا المرمى", "القائم", "العارضة", "؟"].includes(desc);
                        addStats(gkName, opponentTeam, 0, 0, isActualMiss ? 1 : 0, isActualMiss ? 0 : 1);
                    }
                });
            }

            // Partnerships
            const allMatchEvents = (playerDetails || []).filter(p => String(p.MATCH_ID) === String(mId));

            mEvents.filter(e => {
                const type = String(e.TYPE || "").trim();
                const sub = String(e.TYPE_SUB || "").trim();
                return type === "GOAL" || type === "هدف" || sub === "PENGOAL" || sub === "هدف جزاء";
            }).forEach(goal => {
                const gId = String(goal.EVENT_ID);
                const pId = String(goal.PARENT_EVENT_ID || "");

                const assistEvent = allMatchEvents.find(ae => {
                    const aeType = String(ae.TYPE || "").trim();
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

            mEvents.filter(e => {
                const type = String(e.TYPE || "").trim();
                return type === "ASSIST" || type === "اسيست" || type === "صنع";
            }).forEach(assist => {
                const aId = String(assist.EVENT_ID);
                const pId = String(assist.PARENT_EVENT_ID || "");

                const goalEvent = allMatchEvents.find(ae => {
                    const aeType = String(ae.TYPE || "").trim();
                    const aeSub = String(ae.TYPE_SUB || "").trim();
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

            // Presence
            if (app) {
                const playerMatchTeam = getMatchSideTeam(app) || getMatchSideTeam(mEvents[0]);
                const isEgyptSideFlag = playerMatchTeam
                    ? isEgyptSide(playerMatchTeam, ctx)
                    : true;
                
                const pSideGF = isEgyptSideFlag ? ctx.gf : ctx.ga;
                const pSideGA = isEgyptSideFlag ? ctx.ga : ctx.gf;

                summary.impactStats.presence.matches += 1;
                summary.impactStats.presence.gf += pSideGF;
                summary.impactStats.presence.ga += pSideGA;
                summary.impactStats.presence.playerGoals += data.goals;
                summary.impactStats.presence.playerAssists += data.assists;
                if (pSideGA === 0) summary.impactStats.presence.cleanSheets += 1;
                if (pSideGF === 0) summary.impactStats.presence.failedToScore += 1;

                if (pSideGF > pSideGA) summary.impactStats.presence.wins += 1;
                else if (pSideGF < pSideGA) summary.impactStats.presence.losses += 1;
                else summary.impactStats.presence.draws += 1;
            }
        });

        // Absence Range
        const careerDates = allAppearances.map(l => {
            const ctx = matchContextMap[String(l.MATCH_ID)];
            return ctx && ctx.dateVal && ctx.dateVal.getTime() > 0 ? ctx.dateVal.getTime() : null;
        }).filter(Boolean);

        if (careerDates.length > 0) {
            const minDate = Math.min(...careerDates);
            const maxDate = Math.max(...careerDates);

            (masterMatches || []).forEach(m => {
                const mctx = matchContextMap[String(m.MATCH_ID)];
                if (!mctx || !mctx.dateVal || mctx.dateVal.getTime() < minDate || mctx.dateVal.getTime() > maxDate) return;
                if (appearanceMatchIds.has(String(m.MATCH_ID))) return;

                if (selectedComps.length > 0 && !selectedComps.includes(mctx.champion)) return;
                if (selectedSYs.length > 0 && !selectedSYs.includes(mctx.season)) return;
                if (selectedTeams.length > 0 && !selectedTeams.includes(mctx.egyptT)) return;
                if (selectedOpps.length > 0 && !selectedOpps.includes(mctx.oppT)) return;

                summary.impactStats.absence.matches += 1;
                summary.impactStats.absence.gf += mctx.gf;
                summary.impactStats.absence.ga += mctx.ga;
                if (mctx.ga === 0) summary.impactStats.absence.cleanSheets += 1;
                if (mctx.gf === 0) summary.impactStats.absence.failedToScore += 1;

                if (mctx.gf > mctx.ga) summary.impactStats.absence.wins += 1;
                else if (mctx.gf < mctx.ga) summary.impactStats.absence.losses += 1;
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
        summary.opponentByMatchId = Object.fromEntries(
            Object.values(matchDataMap).map(d => [String(d.id), d.opponent])
        );

        const scopedMatchIds = eventMatchIds;
        const scopedMatches = (masterMatches || []).filter(m => scopedMatchIds.has(String(m.MATCH_ID)));
        const scopedEvents = (playerDetails || []).filter(e => scopedMatchIds.has(String(e.MATCH_ID)));
        summary.goalImpact = computePlayerGoalImpact(scopedMatches, scopedEvents, playerName);
        summary.assistImpact = computePlayerAssistImpact(scopedMatches, scopedEvents, playerName);

        summary.goalFreq = summary.goals > 0 ? Math.round(summary.mins / summary.goals) : 0;
        summary.gaContribution = summary.caps > 0 ? ((summary.goals + summary.assists) / summary.caps).toFixed(2) : 0;

        return { stats: summary, playerTeams: uniqueTeams, playerComps: uniqueComps, playerSYs: uniqueSYs, playerOpps: uniqueOpps };
    }, [playerName, playerDetails, lineupDetails, masterMatches, selectedTeams, selectedComps, selectedSYs, selectedOpps, gkDetails, howPenMissed]);

    // Excel Export Listener
    useEffect(() => {
        const handleGlobalExport = () => {
            handleExport();
        };
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = async () => {
        let exportData = [];
        let filename = `EgyptNT_${playerName}_${activeTab}`;

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
                    "OPPONENT TEAM": m.opponent,
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
                    "OPPONENT TEAM": m.opponent,
                    "STATUS": m.role === 'اساسي' ? 'Starter' : 'Sub',
                    "TIME": `${m.mins}'`,
                    "G": m.goals,
                    "A": m.assists,
                    "P-G": m.penGoals,
                    "P-M": m.penMissed,
                    "P-S": m.penSaved,
                    "W-P(G)": m.wonGoal,
                    "W-P(M)": m.wonMiss,
                    "C-P(G)": m.makeGoal,
                    "C-P(M)": m.makeMiss
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).sort().map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "APPS": s.apps, "MINS": s.mins, "W": s.wins, "D": s.draws, "L": s.losses, "G": s.goals, "A": s.assists, "P-G": s.penGoals };
                });
                break;
            case 'seasons':
                exportData = [];
                Object.keys(stats.statsByChampSeason).sort().forEach(comp => {
                    Object.keys(stats.statsByChampSeason[comp]).sort().forEach(season => {
                        const s = stats.statsByChampSeason[comp][season];
                        exportData.push({ "CHAMPION": comp, "SEASON": season, "APPS": s.apps, "MINS": s.mins, "G": s.goals, "A": s.assists, "P-G": s.penGoals });
                    });
                });
                break;
            case 'vs_teams':
                exportData = Object.keys(stats.statsByOpponent).sort((a, b) => stats.statsByOpponent[b].apps - stats.statsByOpponent[a].apps).map((opp, i) => {
                    const s = stats.statsByOpponent[opp];
                    return { "#": i + 1, "OPPONENT": opp, "APPS": s.apps, "G": s.goals, "A": s.assists, "P-G": s.penGoals, "P-M": s.penMissed, "P-S": s.penSaved };
                });
                break;
            case 'vs_gks':
                exportData = Object.keys(stats.statsByGK).sort((a, b) => stats.statsByGK[b].totalGoals - stats.statsByGK[a].totalGoals).map((gkName, i) => {
                    const gk = stats.statsByGK[gkName];
                    const teamsStr = Object.keys(gk.teams).join(', ');
                    return { "#": i + 1, "GK NAME": gkName, "TEAMS": teamsStr, "G": gk.totalGoals, "P-G": gk.totalPenGoals, "P-M": gk.totalPenMissed, "P-S": gk.totalPenSaved };
                });
                break;
            case 'player_with_player':
                const allPartners = Array.from(new Set([...Object.keys(stats.playerWithPlayerStats.assistsFrom), ...Object.keys(stats.playerWithPlayerStats.assistsTo)]));
                exportData = allPartners.map((p, i) => ({
                    "#": i + 1, "PARTNER NAME": p, "ASSISTS FROM": stats.playerWithPlayerStats.assistsFrom[p] || 0, "ASSISTS TO": stats.playerWithPlayerStats.assistsTo[p] || 0, "TOTAL": (stats.playerWithPlayerStats.assistsFrom[p] || 0) + (stats.playerWithPlayerStats.assistsTo[p] || 0)
                })).sort((a, b) => b.TOTAL - a.TOTAL);
                break;
            case 'goal_impact':
                exportData = stats.goalImpact.impactMatches.map((item, i) => ({
                    "#": i + 1,
                    "DATE": item.match.DATE,
                    "SEASON": item.match["SEASON"],
                    "OPPONENT": stats.opponentByMatchId[String(item.match.MATCH_ID)] || item.match["OPPONENT TEAM"],
                    "SCORE": `${item.match.GF} - ${item.match.GA}`,
                    "GOAL MINS": item.playerMins ? item.playerMins.join(", ") + "'" : "—",
                    "IMPACT TYPE": item.type,
                    "RESULT": item.match["W-D-L"] === 'W' ? 'WIN' : 'DRAW'
                }));
                break;
            case 'assist_impact':
                exportData = stats.assistImpact.impactMatches.map((item, i) => ({
                    "#": i + 1,
                    "DATE": item.match.DATE,
                    "SEASON": item.match["SEASON"],
                    "OPPONENT": stats.opponentByMatchId[String(item.match.MATCH_ID)] || item.match["OPPONENT TEAM"],
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
            EgyptNTExcelExport.exportToExcel(exportData, filename);
        }
    };

    if (!playerName) return null;

    const renderEventsCell = (m) => {
        const hasEvents = (m.goals > 0 || m.assists > 0 || m.penGoals > 0 || m.penMissed > 0 || m.penSaved > 0 || m.wonGoal > 0 || m.wonMiss > 0 || m.makeGoal > 0 || m.makeMiss > 0);

        return (
            <div className="m-stats-cell" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                {m.goals > 0 && <div className="m-mini-pill mini-g" title="Goals">{m.goals}G</div>}
                {m.assists > 0 && <div className="m-mini-pill mini-a" title="Assists">{m.assists}A</div>}
                {m.penGoals > 0 && <div className="m-mini-pill" style={{ background: '#27ae60', color: '#fff' }} title="Penalty Goal">{m.penGoals} P-G</div>}
                {m.penSaved > 0 && <div className="m-mini-pill" style={{ background: '#e67e22', color: '#fff' }} title="Penalty Saved by GK">{m.penSaved} P-S</div>}
                {m.penMissed > 0 && <div className="m-mini-pill" style={{ background: '#e74c3c', color: '#fff' }} title="Penalty Missed Off-Target">{m.penMissed} P-M</div>}
                {m.wonGoal > 0 && <div className="m-mini-pill" style={{ background: '#2ecc71', color: '#fff' }} title="Penalty Won (Scored)">{m.wonGoal} W-P(G)</div>}
                {m.wonMiss > 0 && <div className="m-mini-pill" style={{ border: '1px solid #2ecc71', color: '#2ecc71', background: 'transparent' }} title="Penalty Won (Missed)">{m.wonMiss} W-P(M)</div>}
                {m.makeGoal > 0 && <div className="m-mini-pill" style={{ background: '#9b59b6', color: '#fff' }} title="Penalty Committed (Scored)">{m.makeGoal} C-P(G)</div>}
                {m.makeMiss > 0 && <div className="m-mini-pill" style={{ border: '1px solid #9b59b6', color: '#9b59b6', background: 'transparent' }} title="Penalty Committed (Missed)">{m.makeMiss} C-P(M)</div>}
                {!hasEvents && <span style={{ color: '#eee' }}>—</span>}
            </div>
        );
    };

    // Process Seasons for Display (Chronological order)
    let sortedSeasons = Object.keys(stats.seasonalStats).sort();
    if (seasonLimit && !isNaN(seasonLimit)) {
        const limit = parseInt(seasonLimit);
        if (limit > 0) sortedSeasons = sortedSeasons.slice(-limit);
    }
    const maxVal = Math.max(...sortedSeasons.map(s => Math.max(stats.seasonalStats[s].apps, stats.seasonalStats[s].goals, stats.seasonalStats[s].assists)), 1);

    return (
        <div className="player-details-container">
            {/* Header / Hero */}
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}>
                        <span>←</span> All Players
                    </button>
                    <div className="name-and-teams" style={{ display: 'flex', alignItems: 'center', gap: '25px', flexWrap: 'wrap' }}>
                        <h1 className="player-main-name" style={{ margin: 0 }}>
                            {playerName.split(' ').slice(0, -1).join(' ')} <span>{playerName.split(' ').slice(-1)} 🇪🇬</span>
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
                                <label>SEASONS</label>
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

            {/* Tab Navigation */}
            <div className="player-details-tabs">
                {[
                    { id: 'overview', title: 'OVERVIEW' },
                    { id: 'dashboard', title: 'DASHBOARD' },
                    { id: 'presence', title: 'SQUAD INFLUENCE' },
                    { id: 'goal_impact', title: 'GOAL IMPACT' },
                    { id: 'assist_impact', title: 'ASSIST IMPACT' },
                    { id: 'timing', title: 'TIMING' },
                    { id: 'matches', title: 'MATCHES' },
                    { id: 'match_events', title: 'MATCH EVENTS' },
                    { id: 'championships', title: 'CHAMPIONSHIPS' },
                    { id: 'seasons', title: 'SEASONS' },
                    { id: 'vs_teams', title: 'VS TEAMS' },
                    { id: 'vs_gks', title: 'VS GKS' },
                    { id: 'player_with_player', title: 'P W P' }
                ].map(t => (
                    <div 
                        key={t.id} 
                        className={`player-tab-item ${activeTab === t.id ? 'active' : ''}`} 
                        onClick={() => setActiveTab(t.id)}
                    >
                        <span className="tab-title">{t.title}</span>
                    </div>
                ))}
            </div>

            {/* Render Active Subcomponent */}
            {activeTab === 'overview' && (
                <PlayerOverview
                    stats={stats}
                    goalFreq={stats.goalFreq}
                    gaContribution={stats.gaContribution}
                />
            )}

            {activeTab === 'dashboard' && (
                <PlayerDashboard
                    stats={stats}
                    playerComps={playerComps}
                    selectedComps={selectedComps}
                    setSelectedComps={setSelectedComps}
                    isCompOpen={isCompOpen}
                    setIsCompOpen={setIsCompOpen}
                    seasonLimit={seasonLimit}
                    setSeasonLimit={setSeasonLimit}
                    sortedSeasons={sortedSeasons}
                    maxVal={maxVal}
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

            {activeTab === 'vs_gks' && (
                <PlayerVsGksTable
                    stats={stats}
                />
            )}

            {activeTab === 'player_with_player' && (
                <PlayerWithPlayerTable
                    stats={stats}
                />
            )}

            {activeTab === 'goal_impact' && (
                <PlayerGoalImpactTable
                    impactData={stats.goalImpact}
                    opponentByMatchId={stats.opponentByMatchId}
                />
            )}

            {activeTab === 'assist_impact' && (
                <PlayerAssistImpactTable
                    impactData={stats.assistImpact}
                    opponentByMatchId={stats.opponentByMatchId}
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
