import { useState, Fragment } from "react";

export default function PlayerVsGksTable({ stats }) {
    const [search, setSearch] = useState("");
    const [expandedGk, setExpandedGk] = useState(null); // ID or Name of expanded GK

    const gkStore = stats.statsByGK || {};
    const gkNames = Object.keys(gkStore)
        .filter(name => {
            const lowerRes = name.toLowerCase().includes(search.toLowerCase());
            // Also search within team names
            const teamMatch = Object.keys(gkStore[name].teams).some(t => t.toLowerCase().includes(search.toLowerCase()));
            return lowerRes || teamMatch;
        })
        .sort((a, b) => (gkStore[b].totalGoals - gkStore[a].totalGoals) || a.localeCompare(b));

    const totals = gkNames.reduce((acc, name) => {
        const s = gkStore[name];
        acc.goals += s.totalGoals;
        acc.penG += s.totalPenGoals;
        acc.penS += s.totalPenSaved || 0;
        acc.penM += s.totalPenMissed || 0;
        return acc;
    }, { goals: 0, penG: 0, penS: 0, penM: 0 });

    const toggleExpand = (name) => {
        if (expandedGk === name) setExpandedGk(null);
        else setExpandedGk(name);
    };

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>PERFORMANCE VS GOALKEEPERS</div>

            {/* Premium Search Box Centered */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div className="search-wrap-premium" style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="SEARCH GOALKEEPER OR TEAM..."
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
                            <th></th>
                            <th style={{ textAlign: 'left' }}>GOALKEEPER NAME</th>
                            <th>GOALS</th>
                            <th>PEN GOAL</th>
                            <th>PEN SAVED</th>
                            <th>PEN MISSED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gkNames.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No goalkeeper data available.</td>
                            </tr>
                        ) : (
                            gkNames.map(name => {
                                const s = gkStore[name];
                                const teamNames = Object.keys(s.teams);
                                const isExpanded = expandedGk === name;

                                return (
                                    <Fragment key={name}>
                                        <tr
                                            onClick={() => toggleExpand(name)}
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                            className={isExpanded ? 'row-expanded' : ''}
                                        >
                                            <td style={{ width: '40px', textAlign: 'center', color: 'var(--player-gold)' }}>
                                                {isExpanded ? '▼' : '▶'}
                                            </td>
                                            <td style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: '500', color: 'var(--player-dark)', fontSize: '20px', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.5px' }}>{name}</div>
                                                {!isExpanded && <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{teamNames.join(' • ')}</div>}
                                            </td>
                                            <td style={{ color: '#27ae60', fontWeight: '900', fontSize: '20px' }}>{s.totalGoals || "-"}</td>
                                            <td style={{ fontWeight: '700' }}>{s.totalPenGoals || "-"}</td>
                                            <td style={{ color: (s.totalPenSaved || 0) > 0 ? '#e67e22' : 'inherit', fontWeight: '700' }}>{(s.totalPenSaved || 0) || "-"}</td>
                                            <td style={{ color: (s.totalPenMissed || 0) > 0 ? '#e74c3c' : 'inherit', fontWeight: '700' }}>{(s.totalPenMissed || 0) || "-"}</td>
                                        </tr>
                                        {isExpanded && teamNames.sort((a, b) => s.teams[b].goals - s.teams[a].goals).map(team => {
                                            const ts = s.teams[team];
                                            return (
                                                <tr key={`${name}-${team}`} className="sub-row-gk">
                                                    <td></td>
                                                    <td style={{ textAlign: 'left', paddingLeft: '40px', background: 'rgba(0,0,0,0.02)', borderLeft: '3px solid var(--player-gold)' }}>
                                                        <div style={{ fontWeight: '700', color: '#555', fontSize: '14px' }}>{team}</div>
                                                    </td>
                                                    <td style={{ fontSize: '16px', color: '#27ae60', opacity: 0.8 }}>{ts.goals || "-"}</td>
                                                    <td style={{ fontSize: '14px', opacity: 0.8 }}>{ts.penGoals || "-"}</td>
                                                    <td style={{ fontSize: '14px', color: (ts.penSaved || 0) > 0 ? '#e67e22' : 'inherit', opacity: 0.8 }}>{ts.penSaved || 0 || "-"}</td>
                                                    <td style={{ fontSize: '14px', color: (ts.penMissed || 0) > 0 ? '#e74c3c' : 'inherit', opacity: 0.8 }}>{ts.penMissed || 0 || "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })
                        )}
                        {gkNames.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td></td>
                                <td style={{ textAlign: 'left', fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '15px' }}>TOTAL</td>
                                <td style={{ color: '#27ae60', fontWeight: '950', fontSize: '24px' }}>{totals.goals || "-"}</td>
                                <td style={{ fontWeight: '900', fontSize: '20px' }}>{totals.penG || "-"}</td>
                                <td style={{ color: totals.penS > 0 ? '#e67e22' : 'inherit', fontWeight: '900', fontSize: '20px' }}>{totals.penS || "-"}</td>
                                <td style={{ color: totals.penM > 0 ? '#e74c3c' : 'inherit', fontWeight: '900', fontSize: '20px' }}>{totals.penM || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .row-expanded { background: rgba(201, 168, 76, 0.03); }
                .sub-row-gk td { padding: 12px 18px !important; }
                .player-match-table tr:hover { background: rgba(0,0,0,0.01); }
            `}</style>
        </div>
    );
}
