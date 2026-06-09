export default function AlAhlyPlayersStats({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer, sortConfig }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '300px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th>#</th>
                    <th onClick={() => handleSort('name')} className="sortable" style={{ color: sortConfig?.key === 'name' ? 'var(--gold)' : '' }}>PLAYER NAME</th>
                    <th onClick={() => handleSort('caps')} className="sortable" style={{ color: sortConfig?.key === 'caps' ? 'var(--gold)' : '' }}>MATCHES</th>
                    <th onClick={() => handleSort('mins')} className="sortable" style={{ color: sortConfig?.key === 'mins' ? 'var(--gold)' : '' }}>MINUTES</th>
                    <th onClick={() => handleSort('ga')} className="sortable" style={{ color: sortConfig?.key === 'ga' ? 'var(--gold)' : '' }}>G + A</th>
                    <th onClick={() => handleSort('goals')} className="sortable" style={{ color: sortConfig?.key === 'goals' ? 'var(--gold)' : '' }}>GOALS</th>
                    <th onClick={() => handleSort('assists')} className="sortable" style={{ color: sortConfig?.key === 'assists' ? 'var(--gold)' : '' }}>ASSISTS</th>
                    <th onClick={() => handleSort('penalties')} className="sortable" style={{ color: sortConfig?.key === 'penalties' ? 'var(--gold)' : '' }}>PENALTIES</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => (
                    <tr key={r.name}>
                        <td><span className="rank-badge-premium">{ (currentPage - 1) * pageSize + i + 1 }</span></td>
                        <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                        <td style={{ color: 'var(--gold)' }}>{r.caps}</td>
                        <td>{r.mins}</td>
                        <td><div className="ga-pill">{r.ga}</div></td>
                        <td className="g-val">{r.goals}</td>
                        <td className="a-val">{r.assists}</td>
                        <td className="p-val">{r.penalties}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
