import { useState, useEffect } from "react";
import { AlAhlyService } from "./alahly_db_service";

export default function PlayerGoalImpactTable({ playerName, filteredMatches = [] }) {
    const [loading, setLoading] = useState(true);
    const [originalData, setOriginalData] = useState({ winImpact: 0, drawImpact: 0, impactMatches: [] });
    const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'WIN' | 'DRAW'

    useEffect(() => {
        async function fetchImpact() {
            setLoading(true);
            const data = await AlAhlyService.getPlayerGoalImpact(playerName);
            setOriginalData(data);
            setLoading(false);
        }
        if (playerName) fetchImpact();
    }, [playerName]);

    // Apply Advanced Filters (from parent)
    const filteredIds = new Set(filteredMatches.map(m => String(m.id).trim()));
    const finalMatches = originalData.impactMatches.filter(item => {
        const mId = String(item.match.MATCH_ID).trim();
        return filteredIds.has(mId);
    });

    const winCount = finalMatches.filter(m => m.type.includes('WINNER')).length;
    const drawCount = finalMatches.filter(m => m.type.includes('DRAW')).length;

    const displayMatches = finalMatches.filter(item => {
        if (activeFilter === 'WIN') return item.type.includes('WINNER');
        if (activeFilter === 'DRAW') return item.type.includes('DRAW');
        return true;
    }).sort((a, b) => new Date(b.match.DATE.split('/').reverse().join('-')) - new Date(a.match.DATE.split('/').reverse().join('-')));

    const totalImpact = winCount + drawCount;

    if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--player-gold)', fontFamily: 'Space Mono', letterSpacing: '2px' }}>ANALYZING GOAL IMPACT...</div>;

    return (
        <div className="impact-section fade-in">
            {/* Impact Summary Cards */}
            <div className="impact-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div
                    className={`impact-card total ${activeFilter === 'ALL' ? 'active-f' : ''}`}
                    onClick={() => setActiveFilter('ALL')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-label">TOTAL DECISIVE IMPACTS</div>
                    <div className="card-value">{totalImpact}</div>
                    <div className="card-sub">Matches where goals directly avoided Loss or secured Win</div>
                </div>
                <div
                    className={`impact-card wins ${activeFilter === 'WIN' ? 'active-f' : ''}`}
                    onClick={() => setActiveFilter('WIN')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-label">MATCH-WINNING GOALS</div>
                    <div className="card-value" style={{ color: '#27ae60' }}>{winCount}</div>
                    <div className="card-sub">Goals that provided the final winning lead</div>
                </div>
                <div
                    className={`impact-card draws ${activeFilter === 'DRAW' ? 'active-f' : ''}`}
                    onClick={() => setActiveFilter('DRAW')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-label">EQUALIZING GOALS</div>
                    <div className="card-value" style={{ color: '#e67e22' }}>{drawCount}</div>
                    <div className="card-sub">Last goals scored to secure a draw point</div>
                </div>
            </div>

            <div className="history-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="history-title">DECISIVE MATCH HISTORY <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px' }}>({finalMatches.length} RECORDS)</span></div>
                <div className="filter-pills" style={{ display: 'flex', gap: '10px' }}>
                    {['ALL', 'WIN', 'DRAW'].map(f => (
                        <button
                            key={f}
                            className={`f-pill ${activeFilter === f ? 'active' : ''}`}
                            onClick={() => setActiveFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table impact-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>COMPETITION</th>
                            <th>OPPONENT</th>
                            <th>SCORE</th>
                            <th>GOAL MINS</th>
                            <th>IMPACT TYPE</th>
                            <th>RESULT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayMatches.length > 0 ? (
                            displayMatches.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontSize: '14px', opacity: 0.8 }}>{item.match.DATE}</td>
                                    <td style={{ fontSize: '14px', opacity: 0.8 }}>{item.match.CHAMPION}</td>
                                    <td style={{ color: 'var(--player-gold)', fontWeight: 800, fontSize: '16px' }}>{item.match["OPPONENT TEAM"]}</td>
                                    <td style={{ fontFamily: 'Space Mono', fontWeight: 800, fontSize: '17px' }}>{item.match.GF} - {item.match.GA}</td>
                                    <td style={{ fontSize: '15px', fontWeight: 800 }}>{item.playerMins ? item.playerMins.join(", ") + "'" : "—"}</td>
                                    <td>
                                        <span className={`impact-pill ${item.type.includes('WINNER') ? 'pill-win' : 'pill-draw'}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 800, color: item.match["W-D-L"] === 'W' ? '#27ae60' : '#e67e22' }}>
                                        {item.match["W-D-L"] === 'W' ? 'WIN' : 'DRAW'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '80px', textAlign: 'center', opacity: 0.4, fontFamily: 'Space Mono' }}>
                                    NO RECORDED GOAL IMPACTS FOR THIS PLAYER
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .impact-card {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 30px;
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    transition: 0.3s;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                }
                .impact-card::after {
                    content: '';
                    position: absolute;
                    top: 0; right: 0;
                    width: 100px; height: 100px;
                    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
                    pointer-events: none;
                }
                .impact-card {
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 30px;
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    transition: 0.3s;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                }
                .impact-card.active-f {
                    border-color: var(--player-gold);
                    background: rgba(201, 168, 76, 0.05);
                    box-shadow: 0 10px 30px rgba(201, 168, 76, 0.1);
                }
                .impact-card::after {
                    content: '';
                    position: absolute;
                    top: 0; right: 0;
                    width: 100px; height: 100px;
                    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
                    pointer-events: none;
                }
                .impact-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(201, 168, 76, 0.5);
                    box-shadow: 0 15px 50px rgba(201, 168, 76, 0.1);
                }
                .card-label { font-family: 'Space Mono'; font-size: 10px; letter-spacing: 2px; color: #888; margin-bottom: 10px; font-weight: 800; }
                .card-value { font-family: 'Bebas Neue'; font-size: 48px; color: #000; line-height: 1; }
                .card-sub { font-size: 11px; color: #666; margin-top: 10px; font-weight: 600; line-height: 1.4; }
                
                .impact-pill {
                    font-size: 11px;
                    font-weight: 800;
                    padding: 7px 14px;
                    border-radius: 6px;
                    letter-spacing: 0.5px;
                    font-family: 'Space Mono';
                }
                .pill-win { background: rgba(39, 174, 96, 0.1); color: #27ae60; border: 1px solid rgba(39, 174, 96, 0.2); }
                .pill-draw { background: rgba(230, 126, 34, 0.1); color: #e67e22; border: 1px solid rgba(230, 126, 34, 0.2); }

                .f-pill {
                    background: #eee;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-family: 'Space Mono';
                    font-weight: 800;
                    font-size: 11px;
                    cursor: pointer;
                    transition: 0.2s;
                    color: #888;
                }
                .f-pill.active {
                    background: var(--player-gold);
                    color: #000;
                }
                .f-pill:hover:not(.active) {
                    background: #d2d2d2;
                }

                .impact-table tr:hover { background: rgba(0,0,0,0.02); }
            `}</style>
        </div>
    );
}
