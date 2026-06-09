export default function AlAhlyPlayersImpact({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer, sortConfig }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '300px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th rowSpan="2">#</th>
                    <th className="name-th" rowSpan="2" onClick={() => handleSort('name')} style={{ color: sortConfig?.key === 'name' ? 'var(--gold)' : '' }}>PLAYER NAME</th>
                    <th colSpan="2" style={{ background: '#27ae60', color: '#fff' }}>GOAL IMPACT</th>
                    <th colSpan="2" style={{ background: '#2980b9', color: '#fff' }}>ASSIST IMPACT</th>
                    <th rowSpan="2" style={{ background: '#000', color: 'var(--gold)' }}>TOTAL</th>
                </tr>
                <tr style={{ fontSize: '10px' }}>
                    <th onClick={() => handleSort('goalWinImpact')} className="sortable" style={{ color: sortConfig?.key === 'goalWinImpact' ? 'var(--gold)' : '' }}>WIN</th>
                    <th onClick={() => handleSort('goalDrawImpact')} className="sortable" style={{ color: sortConfig?.key === 'goalDrawImpact' ? 'var(--gold)' : '' }}>DRAW</th>
                    <th onClick={() => handleSort('assistWinImpact')} className="sortable" style={{ color: sortConfig?.key === 'assistWinImpact' ? 'var(--gold)' : '' }}>WIN</th>
                    <th onClick={() => handleSort('assistDrawImpact')} className="sortable" style={{ color: sortConfig?.key === 'assistDrawImpact' ? 'var(--gold)' : '' }}>DRAW</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => (
                    <tr key={r.name}>
                        <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                        <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                        <td className="g-val">{r.goalWinImpact}</td>
                        <td style={{ color: '#e67e22' }}>{r.goalDrawImpact}</td>
                        <td className="a-val">{r.assistWinImpact}</td>
                        <td style={{ color: '#e67e22' }}>{r.assistDrawImpact}</td>
                        <td style={{ fontWeight: 800 }}>{r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
