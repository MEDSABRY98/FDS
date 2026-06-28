"use client";

export default function Manager_Matches_Module({ stats }) {
    return (
        <div style={{ overflowX: 'auto' }} className="fade-in">
            <table className="player-match-table mgr-matches-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>MATCH ID</th>
                        <th>DATE</th>
                        <th className="mgr-season-col">SEASON</th>
                        <th>OPPONENT TEAM</th>
                        <th>OPPONENT MANAGER</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>RESULT</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.matchHistory.map((m, idx) => (
                        <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{m.idx}</td>
                            <td>{m.date}</td>
                            <td className="mgr-season-col">{m.season}</td>
                            <td style={{ fontWeight: '800' }}>{m.opponent}</td>
                            <td>{m.opponentManager}</td>
                            <td>{m.gf}</td>
                            <td>{m.ga}</td>
                            <td>
                                <span className={`m-role-pill ${m.wdl === 'W' ? 'role-starter' : m.wdl === 'L' ? 'role-sub' : ''}`} style={{ fontSize: '11px', fontWeight: '800' }}>
                                    {m.wdl}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
