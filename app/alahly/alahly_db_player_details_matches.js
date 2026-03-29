import { useState } from "react";

export default function PlayerMatchesTable({
    stats,
    playerName,
    playerDetails,
    renderEventsCell
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const totalMatches = stats.matchHistory.length;
    const totalPages = Math.ceil(totalMatches / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = stats.matchHistory.slice(startIdx, startIdx + pageSize);

    return (
        <div className="history-section fade-in">
            <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div className="history-title">MATCHES PLAYED <span style={{ color: '#aaa', fontSize: '12px', letterSpacing: '1px' }}>({totalMatches} GAMES)</span></div>
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
                        {currentMatches.length > 0 ? (
                            currentMatches.map((m, idx) => (
                                <tr key={startIdx + idx}>
                                    <td style={{ color: '#ccc', fontSize: '11px' }}>{startIdx + idx + 1}</td>
                                    <td className="m-id-cell">{m.id}</td>
                                    <td style={{ fontSize: '12px', opacity: 0.7 }}>{m.date}</td>
                                    <td style={{ fontSize: '12px', opacity: 0.7 }}>{m.season}</td>
                                    <td style={{ color: 'var(--player-gold)' }}>{m.opponent}</td>
                                    <td>
                                        <span className={`m-role-pill ${m.role === 'اساسي' ? 'role-starter' : 'role-sub'}`}>
                                            {m.role === 'اساسي' ? 'Starter' : 'Sub'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 800 }}>{m.mins}'</td>
                                    <td>
                                        {renderEventsCell({ ...m, allEvents: (playerDetails || []).filter(e => String(e.MATCH_ID) === String(m.id) && String(e["PLAYER NAME"] || "").trim() === playerName) })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ padding: '80px', textAlign: 'center', opacity: 0.4, fontFamily: 'Space Mono' }}>
                                    NO MATCH RECORDS FOUND FOR THIS PLAYER
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
