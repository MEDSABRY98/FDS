"use client";

import { useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export default function GK_VsPlayers_Component_Unique({ stats }) {
    const [search, setSearch] = useState("");

    const scorerStore = stats.statsByScorer || {};
    const scorerNames = Object.keys(scorerStore)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (scorerStore[b].goals - scorerStore[a].goals) || a.localeCompare(b));

    const totals = scorerNames.reduce((acc, name) => {
        const s = scorerStore[name];
        acc.goals += s.goals || 0;
        acc.pens_scored += s.pens_scored || 0;
        acc.pens_saved += s.pens_saved || 0;
        acc.pens_missed += s.pens_missed || 0;
        return acc;
    }, { goals: 0, pens_scored: 0, pens_saved: 0, pens_missed: 0 });

    const thStyle = {
        padding: '16px 20px',
        textAlign: 'center',
        fontSize: '13px',
        fontFamily: 'Space Mono',
        color: '#999',
        borderBottom: '2px solid #eee',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        fontWeight: '700',
    };

    const tdStyle = {
        padding: '18px 20px',
        textAlign: 'center',
        fontFamily: 'Outfit',
        fontWeight: '900',
        fontSize: '18px',
    };

    return (
        <div className="history-section fade-in">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <SearchBar_db
                        value={search}
                        onChange={setSearch}
                        placeholder="SEARCH SCORER NAME..."
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                {scorerNames.length === 0 ? (
                    <NoData_db message="No data available." />
                ) : (
                    <table className="player-match-table vs-teams-table" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "30%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "17%" }} />
                            <col style={{ width: "17%" }} />
                            <col style={{ width: "18%" }} />
                        </colgroup>
                    <thead>
                        <tr>
                            <th style={thStyle}>PLAYER NAME</th>
                            <th style={thStyle}>TOTAL GOALS</th>
                            <th style={thStyle}>P. SCORED</th>
                            <th style={thStyle}>P. SAVED</th>
                            <th style={thStyle}>P. MISSED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scorerNames.map(name => {
                                const s = scorerStore[name];
                                return (
                                    <tr key={name}>
                                        <td style={{ ...tdStyle, fontWeight: '800', color: '#000', fontSize: '15px', wordBreak: 'break-word' }}>{name}</td>
                                        <td style={{ ...tdStyle, color: '#e74c3c' }}>{s.goals || "-"}</td>
                                        <td style={tdStyle}>{s.pens_scored || "-"}</td>
                                        <td style={{ ...tdStyle, color: (s.pens_saved > 0 ? '#2980b9' : 'inherit') }}>{s.pens_saved || "-"}</td>
                                        <td style={{ ...tdStyle, color: (s.pens_missed > 0 ? '#e67e22' : 'inherit') }}>{s.pens_missed || "-"}</td>
                                    </tr>
                            );
                        })}
                        <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '20px', textAlign: 'center', fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.goals || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px' }}>{totals.pens_scored || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5dade2', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.pens_saved || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#f39c12', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.pens_missed || "-"}</td>
                            </tr>
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
}
