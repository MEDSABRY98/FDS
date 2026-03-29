"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_matches.css";

export default function AlAhlyMatches({ matches, onMatchClick }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const pageSize = 50;

    const filteredBySearch = useMemo(() => {
        if (!searchTerm) return matches || [];
        const lowSearch = searchTerm.toLowerCase().trim();
        return (matches || []).filter(m => {
            return (
                String(m["OPPONENT TEAM"] || "").toLowerCase().includes(lowSearch) ||
                String(m["OPPONENT MANAGER"] || "").toLowerCase().includes(lowSearch) ||
                String(m["AHLY MANAGER"] || "").toLowerCase().includes(lowSearch) ||
                String(m["SEASON - NAME"] || "").toLowerCase().includes(lowSearch) ||
                String(m.STAD || "").toLowerCase().includes(lowSearch) ||
                String(m.REFREE || "").toLowerCase().includes(lowSearch)
            );
        });
    }, [matches, searchTerm]);

    const groupMatchesByMonth = (matchList) => {
        const groups = {};
        matchList.forEach(m => {
            if (!m.DATE) return;
            const date = new Date(m.DATE);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
            if (!groups[monthYear]) groups[monthYear] = [];
            groups[monthYear].push(m);
        });
        return groups;
    };

    const paginatedMatches = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredBySearch.slice(start, start + pageSize);
    }, [filteredBySearch, currentPage]);

    const groupedMatches = useMemo(() => groupMatchesByMonth(paginatedMatches), [paginatedMatches]);
    const totalPages = Math.ceil(filteredBySearch.length / pageSize);

    useEffect(() => {
        setCurrentPage(1);
    }, [matches, searchTerm]);

    const formatPenalties = (penString) => {
        if (!penString) return "";
        const isLoss = penString.toUpperCase().includes('L');
        const isWin = penString.toUpperCase().includes('W');
        const numbers = penString.match(/\d+/g);
        if (!numbers || numbers.length < 2) return `(${penString})`;
        let n1 = parseInt(numbers[0]);
        let n2 = parseInt(numbers[1]);
        const low = Math.min(n1, n2);
        const high = Math.max(n1, n2);
        return isLoss ? `(L ${low}-${high})` : `(W ${high}-${low})`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const VenueIndicator = ({ venue, type }) => {
        const v = String(venue || 'N').trim().toUpperCase();
        return <div className={`venue-circle ${type}`}>{v}</div>;
    };

    return (
        <div className="tab-content" id="tab-matches">
            <div className="matches-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                <div style={{ paddingBottom: '10px' }}>
                    <div className="header-tabs-container">
                        <div className="section-title">AL AHLY <span className="accent">MATCHES</span></div>
                    </div>
                    <div className="gold-line"></div>

                    <div className="match-search-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '500px' }}>
                            <input
                                type="text"
                                placeholder="Search matches (Team, Manager, Stad, Referee...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#fff',
                                    border: '2px solid #eee',
                                    borderRadius: '50px',
                                    padding: '18px 30px',
                                    fontSize: '15px',
                                    fontFamily: 'Outfit, sans-serif',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.04)',
                                    outline: 'none',
                                    textAlign: 'center',
                                    transition: '0.3s'
                                }}
                                className="m-search-box"
                            />
                        </div>
                    </div>
                </div>

                {Object.keys(groupedMatches).length === 0 ? (
                    <div className="empty-state-lux">No matches found for current filters.</div>
                ) : (
                    Object.keys(groupedMatches).map(monthYear => (
                        <div key={monthYear} className="month-section fade-in">
                            <div className="luxury-month-divider">
                                <span className="m-text">{monthYear}</span>
                                <div className="m-line"></div>
                            </div>

                            <div className="match-list-vertical">
                                {groupedMatches[monthYear].map(m => (
                                    <div key={m.MATCH_ID} className="modern-match-row-h" onClick={() => onMatchClick && onMatchClick(m.MATCH_ID)} style={{
                                        cursor: 'pointer',
                                        background: '#fff',
                                        marginBottom: '6px',
                                        borderRadius: '12px',
                                        padding: '10px 25px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        border: '1px solid #eee',
                                        transition: '0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}>
                                        {/* Date and Season cell */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '320px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '12px', color: '#888', width: '85px', fontFamily: 'Space Mono, monospace' }}>{formatDate(m.DATE)}</div>
                                            <div style={{ height: '15px', width: '1px', background: '#eee' }}></div>
                                            <div style={{ fontSize: '15px', color: 'var(--gold)', fontWeight: '800', flex: 1 }}>🏆 {m["SEASON - NAME"]}</div>
                                        </div>

                                        {/* Main Match Center (Flex 1) */}
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '0 20px' }}>
                                            <div style={{ flex: 1, textAlign: 'right', fontWeight: '800', fontSize: '18px', color: m["H-A-N"] === 'A' ? '#aaa' : '#000' }}>النادي الأهلي</div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Space Mono', letterSpacing: '-1px', color: '#000' }}>
                                                    {m.GF} <span style={{ color: 'var(--gold)' }}>—</span> {m.GA}
                                                </div>
                                                {m.PEN && <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '700', marginTop: '-3px' }}>{formatPenalties(m.PEN)}</div>}
                                            </div>

                                            <div style={{ flex: 1, textAlign: 'left', fontWeight: '800', fontSize: '16px', color: m["H-A-N"] === 'H' ? '#999' : '#000' }}>{m["OPPONENT TEAM"]}</div>
                                        </div>

                                        {/* Venue indicator on the right */}
                                        <div style={{ width: '60px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                                            <VenueIndicator venue={m["H-A-N"]} type="ahly" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {totalPages > 1 && (
                    <div className="pagination-matches">
                        <button className="page-btn prev-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>PREV</button>
                        <div className="page-info">PAGE <span className="p-num">{currentPage}</span> OF <span className="p-num">{totalPages}</span></div>
                        <button className="page-btn next-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>NEXT</button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .m-search-box:focus { border-color: var(--gold) !important; box-shadow: 0 10px 30px rgba(201,168,76,0.15) !important; }
                
                .luxury-month-divider { display: flex; align-items: center; gap: 20px; margin: 40px 0 20px; }
                .m-text { font-family: 'Space Mono', monospace; font-weight: 800; font-size: 14px; color: #555; background: #f0f0f0; padding: 4px 15px; border-radius: 50px; }
                .m-line { flex: 1; height: 1px; background: linear-gradient(to right, #ddd, transparent); }

                .match-list-vertical { display: flex; flex-direction: column; gap: 4px; }

                .modern-match-row-h:hover { transform: translateX(5px); border-color: var(--gold); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                
                .pagination-matches { margin-top: 50px; display: flex; align-items: center; justify-content: center; gap: 30px; padding: 30px 0; }
                .page-btn { background: #fff; border: 2px solid #eee; padding: 10px 25px; border-radius: 50px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.3s; color: #000; letter-spacing: 1px; }
                .page-btn:hover:not(:disabled) { border-color: var(--gold); box-shadow: 0 5px 15px rgba(201,168,76,0.15); }
                .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .page-info { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 400; color: #888; }
                .p-num { color: #000; font-weight: 800; padding: 0 4px; }

                .venue-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; font-family: 'Space Mono', monospace; flex-shrink: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .venue-circle.ahly { background: #000; color: var(--gold); border: 2px solid var(--gold); }
                
                .header-tabs-container { display: flex; align-items: center; justify-content: flex-start; gap: 30px; margin-bottom: 5px; }

                .empty-state-lux { text-align: center; padding: 100px; opacity: 0.4; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 1000px) {
                    .modern-match-row-h { flex-direction: column; gap: 15px; padding: 20px; text-align: center; }
                    .modern-match-row-h > div { width: 100% !important; justify-content: center !important; text-align: center !important; }
                }
            `}</style>
        </div>
    );
}
