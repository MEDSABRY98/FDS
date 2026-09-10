import { useState, Fragment } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { Eye, X } from "lucide-react";

export default function PlayerVsGksTable({ stats, playerName }) {
    const [search, setSearch] = useState("");
    const [selectedGk, setSelectedGk] = useState(null);

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

    return (
        <div className="history-section fade-in">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <SearchBar_db
                        value={search}
                        onChange={setSearch}
                        placeholder="SEARCH GOALKEEPER OR TEAM..."
                    />
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                {gkNames.length === 0 ? (
                    <NoData_db message="No goalkeeper data available." />
                ) : (
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
                        {gkNames.map(name => {
                                const s = gkStore[name];
                                const teamNames = Object.keys(s.teams);

                                return (
                                    <tr key={name} style={{ transition: 'background 0.2s' }}>
                                        <td style={{ width: '60px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => setSelectedGk(name)}
                                                className="gk-view-btn"
                                                title="View Teams"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: '500', color: 'var(--player-dark)', fontSize: '20px', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.5px' }}>{name}</div>
                                        </td>
                                        <td style={{ color: '#27ae60', fontWeight: '900', fontSize: '20px' }}>{s.totalGoals || "-"}</td>
                                        <td style={{ fontWeight: '700' }}>{s.totalPenGoals || "-"}</td>
                                        <td style={{ color: (s.totalPenSaved || 0) > 0 ? '#e67e22' : 'inherit', fontWeight: '700' }}>{(s.totalPenSaved || 0) || "-"}</td>
                                        <td style={{ color: (s.totalPenMissed || 0) > 0 ? '#e74c3c' : 'inherit', fontWeight: '700' }}>{(s.totalPenMissed || 0) || "-"}</td>
                                    </tr>
                                );
                        })}
                        <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td></td>
                                <td style={{ textAlign: 'left', fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '15px' }}>TOTAL</td>
                                <td style={{ color: '#27ae60', fontWeight: '950', fontSize: '24px' }}>{totals.goals || "-"}</td>
                                <td style={{ fontWeight: '900', fontSize: '20px' }}>{totals.penG || "-"}</td>
                                <td style={{ color: totals.penS > 0 ? '#e67e22' : 'inherit', fontWeight: '900', fontSize: '20px' }}>{totals.penS || "-"}</td>
                                <td style={{ color: totals.penM > 0 ? '#e74c3c' : 'inherit', fontWeight: '900', fontSize: '20px' }}>{totals.penM || "-"}</td>
                            </tr>
                    </tbody>
                </table>
                )}
            </div>

            {selectedGk && (
                <div className="gk-modal-overlay" onClick={() => setSelectedGk(null)}>
                    <div className="gk-modal-content fade-in" onClick={e => e.stopPropagation()}>
                        <div className="gk-modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {selectedGk} 
                                {playerName && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'inherit', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>VS {playerName}</span>}
                            </h3>
                            <button onClick={() => setSelectedGk(null)}><X size={20} /></button>
                        </div>
                        <div style={{ overflowX: 'auto', maxHeight: '75vh' }}>
                            <table className="player-match-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>TEAM</th>
                                        <th>GOALS</th>
                                        <th>PEN GOAL</th>
                                        <th>PEN SAVED</th>
                                        <th>PEN MISSED</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(gkStore[selectedGk].teams)
                                        .sort((a, b) => gkStore[selectedGk].teams[b].goals - gkStore[selectedGk].teams[a].goals)
                                        .map(team => {
                                            const ts = gkStore[selectedGk].teams[team];
                                            return (
                                                <tr key={team}>
                                                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#555', fontSize: '15px' }}>{team}</td>
                                                    <td style={{ color: '#27ae60', fontWeight: '800', fontSize: '18px' }}>{ts.goals || "-"}</td>
                                                    <td style={{ fontWeight: '600' }}>{ts.penGoals || "-"}</td>
                                                    <td style={{ color: ts.penSaved > 0 ? '#e67e22' : 'inherit', fontWeight: '600' }}>{ts.penSaved || "-"}</td>
                                                    <td style={{ color: ts.penMissed > 0 ? '#e74c3c' : 'inherit', fontWeight: '600' }}>{ts.penMissed || "-"}</td>
                                                </tr>
                                            );
                                        })
                                    }
                                    <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                        <td style={{ textAlign: 'center', fontWeight: '900', color: 'var(--player-gold)' }}>TOTAL</td>
                                        <td style={{ color: '#27ae60', fontWeight: '900', fontSize: '20px' }}>{gkStore[selectedGk].totalGoals || "-"}</td>
                                        <td style={{ fontWeight: '800', fontSize: '18px' }}>{gkStore[selectedGk].totalPenGoals || "-"}</td>
                                        <td style={{ color: gkStore[selectedGk].totalPenSaved > 0 ? '#e67e22' : 'inherit', fontWeight: '800', fontSize: '18px' }}>{gkStore[selectedGk].totalPenSaved || "-"}</td>
                                        <td style={{ color: gkStore[selectedGk].totalPenMissed > 0 ? '#e74c3c' : 'inherit', fontWeight: '800', fontSize: '18px' }}>{gkStore[selectedGk].totalPenMissed || "-"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .player-match-table tr:hover { background: rgba(0,0,0,0.01); }
                .gk-view-btn {
                    background: rgba(201, 168, 76, 0.1);
                    border: 1px solid rgba(201, 168, 76, 0.3);
                    color: var(--player-gold);
                    border-radius: 6px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                    margin: 0 auto;
                }
                .gk-view-btn:hover {
                    background: var(--player-gold);
                    color: #fff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(201, 168, 76, 0.3);
                }
                .gk-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(5px);
                }
                .gk-modal-content {
                    background: #fff;
                    width: 95%;
                    max-width: 850px;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .gk-modal-header {
                    background: #0a0a0a;
                    color: #fff;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .gk-modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    color: var(--player-gold);
                    font-family: 'Outfit', sans-serif;
                    letter-spacing: 1px;
                }
                .gk-modal-header button {
                    background: transparent;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    transition: 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .gk-modal-header button:hover {
                    color: #e74c3c;
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}
