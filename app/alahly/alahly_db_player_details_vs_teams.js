import { useState } from "react";

export default function PlayerVsTeamsTable({ stats }) {
    const [search, setSearch] = useState("");

    const oppStore = stats.statsByOpponent || {};
    const oppNames = Object.keys(oppStore)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (oppStore[b].apps - oppStore[a].apps) || a.localeCompare(b));

    // Calculate Totals for the dynamic (filtered) list
    const totals = oppNames.reduce((acc, name) => {
        const s = oppStore[name];
        acc.apps += s.apps;
        acc.ga += (s.goals + s.assists);
        acc.goals += s.goals;
        acc.assists += s.assists;
        acc.penG += s.penGoals;
        acc.penS += s.penSaved || 0;
        acc.penM += s.penMissed;
        return acc;
    }, { apps: 0, ga: 0, goals: 0, assists: 0, penG: 0, penS: 0, penM: 0 });

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>PERFORMANCE VS OPPONENTS</div>

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
            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table vs-teams-table">
                    <thead>
                        <tr>
                            <th>OPPONENT TEAM</th>
                            <th>MATCHES</th>
                            <th>G+A</th>
                            <th>GOALS</th>
                            <th>ASSISTS</th>
                            <th>PEN GOALS</th>
                            <th>PEN SAVED</th>
                            <th>PEN MISSED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oppNames.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No opponent data available.</td>
                            </tr>
                        ) : (
                            oppNames.map(name => {
                                const s = stats.statsByOpponent[name];
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: 'var(--player-dark)' }}>{name}</td>
                                        <td style={{ fontFamily: 'Space Mono', fontWeight: '700' }}>{s.apps || "-"}</td>
                                        <td style={{ color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px' }}>{(s.goals + s.assists) || "-"}</td>
                                        <td style={{ color: '#27ae60' }}>{s.goals || "-"}</td>
                                        <td style={{ color: '#2980b9' }}>{s.assists || "-"}</td>
                                        <td>{s.penGoals || "-"}</td>
                                        <td style={{ color: (s.penSaved || 0) > 0 ? '#e67e22' : 'inherit' }}>{s.penSaved || "-"}</td>
                                        <td style={{ color: s.penMissed > 0 ? '#e74c3c' : 'inherit' }}>{s.penMissed || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        {oppNames.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '15px' }}>TOTAL</td>
                                <td style={{ fontFamily: 'Space Mono', fontWeight: '900', fontSize: '20px' }}>{totals.apps || "-"}</td>
                                <td style={{ color: 'var(--player-gold)', fontWeight: '950', fontSize: '24px' }}>{totals.ga || "-"}</td>
                                <td style={{ color: '#27ae60', fontWeight: '900', fontSize: '20px' }}>{totals.goals || "-"}</td>
                                <td style={{ color: '#2980b9', fontWeight: '900', fontSize: '20px' }}>{totals.assists || "-"}</td>
                                <td style={{ fontWeight: '900', fontSize: '18px' }}>{totals.penG || "-"}</td>
                                <td style={{ color: totals.penS > 0 ? '#e67e22' : 'inherit', fontWeight: '900', fontSize: '18px' }}>{totals.penS || "-"}</td>
                                <td style={{ color: totals.penM > 0 ? '#e74c3c' : 'inherit', fontWeight: '900', fontSize: '18px' }}>{totals.penM || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
