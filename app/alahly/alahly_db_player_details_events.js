import { useState, useMemo } from "react";

export default function PlayerEventsTable({
    stats,
    renderEventsCell
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('goal'); // Default to goal for better discovery
    const [threshold, setThreshold] = useState(1);
    const [operator, setOperator] = useState('>=');
    const pageSize = 50;

    const filteredEvents = useMemo(() => {
        return stats.matchEventsHistory.filter(m => {
            let val = 0;
            if (filter === 'all') return true;
            if (filter === 'goal') val = (m.goals || 0);
            else if (filter === 'assist') val = (m.assists || 0);
            else if (filter === 'pengoal') val = (m.penGoals || 0);
            else if (filter === 'pensaved') val = (m.penSaved || 0);
            else if (filter === 'penmissed') val = (m.penMissed || 0);
            else if (filter === 'wongoal') val = (m.wonGoal || 0);
            else if (filter === 'wonmiss') val = (m.wonMiss || 0);
            else if (filter === 'makegoal') val = (m.makeGoal || 0);
            else if (filter === 'makemiss') val = (m.makeGoal || 0);

            const numThreshold = parseInt(threshold) || 1;
            if (operator === '>=') return val >= numThreshold;
            if (operator === '==') return val === numThreshold;
            if (operator === '<=') return val <= numThreshold && val > 0;
            return true;
        });
    }, [stats.matchEventsHistory, filter, threshold, operator]);

    const totalEvents = filteredEvents.length;
    const totalPages = Math.ceil(totalEvents / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentEvents = filteredEvents.slice(startIdx, startIdx + pageSize);

    // Calculate Dynamic Summary for the filtered set
    const summary = useMemo(() => {
        const s = { g: 0, a: 0, pg: 0, ps: 0, pm: 0, wg: 0, wm: 0, cg: 0, cm: 0 };
        filteredEvents.forEach(m => {
            s.g += (m.goals || 0);
            s.a += (m.assists || 0);
            s.pg += (m.penGoals || 0);
            s.ps += (m.penSaved || 0);
            s.pm += (m.penMissed || 0);
            s.wg += (m.wonGoal || 0);
            s.wm += (m.wonMiss || 0);
            s.cg += (m.makeGoal || 0);
            s.cm += (m.makeMiss || 0);
        });
        return s;
    }, [filteredEvents]);

    return (
        <div className="history-section fade-in">
            <div className="history-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
                <div className="history-title" style={{ textAlign: 'center' }}>
                    PERFORMANCE EVENTS
                    <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px', marginLeft: '10px' }}>
                        ({totalEvents} {filter === 'all' ? 'GAMES' : 'MATCHES FOUND'})
                    </span>
                </div>

                <div className="event-filters-wrap" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="filter-controls-group" style={{ display: 'flex', gap: '5px', background: '#fff', padding: '5px', borderRadius: '15px', border: '1px solid #e0e0e0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <select
                            value={filter}
                            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                            className="event-white-select type-select"
                        >
                            <option value="all">ALL EVENTS</option>
                            <option value="goal">GOALS</option>
                            <option value="assist">ASSISTS</option>
                            <option value="pengoal">P-GOAL</option>
                            <option value="pensaved">P-SAVED</option>
                            <option value="penmissed">P-MISSED</option>
                            <option value="wongoal">W-P (G)</option>
                            <option value="wonmiss">W-P (M)</option>
                            <option value="makegoal">C-P (G)</option>
                            <option value="makemiss">C-P (M)</option>
                        </select>

                        <div style={{ display: 'flex', gap: '5px', opacity: filter === 'all' ? 0.3 : 1, pointerEvents: filter === 'all' ? 'none' : 'auto', transition: '0.3s' }}>
                            <select
                                value={operator}
                                onChange={(e) => { setOperator(e.target.value); setCurrentPage(1); }}
                                className="event-white-select op-select"
                                disabled={filter === 'all'}
                            >
                                <option value=">=">≥</option>
                                <option value="==">=</option>
                                <option value="<=">≤</option>
                            </select>

                            <input
                                type="number"
                                min="1"
                                value={threshold}
                                onChange={(e) => { setThreshold(e.target.value); setCurrentPage(1); }}
                                className="event-white-input"
                                disabled={filter === 'all'}
                            />
                        </div>
                    </div>

                    <div className="event-summary-box-premium">
                        <div className="sum-premium-item">
                            <span className="sum-label">MATCHES</span>
                            <span className="sum-val">{totalEvents}</span>
                        </div>
                        <div className="sum-premium-divider"></div>
                        <div className="sum-premium-item" style={{ opacity: filter === 'all' ? 0.3 : 1, transition: '0.3s' }}>
                            <span className="sum-label">TOTAL {filter === 'all' ? 'STATS' : filter.toUpperCase()}</span>
                            <span className="sum-val" style={{ color: 'var(--player-gold)' }}>
                                {(() => {
                                    if (filter === 'all') return '—';
                                    const keyMap = { goal: 'g', assist: 'a', pengoal: 'pg', pensaved: 'ps', penmissed: 'pm', wongoal: 'wg', wonmiss: 'wm', makegoal: 'cg', makemiss: 'cm' };
                                    return summary[keyMap[filter]] || 0;
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>MATCH ID</th>
                            <th>DATE</th>
                            <th>SEASON</th>
                            <th>OPPONENT TEAM</th>
                            <th>STATUS</th>
                            <th>TIME</th>
                            <th>EVENTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentEvents.length > 0 ? (
                            currentEvents.map((m, idx) => (
                                <tr key={startIdx + idx}>
                                    <td style={{ color: '#ccc', fontSize: '11px' }}>{startIdx + idx + 1}</td>
                                    <td className="m-id-cell">{m.id}</td>
                                    <td style={{ fontSize: '12px', opacity: 0.7 }}>{m.date}</td>
                                    <td style={{ fontSize: '12px', opacity: 0.7 }}>{m.season}</td>
                                    <td style={{ color: 'var(--player-gold)' }}>{m.opponent}</td>
                                    <td>
                                        <span className={`m-role-pill ${m.role && m.role !== '—' ? (m.role === 'اساسي' ? 'role-starter' : 'role-sub') : ''}`}>
                                            {m.role === 'اساسي' ? 'Starter' : (m.role === 'احتياطي' || m.role === 'بديلا' ? 'Sub' : (m.role || '—'))}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 800 }}>{m.mins && m.mins !== '—' ? `${m.mins}'` : '—'}</td>
                                    <td>{renderEventsCell(m)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ padding: '80px', textAlign: 'center', opacity: 0.4, fontFamily: 'Space Mono' }}>
                                    NO PERFORMANCE EVENTS FOUND FOR THIS PLAYER
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-pagination" style={{ marginTop: '20px', justifyContent: 'center' }}>
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>PREV</button>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>NEXT</button>
                </div>
            )}

            <style jsx>{`
                .event-white-select {
                    background: #fff;
                    border: none;
                    color: #000;
                    padding: 10px 15px;
                    border-radius: 10px;
                    font-family: 'Space Mono';
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    outline: none;
                    transition: 0.2s;
                }
                .type-select { width: 140px; }
                .op-select { width: 60px; text-align: center; background: #f5f5f5; color: var(--player-gold); }
                .event-white-select:hover { background: #f9f9f9; }

                .event-white-input {
                    background: #fff;
                    border: none;
                    width: 60px;
                    padding: 8px;
                    border-radius: 10px;
                    font-family: 'Bebas Neue';
                    font-size: 20px;
                    color: #000;
                    text-align: center;
                    outline: none;
                }
                .event-white-input::-webkit-inner-spin-button { opacity: 1; }

                .event-summary-box-premium {
                    display: flex;
                    align-items: center;
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    padding: 5px 25px;
                    border-radius: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                }
                .sum-premium-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 5px 15px;
                }
                .sum-premium-divider {
                    width: 1px;
                    height: 30px;
                    background: #eee;
                }
                .sum-label {
                    font-family: 'Space Mono';
                    font-size: 9px;
                    color: #aaa;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                .sum-val {
                    font-family: 'Bebas Neue';
                    font-size: 24px;
                    color: #000;
                    letter-spacing: 1px;
                    line-height: 1.1;
                }

                .p-pagination { display: flex; gap: 12px; align-items: center; }
                .p-pagination button { 
                    background: rgba(201, 168, 76, 0.15); 
                    border: 1px solid rgba(201, 168, 76, 0.3); 
                    color: var(--player-gold); 
                    padding: 8px 18px; 
                    border-radius: 10px; 
                    font-family: 'Space Mono'; 
                    font-weight: 700;
                    font-size: 11px; 
                    cursor: pointer; 
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .p-pagination button:hover:not(:disabled) { 
                    background: var(--player-gold); 
                    color: #000; 
                    border-color: var(--player-gold);
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.2);
                    transform: translateY(-1px);
                }
                .p-pagination button:disabled { 
                    opacity: 0.2; 
                    cursor: not-allowed; 
                    border-color: rgba(255,255,255,0.1);
                    color: #666;
                }
                .p-pagination span { 
                    font-family: 'Space Mono'; 
                    font-size: 13px; 
                    color: var(--player-gold); 
                    letter-spacing: 2px; 
                    font-weight: 800;
                    text-shadow: 0 0 5px rgba(201,168,76,0.1);
                }
            `}</style>
        </div>
    );
}
