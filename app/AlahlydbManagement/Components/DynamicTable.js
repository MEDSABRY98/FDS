import { Edit, Trash2 } from "lucide-react";

export default function DynamicTable({ 
    selectedTable, 
    columns, 
    paginatedData, 
    selectedRows, 
    handleToggleSelect, 
    handleEditClick, 
    handleDelete 
}) {
    return (
        <div className="table-overflow">
            <table className="db-table" style={{ 
                width: columns.length > 7 ? 'max-content' : '100%', 
                tableLayout: columns.length > 7 ? 'auto' : 'fixed' 
            }}>
                <thead>
                    <tr style={{ height: '54px' }}>
                        {selectedTable === "alahly_PLAYERDATABASE" && (
                            <th className="select-header" style={{ width: '60px', minWidth: '60px', position: 'sticky', left: 0, zIndex: 15 }}>SELECT</th>
                        )}
                        <th className="actions-header" style={{
                            width: '110px',
                            minWidth: '110px',
                            position: 'sticky',
                            left: selectedTable === "alahly_PLAYERDATABASE" ? '60px' : '0',
                            zIndex: 15
                        }}>ACTIONS</th>
                        {columns.map(col => {
                            const isNarrow = ['GF', 'GA', 'ET', 'W-D-L', 'SEASON - NUMBER', 'ROUND', 'H-A-N', 'PEN'].includes(col);
                            return (
                                <th
                                    key={col}
                                    style={{
                                        width: isNarrow ? '100px' : '180px',
                                        minWidth: isNarrow ? '100px' : '180px'
                                    }}
                                >
                                    {col}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (selectedTable === "alahly_PLAYERDATABASE" ? 2 : 1)}
                                style={{
                                    padding: '120px 20px',
                                    color: '#c9a84c',
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    background: '#fff',
                                    letterSpacing: '3px',
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    opacity: 0.6
                                }}
                            >
                                NO MATCHING RECORDS FOUND IN {selectedTable.replace('alahly_', '').toUpperCase()}
                            </td>
                        </tr>
                    ) : (
                        paginatedData.map((row, idx) => {
                            const rKey = row["PLAYER NAME"];
                            const isSelected = selectedRows.some(sr => sr["PLAYER NAME"] === rKey);

                            return (
                                <tr key={idx} className={isSelected ? 'selected-row' : ''}>
                                    {selectedTable === "alahly_PLAYERDATABASE" && (
                                        <td className="select-cell" style={{ textAlign: 'center', position: 'sticky', left: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleSelect(row)}
                                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                            />
                                        </td>
                                    )}
                                    <td className="actions-cell" style={{
                                        position: 'sticky',
                                        left: selectedTable === "alahly_PLAYERDATABASE" ? '60px' : '0'
                                    }}>
                                        <div className="actions-flex">
                                            <button className="edit-row-btn" onClick={() => handleEditClick(row)} title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button className="delete-row-btn" onClick={() => handleDelete(row)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    {columns.map(col => (
                                        <td key={col} style={col === 'W-D-L' ? { minWidth: '120px', fontWeight: 'bold' } : {}}>
                                            {String(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
