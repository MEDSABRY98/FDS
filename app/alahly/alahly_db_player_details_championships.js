"use client";

import { useMemo } from "react";

export default function PlayerChampionshipsTable({ stats }) {
    const compStore = stats.compStats || {};

    const comps = useMemo(() => {
        return Object.keys(compStore).sort((a, b) => (compStore[b].apps - compStore[a].apps) || a.localeCompare(b));
    }, [compStore]);

    const totals = useMemo(() => {
        return comps.reduce((acc, name) => {
            const s = compStore[name];
            acc.apps += s.apps;
            acc.wins += s.wins;
            acc.draws += s.draws;
            acc.losses += s.losses;
            acc.mins += s.mins;
            acc.goals += s.goals;
            acc.assists += s.assists;
            acc.penGoals += s.penGoals;
            acc.penSaved += s.penSaved;
            acc.penMissed += s.penMissed;
            return acc;
        }, { apps: 0, wins: 0, draws: 0, losses: 0, mins: 0, goals: 0, assists: 0, penGoals: 0, penSaved: 0, penMissed: 0 });
    }, [compStore, comps]);

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '25px' }}>PLAYER PERFORMANCE BY CHAMPIONSHIP</div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>CHAMPIONSHIP NAME</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>MP</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>MINS</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>G + A</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>GOALS</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>ASSISTS</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>P. GOALS</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>P. SAVED</th>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '15px', letterSpacing: '2px', color: '#666', padding: '20px 10px', textTransform: 'uppercase', fontWeight: '800' }}>P. MISSED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comps.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>No championship data available.</td>
                            </tr>
                        ) : (
                            comps.map(name => {
                                const s = compStore[name];
                                const wr = s.apps > 0 ? ((s.wins / s.apps) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '15px', fontFamily: 'Outfit' }}>{name}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '18px', color: 'var(--player-gold)' }}>{s.apps || "-"}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'Space Mono', color: '#666', fontSize: '14px', fontWeight: '700' }}>{s.mins || "-"}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{(s.goals || 0) + (s.assists || 0) || "-"}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--player-dark)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.goals || "-"}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--player-dark)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{s.assists || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#444', fontWeight: '700', fontSize: '16px', fontFamily: 'Outfit' }}>{s.penGoals || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e67e22', fontWeight: '700', fontSize: '16px', fontFamily: 'Outfit' }}>{s.penSaved || "-"}</td>
                                        <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '700', fontSize: '16px', fontFamily: 'Outfit' }}>{s.penMissed || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        {comps.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px' }}>{totals.apps || "-"}</td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', color: '#fff', fontSize: '15px', fontWeight: '900', background: 'var(--player-dark)' }}>{totals.mins || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '22px', borderLeft: '1px solid rgba(201,168,76,0.2)', fontFamily: 'Outfit' }}>{(totals.goals || 0) + (totals.assists || 0) || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.goals || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.assists || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{totals.penGoals || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{totals.penSaved || "-"}</td>
                                <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '18px', fontFamily: 'Outfit' }}>{totals.penMissed || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
