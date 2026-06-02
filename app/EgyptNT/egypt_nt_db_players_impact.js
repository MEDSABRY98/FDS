export default function EgyptNTPlayersImpact({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer }) {
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
                    <th onClick={() => handleSort('name')} className="sortable">PLAYER NAME {renderSortIcon('name')}</th>
                    <th onClick={() => handleSort('goalWinImpact')} className="sortable">GOAL WINNER {renderSortIcon('goalWinImpact')}</th>
                    <th onClick={() => handleSort('goalDrawImpact')} className="sortable">GOAL DRAW {renderSortIcon('goalDrawImpact')}</th>
                    <th onClick={() => handleSort('assistWinImpact')} className="sortable">ASSIST WINNER {renderSortIcon('assistWinImpact')}</th>
                    <th onClick={() => handleSort('assistDrawImpact')} className="sortable">ASSIST DRAW {renderSortIcon('assistDrawImpact')}</th>
                    <th onClick={() => handleSort('totalImpact')} className="sortable">TOTAL {renderSortIcon('totalImpact')}</th>
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
