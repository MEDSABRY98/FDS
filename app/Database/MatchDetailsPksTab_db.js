"use client";

import { useState, useEffect, useMemo } from "react";
import NoData_db from "../lib/NoData_db";
import "../AlahlyPKS/MatchDetails/alahly_pks_match_details.css";
import "./match_details_pks_tab.css";

function PksTabLoading() {
    return (
        <div className="match-details-pks-embed pks-tab-loading fade-in">
            <div className="pks-loading-stage" aria-hidden="true">
                <div className="pks-loading-goal" />
                <div className="pks-loading-ball">⚽</div>
                <div className="pks-loading-spot" />
            </div>
            <p className="pks-loading-label">Loading PKS</p>
            <div className="pks-loading-track" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}

function formatPenalties(item, config) {
    const home = item[config.homeScoreField];
    const opp = item[config.oppScoreField];
    if (home !== undefined && opp !== undefined) {
        return `${home} - ${opp}`;
    }

    const penString = item[config.pksWlField] || item["PKS RESULT"] || item.PKS_RESULT || item.RESULT;
    if (!penString) return "---";
    const ps = String(penString).toUpperCase();
    const numbers = ps.match(/\d+/g);
    if (!numbers || numbers.length < 2) return penString;
    const n1 = parseInt(numbers[0], 10);
    const n2 = parseInt(numbers[1], 10);
    const low = Math.min(n1, n2);
    const high = Math.max(n1, n2);
    if (ps.includes("L")) return `${low} - ${high}`;
    return `${high} - ${low}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "---";
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

function resolveShootoutResult(matchInfo, config) {
    const homeScore = parseInt(matchInfo?.[config.homeScoreField] || 0, 10);
    const oppScore = parseInt(matchInfo?.[config.oppScoreField] || 0, 10);
    const resStr = String(matchInfo?.[config.pksWlField] || matchInfo?.["PKS RESULT"] || matchInfo?.PKS_RESULT || matchInfo?.RESULT || "").toUpperCase();

    if (resStr.includes("W")) return "win";
    if (resStr.includes("L")) return "loss";
    if (homeScore > oppScore) return "win";
    if (oppScore > homeScore) return "loss";
    return "neutral";
}

function resolveShootoutResultLabel(matchInfo, config) {
    const status = resolveShootoutResult(matchInfo, config);
    if (status === "win") return "WIN";
    if (status === "loss") return "LOSS";
    return "---";
}

export default function MatchDetailsPksTab({ matchId, matchInfo, config, fetchMatchPks }) {
    const [matchPks, setMatchPks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeInternalTab, setActiveInternalTab] = useState(config.homeTabPlayers);

    useEffect(() => {
        let cancelled = false;

        async function loadPks() {
            setLoading(true);
            setError("");
            try {
                const rows = await fetchMatchPks(matchId);
                if (!cancelled) setMatchPks(rows || []);
            } catch (err) {
                if (!cancelled) {
                    setMatchPks([]);
                    setError(err?.message || "Failed to load penalty shootout data.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (matchId) loadPks();
        else {
            setMatchPks([]);
            setLoading(false);
        }

        return () => { cancelled = true; };
    }, [matchId, fetchMatchPks]);

    const kickInfo = matchPks[0] || matchInfo || {};

    const filteredKicks = useMemo(() => (
        (matchPks || []).filter((kick) => {
            switch (activeInternalTab) {
                case config.homeTabPlayers:
                    return !!kick[config.homePlayerField];
                case config.homeTabGks:
                    return !!kick[config.homeGkField];
                case "opp_players":
                    return !!kick[config.oppPlayerField];
                case "opp_gks":
                    return !!kick[config.oppGkField];
                default:
                    return true;
            }
        })
    ), [matchPks, activeInternalTab, config]);

    const tabs = [
        { id: config.homeTabPlayers, label: config.homeTabLabel },
        { id: config.homeTabGks, label: config.homeGkTabLabel },
        { id: "opp_players", label: "OPPONENT PLAYERS" },
        { id: "opp_gks", label: "OPPONENT GKs" },
    ];

    if (loading) {
        return <PksTabLoading />;
    }

    if (error) {
        return <div className="match-details-pks-embed error-state">{error}</div>;
    }

    if (!matchPks.length) {
        return (
            <NoData_db message="No penalty shootout kick data recorded for this match." />
        );
    }

    const systemBadge = config.whoStartField
        ? (kickInfo[config.whoStartField] || kickInfo.WHO_START || kickInfo["بداية"] || "---")
        : (kickInfo[config.systemField] || kickInfo["CHAMPION System"] || "---");

    return (
        <div className="match-details-pks-embed fade-in">
            <div className="pks-details-container">
                <div className="shootout-summary-card">
                    <div className="summary-row-modern">
                        <div className="team-text-luxury">{config.homeLabel}</div>
                        <div className="result-pill-luxury">
                            {formatPenalties(kickInfo, config)}
                        </div>
                        <div className="team-text-luxury">{kickInfo["OPPONENT TEAM"] || matchInfo?.["OPPONENT TEAM"] || "---"}</div>
                    </div>
                    <div className="shootout-meta-info">
                        <div className="meta-badge starter-badge">
                            <span className="starter-val">{String(systemBadge).toUpperCase()}</span>
                        </div>
                        {kickInfo[config.pksIdField] && (
                            <div className="meta-badge">PKS ID: {kickInfo[config.pksIdField]}</div>
                        )}
                        <div className="meta-badge">MATCH ID: {matchId}</div>
                        <div className="meta-badge">DATE: {formatDate(kickInfo.DATE || matchInfo?.DATE)}</div>
                        {(kickInfo.CHAMPION || matchInfo?.CHAMPION) && (
                            <div className="meta-badge">{kickInfo.CHAMPION || matchInfo?.CHAMPION}</div>
                        )}
                        {(kickInfo.SEASON || matchInfo?.SEASON || matchInfo?.["SEASON - NAME"]) && (
                            <div className="meta-badge">{kickInfo.SEASON || matchInfo?.SEASON || matchInfo?.["SEASON - NAME"]}</div>
                        )}
                        {(kickInfo.ROUND || matchInfo?.ROUND) && (
                            <div className="meta-badge">{kickInfo.ROUND || matchInfo?.ROUND}</div>
                        )}
                        <div className={`meta-badge status-${resolveShootoutResult(kickInfo, config)}`}>
                            {resolveShootoutResultLabel(kickInfo, config)}
                        </div>
                    </div>
                </div>

                <div className="internal-tabs-bar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`internal-tab-btn ${activeInternalTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveInternalTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="kicks-table-luxury">
                    {activeInternalTab.includes("gks") ? (
                        (() => {
                            const gkData = filteredKicks[0] || {};
                            const isHomeGk = activeInternalTab === config.homeTabGks;
                            const gkName = isHomeGk ? gkData[config.homeGkField] : gkData[config.oppGkField];

                            let total = filteredKicks.length;
                            let goals = 0;
                            let saves = 0;
                            let out = 0;

                            filteredKicks.forEach((kick) => {
                                const statusCol = isHomeGk ? kick[config.homeGkStatusField] : kick[config.oppGkStatusField];
                                const howCol = isHomeGk ? kick[config.homeGkHowField] : kick[config.oppGkHowField];
                                const statusStr = String(statusCol || "").toUpperCase();
                                const howStr = String(howCol || "").toLowerCase();

                                if (config.goalStatusIncludes(statusStr)) {
                                    goals += 1;
                                } else {
                                    const saveKeys = ["حارس", "الحارس", "صد", "تصدى", "gk", "save", "keeper"];
                                    const isSave = saveKeys.some((key) => howStr.includes(key));
                                    if (isSave) saves += 1;
                                    else out += 1;
                                }
                            });

                            return (
                                <div className="gk-stats-wrapper fade-in">
                                    <div className="gk-profile-header">
                                        <div className="gk-avatar">🧤</div>
                                        <div className="gk-name-box">
                                            <span className="gk-label">GOALKEEPER</span>
                                            <h2 className="gk-name-display">{gkName || "---"}</h2>
                                        </div>
                                    </div>
                                    <div className="gk-stats-grid">
                                        <div className="gk-stat-card total">
                                            <span className="s-val">{total}</span>
                                            <span className="s-lbl">TOTAL FACED</span>
                                        </div>
                                        <div className="gk-stat-card goals">
                                            <span className="s-val">{goals}</span>
                                            <span className="s-lbl">GOALS</span>
                                        </div>
                                        <div className="gk-stat-card saves">
                                            <span className="s-val">{saves}</span>
                                            <span className="s-lbl">SAVES</span>
                                        </div>
                                        <div className="gk-stat-card misses">
                                            <span className="s-val">{out}</span>
                                            <span className="s-lbl">NOT ON TARGET</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <>
                            <div className="kicks-header">
                                <div className="k-col-seq">#</div>
                                <div className="k-col-main">PLAYER</div>
                                <div className="k-col-result">RESULT</div>
                                <div className="k-col-note">HOW</div>
                            </div>
                            <div className="kicks-body">
                                {filteredKicks.length > 0 ? filteredKicks.map((kick, idx) => {
                                    const isHomeTab = activeInternalTab === config.homeTabPlayers;
                                    const name = isHomeTab ? kick[config.homePlayerField] : kick[config.oppPlayerField];
                                    const status = isHomeTab ? kick[config.homeStatusField] : kick[config.oppStatusField];
                                    const how = isHomeTab ? kick[config.homeHowMissField] : kick[config.oppHowMissField];
                                    const isGoal = config.goalStatusIncludes(status);

                                    return (
                                        <div key={idx} className="kick-row-premium">
                                            <div className="k-col-seq">{idx + 1}</div>
                                            <div className="k-col-main">
                                                <span className="player-name-val">{name || "---"}</span>
                                            </div>
                                            <div className="k-col-result">
                                                <div className={`kick-indicator ${isGoal ? "goal" : "miss"}`}>
                                                    {isGoal ? "⚽ GOAL" : "❌ MISS"}
                                                </div>
                                            </div>
                                            <div className="k-col-note">
                                                <span className="kick-note-txt">{how || ""}</span>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <NoData_db message="NO RECORDED DATA FOR THIS CATEGORY" />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
