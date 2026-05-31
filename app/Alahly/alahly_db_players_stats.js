export default function AlAhlyPlayersStats({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer }) {
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
                    <th onClick={() => handleSort('name')} className="sortable">PLAYER NAME {renderSortIcon('name')}</th>
                    <th onClick={() => handleSort('caps')} className="sortable">MATCHES {renderSortIcon('caps')}</th>
                    <th onClick={() => handleSort('mins')} className="sortable">MINUTES {renderSortIcon('mins')}</th>
                    <th onClick={() => handleSort('ga')} className="sortable">G + A {renderSortIcon('ga')}</th>
                    <th onClick={() => handleSort('goals')} className="sortable">GOALS {renderSortIcon('goals')}</th>
                    <th onClick={() => handleSort('assists')} className="sortable">ASSISTS {renderSortIcon('assists')}</th>
                    <th onClick={() => handleSort('penalties')} className="sortable">PENALTIES {renderSortIcon('penalties')}</th>
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
