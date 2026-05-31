export default function AlAhlyPlayersPenalties({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer }) {
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
                    <th onClick={() => handleSort('name')} className="sortable">PLAYER NAME {renderSortIcon('name')}</th>
                    <th onClick={() => handleSort('total')} className="sortable">TOTAL SHOT {renderSortIcon('total')}</th>
                    <th onClick={() => handleSort('goal')} className="sortable">SCORE {renderSortIcon('goal')}</th>
                    <th onClick={() => handleSort('miss')} className="sortable">MISS {renderSortIcon('miss')}</th>
                    <th onClick={() => handleSort('wonGoal')} className="sortable">WON (G) {renderSortIcon('wonGoal')}</th>
                    <th onClick={() => handleSort('wonMiss')} className="sortable">WON (M) {renderSortIcon('wonMiss')}</th>
                    <th onClick={() => handleSort('makeGoal')} className="sortable">MAKE (G) {renderSortIcon('makeGoal')}</th>
                    <th onClick={() => handleSort('makeMiss')} className="sortable">MAKE (M) {renderSortIcon('makeMiss')}</th>
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
