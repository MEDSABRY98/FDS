"use client";

import { useState } from "react";

export default function GK_Overview_Component_Unique({ stats }) {
    const [popupData, setPopupData] = useState(null);
    const [activeStreakIdx, setActiveStreakIdx] = useState(0);

    const openStreakPopup = (type) => {
        const streaks = type === 'cs' ? stats.allStreaksCS : stats.allStreaksGC;
        if (streaks?.length > 0) {
            setPopupData({
                type,
                title: type === 'cs' ? "Clean Sheet Streaks (3+ matches)" : "Conceded Streaks (3+ matches)",
                allStreaks: streaks,
                color: type === 'cs' ? "#27ae60" : "#e74c3c"
            });
            setActiveStreakIdx(0);
        }
    };

    const currentStreak = popupData?.allStreaks[activeStreakIdx];

    return (
        <div className="stats-grid-premium fade-in">
            <div className="stat-card-premium">
                <span className="stat-label-modern">Total Appearances</span>
                <div className="stat-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.caps}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheets</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.cleanSheets}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Goals Conceded</span>
                <div className="stat-value-modern" style={{ color: stats.goalsConceded > 0 ? '#e74c3c' : '#27ae60' }}>{stats.goalsConceded}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Conceded Per Game</span>
                <div className="stat-value-modern" style={{ color: '#f39c12' }}>{stats.caps > 0 ? (stats.goalsConceded / stats.caps).toFixed(2) : 0}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Clean Sheet Rate</span>
                <div className="stat-value-modern" style={{ color: '#2ecc71' }}>{stats.caps > 0 ? ((stats.cleanSheets / stats.caps) * 100).toFixed(1) : 0}%</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Received</span>
                <div className="stat-value-modern" style={{ color: '#9b59b6' }}>{stats.penaltiesReceived}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalties Saved</span>
                <div className="stat-value-modern" style={{ color: '#2980b9' }}>{stats.penaltiesSaved}</div>
            </div>
            <div className="stat-card-premium">
                <span className="stat-label-modern">Penalty Save Rate</span>
                <div className="stat-value-modern" style={{ color: '#3498db' }}>{stats.penaltiesReceived > 0 ? ((stats.penaltiesSaved / stats.penaltiesReceived) * 100).toFixed(1) : 0}%</div>
            </div>

            {/* Clickable Streak Cards */}
            <div className="stat-card-premium clickable-streak" onClick={() => openStreakPopup('cs')} style={{ cursor: 'pointer', transition: '0.3s' }}>
                <span className="stat-label-modern">Max Clean Sheet Streak</span>
                <div className="stat-value-modern" style={{ color: '#27ae60' }}>{stats.maxCSStreak || 0}</div>
                <div className="streak-info-hint">Click for all streaks ({stats.allStreaksCS?.length || 0})</div>
            </div>
            <div className="stat-card-premium clickable-streak" onClick={() => openStreakPopup('gc')} style={{ cursor: 'pointer', transition: '0.3s' }}>
                <span className="stat-label-modern">Max Conceded Streak</span>
                <div className="stat-value-modern" style={{ color: '#e74c3c' }}>{stats.maxGCStreak || 0}</div>
                <div className="streak-info-hint">Click for all streaks ({stats.allStreaksGC?.length || 0})</div>
            </div>

            {/* Streak Popup Modal */}
            {popupData && (
                <div className="streak-modal-overlay fade-in" onClick={() => setPopupData(null)}>
                    <div className="streak-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="streak-modal-header" style={{ borderBottom: `4px solid ${popupData.color}` }}>
                            <div className="streak-modal-title">{popupData.title}</div>

                            {/* Streak Selection / Pagination */}
                            <div className="streak-nav-pill-container">
                                {popupData.allStreaks.map((s, idx) => (
                                    <button
                                        key={idx}
                                        className={`streak-nav-pill ${activeStreakIdx === idx ? 'active' : ''}`}
                                        onClick={() => setActiveStreakIdx(idx)}
                                        style={{ '--streak-color': popupData.color }}
                                    >
                                        #{idx + 1} ({s.length} Matches)
                                    </button>
                                ))}
                            </div>

                            <div className="streak-modal-range">
                                📅 {currentStreak.matches[0].date} — {currentStreak.matches[currentStreak.matches.length - 1].date}
                            </div>
                            <button className="close-streak-modal" onClick={() => setPopupData(null)}>&times;</button>
                        </div>

                        <div className="streak-matches-wrapper">
                            <table className="streak-table-modern">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th style={{ width: `calc((100% - 60px) / ${popupData.type === 'gc' ? 5 : 4})` }}>MATCH ID</th>
                                        <th style={{ width: `calc((100% - 60px) / ${popupData.type === 'gc' ? 5 : 4})` }}>DATE</th>
                                        <th style={{ width: `calc((100% - 60px) / ${popupData.type === 'gc' ? 5 : 4})` }}>SEASON</th>
                                        <th style={{ width: `calc((100% - 60px) / ${popupData.type === 'gc' ? 5 : 4})` }}>OPPONENT</th>
                                        {popupData.type === 'gc' && <th style={{ width: `calc((100% - 60px) / 5)` }}>GC</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentStreak.matches.map((m, i) => (
                                        <tr key={i}>
                                            <td className="st-idx-num">{i + 1}</td>
                                            <td className="st-id">{m.idx}</td>
                                            <td className="st-date">{m.date}</td>
                                            <td className="st-season">{m.season}</td>
                                            <td className="st-opp">{m.opponent}</td>
                                            {popupData.type === 'gc' && (
                                                <td className="st-gc-val" style={{ color: '#e74c3c', fontWeight: '900' }}>{m.gc}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .clickable-streak:hover { transform: translateY(-5px); border-color: var(--player-gold); box-shadow: 0 10px 25px rgba(201,168,76,0.1); }
                .streak-info-hint { font-size: 10px; color: #888; margin-top: 5px; font-family: 'Space Mono', monospace; text-transform: uppercase; }
                
                .streak-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000;
                    backdrop-filter: blur(5px);
                }
                .streak-modal-content {
                    background: #fff; width: 98%; max-width: 1300px; max-height: 90vh;
                    border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
                }
                .streak-modal-header { padding: 25px; display: flex; flex-direction: column; position: relative; background: #fafafa; text-align: center; }
                .streak-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 2px; color: #000; margin-bottom: 15px; }
                
                .streak-nav-pill-container { 
                    display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 15px;
                    max-height: 100px; overflow-y: auto; padding: 5px;
                }
                .streak-nav-pill {
                    padding: 6px 14px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700;
                    border: 1px solid #ddd; background: #fff; color: #888; cursor: pointer; transition: 0.2s;
                    border-radius: 20px;
                }
                .streak-nav-pill:hover { border-color: var(--streak-color); color: var(--streak-color); }
                .streak-nav-pill.active { background: var(--streak-color); color: #fff; border-color: var(--streak-color); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

                .streak-modal-range { font-family: 'Space Mono', monospace; font-size: 15px; color: #444; font-weight: 700; letter-spacing: 1px; }
                
                .close-streak-modal { 
                    position: absolute; top: 15px; right: 20px; background: none; border: none; 
                    font-size: 40px; color: #aaa; cursor: pointer; transition: 0.2s; 
                }
                .close-streak-modal:hover { color: #000; }

                .streak-matches-wrapper { overflow-y: auto; padding: 0; }
                
                .streak-table-modern { width: 100%; border-collapse: collapse; table-layout: fixed; }
                .streak-table-modern th {
                    position: sticky; top: 0; background: #f4f4f4; padding: 20px 15px;
                    text-align: center; font-family: 'Space Mono', monospace; font-size: 14px;
                    color: #444; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #ddd;
                    z-index: 10;
                }
                .streak-table-modern td { 
                    padding: 22px 15px; border-bottom: 1px solid #eee; font-size: 16px; 
                    color: #333; text-align: center;
                }
                
                .st-idx-num { font-family: 'Space Mono', monospace; color: #bbb; font-size: 14px; font-weight: 700; }
                .st-id { 
                    font-family: 'Space Mono', monospace; font-size: 13px; color: #000; font-weight: 800; 
                    background: #fdfdfd; white-space: nowrap; padding: 0 15px !important;
                }
                .st-date { font-family: 'Space Mono', monospace; font-size: 14px; white-space: nowrap; color: #555; }
                .st-season { color: var(--gold); font-weight: 800; font-size: 14px; white-space: nowrap; }
                .st-opp { font-weight: 800; font-size: 18px; white-space: nowrap; }
                
                .streak-table-modern tbody tr:hover { background: #f8f8f8; }
                .streak-table-modern tbody tr:hover .st-id { background: var(--gold); color: #000; }

                .streak-matches-wrapper::-webkit-scrollbar { width: 10px; }
                .streak-matches-wrapper::-webkit-scrollbar-track { background: #f1f1f1; }
                .streak-matches-wrapper::-webkit-scrollbar-thumb { background: #bbb; border-radius: 5px; }
            `}</style>
        </div>
    );
}
