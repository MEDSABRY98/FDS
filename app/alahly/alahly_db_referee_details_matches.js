"use client";

import { useState } from "react";

export default function Referee_Matches_Module({ stats }) {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const totalMatches = stats.matchHistory.length;
    const totalPages = Math.ceil(totalMatches / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = stats.matchHistory.slice(startIdx, startIdx + pageSize);

    return (
        <div className="history-section fade-in" style={{ paddingTop: '20px' }}>
            <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', maxWidth: '1400px', width: '95%', margin: '0 auto 15px auto' }}>
                <div className="history-title" style={{ fontFamily: 'Bebas Neue', fontSize: '24px', letterSpacing: '2px', color: 'var(--player-gold)' }}>GAMES REFEREED <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px' }}>({totalMatches} GAMES)</span></div>
            </div>

            <div style={{ overflowX: 'auto', maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
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
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>PEN (F-A)</th>
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
                                    <td style={{ color: 'var(--player-gold)', fontWeight: '800', textAlign: 'center', fontSize: '15px', fontFamily: 'Outfit' }}>{m.opponent}</td>
                                    <td style={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '18px', textAlign: 'center', letterSpacing: '0.5px', color: '#000' }}>
                                        {m.gf} - {m.ga}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="m-role-pill"
                                            style={{
                                                background: m.wdl === 'W' ? 'rgba(46, 204, 113, 0.15)' : (m.wdl === 'L' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(230, 126, 34, 0.15)'),
                                                color: m.wdl === 'W' ? '#2ecc71' : (m.wdl === 'L' ? '#e74c3c' : '#e67e22'),
                                                fontFamily: 'Space Mono',
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '800'
                                            }}>
                                            {m.wdl === 'W' ? 'AHLY WIN' : (m.wdl === 'L' ? 'AHLY LOSS' : 'DRAW')}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '14px', fontWeight: '800' }}>
                                        <span style={{ color: '#f39c12' }}>{m.penFor}</span> - <span style={{ color: '#e67e22' }}>{m.penAgainst}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ padding: '80px', textAlign: 'center', opacity: 0.4, fontFamily: 'Space Mono' }}>
                                    NO MATCH RECORDS FOUND FOR THIS REFEREE
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-pagination" style={{ marginTop: '20px', justifyContent: 'center', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }} style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.3)', color: 'var(--player-gold)', padding: '8px 18px', borderRadius: '10px', fontFamily: 'Space Mono', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>PREV</button>
                    <span style={{ fontFamily: 'Space Mono', fontSize: '13px', color: 'var(--player-gold)', letterSpacing: '2px', fontWeight: '800' }}>PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }} style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.3)', color: 'var(--player-gold)', padding: '8px 18px', borderRadius: '10px', fontFamily: 'Space Mono', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>NEXT</button>
                </div>
            )}
        </div>
    );
}
