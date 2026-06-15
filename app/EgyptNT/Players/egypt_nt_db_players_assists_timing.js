export default function EgyptNTPlayersAssistsTiming({ paginatedRows, currentPage, pageSize, handleSort, renderSortIcon, setSelectedPlayer }) {
    return (
        <table className="modern-player-table fade-in" style={{ tableLayout: 'fixed' }}>
            <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '250px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
            </colgroup>
            <thead>
                <tr>
                    <th rowSpan="2">#</th>
                    <th className="name-th" rowSpan="2" onClick={() => handleSort('name')}>PLAYER NAME {renderSortIcon('name')}</th>
                    <th rowSpan="2" style={{ background: '#27ae60', color: '#fff' }} onClick={() => handleSort('total')} className="sortable"> TOTAL {renderSortIcon('total')} </th>
                    <th colSpan="9" style={{ background: '#000', color: 'var(--gold)' }}>ASSISTS TIMING DISTRIBUTION</th>
                </tr>
                <tr style={{ fontSize: '11px', background: '#f8f8f8' }}>
                    {["1-15", "16-30", "31-45", "45+", "46-60", "61-75", "76-90", "90+", "?"].map(min => (
                        <th key={min} onClick={() => handleSort(min)} className="sortable">{min} {renderSortIcon(min)}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {paginatedRows.map((r, i) => {
                    const tim = r.assistsTiming || {};
                    return (
                        <tr key={r.name}>
                            <td><span className="rank-badge-premium">{(currentPage - 1) * pageSize + i + 1}</span></td>
                            <td className="p-name" onClick={() => setSelectedPlayer(r.name)}>{r.name}</td>
                            <td style={{ fontWeight: 800, fontSize: '16px', color: '#000' }}>
                                {r.assists}
                            </td>
                            {["1-15", "16-30", "31-45", "45+", "46-60", "61-75", "76-90", "90+", "?"].map(m => (
                                <td key={m} 
                                    className={tim[m] > 0 ? 'a-val' : ''} 
                                    style={{ opacity: tim[m] > 0 ? 1 : 0.3, color: '#000' }}
                                >
                                    {tim[m] || 0}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
