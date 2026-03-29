"use client";

import { useState, useMemo } from "react";

export default function GK_Matches_Component_Unique({
    stats,
    gkName,
    gkDetails,
    renderEventsCell
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [threshold, setThreshold] = useState(1);
    const [operator, setOperator] = useState('>=');
    const pageSize = 50;

    const filteredMatches = useMemo(() => {
        return stats.matchHistory.filter(m => {
            if (filter === 'all') return true;
            let val = 0;
            if (filter === 'gc') val = (m.gc || 0);
            else if (filter === 'cs') val = (m.gc === 0 ? 1 : 0);
            else if (filter === 'psm') val = (m.psm || 0);
            else if (filter === 'pg') val = (m.pg || 0);

            const numThreshold = parseInt(threshold) || 1;
            if (operator === '>=') return val >= numThreshold;
            if (operator === '==') return val === numThreshold;
            if (operator === '<=') return val <= numThreshold && val > 0;
            return true;
        });
    }, [stats.matchHistory, filter, threshold, operator]);

    const totalMatchesNum = filteredMatches.length;
    const totalPages = Math.ceil(totalMatchesNum / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = filteredMatches.slice(startIdx, startIdx + pageSize);

    const summary = useMemo(() => {
        const s = { gc: 0, cs: 0, psm: 0, pg: 0 };
        filteredMatches.forEach(m => {
            s.gc += (m.gc || 0);
            if (m.gc === 0) s.cs += 1;
            s.psm += (m.psm || 0);
            s.pg += (m.pg || 0);
        });
        return s;
    }, [filteredMatches]);

    return (
        <div className="history-section fade-in">
            <div className="history-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
                <div className="history-title" style={{ textAlign: 'center' }}>
                    GK MATCHES PLAYED
                    <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px', marginLeft: '10px' }}>
                        ({totalMatchesNum} {filter === 'all' ? 'GAMES' : 'MATCHES FOUND'})
                    </span>
                </div>

                <div className="event-filters-wrap" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="filter-controls-group" style={{ display: 'flex', gap: '5px', background: '#fff', padding: '5px', borderRadius: '15px', border: '1px solid #e0e0e0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <select
                            value={filter}
                            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                            className="event-white-select type-select"
                        >
                            <option value="all">ALL MATCHES</option>
                            <option value="gc">GOALS CONC.</option>
                            <option value="cs">CLEAN SHEETS</option>
                            <option value="psm">PEN SAVED</option>
                            <option value="pg">PEN GOALS</option>
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
                            <span className="sum-val">{totalMatchesNum}</span>
                        </div>
                        <div className="sum-premium-divider"></div>
                        <div className="sum-premium-item" style={{ opacity: filter === 'all' ? 0.3 : 1, transition: '0.3s' }}>
                            <span className="sum-label">TOTAL {filter === 'all' ? 'STATS' : (filter === 'psm' ? 'PS' : filter.toUpperCase())}</span>
                            <span className="sum-val" style={{ color: 'var(--player-gold)' }}>
                                {(() => {
                                    if (filter === 'all') return '—';
                                    return summary[filter] || 0;
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
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>#</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>MATCH ID</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>DATE</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>SEASON</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>OPPONENT TEAM</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>STATUS</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>TIME</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>GOALS CONC.</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontFamily: 'Space Mono', color: '#999', borderBottom: '2px solid #eee', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>STATS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMatches.length > 0 ? (
                            currentMatches.map((m, idx) => (
                                <tr key={startIdx + idx}>
                                    <td style={{ color: '#888', fontSize: '12px', textAlign: 'center', fontFamily: 'Space Mono' }}>{startIdx + idx + 1}</td>
                                    <td className="m-id-cell" style={{ textAlign: 'center', fontFamily: 'Space Mono', color: 'var(--player-gold)', fontSize: '12px' }}>{m.idx}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '800', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.date}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '800', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.season}</td>
                                    <td style={{ color: 'var(--player-gold)', fontWeight: '800', textAlign: 'center', fontSize: '15px', fontFamily: 'Outfit' }}>{m.opponent}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`m-role-pill ${m.role === 'اساسي' ? 'role-starter' : 'role-sub'}`}
                                            style={{ fontFamily: 'Space Mono', fontSize: '11px', fontWeight: '800' }}>
                                            {m.role === 'اساسي' || !m.role ? 'Starter' : 'Sub'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 900, fontFamily: 'Outfit', fontSize: '18px', textAlign: 'center' }}>{m.mins}'</td>
                                    <td style={{ fontWeight: 900, fontFamily: 'Outfit', fontSize: '18px', textAlign: 'center', color: m.gc > 0 ? '#e74c3c' : '#2ecc71' }}>{m.gc}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {renderEventsCell(m)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" style={{ padding: '80px', textAlign: 'center', opacity: 0.4, fontFamily: 'Space Mono' }}>
                                    NO MATCH RECORDS FOUND FOR THIS GK
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
