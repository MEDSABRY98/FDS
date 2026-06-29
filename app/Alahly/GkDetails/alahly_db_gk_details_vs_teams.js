"use client";

import { useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

function penReceived(s) {
    return (s.pr || 0) + (s.ps || 0) + (s.pm || 0);
}

export default function GK_VsTeams_Component_Unique({ stats }) {
    const [search, setSearch] = useState("");

    const oppStore = stats.statsByOpponent || {};
    const oppNames = Object.keys(oppStore)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (oppStore[b].matches - oppStore[a].matches) || a.localeCompare(b));

    const totals = oppNames.reduce((acc, name) => {
        const s = oppStore[name];
        acc.apps += s.matches;
        acc.gc += s.gc;
        acc.cs += s.cs;
        acc.pr += s.pr || 0;
        acc.ps += s.ps || 0;
        acc.pm += s.pm || 0;
        return acc;
    }, { apps: 0, gc: 0, cs: 0, pr: 0, ps: 0, pm: 0 });

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
                        placeholder="SEARCH OPPONENT TEAM..."
                    />
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                {oppNames.length === 0 ? (
                    <NoData_db message="No opponent data available." />
                ) : (
                    <table className="player-match-table vs-teams-table" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "30%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "12%" }} />
                        </colgroup>
                    <thead>
                        <tr>
                            <th style={thStyle}>OPPONENT TEAM</th>
                            <th style={thStyle}>MATCHES</th>
                            <th style={thStyle}>CS</th>
                            <th style={thStyle}>GC</th>
                            <th style={thStyle}>P. REC.</th>
                            <th style={thStyle}>P. SAVED</th>
                            <th style={thStyle}>P. MISSED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oppNames.map(name => {
                                const s = oppStore[name];
                                const received = penReceived(s);
                                return (
                                    <tr key={name}>
                                        <td style={{ ...tdStyle, fontWeight: '800', color: '#000', fontSize: '15px', wordBreak: 'break-word' }}>{name}</td>
                                        <td style={{ ...tdStyle, color: 'var(--player-gold)' }}>{s.matches || "-"}</td>
                                        <td style={{ ...tdStyle, color: '#27ae60' }}>{s.cs || "-"}</td>
                                        <td style={{ ...tdStyle, color: s.gc > 0 ? '#e74c3c' : '#27ae60' }}>{s.gc || "-"}</td>
                                        <td style={{ ...tdStyle, color: received > 0 ? '#9b59b6' : 'inherit' }}>{received || "-"}</td>
                                        <td style={{ ...tdStyle, color: (s.ps || 0) > 0 ? '#2980b9' : 'inherit' }}>{s.ps || "-"}</td>
                                        <td style={{ ...tdStyle, color: (s.pm || 0) > 0 ? '#e67e22' : 'inherit' }}>{s.pm || "-"}</td>
                                    </tr>
                            );
                        })}
                        <tr style={{ background: '#0a0a0a', color: '#fff', fontWeight: '700' }}>
                                <td style={{ padding: '20px', textAlign: 'center', fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>TOTAL</td>
                                <td style={{ padding: '20px', textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '20px', color: 'var(--player-gold)' }}>{totals.apps || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5ef193', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.cs || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: totals.gc > 0 ? '#ff6b6b' : '#5ef193', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.gc || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#bb8fce', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{penReceived(totals) || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#5dade2', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.ps || "-"}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#f39c12', fontWeight: '900', fontSize: '20px', fontFamily: 'Outfit' }}>{totals.pm || "-"}</td>
                            </tr>
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
}
