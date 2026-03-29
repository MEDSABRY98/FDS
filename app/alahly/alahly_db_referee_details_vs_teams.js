"use client";

import { useMemo, useState } from "react";

export default function Referee_VsTeams_Module({ stats }) {
    const [search, setSearch] = useState("");
    const oppStore = stats.statsByOpponent || {};

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
            acc.penFor += s.penFor;
            acc.penAgainst += s.penAgainst;
            return acc;
        }, { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0, penFor: 0, penAgainst: 0 });
    }, [oppStore, oppNames]);

    return (
        <div className="history-section fade-in" style={{ paddingTop: '20px' }}>
            <div className="history-title" style={{ marginBottom: '15px' }}>REFEREE PERFORMANCE VS OPPONENTS</div>

            {/* Replicated Premium Search Box Centered */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div className="search-wrap-premium" style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="SEARCH OPPONENT TEAM..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-search-input"
                        style={{ textAlign: 'center' }}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto', maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
                <table className="player-match-table vs-teams-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>OPPONENT TEAM</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>MATCHES</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>W</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>D</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>L</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>WIN %</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>GS-GA</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>PEN F-A</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>CS F-A</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oppNames.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '100px', opacity: 0.3, fontFamily: 'Space Mono' }}>No opponent data found matching filters.</td>
                            </tr>
                        ) : (
                            oppNames.map(name => {
                                const s = oppStore[name];
                                const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: '#000', fontSize: '15px', fontFamily: 'Outfit', textAlign: 'center' }}>{name}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px', color: 'var(--player-gold)' }}>{s.matches || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.wins || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.draws || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.losses || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#000', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{wr}%</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '800', fontSize: '14px' }}>{s.gs} - {s.ga}</td>
                                        <td style={{ textAlign: 'center', color: '#000', fontWeight: '900', fontSize: '16px', fontFamily: 'Outfit' }}>{s.penFor} - {s.penAgainst}</td>
                                        <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '16px', fontFamily: 'Outfit' }}>{s.csFor} / <span style={{ color: '#ff6b6b' }}>{s.csAgainst}</span></td>
                                    </tr>
                                );
                            })
                        )}
                        {oppNames.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit', textAlign: 'center' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px', color: 'var(--player-gold)' }}>{totals.matches || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.wins || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.draws || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.losses || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>
                                    {totals.matches > 0 ? ((totals.wins / totals.matches) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '900', fontSize: '15px' }}>{totals.gs} - {totals.ga}</td>
                                <td style={{ textAlign: 'center', color: '#000', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{totals.penFor} - {totals.penAgainst}</td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{totals.csFor} / <span style={{ color: '#ff6b6b' }}>{totals.csAgainst}</span></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
