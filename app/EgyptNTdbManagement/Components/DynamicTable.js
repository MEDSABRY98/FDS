import { Edit, Trash2 } from "lucide-react";

export function DynamicTable({ 
    selectedTable, 
    columns, 
    paginatedData, 
    selectedRows, 
    handleToggleSelect, 
    handleEditClick, 
    handleDelete 
}) {
    if (!paginatedData || paginatedData.length === 0) return null;

    const isSquadOrPlayerDetails = ["egy_NT_SQUAD", "egy_NT_PLAYERDETAILS"].includes(selectedTable);

    return (
        <div className="table-overflow">
            <table className="db-table" style={{ 
                width: columns.length > 7 ? 'max-content' : '100%', 
                tableLayout: columns.length > 7 ? 'auto' : 'fixed' 
            }}>
                <thead>
                    <tr>
                        {isSquadOrPlayerDetails && (
                            <th className="select-header" style={{ width: '60px', left: 0 }}>SEL</th>
                        )}
                        <th className="actions-header" style={{
                            width: '110px',
                            left: isSquadOrPlayerDetails ? '60px' : '0'
                        }}>ACTIONS</th>
                        {columns.map(col => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => {
                        const isSelected = selectedRows.some(r => {
                            const rKey = selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"];
                            const rowKey = selectedTable === "egy_NT_SQUAD" ? row["PLAYERNAME"] : row["PLAYER NAME"];
                            return rKey === rowKey && rowKey; // Only true if keys match and aren't undefined
                        });

                        return (
                            <tr key={idx} className={isSelected ? 'selected-row' : ''}>
                                {isSquadOrPlayerDetails && (
                                    <td className="select-cell" style={{ left: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(row)}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                        />
                                    </td>
                                )}
                                <td className="actions-cell" style={{
                                    left: isSquadOrPlayerDetails ? '60px' : '0'
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
                                    <td key={col} style={col === 'W-D-L' || col === 'W-L Q & F' ? { minWidth: '120px', fontWeight: 'bold' } : {}}>
                                        {String(row[col])}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
