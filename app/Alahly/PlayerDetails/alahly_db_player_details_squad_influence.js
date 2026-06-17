"use client";

import React, { useMemo, useState } from "react";

const EMPTY_IMPACT = {
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    cleanSheets: 0,
    failedToScore: 0,
};

function createEmptyImpactStats() {
    return {
        presence: { ...EMPTY_IMPACT },
        absence: { ...EMPTY_IMPACT },
        careerRange: { start: "—", end: "—" },
    };
}

function lineupTeam(row) {
    return String(row?.TEAM || row?.CLUB || row?.["TEAM NAME"] || row?.Team || "").trim();
}

function addTeamResult(bucket, gf, ga) {
    bucket.matches += 1;
    bucket.gf += gf;
    bucket.ga += ga;
    if (ga === 0) bucket.cleanSheets += 1;
    if (gf === 0) bucket.failedToScore += 1;
    if (gf > ga) bucket.wins += 1;
    else if (gf < ga) bucket.losses += 1;
    else bucket.draws += 1;
}

/**
 * Squad influence uses alahly_LINEUPDETAILS only — not player event rows.
 */
export function computeSquadImpactStats({
    playerName,
    lineupDetails = [],
    masterMatches = [],
    selectedTeams = [],
    selectedComps = [],
    selectedSYs = [],
    selectedOpps = [],
    isHomeSide = (team) => String(team || "").trim() === "الأهلي",
    homeTeamKey = "ahlyT",
    awayTeamKey = "oppT",
}) {
    const summary = createEmptyImpactStats();
    if (!playerName) return summary;

    const matchContextMap = {};
    (masterMatches || []).forEach((m) => {
        const mId = String(m.MATCH_ID);
        matchContextMap[mId] = {
            champion: String(m.CHAMPION || "Unknown").trim(),
            season: String(m["SEASON - NAME"] || "Unknown").trim(),
            sy: String(m["SEASON - NUMBER"] || "Unknown").trim(),
            date: m.DATE || "—",
            dateVal: m.DATE ? new Date(m.DATE.split("/").reverse().join("-")) : new Date(0),
            ahlyT: String(m["AHLY TEAM"] || "الأهلي").trim(),
            oppT: String(m["OPPONENT TEAM"] || "—").trim(),
            gf: parseInt(m.GF, 10) || 0,
            ga: parseInt(m.GA, 10) || 0,
        };
    });

    const passesFilters = (row, ctx) => {
        if (!ctx) return false;
        if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return false;
        if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.sy)) return false;

        const team = lineupTeam(row);
        if (selectedTeams.length > 0 && !selectedTeams.includes(team)) return false;

        if (selectedOpps.length > 0) {
            const opp = isHomeSide(team) ? ctx[awayTeamKey] : ctx[homeTeamKey];
            if (!selectedOpps.includes(opp)) return false;
        }

        return true;
    };

    const lineupAppearances = (lineupDetails || []).filter((row) => {
        if (String(row["PLAYER NAME"] || "").trim() !== playerName) return false;
        return passesFilters(row, matchContextMap[String(row.MATCH_ID)]);
    });

    const lineupMatchIds = new Set(lineupAppearances.map((row) => String(row.MATCH_ID)));

    lineupAppearances.forEach((row) => {
        const ctx = matchContextMap[String(row.MATCH_ID)];
        if (!ctx) return;

        const playerTeam = lineupTeam(row);
        const onHomeSide = isHomeSide(playerTeam);
        const sideGF = onHomeSide ? ctx.gf : ctx.ga;
        const sideGA = onHomeSide ? ctx.ga : ctx.gf;

        addTeamResult(summary.presence, sideGF, sideGA);
    });

    const careerDates = lineupAppearances
        .map((row) => matchContextMap[String(row.MATCH_ID)]?.dateVal)
        .filter((dateVal) => dateVal && dateVal.getTime() > 0);

    if (careerDates.length === 0) {
        return summary;
    }

    const minDate = Math.min(...careerDates.map((d) => d.getTime()));
    const maxDate = Math.max(...careerDates.map((d) => d.getTime()));

    (masterMatches || []).forEach((m) => {
        const mId = String(m.MATCH_ID);
        const ctx = matchContextMap[mId];
        if (!ctx || !ctx.dateVal || ctx.dateVal.getTime() < minDate || ctx.dateVal.getTime() > maxDate) return;
        if (lineupMatchIds.has(mId)) return;

        if (selectedComps.length > 0 && !selectedComps.includes(ctx.champion)) return;
        if (selectedSYs.length > 0 && !selectedSYs.includes(ctx.sy)) return;
        if (selectedTeams.length > 0 && !selectedTeams.includes(ctx[homeTeamKey])) return;
        if (selectedOpps.length > 0 && !selectedOpps.includes(ctx[awayTeamKey])) return;

        addTeamResult(summary.absence, ctx.gf, ctx.ga);
    });

    const firstMatch = lineupAppearances.find(
        (row) => matchContextMap[String(row.MATCH_ID)]?.dateVal?.getTime() === minDate
    );
    const lastMatch = lineupAppearances.find(
        (row) => matchContextMap[String(row.MATCH_ID)]?.dateVal?.getTime() === maxDate
    );

    summary.careerRange = {
        start: matchContextMap[String(firstMatch?.MATCH_ID)]?.date || "—",
        end: matchContextMap[String(lastMatch?.MATCH_ID)]?.date || "—",
    };

    return summary;
}

export default function PlayerPresenceTable({
    impactStats,
    playerName,
    lineupDetails,
    masterMatches,
    selectedTeams = [],
    selectedComps = [],
    selectedSYs = [],
    selectedOpps = [],
}) {
    const [subTab, setSubTab] = useState("presence");

    const computedStats = useMemo(
        () =>
            computeSquadImpactStats({
                playerName,
                lineupDetails,
                masterMatches,
                selectedTeams,
                selectedComps,
                selectedSYs,
                selectedOpps,
            }),
        [playerName, lineupDetails, masterMatches, selectedTeams, selectedComps, selectedSYs, selectedOpps]
    );

    const stats = impactStats || computedStats;
    if (!stats) return null;

    const data = subTab === "presence" ? stats.presence : stats.absence;

    const winRate =
        data.matches > 0 ? ((data.wins / data.matches) * 100).toFixed(1) : 0;

    const statsConfig = [
        {
            label: "Matches Involved",
            value: data.matches,
            color: "var(--player-gold)",
            sub:
                subTab === "presence"
                    ? "Matches where player appears in lineup"
                    : "Team matches missed during lineup career period",
        },
        { label: "Team Wins", value: data.wins, color: "#27ae60", sub: "Team victories" },
        { label: "Win Rate %", value: `${winRate}%`, color: "#2ecc71", sub: "Success percentage" },
        { label: "Team Draws", value: data.draws, color: "#f39c12", sub: "Tied matches" },
        { label: "Team Losses", value: data.losses, color: "#e74c3c", sub: "Defeats sustained" },
        { label: "Goals For", value: data.gf, color: "#27ae60", sub: "Total team goals scored" },
        { label: "Goals Against", value: data.ga, color: "#e74c3c", sub: "Total team goals conceded" },
        { label: "Clean Sheets", value: data.cleanSheets, color: "#2980b9", sub: "Shutouts achieved" },
        { label: "Opponent CS", value: data.failedToScore, color: "#95a5a6", sub: "Failed to score matches" },
    ];

    return (
        <div className="presence-impact-container fade-in">
            <div className="sub-tabs-container">
                <button
                    className={`sub-tab-btn ${subTab === "presence" ? "active" : ""}`}
                    onClick={() => setSubTab("presence")}
                >
                    <span className="dot"></span>
                    PRESENCE
                </button>
                <button
                    className={`sub-tab-btn ${subTab === "absence" ? "active" : ""}`}
                    onClick={() => setSubTab("absence")}
                >
                    <span className="dot"></span>
                    ABSENCE
                </button>
            </div>

            <div className="range-badge-container">
                <div className="range-badge">
                    <span className="range-label">CAREER PERIOD:</span>
                    <span className="range-value">{stats.careerRange?.start}</span>
                    <span className="range-separator">TO</span>
                    <span className="range-value">{stats.careerRange?.end}</span>
                </div>
            </div>

            <div className="impact-grid-modern">
                {statsConfig.map((stat, idx) => (
                    <div className="impact-card-premium" key={idx}>
                        <div className="card-top">
                            <span className="impact-label">{stat.label}</span>
                            <div
                                className="impact-indicator"
                                style={{ background: stat.color, color: stat.color }}
                            ></div>
                        </div>
                        <div className="impact-value" style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                        <div className="impact-subtext">{stat.sub}</div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .presence-impact-container {
                    padding: 20px 0;
                }
                .sub-tabs-container {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 10px;
                    border-radius: 16px;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                }
                .sub-tab-btn {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 12px 25px;
                    border-radius: 12px;
                    font-family: "Space Mono";
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #999;
                }
                .sub-tab-btn .dot {
                    width: 6px;
                    height: 6px;
                    background: #ddd;
                    border-radius: 50%;
                    transition: 0.3s;
                }
                .sub-tab-btn.active {
                    background: #000;
                    color: var(--player-gold);
                    border-color: #000;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                }
                .sub-tab-btn.active .dot {
                    background: var(--player-gold);
                    box-shadow: 0 0 10px var(--player-gold);
                }
                .sub-tab-btn:hover:not(.active) {
                    background: #f9f9f9;
                    color: #666;
                }

                .range-badge-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 30px;
                }
                .range-badge {
                    background: #f9f9f9;
                    border: 1px solid #eee;
                    padding: 12px 28px;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-family: "Space Mono";
                    font-size: 15px;
                    font-weight: 700;
                }
                .range-label {
                    color: #999;
                    letter-spacing: 1px;
                }
                .range-value {
                    color: var(--player-gold);
                    font-weight: 800;
                }
                .range-separator {
                    color: #ccc;
                    font-size: 9px;
                }

                .impact-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }
                .impact-card-premium {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 30px;
                    border-radius: 24px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
                    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }
                .impact-card-premium:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05);
                    border-color: var(--player-gold);
                }
                .impact-card-premium::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: var(--player-gold);
                    opacity: 0;
                    transition: 0.3s;
                }
                .impact-card-premium:hover::before {
                    opacity: 1;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .impact-label {
                    font-family: "Space Mono";
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #999;
                    text-transform: uppercase;
                }
                .impact-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    box-shadow: 0 0 10px currentColor;
                }
                .impact-value {
                    font-family: "Bebas Neue";
                    font-size: 56px;
                    line-height: 1;
                    margin-bottom: 15px;
                    letter-spacing: 2px;
                }
                .impact-subtext {
                    font-family: "Outfit";
                    font-size: 13px;
                    color: #666;
                    font-weight: 600;
                    min-height: 20px;
                }

                @media (max-width: 768px) {
                    .impact-grid-modern {
                        grid-template-columns: 1fr;
                    }
                    .impact-value {
                        font-size: 48px;
                    }
                    .sub-tabs-container {
                        width: 100%;
                    }
                    .sub-tab-btn {
                        flex: 1;
                        padding: 12px 10px;
                        font-size: 10px;
                    }
                }
            `}</style>
        </div>
    );
}
