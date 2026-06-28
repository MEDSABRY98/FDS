"use client";

import SearchBar_db from "../../lib/SearchBar_db";
import { calcGkAppearanceMinutes, resolveMatchLengthMinute } from "../../Database";
import {
    findGkForPenaltyMiss,
    findDefendingGkForPenalty,
    findHowPenMissedForEvent,
    getPenaltyMissOutcome,
} from "../../Alahly/Penalties/alahly_db_penalties_utils";

export const GK_TABS = [
    { id: "overview", label: "OVERVIEW" },
    { id: "matches", label: "MATCHES" },
    { id: "championships", label: "CHAMPIONSHIPS" },
    { id: "season", label: "SEASONS" },
    { id: "vs_teams", label: "VS TEAMS" },
];

export const GK_TOTAL_ROW_STYLE = { background: "#0a0a0a", color: "#fff", fontWeight: 700 };
export const GK_TOTAL_LABEL_STYLE = {
    padding: "20px",
    textAlign: "center",
    fontWeight: 900,
    color: "var(--gold)",
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontSize: "14px",
    fontFamily: "Outfit",
};
export const GK_TOTAL_VAL_STYLE = {
    padding: "20px",
    textAlign: "center",
    fontFamily: "Outfit",
    fontWeight: 900,
    fontSize: "18px",
};

export const GK_ZERO_CELL_STYLE = { color: "#ccc" };

export function gkStatText(value) {
    return value ? value : "—";
}

export function gkStatCellStyle(value, activeStyle = {}) {
    return value ? activeStyle : GK_ZERO_CELL_STYLE;
}

export function gkTotalCellStyle(value, activeStyle = {}) {
    return value ? { ...GK_TOTAL_VAL_STYLE, ...activeStyle } : { ...GK_TOTAL_VAL_STYLE, ...GK_ZERO_CELL_STYLE };
}

export function GK_TabSearch({ value, onChange, placeholder }) {
    return (
        <div
            style={{
                width: "50%",
                maxWidth: 400,
                margin: "0 auto 28px",
                boxSizing: "border-box",
            }}
        >
            <SearchBar_db value={value} onChange={onChange} placeholder={placeholder} />
        </div>
    );
}

export function buildEgyptNTGkStats({
    gkName,
    gkDetails,
    masterMatches,
    howPenMissed,
    playerDetails,
    selectedTeams,
    selectedComps,
    selectedSYs,
    selectedOpps,
}) {
    const summary = {
        caps: 0, goalsConceded: 0, cleanSheets: 0, penaltiesFaced: 0, penaltiesSaved: 0, penaltiesMissed: 0, penaltiesReceived: 0,
        matchHistory: [], seasonalStats: {}, compStats: {},
        statsBySY: {}, statsByOpponent: {}
    };

    if (!gkName || !gkDetails) return { stats: summary, gkTeams: [], gkSYs: [], gkComps: [], gkOpps: [] };

    const isEgypt = (t) => {
        if (!t) return false;
        const s = String(t).trim();
        return s === "مصر" || s === "Egypt" || s === "منتخب مصر" || s === "المنتخب المصري"
            || s.includes("مصر") || s.toLowerCase().includes("egypt");
    };

    const isOpponentToGk = (eventTeam, gkTeam) => {
        const eventTv = String(eventTeam || "").trim();
        const gkTv = String(gkTeam || "").trim();
        if (!eventTv || !gkTv) return eventTv !== gkTv;
        if (eventTv === gkTv) return false;
        if (isEgypt(eventTv) && isEgypt(gkTv)) return false;
        return true;
    };

    const teamSet = new Set();
    (gkDetails || []).forEach(g => {
        if (String(g["PLAYER NAME"] || "").trim() === gkName) {
            const tv = String(g.TEAM || "").trim();
            if (tv) teamSet.add(tv);
        }
    });
    const uniqueTeams = Array.from(teamSet).sort();

    const matchContextMap = {};
    (masterMatches || []).forEach(m => {
        const mId = String(m.MATCH_ID);
        matchContextMap[mId] = {
            champion: String(m.CHAMPION || "Unknown").trim(),
            season: String(m.SEASON || m["SEASON - NAME"] || "Unknown").trim(),
            sy: String(m["SEASON - NUMBER"] || m.SEASON || "Unknown").trim(),
            date: m.DATE || "—",
            matchMinute: String(resolveMatchLengthMinute(m)),
            egyptT: String(m["Egypt TEAM"] || m["EGYPT TEAM"] || "مصر").trim(),
            oppT: String(m["OPPONENT TEAM"] || "—").trim(),
            gf: parseInt(m.GF || 0),
            ga: parseInt(m.GA || 0)
        };
    });

    const compSet = new Set();
    const sySet = new Set();
    const oppSet = new Set();

    (gkDetails || []).forEach(g => {
        if (String(g["PLAYER NAME"] || "").trim() === gkName && g.MATCH_ID) {
            const tv = String(g.TEAM || "").trim();
            if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return;

            const ctx = matchContextMap[String(g.MATCH_ID)];
            if (!ctx) return;
            compSet.add(ctx.champion);
            sySet.add(ctx.sy);
            const opp = isEgypt(tv) ? ctx.oppT : ctx.egyptT;
            if (opp && opp !== "—") oppSet.add(opp);
        }
    });

    const filteredGKRows = (gkDetails || []).filter(g => {
        if (String(g["PLAYER NAME"] || "").trim() !== gkName) return false;
        const ctx = matchContextMap[String(g.MATCH_ID)];
        if (!ctx) return false;
        const tv = String(g.TEAM || "").trim();
        const opp = isEgypt(tv) ? ctx.oppT : ctx.egyptT;

        if (selectedTeams.length > 0 && !selectedTeams.includes(tv)) return false;
        if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
        if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.sy)) return false;
        if (selectedOpps.length > 0 && !selectedOpps.includes(opp)) return false;
        return true;
    });

    const gkRowsByMatch = {};
    filteredGKRows.forEach((g) => {
        const id = String(g.MATCH_ID);
        if (!gkRowsByMatch[id]) gkRowsByMatch[id] = [];
        gkRowsByMatch[id].push(g);
    });

    filteredGKRows.forEach(g => {
        const mId = String(g.MATCH_ID);
        const ctx = matchContextMap[mId];
        const tv = String(g.TEAM || "").trim();
        const oppName = isEgypt(tv) ? ctx.oppT : ctx.egyptT;
        const sy = ctx.sy;
        const champion = ctx.champion;
        const season = ctx.season;

        summary.caps += 1;
        const gc = parseInt(g["GOALS CONCEDED"] || 0);
        summary.goalsConceded += gc;

        const isStarter = String(g.STATU || "").trim() === "اساسي";
        const stayedAllMatch = !g["OUT MINUTE"] || String(g["OUT MINUTE"]).trim() === "";
        let isClean = false;
        if (isStarter && stayedAllMatch) {
            if (isEgypt(tv) && ctx.ga === 0) isClean = true;
            else if (!isEgypt(tv) && ctx.gf === 0) isClean = true;
        }
        if (isClean) summary.cleanSheets += 1;

        const matchPens = (playerDetails || []).filter(p => {
            if (String(p.MATCH_ID) !== mId) return false;
            const isOppScore = isOpponentToGk(p.TEAM, tv);
            const typeSub = String(p.TYPE_SUB || "").toUpperCase();
            return (typeSub === "PENGOAL" || String(p.TYPE_SUB || "").trim() === "هدف جزاء") && isOppScore;
        });
        summary.penaltiesReceived += matchPens.length;

        const matchPenMissedEvents = (playerDetails || []).filter((p) => {
            if (String(p.MATCH_ID) !== mId) return false;
            return String(p.TYPE || "").trim().toUpperCase() === "PENMISSED";
        });

        const matchSaves = matchPenMissedEvents.filter((pen) => {
            const gk = findGkForPenaltyMiss({ penEvent: pen, howPenMissed, gkDetails });
            return gk && String(gk["PLAYER NAME"] || "").trim() === gkName;
        });

        const matchMisses = matchPenMissedEvents.filter((pen) => {
            const detail = findHowPenMissedForEvent(howPenMissed, pen);
            if (getPenaltyMissOutcome(detail) !== "missed") return false;
            const gk = findDefendingGkForPenalty({ penEvent: pen, howPenMissed, gkDetails });
            return gk && String(gk["PLAYER NAME"] || "").trim() === gkName;
        });

        summary.penaltiesSaved += matchSaves.length;
        summary.penaltiesMissed += matchMisses.length;

        [sy, champion, oppName].forEach((key, i) => {
            if (!key || key === "—") return;
            const target = [summary.seasonalStats, summary.compStats, summary.statsByOpponent][i];
            if (!target[key]) target[key] = { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, gc: 0, cs: 0, ps: 0, pr: 0 };
            const t = target[key];
            t.matches += 1; t.gc += gc; if (isClean) t.cs += 1; t.ps += matchSaves.length; t.pr += matchPens.length;

            t.gs += isEgypt(tv) ? ctx.gf : ctx.ga;
            t.ga += isEgypt(tv) ? ctx.ga : ctx.gf;
            const matchResult = isEgypt(tv) ? (ctx.gf > ctx.ga ? 'W' : ctx.gf < ctx.ga ? 'L' : 'D') : (ctx.ga > ctx.gf ? 'W' : ctx.ga < ctx.gf ? 'L' : 'D');
            if (matchResult === 'W') t.wins += 1; else if (matchResult === 'L') t.losses += 1; else t.draws += 1;
        });

        if (!summary.statsBySY[sy]) summary.statsBySY[sy] = { matches: 0, wins: 0, draws: 0, losses: 0, gc: 0, cs: 0, ps: 0, pr: 0 };

        const mResult = isEgypt(tv) ? (ctx.gf > ctx.ga ? 'W' : ctx.gf < ctx.ga ? 'L' : 'D') : (ctx.ga > ctx.gf ? 'W' : ctx.ga < ctx.gf ? 'L' : 'D');
        const mGF = isEgypt(tv) ? ctx.gf : ctx.ga;
        const mGA = isEgypt(tv) ? ctx.ga : ctx.gf;

        const msy = summary.statsBySY[sy];
        msy.matches += 1; msy.gc += gc; if (isClean) msy.cs += 1; msy.ps += matchSaves.length; msy.pr += matchPens.length;
        if (mResult === 'W') msy.wins += 1; else if (mResult === 'L') msy.losses += 1; else msy.draws += 1;

        summary.matchHistory.push({
            idx: mId, date: ctx.date, champion, season, sy, opponent: oppName,
            role: g.STATU || 'اساسي',
            mins: calcGkAppearanceMinutes(g, gkRowsByMatch[mId] || [], ctx.matchMinute),
            gc, clean: isClean,
            ps: matchSaves.length,
            pm: matchMisses.length,
            psm: matchSaves.length + matchMisses.length,
            pg: matchPens.length,
            result: mResult,
            score: `${mGF}-${mGA}`
        });
    });

    summary.matchHistory.sort((a, b) => {
        const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
        const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
        return db - da;
    });

    summary.penaltiesFaced = summary.penaltiesReceived + summary.penaltiesSaved + summary.penaltiesMissed;

    let allStreaksCS = [];
    let allStreaksGC = [];
    let currentCSMatches = [];
    let currentGCMatches = [];

    const chronologicalHistory = [...summary.matchHistory].sort((a, b) => {
        const da = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
        const db = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
        return da - db;
    });

    chronologicalHistory.forEach(m => {
        if (m.clean) {
            currentCSMatches.push(m);
            if (currentGCMatches.length >= 2) allStreaksGC.push({ length: currentGCMatches.length, matches: [...currentGCMatches], startDate: currentGCMatches[0].date });
            currentGCMatches = [];
        } else {
            currentGCMatches.push(m);
            if (currentCSMatches.length >= 2) allStreaksCS.push({ length: currentCSMatches.length, matches: [...currentCSMatches], startDate: currentCSMatches[0].date });
            currentCSMatches = [];
        }
    });

    if (currentCSMatches.length >= 2) allStreaksCS.push({ length: currentCSMatches.length, matches: [...currentCSMatches], startDate: currentCSMatches[0].date });
    if (currentGCMatches.length >= 2) allStreaksGC.push({ length: currentGCMatches.length, matches: [...currentGCMatches], startDate: currentGCMatches[0].date });

    const sortStreaks = (arr) => arr.sort((a, b) => {
        if (b.length !== a.length) return b.length - a.length;
        const da = a.startDate ? new Date(a.startDate.split('/').reverse().join('-')) : new Date(0);
        const db = b.startDate ? new Date(b.startDate.split('/').reverse().join('-')) : new Date(0);
        return db - da;
    });

    summary.allStreaksCS = sortStreaks(allStreaksCS);
    summary.allStreaksGC = sortStreaks(allStreaksGC);
    summary.maxCSStreak = summary.allStreaksCS[0]?.length || 0;
    summary.maxGCStreak = summary.allStreaksGC[0]?.length || 0;

    return {
        stats: summary,
        gkTeams: uniqueTeams,
        gkComps: Array.from(compSet).sort(),
        gkSYs: Array.from(sySet).sort((a, b) => b.localeCompare(a)),
        gkOpps: Array.from(oppSet).sort()
    };
}
