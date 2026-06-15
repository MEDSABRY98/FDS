export default function EgyptNTPlayersMultiples({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '280px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th>#</th>
                    <th onClick={() => handleSort('name')} className="sortable">PLAYER NAME {renderSortIcon('name')}</th>
                    <th onClick={() => handleSort('braceG')} className="sortable">BRACE (G) {renderSortIcon('braceG')}</th>
                    <th onClick={() => handleSort('hatG')} className="sortable">HATRICK (G) {renderSortIcon('hatG')}</th>
                    <th onClick={() => handleSort('superG')} className="sortable">4+ (G) {renderSortIcon('superG')}</th>
                    <th onClick={() => handleSort('braceA')} className="sortable">BRACE (A) {renderSortIcon('braceA')}</th>
                    <th onClick={() => handleSort('hatA')} className="sortable">HATRICK (A) {renderSortIcon('hatA')}</th>
                    <th onClick={() => handleSort('superA')} className="sortable">4+ (A) {renderSortIcon('superA')}</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => (
                    <tr key={r.name}>
                        <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                        <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                        <td className="g-val">{r.braceG}</td>
                        <td className="g-val" style={{ color: '#d4af37' }}>{r.hatG}</td>
                        <td className="g-val" style={{ color: '#e74c3c' }}>{r.superG}</td>
                        <td className="a-val">{r.braceA}</td>
                        <td className="a-val" style={{ color: '#8e44ad' }}>{r.hatA}</td>
                        <td className="a-val" style={{ color: '#f39c12' }}>{r.superA}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
