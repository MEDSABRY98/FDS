export default function AlAhlyPlayersMultiples({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '300px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th rowSpan="2">#</th>
                    <th className="name-th" rowSpan="2" onClick={() => handleSort('name')}>PLAYER NAME {renderSortIcon('name')}</th>
                    <th colSpan="3" style={{ background: '#27ae60', color: '#fff' }}>GOALS MULTIPLES</th>
                    <th colSpan="3" style={{ background: '#2980b9', color: '#fff' }}>ASSISTS MULTIPLES</th>
                </tr>
                <tr style={{ fontSize: '10px' }}>
                    <th onClick={() => handleSort('braceG')} className="sortable">BRACE(2) {renderSortIcon('braceG')}</th>
                    <th onClick={() => handleSort('hatG')} className="sortable">HAT-TRICK(3) {renderSortIcon('hatG')}</th>
                    <th onClick={() => handleSort('superG')} className="sortable">SUPER(4+) {renderSortIcon('superG')}</th>
                    <th onClick={() => handleSort('braceA')} className="sortable">BRACE(2) {renderSortIcon('braceA')}</th>
                    <th onClick={() => handleSort('hatA')} className="sortable">HAT-TRICK(3) {renderSortIcon('hatA')}</th>
                    <th onClick={() => handleSort('superA')} className="sortable">SUPER(4+) {renderSortIcon('superA')}</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => (
                    <tr key={r.name}>
                        <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                        <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                        <td className="g-val">{r.braceG}</td>
                        <td className="g-val">{r.hatG}</td>
                        <td className="g-val">{r.superG}</td>
                        <td className="a-val">{r.braceA}</td>
                        <td className="a-val">{r.hatA}</td>
                        <td className="a-val">{r.superA}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
