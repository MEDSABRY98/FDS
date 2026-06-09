export default function AlAhlyPlayersPenalties({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer, sortConfig }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '250px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th>#</th>
                    <th onClick={() => handleSort('name')} className="sortable" style={{ color: sortConfig?.key === 'name' ? 'var(--gold)' : '' }}>PLAYER NAME</th>
                    <th onClick={() => handleSort('total')} className="sortable" style={{ color: sortConfig?.key === 'total' ? 'var(--gold)' : '' }}>TOTAL SHOT</th>
                    <th onClick={() => handleSort('goal')} className="sortable" style={{ color: sortConfig?.key === 'goal' ? 'var(--gold)' : '' }}>SCORE</th>
                    <th onClick={() => handleSort('miss')} className="sortable" style={{ color: sortConfig?.key === 'miss' ? 'var(--gold)' : '' }}>MISS</th>
                    <th onClick={() => handleSort('wonGoal')} className="sortable" style={{ color: sortConfig?.key === 'wonGoal' ? 'var(--gold)' : '' }}>WON (G)</th>
                    <th onClick={() => handleSort('wonMiss')} className="sortable" style={{ color: sortConfig?.key === 'wonMiss' ? 'var(--gold)' : '' }}>WON (M)</th>
                    <th onClick={() => handleSort('makeGoal')} className="sortable" style={{ color: sortConfig?.key === 'makeGoal' ? 'var(--gold)' : '' }}>MAKE (G)</th>
                    <th onClick={() => handleSort('makeMiss')} className="sortable" style={{ color: sortConfig?.key === 'makeMiss' ? 'var(--gold)' : '' }}>MAKE (M)</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => (
                    <tr key={r.name}>
                        <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                        <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                        <td style={{ fontWeight: 800 }}>{r.total}</td>
                        <td className="g-val">{r.goal}</td>
                        <td className="p-val">{r.miss}</td>
                        <td>{r.wonGoal}</td>
                        <td>{r.wonMiss}</td>
                        <td>{r.makeGoal}</td>
                        <td>{r.makeMiss}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
