export default function EgyptNTPlayersImpact({ paginatedRows, currentPage, pageSize, handleSort, sortConfig, setSelectedPlayer }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '280px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '130px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th>#</th>
                    <th onClick={() => handleSort('name')} className={`sortable ${sortConfig?.key === 'name' ? 'sort-active' : ''}`}>PLAYER NAME</th>
                    <th onClick={() => handleSort('goalWinImpact')} className={`sortable ${sortConfig?.key === 'goalWinImpact' ? 'sort-active' : ''}`}>GOAL WINNER</th>
                    <th onClick={() => handleSort('goalDrawImpact')} className={`sortable ${sortConfig?.key === 'goalDrawImpact' ? 'sort-active' : ''}`}>GOAL DRAW</th>
                    <th onClick={() => handleSort('assistWinImpact')} className={`sortable ${sortConfig?.key === 'assistWinImpact' ? 'sort-active' : ''}`}>ASSIST WINNER</th>
                    <th onClick={() => handleSort('assistDrawImpact')} className={`sortable ${sortConfig?.key === 'assistDrawImpact' ? 'sort-active' : ''}`}>ASSIST DRAW</th>
                    <th
                        onClick={() => handleSort('totalImpact')}
                        className={`sortable ${sortConfig?.key === 'totalImpact' ? 'sort-active' : ''}`}
                    >
                        TOTAL
                    </th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => {
                    const totalImpact = r.goalWinImpact + r.goalDrawImpact + r.assistWinImpact + r.assistDrawImpact;
                    return (
                        <tr key={r.name}>
                            <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                            <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                            <td className="g-val">{r.goalWinImpact}</td>
                            <td style={{ color: '#f39c12' }}>{r.goalDrawImpact}</td>
                            <td className="a-val">{r.assistWinImpact}</td>
                            <td style={{ color: '#e67e22' }}>{r.assistDrawImpact}</td>
                            <td><div className="ga-pill" style={{ background: '#000', color: 'var(--gold)', borderColor: 'var(--gold)' }}>{totalImpact}</div></td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
