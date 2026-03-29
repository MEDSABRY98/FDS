"use client";

import { useState } from "react";

export default function Manager_Matches_Module({ stats }) {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const totalMatches = stats.matchHistory.length;
    const totalPages = Math.ceil(totalMatches / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = stats.matchHistory.slice(startIdx, startIdx + pageSize);

    return (
        <div className="history-section fade-in">
            <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div className="history-title">GAMES MANAGED <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px' }}>({totalMatches} GAMES)</span></div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>#</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>MATCH ID</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>DATE</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>SEASON</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>OPPONENT TEAM</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>SCORE</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>RESULT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMatches.length > 0 ? (
                            currentMatches.map((m, idx) => (
                                <tr key={startIdx + idx}>
                                    <td style={{ color: '#888', fontSize: '12px', textAlign: 'center', fontFamily: 'Space Mono' }}>{startIdx + idx + 1}</td>
                                    <td className="m-id-cell" style={{ textAlign: 'center', fontFamily: 'Space Mono', color: 'var(--player-gold)', fontSize: '12px' }}>{m.idx}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '700', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.date}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '700', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.season}</td>
                                    <td style={{ color: 'var(--player-gold)', fontWeight: '800', textAlign: 'center', fontSize: '15px', fontFamily: 'Outfit' }}>
                                        {m.role === 'Opponent' ? m.managedTeam : m.opponent}
                                    </td>
                                    <td style={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '18px', textAlign: 'center', letterSpacing: '0.5px', color: '#000' }}>
                                        {m.gf} - {m.ga}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`m-role-pill ${m.wdl === 'W' ? 'role-starter' : (m.wdl === 'L' ? 'role-sub' : '')}`}
                                            style={{
                                                background: m.wdl === 'W' ? 'rgba(46, 204, 113, 0.15)' : (m.wdl === 'L' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(230, 126, 34, 0.15)'),
                                                color: m.wdl === 'W' ? '#2ecc71' : (m.wdl === 'L' ? '#e74c3c' : '#e67e22'),
                                                fontFamily: 'Space Mono',
                                                fontSize: '11px',
                                                fontWeight: '800'
                                            }}>
                                            {m.wdl === 'W' ? 'WIN' : (m.wdl === 'L' ? 'LOSS' : 'DRAW')}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '80px', textAlign: 'center', opacity: 0.4, fontFamily: 'Space Mono' }}>
                                    NO MATCH RECORDS FOUND FOR THIS MANAGER
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-pagination" style={{ marginTop: '20px', justifyContent: 'center', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>PREV</button>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>NEXT</button>
                </div>
            )}

            <style jsx>{`
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
                }
                .p-pagination button:disabled { opacity: 0.2; cursor: not-allowed; }
                .p-pagination span { font-family: 'Space Mono'; font-size: 13px; color: var(--player-gold); letter-spacing: 2px; font-weight: 800; }
            `}</style>
        </div>
    );
}
