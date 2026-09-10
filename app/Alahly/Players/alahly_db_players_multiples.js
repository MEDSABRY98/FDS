export default function AlAhlyPlayersMultiples({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer, sortConfig }) {
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
                <col style={{ width: '130px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th>#</th>
                    <th className="name-th sortable" onClick={() => handleSort('name')} style={{ color: sortConfig?.key === 'name' ? 'var(--gold)' : '' }}>PLAYER NAME</th>
                    <th onClick={() => handleSort('braceG')} className="sortable" style={{ background: '#27ae60', color: sortConfig?.key === 'braceG' ? 'var(--gold)' : '#fff', whiteSpace: 'nowrap', fontSize: '13px', padding: '25px 10px' }}>BRACE (2)</th>
                    <th onClick={() => handleSort('hatG')} className="sortable" style={{ background: '#27ae60', color: sortConfig?.key === 'hatG' ? 'var(--gold)' : '#fff', whiteSpace: 'nowrap', fontSize: '13px', padding: '25px 10px' }}>HAT-TRICK (3)</th>
                    <th onClick={() => handleSort('superG')} className="sortable" style={{ background: '#27ae60', color: sortConfig?.key === 'superG' ? 'var(--gold)' : '#fff', whiteSpace: 'nowrap', fontSize: '13px', padding: '25px 10px' }}>SUPER (4+)</th>
                    <th onClick={() => handleSort('braceA')} className="sortable" style={{ background: '#2980b9', color: sortConfig?.key === 'braceA' ? 'var(--gold)' : '#fff', whiteSpace: 'nowrap', fontSize: '13px', padding: '25px 10px' }}>BRACE (2)</th>
                    <th onClick={() => handleSort('hatA')} className="sortable" style={{ background: '#2980b9', color: sortConfig?.key === 'hatA' ? 'var(--gold)' : '#fff', whiteSpace: 'nowrap', fontSize: '13px', padding: '25px 10px' }}>HAT-TRICK (3)</th>
                    <th onClick={() => handleSort('superA')} className="sortable" style={{ background: '#2980b9', color: sortConfig?.key === 'superA' ? 'var(--gold)' : '#fff', whiteSpace: 'nowrap', fontSize: '13px', padding: '25px 10px' }}>SUPER (4+)</th>
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
