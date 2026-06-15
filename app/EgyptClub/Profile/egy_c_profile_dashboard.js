"use client";

import { useMemo, useEffect } from 'react';
import { 
    Trophy, 
    Percent, 
    Target, 
    Shield, 
    Flame, 
    MapPin, 
    Award, 
    TrendingUp, 
    TrendingDown, 
    AlertTriangle 
} from 'lucide-react';
import { exportMatchesToExcel } from '../ExcelExport/egy_c_excel_export';

export default function EgyptClubProfileDashboard({ clubProfile }) {
    useEffect(() => {
        const handleGlobalExport = () => {
            exportMatchesToExcel(clubProfile.matches || [], `${clubProfile.name || "Club"}_Matches`);
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [clubProfile]);

    const played = clubProfile.played || 0;
    const wins = clubProfile.wins || 0;
    const draws = clubProfile.draws || 0;
    const losses = clubProfile.losses || 0;
    const gf = clubProfile.gf || 0;
    const ga = clubProfile.ga || 0;
    const gd = clubProfile.gd || 0;
    const winRate = clubProfile.winRate || 0;
    const matches = clubProfile.matches || [];

    // Calculate advanced stats
    const stats = useMemo(() => {
        // Clean sheets
        const cleanSheets = matches.filter(m => Number(m.GA) === 0).length;
        const cleanSheetRate = played > 0 ? Math.round((cleanSheets / played) * 100) : 0;

        // Failed to score
        const failedToScore = matches.filter(m => Number(m.GF) === 0).length;
        const failedToScoreRate = played > 0 ? Math.round((failedToScore / played) * 100) : 0;

        // Averages
        const avgGf = played > 0 ? (gf / played).toFixed(2) : "0.00";
        const avgGa = played > 0 ? (ga / played).toFixed(2) : "0.00";

        // Home / Away / Neutral breakdowns
        const homeMatches = matches.filter(m => m["H-A-N"] === "H");
        const homeWins = homeMatches.filter(m => m["W-D-L"] === "W").length;
        const homeDraws = homeMatches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;
        const homeLosses = homeMatches.filter(m => m["W-D-L"] === "L").length;
        const homeGf = homeMatches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const homeGa = homeMatches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
        const homeWinRate = homeMatches.length > 0 ? Math.round((homeWins / homeMatches.length) * 100) : 0;

        const awayMatches = matches.filter(m => m["H-A-N"] === "A");
        const awayWins = awayMatches.filter(m => m["W-D-L"] === "W").length;
        const awayDraws = awayMatches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;
        const awayLosses = awayMatches.filter(m => m["W-D-L"] === "L").length;
        const awayGf = awayMatches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const awayGa = awayMatches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
        const awayWinRate = awayMatches.length > 0 ? Math.round((awayWins / awayMatches.length) * 100) : 0;

        const neutralMatches = matches.filter(m => m["H-A-N"] === "N");
        const neutralWins = neutralMatches.filter(m => m["W-D-L"] === "W").length;
        const neutralDraws = neutralMatches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;
        const neutralLosses = neutralMatches.filter(m => m["W-D-L"] === "L").length;
        const neutralGf = neutralMatches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const neutralGa = neutralMatches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
        const neutralWinRate = neutralMatches.length > 0 ? Math.round((neutralWins / neutralMatches.length) * 100) : 0;

        // Biggest Win
        let biggestWin = null;
        let maxWinDiff = -1;
        matches.forEach(m => {
            if (m["W-D-L"] === "W") {
                const diff = (Number(m.GF) || 0) - (Number(m.GA) || 0);
                if (diff > maxWinDiff) {
                    maxWinDiff = diff;
                    biggestWin = m;
                } else if (diff === maxWinDiff && biggestWin) {
                    if ((Number(m.GF) || 0) > (Number(biggestWin.GF) || 0)) {
                        biggestWin = m;
                    }
                }
            }
        });

        // Biggest Loss
        let biggestLoss = null;
        let maxLossDiff = -1;
        matches.forEach(m => {
            if (m["W-D-L"] === "L") {
                const diff = (Number(m.GA) || 0) - (Number(m.GF) || 0);
                if (diff > maxLossDiff) {
                    maxLossDiff = diff;
                    biggestLoss = m;
                } else if (diff === maxLossDiff && biggestLoss) {
                    if ((Number(m.GA) || 0) > (Number(biggestLoss.GA) || 0)) {
                        biggestLoss = m;
                    }
                }
            }
        });

        // Highest Scoring Match
        let highestScoring = null;
        let maxTotalGoals = -1;
        matches.forEach(m => {
            const total = (Number(m.GF) || 0) + (Number(m.GA) || 0);
            if (total > maxTotalGoals) {
                maxTotalGoals = total;
                highestScoring = m;
            }
        });

        return {
            cleanSheets,
            cleanSheetRate,
            failedToScore,
            failedToScoreRate,
            avgGf,
            avgGa,
            home: { played: homeMatches.length, wins: homeWins, draws: homeDraws, losses: homeLosses, gf: homeGf, ga: homeGa, winRate: homeWinRate },
            away: { played: awayMatches.length, wins: awayWins, draws: awayDraws, losses: awayLosses, gf: awayGf, ga: awayGa, winRate: awayWinRate },
            neutral: { played: neutralMatches.length, wins: neutralWins, draws: neutralDraws, losses: neutralLosses, gf: neutralGf, ga: neutralGa, winRate: neutralWinRate },
            biggestWin,
            biggestLoss,
            highestScoring
        };
    }, [matches, played, gf, ga]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    };

    return (
        <div className="profile-dashboard fade-in" style={{ paddingBottom: '20px' }}>
            {/* KPI grid */}
            <div className="kpi-section-grid">
                {[
                    { label: "PLAYED", val: played, icon: <ActivityIcon /> },
                    { label: "WINS", val: wins, color: '#00c853', icon: <TrophyIcon color="#00c853" /> },
                    { label: "DRAWS", val: draws, color: 'var(--gold, #c9a84c)', icon: <DrawsIcon color="var(--gold, #c9a84c)" /> },
                    { label: "LOSSES", val: losses, color: '#ff4d4d', icon: <LossIcon color="#ff4d4d" /> },
                    { label: "GOALS FOR", val: gf, icon: <FlameIcon /> },
                    { label: "GOALS AGST", val: ga, icon: <ShieldIcon /> },
                    { label: "GOAL DIFF", val: gd > 0 ? `+${gd}` : gd, color: gd > 0 ? '#00c853' : (gd < 0 ? '#ff4d4d' : '#888'), icon: <GoalDiffIcon /> },
                    { label: "WIN RATE", val: `${winRate}%`, color: 'var(--gold, #c9a84c)', icon: <PercentIcon color="var(--gold, #c9a84c)" /> }
                ].map((card, idx) => (
                    <div key={idx} className="dashboard-kpi-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="kpi-card-label">{card.label}</div>
                                <div className="kpi-card-val" style={{ color: card.color || '#111' }}>{card.val}</div>
                            </div>
                            <div className="kpi-card-icon-wrap">{card.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Advanced Stats & Special Matches Grid */}
            <div className="details-grid">
                {/* Advanced Stats */}
                <div className="details-section-card">
                    <h3 className="section-card-title"><Trophy size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> ADVANCED RATIOS</h3>
                    
                    <div className="stat-row-group">
                        <div className="detailed-stat-row">
                            <span className="detailed-stat-label">Clean Sheets</span>
                            <span className="detailed-stat-value">{stats.cleanSheets} <span className="sub-unit">({stats.cleanSheetRate}%)</span></span>
                        </div>
                        <div className="detailed-stat-row">
                            <span className="detailed-stat-label">Failed to Score</span>
                            <span className="detailed-stat-value">{stats.failedToScore} <span className="sub-unit">({stats.failedToScoreRate}%)</span></span>
                        </div>
                        <div className="detailed-stat-row">
                            <span className="detailed-stat-label">Avg. Goals Scored / Match</span>
                            <span className="detailed-stat-value" style={{ fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>{stats.avgGf}</span>
                        </div>
                        <div className="detailed-stat-row">
                            <span className="detailed-stat-label">Avg. Goals Conceded / Match</span>
                            <span className="detailed-stat-value" style={{ fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>{stats.avgGa}</span>
                        </div>
                    </div>

                    <h4 className="sub-section-title"><MapPin size={14} style={{ color: '#888' }} /> VENUE BREAKDOWN</h4>
                    <div className="venue-table-wrapper">
                        <table className="venue-stats-table">
                            <thead>
                                <tr>
                                    <th>VENUE</th>
                                    <th>P</th>
                                    <th>W</th>
                                    <th>D</th>
                                    <th>L</th>
                                    <th>GOALS</th>
                                    <th>WIN%</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Home (H)</td>
                                    <td>{stats.home.played}</td>
                                    <td style={{ color: '#00c853', fontWeight: '600' }}>{stats.home.wins}</td>
                                    <td style={{ color: 'var(--gold, #c9a84c)' }}>{stats.home.draws}</td>
                                    <td style={{ color: '#ff4d4d' }}>{stats.home.losses}</td>
                                    <td>{stats.home.gf}:{stats.home.ga}</td>
                                    <td style={{ fontWeight: 'bold' }}>{stats.home.winRate}%</td>
                                </tr>
                                <tr>
                                    <td>Away (A)</td>
                                    <td>{stats.away.played}</td>
                                    <td style={{ color: '#00c853', fontWeight: '600' }}>{stats.away.wins}</td>
                                    <td style={{ color: 'var(--gold, #c9a84c)' }}>{stats.away.draws}</td>
                                    <td style={{ color: '#ff4d4d' }}>{stats.away.losses}</td>
                                    <td>{stats.away.gf}:{stats.away.ga}</td>
                                    <td style={{ fontWeight: 'bold' }}>{stats.away.winRate}%</td>
                                </tr>
                                <tr>
                                    <td>Neutral (N)</td>
                                    <td>{stats.neutral.played}</td>
                                    <td style={{ color: '#00c853', fontWeight: '600' }}>{stats.neutral.wins}</td>
                                    <td style={{ color: 'var(--gold, #c9a84c)' }}>{stats.neutral.draws}</td>
                                    <td style={{ color: '#ff4d4d' }}>{stats.neutral.losses}</td>
                                    <td>{stats.neutral.gf}:{stats.neutral.ga}</td>
                                    <td style={{ fontWeight: 'bold' }}>{stats.neutral.winRate}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Record Matches */}
                <div className="details-section-card">
                    <h3 className="section-card-title"><Award size={18} style={{ color: 'var(--gold, #c9a84c)' }} /> RECORD MATCHES</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
                        {/* Biggest Win */}
                        <div className="record-match-box" style={{ borderLeft: '4px solid #00c853' }}>
                            <div className="record-match-header">
                                <span className="record-badge win"><TrendingUp size={12} /> BIGGEST WIN</span>
                                <span className="record-date">{stats.biggestWin ? formatDate(stats.biggestWin.DATE) : ""}</span>
                            </div>
                            {stats.biggestWin ? (
                                <div className="record-match-body">
                                    <div className="record-match-teams">
                                        🛡️ {stats.biggestWin["EGYPT TEAM"]} <span className="vs">vs</span> 🚩 {stats.biggestWin["OPPONENT TEAM"]}
                                    </div>
                                    <div className="record-match-score">
                                        Score: <span className="score-highlight green">{stats.biggestWin.GF} - {stats.biggestWin.GA}</span>
                                        <span className="record-competition">({stats.biggestWin.ROUND} · {stats.biggestWin.SEASON.split(' - ')[0]})</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-record-msg">No wins recorded yet</div>
                            )}
                        </div>

                        {/* Biggest Loss */}
                        <div className="record-match-box" style={{ borderLeft: '4px solid #ff4d4d' }}>
                            <div className="record-match-header">
                                <span className="record-badge loss"><TrendingDown size={12} /> BIGGEST LOSS</span>
                                <span className="record-date">{stats.biggestLoss ? formatDate(stats.biggestLoss.DATE) : ""}</span>
                            </div>
                            {stats.biggestLoss ? (
                                <div className="record-match-body">
                                    <div className="record-match-teams">
                                        🛡️ {stats.biggestLoss["EGYPT TEAM"]} <span className="vs">vs</span> 🚩 {stats.biggestLoss["OPPONENT TEAM"]}
                                    </div>
                                    <div className="record-match-score">
                                        Score: <span className="score-highlight red">{stats.biggestLoss.GF} - {stats.biggestLoss.GA}</span>
                                        <span className="record-competition">({stats.biggestLoss.ROUND} · {stats.biggestLoss.SEASON.split(' - ')[0]})</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-record-msg">No losses recorded yet</div>
                            )}
                        </div>

                        {/* Highest Scoring Match */}
                        <div className="record-match-box" style={{ borderLeft: '4px solid var(--gold, #c9a84c)' }}>
                            <div className="record-match-header">
                                <span className="record-badge goal"><Flame size={12} /> HIGHEST SCORING MATCH</span>
                                <span className="record-date">{stats.highestScoring ? formatDate(stats.highestScoring.DATE) : ""}</span>
                            </div>
                            {stats.highestScoring ? (
                                <div className="record-match-body">
                                    <div className="record-match-teams">
                                        🛡️ {stats.highestScoring["EGYPT TEAM"]} <span className="vs">vs</span> 🚩 {stats.highestScoring["OPPONENT TEAM"]}
                                    </div>
                                    <div className="record-match-score">
                                        Score: <span className="score-highlight gold">{stats.highestScoring.GF} - {stats.highestScoring.GA}</span>
                                        <span className="record-competition">({stats.highestScoring.ROUND} · {stats.highestScoring.SEASON.split(' - ')[0]})</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-record-msg">No matches played yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .kpi-section-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 25px;
                }

                .dashboard-kpi-card {
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid rgba(10, 10, 10, 0.06);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    position: relative;
                    transition: all 0.2s ease-in-out;
                }

                .dashboard-kpi-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                    border-color: var(--gold, #c9a84c);
                }

                .kpi-card-label {
                    fontSize: 10px;
                    font-family: 'Space Mono', monospace;
                    letter-spacing: 1.5px;
                    color: #777;
                    margin-bottom: 8px;
                    font-weight: bold;
                }

                .kpi-card-val {
                    font-size: 32px;
                    font-family: 'Bebas Neue', sans-serif;
                    font-weight: bold;
                    line-height: 1;
                }

                .kpi-card-icon-wrap {
                    opacity: 0.8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 10px;
                }

                @media (max-width: 900px) {
                    .details-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .details-section-card {
                    background: #ffffff;
                    border: 1px solid rgba(10, 10, 10, 0.06);
                    border-radius: 8px;
                    padding: 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                }

                .section-card-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 22px;
                    letter-spacing: 1px;
                    margin: 0 0 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #111;
                    border-bottom: 1px solid #f0f0f0;
                    padding-bottom: 10px;
                }

                .stat-row-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 25px;
                }

                .detailed-stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #f9f9f9;
                }

                .detailed-stat-label {
                    font-size: 14px;
                    color: #555;
                    font-weight: 500;
                }

                .detailed-stat-value {
                    font-size: 15px;
                    font-weight: 600;
                    color: #111;
                }

                .sub-unit {
                    font-size: 12px;
                    color: #888;
                    font-weight: normal;
                }

                .sub-section-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 16px;
                    letter-spacing: 0.5px;
                    margin: 20px 0 10px 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #666;
                }

                .venue-table-wrapper {
                    overflow-x: auto;
                }

                .venue-stats-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                    text-align: center;
                }

                .venue-stats-table th {
                    font-weight: 600;
                    color: #888;
                    padding: 8px 4px;
                    border-bottom: 1px solid #eee;
                }

                .venue-stats-table td {
                    padding: 10px 4px;
                    border-bottom: 1px solid #f9f9f9;
                    color: #333;
                }

                .record-match-box {
                    background: #fcfcfc;
                    border: 1px solid rgba(10, 10, 10, 0.04);
                    border-radius: 4px;
                    padding: 12px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .record-match-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .record-badge {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                    padding: 2px 8px;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .record-badge.win {
                    background: rgba(0, 200, 83, 0.1);
                    color: #00c853;
                }

                .record-badge.loss {
                    background: rgba(255, 77, 77, 0.1);
                    color: #ff4d4d;
                }

                .record-badge.goal {
                    background: rgba(201, 168, 76, 0.1);
                    color: var(--gold, #c9a84c);
                }

                .record-date {
                    font-size: 11px;
                    font-family: 'Space Mono', monospace;
                    color: #888;
                }

                .record-match-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .record-match-teams {
                    font-weight: 600;
                    font-size: 14px;
                    color: #111;
                }

                .record-match-teams .vs {
                    font-size: 12px;
                    color: #aaa;
                    font-weight: normal;
                }

                .record-match-score {
                    font-size: 12px;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .score-highlight {
                    font-weight: bold;
                    font-family: 'Space Mono', monospace;
                }

                .score-highlight.green {
                    color: #00c853;
                }

                .score-highlight.red {
                    color: #ff4d4d;
                }

                .score-highlight.gold {
                    color: var(--gold, #c9a84c);
                }

                .record-competition {
                    font-size: 11px;
                    color: #999;
                }

                .no-record-msg {
                    font-size: 13px;
                    color: #888;
                    font-style: italic;
                    text-align: center;
                    padding: 10px 0;
                }
            `}</style>
        </div>
    );
}

// Micro icons
function TrophyIcon({ color = '#888' }) {
    return <Trophy size={20} style={{ color }} />;
}
function ActivityIcon() {
    return <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c853', boxShadow: '0 0 8px #00c853' }} />;
}
function DrawsIcon({ color }) {
    return <Target size={18} style={{ color }} />;
}
function PercentIcon({ color }) {
    return <Percent size={18} style={{ color }} />;
}
function LossIcon({ color }) {
    return <AlertTriangle size={18} style={{ color }} />;
}
function FlameIcon() {
    return <Flame size={20} style={{ color: '#ff9100' }} />;
}
function ShieldIcon() {
    return <Shield size={20} style={{ color: '#00b0ff' }} />;
}
function GoalDiffIcon() {
    return <Award size={20} style={{ color: 'var(--gold, #c9a84c)' }} />;
}
