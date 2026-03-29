"use client";

import { useMemo, useState } from "react";

export default function Manager_VsTeams_Module({ stats, managerStatus }) {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState(managerStatus === 'alahly' ? 'AHLY' : 'OPPONENT');

    const oppStore = role === 'AHLY' ? (stats.statsByOpponent || {}) : (stats.statsAsOpponentMgr || {});

    const oppNames = useMemo(() => {
        return Object.keys(oppStore)
            .filter(name => name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (oppStore[b].matches - oppStore[a].matches) || a.localeCompare(b));
    }, [oppStore, search]);

    const totals = useMemo(() => {
        return oppNames.reduce((acc, name) => {
            const s = oppStore[name];
            acc.matches += s.matches;
            acc.wins += s.wins;
            acc.draws += s.draws;
            acc.losses += s.losses;
            acc.gs += s.gs;
            acc.ga += s.ga;
            acc.csFor += s.csFor;
            acc.csAgainst += s.csAgainst;
            return acc;
        }, { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 });
    }, [oppStore, oppNames]);

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>MANAGER PERFORMANCE VS OPPONENTS</div>

            {/* Role Toggle & Search Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
                {/* Role Switcher */}
                <div className="role-switcher-modern" style={{ display: 'flex', background: '#f5f5f5', padding: '5px', borderRadius: '15px', border: '1px solid #eee' }}>
                    <button
                        onClick={() => setRole('AHLY')}
                        className={`role-btn ${role === 'AHLY' ? 'active' : ''}`}
                        style={{ padding: '10px 25px', borderRadius: '12px', border: 'none', background: role === 'AHLY' ? 'var(--player-gold)' : 'transparent', color: role === 'AHLY' ? '#000' : '#888', fontFamily: 'Space Mono', fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}
                    >
                        AS AHLY MANAGER
                    </button>
                    <button
                        onClick={() => setRole('OPPONENT')}
                        className={`role-btn ${role === 'OPPONENT' ? 'active' : ''}`}
                        style={{ padding: '10px 25px', borderRadius: '12px', border: 'none', background: role === 'OPPONENT' ? 'var(--player-gold)' : 'transparent', color: role === 'OPPONENT' ? '#000' : '#888', fontFamily: 'Space Mono', fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}
                    >
                        AS OPPONENT MANAGER
                    </button>
                </div>

                {/* Search Box */}
                <div className="search-wrap-premium" style={{ width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder={role === 'AHLY' ? "SEARCH OPPONENT TEAM..." : "SEARCH MANAGED TEAM..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-search-input"
                        style={{ textAlign: 'center' }}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table vs-teams-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>
                                {role === 'AHLY' ? 'OPPONENT TEAM' : 'MANAGED TEAM'}
                            </th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>MATCHES</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>W</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>D</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>L</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>WIN %</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>GS-GA</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>CS FOR</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>CS AGAINST</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oppNames.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
                                    {role === 'AHLY'
                                        ? "No manager matches as Al Ahly manager found."
                                        : "No matches as opponent manager (against Al Ahly) found."
                                    }
                                </td>
                            </tr>
                        ) : (
                            oppNames.map(name => {
                                const s = oppStore[name];
                                const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '15px', fontFamily: 'Outfit' }}>
                                            {name}
                                        </td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px', color: 'var(--player-gold)' }}>{s.matches || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.wins || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.draws || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.losses || "-"}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--player-dark)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{wr}%</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '800', fontSize: '14px' }}>{s.gs} - {s.ga}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.csFor || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.csAgainst || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        {oppNames.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px' }}>{totals.matches || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.wins || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.draws || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.losses || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>
                                    {totals.matches > 0 ? ((totals.wins / totals.matches) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '900', fontSize: '15px' }}>{totals.gs} - {totals.ga}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.csFor || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.csAgainst || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .role-btn:hover:not(.active) {
                    background: rgba(201, 168, 76, 0.1) !important;
                    color: #000 !important;
                }
            `}</style>
        </div>
    );
}
