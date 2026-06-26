"use client";

import NoData_db from "../../lib/NoData_db";
import { getTopChampionshipsForChart } from "./alahly_db_penalties_utils";

function PenaltyDonut({ scored, missed, saved }) {
    const total = (scored || 0) + (missed || 0) + (saved || 0);
    const conversion = total ? Math.round((scored / total) * 100) : 0;

    if (!total) {
        return <div className="penalty-donut-empty">—</div>;
    }

    const scoredPct = (scored / total) * 100;
    const missedPct = (missed / total) * 100;

    let gradient;
    if (saved > 0) {
        gradient = `conic-gradient(
            #2ecc71 0% ${scoredPct}%,
            #e74c3c ${scoredPct}% ${scoredPct + missedPct}%,
            #3498db ${scoredPct + missedPct}% 100%
        )`;
    } else if (missed > 0) {
        gradient = `conic-gradient(
            #2ecc71 0% ${scoredPct}%,
            #e74c3c ${scoredPct}% 100%
        )`;
    } else {
        gradient = "conic-gradient(#2ecc71 0% 100%)";
    }

    return (
        <div className="penalty-donut">
            <div className="penalty-donut-ring" style={{ background: gradient }}>
                <div className="penalty-donut-hole">
                    <span className="penalty-donut-pct">{conversion}%</span>
                    <span className="penalty-donut-label">CONV</span>
                </div>
            </div>
        </div>
    );
}

function CompetitionDonutCard({ row, rank }) {
    const scored = row.scored || 0;
    const missed = row.missed || 0;
    const saved = row.saved || 0;
    const total = row.attFor || scored + missed + saved;

    return (
        <div className="penalty-comp-card">
            <div className="penalty-comp-rank">#{rank}</div>
            <h3 className="penalty-comp-title" title={row.name}>{row.name}</h3>
            <div className="penalty-comp-body">
                <PenaltyDonut scored={scored} missed={missed} saved={saved} />
                <div className="penalty-comp-stats">
                    <div className="penalty-comp-stat">
                        <span className="penalty-comp-dot" style={{ background: "#2ecc71" }} />
                        <span className="penalty-comp-stat-label">Scored</span>
                        <strong style={{ color: "#2ecc71" }}>{scored}</strong>
                    </div>
                    <div className="penalty-comp-stat">
                        <span className="penalty-comp-dot" style={{ background: "#e74c3c" }} />
                        <span className="penalty-comp-stat-label">Missed</span>
                        <strong style={{ color: "#e74c3c" }}>{missed}</strong>
                    </div>
                    {saved > 0 && (
                        <div className="penalty-comp-stat">
                            <span className="penalty-comp-dot" style={{ background: "#3498db" }} />
                            <span className="penalty-comp-stat-label">Saved</span>
                            <strong style={{ color: "#3498db" }}>{saved}</strong>
                        </div>
                    )}
                    <div className="penalty-comp-total">
                        <span>Total shots</span>
                        <strong>{total}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AlAhlyPenaltiesDashboard({ teamStats, events }) {
    const { forAhly, againstAhly } = teamStats;
    const chartRows = getTopChampionshipsForChart(events, 6);
    const againstAttempts = (againstAhly.concGoal || 0) + (againstAhly.concMiss || 0) + (againstAhly.concSaved || 0);
    const againstConversion = againstAttempts
        ? ((againstAhly.concGoal / againstAttempts) * 100).toFixed(1)
        : "0.0";
    const hasData = forAhly.attFor > 0 || againstAttempts > 0;

    if (!hasData) {
        return <NoData_db message="NO PENALTY DATA IN CURRENT FILTER" />;
    }

    return (
        <div className="penalties-dashboard-wrap">
            <div className="penalties-section-label">FOR AL AHLY</div>
            <div className="kpi-grid penalties-kpi-grid">
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">ATTEMPTS</span>
                    <div className="kpi-value">{forAhly.attFor}</div>
                    <div className="kpi-sub">Total penalty shots</div>
                </div>
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">SCORED</span>
                    <div className="kpi-value" style={{ color: "#2ecc71" }}>{forAhly.scored}</div>
                    <div className="kpi-sub">Conversion {forAhly.conversion}%</div>
                </div>
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">MISSED</span>
                    <div className="kpi-value" style={{ color: "#e74c3c" }}>{forAhly.missed}</div>
                    <div className="kpi-sub">Off target / post</div>
                </div>
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">SAVED</span>
                    <div className="kpi-value" style={{ color: "#3498db" }}>{forAhly.saved}</div>
                    <div className="kpi-sub">GK saves</div>
                </div>
            </div>

            <div className="penalties-section-label">AGAINST AL AHLY</div>
            <div className="kpi-grid penalties-kpi-grid">
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">ATTEMPTS</span>
                    <div className="kpi-value">{againstAttempts}</div>
                    <div className="kpi-sub">Total penalty shots</div>
                </div>
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">SCORED</span>
                    <div className="kpi-value" style={{ color: "#2ecc71" }}>{againstAhly.concGoal}</div>
                    <div className="kpi-sub">Conversion {againstConversion}%</div>
                </div>
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">MISSED</span>
                    <div className="kpi-value" style={{ color: "#e74c3c" }}>{againstAhly.concMiss}</div>
                    <div className="kpi-sub">Off target / post</div>
                </div>
                <div className="kpi-card penalties-kpi-card">
                    <span className="kpi-label">SAVED</span>
                    <div className="kpi-value" style={{ color: "#3498db" }}>{againstAhly.concSaved}</div>
                    <div className="kpi-sub">GK saves</div>
                </div>
            </div>

            {chartRows.length > 0 && (
                <div className="penalties-chart-card penalties-donut-section">
                    <div className="penalties-chart-header">
                        <span>TOP COMPETITIONS — AHLY PENALTIES</span>
                        <div className="penalties-chart-legend">
                            <span style={{ color: "#2ecc71" }}>■ SCORED</span>
                            <span style={{ color: "#e74c3c" }}>■ MISSED</span>
                            <span style={{ color: "#3498db" }}>■ SAVED</span>
                        </div>
                    </div>
                    <div className="penalties-donut-grid">
                        {chartRows.map((row, idx) => (
                            <CompetitionDonutCard key={row.name} row={row} rank={idx + 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
