import { useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export default function PlayerVsCountriesTable({ stats }) {
    const [search, setSearch] = useState("");

    const ctryStore = stats.statsByCountry || {};
    const ctryNames = Object.keys(ctryStore)
        .filter(name => name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => ((ctryStore[b].apps || 0) - (ctryStore[a].apps || 0)) || a.localeCompare(b));

    // Calculate Totals for the dynamic (filtered) list
    const totals = ctryNames.reduce((acc, name) => {
        const s = ctryStore[name];
        acc.teamsCount += s.teams.size || 0;
        acc.apps += s.apps || 0;
        acc.ga += ((s.goals || 0) + (s.assists || 0));
        acc.goals += s.goals || 0;
        acc.assists += s.assists || 0;
        acc.penG += s.penGoals || 0;
        acc.penS += s.penSaved || 0;
        acc.penM += s.penMissed || 0;
        return acc;
    }, { teamsCount: 0, apps: 0, ga: 0, goals: 0, assists: 0, penG: 0, penS: 0, penM: 0 });

    return (
        <div className="history-section fade-in">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <SearchBar_db
                        value={search}
                        onChange={setSearch}
                        placeholder="SEARCH COUNTRY..."
                    />
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                {ctryNames.length === 0 ? (
                    <NoData_db message="No country data available." />
                ) : (
                    <table className="player-match-table vs-teams-table vs-opponents-table">
                        <colgroup>
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>COUNTRY</th>
                                <th>TEAMS</th>
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
                            {ctryNames.map(name => {
                                const s = stats.statsByCountry[name];
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: '800', color: 'var(--player-dark)', textAlign: 'center', wordBreak: 'break-word' }}>{name}</td>
                                        <td style={{ fontWeight: '700', color: '#555' }}>{s.teams.size || "-"}</td>
                                        <td style={{ fontFamily: 'Space Mono', fontWeight: '700' }}>{s.apps || "-"}</td>
                                        <td style={{ color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px' }}>{((s.goals || 0) + (s.assists || 0)) || "-"}</td>
                                        <td style={{ color: '#27ae60' }}>{s.goals || "-"}</td>
                                        <td style={{ color: '#2980b9' }}>{s.assists || "-"}</td>
                                        <td>{s.penGoals || "-"}</td>
                                        <td style={{ color: (s.penSaved || 0) > 0 ? '#e67e22' : 'inherit' }}>{s.penSaved || "-"}</td>
                                        <td style={{ color: (s.penMissed || 0) > 0 ? '#e74c3c' : 'inherit' }}>{s.penMissed || "-"}</td>
                                    </tr>
                                );
                            })}
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '15px', textAlign: 'center' }}>TOTAL</td>
                                <td style={{ fontWeight: '900', fontSize: '18px' }}>{totals.teamsCount || "-"}</td>
                                <td style={{ fontFamily: 'Space Mono', fontWeight: '900', fontSize: '20px' }}>{totals.apps || "-"}</td>
                                <td style={{ color: 'var(--player-gold)', fontWeight: '950', fontSize: '24px' }}>{totals.ga || "-"}</td>
                                <td style={{ color: '#27ae60', fontWeight: '900', fontSize: '20px' }}>{totals.goals || "-"}</td>
                                <td style={{ color: '#2980b9', fontWeight: '900', fontSize: '20px' }}>{totals.assists || "-"}</td>
                                <td style={{ fontWeight: '900', fontSize: '18px' }}>{totals.penG || "-"}</td>
                                <td style={{ color: totals.penS > 0 ? '#e67e22' : 'inherit', fontWeight: '900', fontSize: '18px' }}>{totals.penS || "-"}</td>
                                <td style={{ color: totals.penM > 0 ? '#e74c3c' : 'inherit', fontWeight: '900', fontSize: '18px' }}>{totals.penM || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
