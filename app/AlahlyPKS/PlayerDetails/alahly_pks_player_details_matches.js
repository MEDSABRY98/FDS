"use client";
import NoData_db from "../../lib/NoData_db";

export default function AlAhlyPKsPlayerDetailsMatches({ pksData, playerName }) {
    // Sort PKs by DATE (Newest first)
    const sortedPks = [...(pksData || [])].sort((a, b) => {
        const dateA = a.DATE ? new Date(a.DATE.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.DATE ? new Date(b.DATE.split('/').reverse().join('-')) : new Date(0);
        return dateB - dateA;
    });

    return (
        <div className="history-section fade-in" style={{ padding: '0', border: 'none', boxShadow: 'none' }}>
            <div className="history-title" style={{ fontSize: '32px', marginBottom: '20px' }}>MATCHES HISTORY</div>
            
            <div style={{ overflowX: 'auto' }}>
                {sortedPks.length === 0 ? (
                    <NoData_db message="No penalty records found for this player." />
                ) : (
                    <table className="player-match-table">
                        <thead>
                            <tr style={{ height: '70px' }}>
                                <th style={{ fontSize: '15px' }}>PKS ID</th>
                                <th style={{ fontSize: '15px' }}>DATE</th>
                                <th style={{ fontSize: '15px' }}>CHAMPION</th>
                                <th style={{ fontSize: '15px' }}>SEASON</th>
                                <th style={{ fontSize: '15px' }}>PLAYER TEAM</th>
                                <th style={{ fontSize: '15px' }}>OPPONENT TEAM</th>
                                <th style={{ fontSize: '15px' }}>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPks.map((pk, idx) => {
                                const isAhlyPlayer = pk["AHLY PLAYER"] === playerName;
                                const playerTeam = isAhlyPlayer ? pk["AHLY TEAM"] : pk["OPPONENT TEAM"];
                                const oppTeam = isAhlyPlayer ? pk["OPPONENT TEAM"] : pk["AHLY TEAM"];
                                const status = isAhlyPlayer ? pk["AHLY STATUS"] : pk["OPPONENT STATUS"];
                                const isGoal = String(status || "").toUpperCase().includes("GOAL");

                                return (
                                    <tr key={idx} style={{ height: '85px' }}>
                                        <td style={{ 
                                            fontFamily: 'Space Mono, monospace', 
                                            fontSize: '14px', 
                                            fontWeight: '800', 
                                            color: 'var(--player-gold)' 
                                        }}>
                                            #{pk.PKS_ID || "—"}
                                        </td>
                                        <td style={{ 
                                            fontFamily: 'Outfit, sans-serif', 
                                            fontSize: '16px', 
                                            fontWeight: '700' 
                                        }}>
                                            {pk.DATE || "—"}
                                        </td>
                                        <td style={{ 
                                            fontFamily: 'Outfit, sans-serif', 
                                            fontSize: '15px', 
                                            fontWeight: '800', 
                                            textTransform: 'uppercase',
                                            color: '#555'
                                        }}>
                                            {pk.CHAMPION || "—"}
                                        </td>
                                        <td style={{ 
                                            fontFamily: 'Outfit, sans-serif', 
                                            fontSize: '16px', 
                                            fontWeight: '600', 
                                            color: '#777' 
                                        }}>
                                            {pk.SEASON || "—"}
                                        </td>
                                        <td style={{ 
                                            fontFamily: 'Outfit, sans-serif', 
                                            fontSize: '18px', 
                                            fontWeight: '950', 
                                            color: '#000' 
                                        }}>
                                            {playerTeam || "—"}
                                        </td>
                                        <td style={{ 
                                            fontFamily: 'Outfit, sans-serif', 
                                            fontSize: '18px', 
                                            fontWeight: '700', 
                                            color: '#777' 
                                        }}>
                                            {oppTeam || "—"}
                                        </td>
                                        <td style={{ fontFamily: 'Outfit, sans-serif' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <span className={`m-mini-pill ${isGoal ? 'mini-g' : 'mini-m'}`} style={{ 
                                                    padding: '8px 20px', 
                                                    fontSize: '13px', 
                                                    borderRadius: '8px',
                                                    height: 'auto'
                                                }}>
                                                    {isGoal ? 'GOAL' : 'MISS'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
