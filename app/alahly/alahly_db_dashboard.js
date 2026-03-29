"use client";

import "./alahly_db_dashboard.css";

export default function AlAhlyDashboard({ matches, season }) {
    // --- STATISTICS CALCULATIONS ---
    const total = matches.length;

    // Helper to check for Win/Draw/Loss flexibly
    const isW = (tag) => tag && tag.toUpperCase().includes('W');
    const isD = (tag) => tag && tag.toUpperCase().includes('D');
    const isL = (tag) => tag && tag.toUpperCase().includes('L');

    const wins = matches.filter(m => isW(m["W-D-L"])).length;
    const losses = matches.filter(m => isL(m["W-D-L"])).length;

    // Explicitly check for 0-0 for negative draws
    const negDraws = matches.filter(m => isD(m["W-D-L"]) && Number(m.GF) === 0 && Number(m.GA) === 0).length;
    const posDraws = matches.filter(m => isD(m["W-D-L"]) && (Number(m.GF) > 0)).length;

    const gfTotal = matches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
    const gaTotal = matches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
    const gfAvg = total > 0 ? (gfTotal / total).toFixed(2) : 0;
    const gaAvg = total > 0 ? (gaTotal / total).toFixed(2) : 0;

    const csFor = matches.filter(m => Number(m.GA) === 0).length;
    const csAgainst = matches.filter(m => Number(m.GF) === 0).length;

    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    // TOP 5 WINS
    const topWins = [...matches]
        .filter(m => isW(m["W-D-L"]))
        .sort((a, b) => (Number(b.GF) - Number(b.GA)) - (Number(a.GF) - Number(a.GA)))
        .slice(0, 5);

    // TOP 5 DEFEATS
    const worstLosses = [...matches]
        .filter(m => isL(m["W-D-L"]))
        .sort((a, b) => (Number(b.GA) - Number(b.GF)) - (Number(a.GA) - Number(a.GF)))
        .slice(0, 5);

    return (
        <div className="tab-content" id="tab-dashboard">
            <div className="dashboard-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                <div className="section-header">
                    <div className="section-title">AL AHLY <span className="accent">DASHBOARD</span></div>
                </div>

                <div className="gold-line"></div>

                {/* KPI CARDS */}
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div className="kpi-card" style={{ background: 'var(--black)', borderColor: 'var(--gold)' }}>
                        <span className="kpi-label">TOTAL MATCHES</span>
                        <div className="kpi-value" style={{ color: '#fff' }}>{total}</div>
                        <div className="kpi-sub">Overall Games</div>
                        <span className="kpi-icon">⚽</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">TOTAL WINS</span>
                        <div className="kpi-value">{wins}</div>
                        <div className="kpi-sub">↑ {winRate}% win rate</div>
                        <span className="kpi-icon">🏆</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">POS. DRAWS (+)</span>
                        <div className="kpi-value">{posDraws}</div>
                        <div className="kpi-sub">Scored (1-1, etc.)</div>
                        <span className="kpi-icon">🤝</span>
                    </div>

                    <div className="kpi-card">
                        <span className="kpi-label">NEG. DRAWS (-)</span>
                        <div className="kpi-value">{negDraws}</div>
                        <div className="kpi-sub">Scoreless (0-0)</div>
                        <span className="kpi-icon">⚪</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">LOSSES</span>
                        <div className="kpi-value" style={{ color: '#ff4d4d' }}>{losses}</div>
                        <div className="kpi-sub">Match Defeats</div>
                        <span className="kpi-icon">🔻</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">GOALS FOR / AVG</span>
                        <div className="kpi-value">{gfTotal} <span style={{ fontSize: '16px', opacity: 0.5 }}>/ {gfAvg}</span></div>
                        <div className="kpi-sub">Goals Scored</div>
                        <span className="kpi-icon">📢</span>
                    </div>

                    <div className="kpi-card">
                        <span className="kpi-label">GOALS AGST / AVG</span>
                        <div className="kpi-value">{gaTotal} <span style={{ fontSize: '16px', opacity: 0.5 }}>/ {gaAvg}</span></div>
                        <div className="kpi-sub">Goals Conceded</div>
                        <span className="kpi-icon">🥅</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">CLEAN SHEETS (F)</span>
                        <div className="kpi-value">{csFor}</div>
                        <div className="kpi-sub">Defensive Success</div>
                        <span className="kpi-icon">🛡️</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">CLEAN SHEETS (A)</span>
                        <div className="kpi-value">{csAgainst}</div>
                        <div className="kpi-sub">Offensive Blanks</div>
                        <span className="kpi-icon">🚫</span>
                    </div>
                </div>

                <div className="dash-grid">
                    {/* TOP 5 WINS */}
                    <div className="chart-card">
                        <div className="chart-card-title">Top 5 Performances (Largest Wins)</div>
                        <div className="scorer-list">
                            {topWins.length > 0 ? topWins.map((m, idx) => (
                                <div key={m.MATCH_ID} className="scorer-row" style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '12px' }}>
                                    <div className="scorer-rank">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</div>
                                    <div className="scorer-avatar">🏆</div>
                                    <div className="scorer-info">
                                        <div className="scorer-name">{m["OPPONENT TEAM"]}</div>
                                        {/* CHANGED FROM CHAMPION TO SEASON */}
                                        <div className="scorer-pos">{m["SEASON - NAME"]} · {m.DATE}</div>
                                    </div>
                                    <div className="scorer-goals" style={{ color: 'var(--gold)' }}>{m.GF} - {m.GA}</div>
                                </div>
                            )) : <div style={{ opacity: 0.4, padding: '20px' }}>No wins recorded yet.</div>}
                        </div>
                    </div>

                    {/* WORST 5 LOSSES */}
                    <div className="chart-card">
                        <div className="chart-card-title">Worst 5 Defeats (Largest Losses)</div>
                        <div className="scorer-list">
                            {worstLosses.length > 0 ? worstLosses.map((m, idx) => (
                                <div key={m.MATCH_ID} className="scorer-row" style={{ borderLeft: '3px solid #ff4d4d', paddingLeft: '12px' }}>
                                    <div className="scorer-rank">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</div>
                                    <div className="scorer-avatar">🔻</div>
                                    <div className="scorer-info">
                                        <div className="scorer-name">{m["OPPONENT TEAM"]}</div>
                                        {/* CHANGED FROM CHAMPION TO SEASON */}
                                        <div className="scorer-pos">{m["SEASON - NAME"]} · {m.DATE}</div>
                                    </div>
                                    <div className="scorer-goals" style={{ color: '#ff4d4d' }}>{m.GF} - {m.GA}</div>
                                </div>
                            )) : <div style={{ opacity: 0.4, padding: '20px' }}>No losses recorded yet.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
