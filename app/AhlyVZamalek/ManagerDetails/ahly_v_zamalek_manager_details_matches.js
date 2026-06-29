"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

function matchSearchText(m) {
    return [
        m.idx,
        m.date,
        m.champion,
        m.season,
        m.gf,
        m.ga,
        m.wdl,
    ].map(v => String(v ?? "").toLowerCase()).join(" ");
}

export default function ManagerMatches({ stats }) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const matchHistory = stats.matchHistory || [];

    const filteredMatches = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return matchHistory;
        return matchHistory.filter(m => matchSearchText(m).includes(q));
    }, [matchHistory, search]);

    const totalMatches = filteredMatches.length;
    const totalPages = Math.ceil(totalMatches / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = filteredMatches.slice(startIdx, startIdx + pageSize);

    const handleSearchChange = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    return (
        <div className="history-section fade-in">
            {matchHistory.length > 0 && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                    <div style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                        <SearchBar_db
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="SEARCH MATCHES..."
                        />
                    </div>
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                {currentMatches.length === 0 ? (
                    <NoData_db message={matchHistory.length === 0 ? "NO MATCH RECORDS FOUND FOR THIS MANAGER" : "No matches match your search."} />
                ) : (
                    <table className="player-match-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>#</th>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>MATCH ID</th>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>DATE</th>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>CHAMPIONSHIP</th>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>SEASON</th>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>SCORE</th>
                                <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px' }}>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMatches.map((m, idx) => (
                                <tr key={startIdx + idx}>
                                    <td style={{ color: '#888', fontSize: '12px', textAlign: 'center', fontFamily: 'Space Mono' }}>{startIdx + idx + 1}</td>
                                    <td className="m-id-cell" style={{ textAlign: 'center', fontFamily: 'Space Mono', color: 'var(--mgr-gold)', fontSize: '12px' }}>{m.idx}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '700', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.date}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '700', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.champion}</td>
                                    <td style={{ fontSize: '15px', fontWeight: '700', textAlign: 'center', fontFamily: 'Outfit', color: '#000' }}>{m.season}</td>
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
                                                fontWeight: '800',
                                                padding: '4px 12px',
                                                borderRadius: '20px'
                                            }}>
                                            {m.wdl === 'W' ? 'WIN' : (m.wdl === 'L' ? 'LOSS' : 'DRAW')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
                    color: var(--mgr-gold); 
                    padding: 8px 18px; 
                    border-radius: 10px; 
                    font-family: 'Space Mono'; 
                    font-weight: 700;
                    font-size: 11px; 
                    cursor: pointer; 
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .p-pagination button:hover:not(:disabled) { 
                    background: var(--mgr-gold); 
                    color: #000; 
                    border-color: var(--mgr-gold);
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.2);
                }
                .p-pagination button:disabled { opacity: 0.2; cursor: not-allowed; }
                .p-pagination span { font-family: 'Space Mono'; font-size: 13px; color: var(--mgr-gold); letter-spacing: 2px; font-weight: 800; }
            `}</style>
        </div>
    );
}
