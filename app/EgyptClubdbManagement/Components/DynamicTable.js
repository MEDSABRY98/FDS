import { Edit, Trash2 } from "lucide-react";

export function DynamicTable({ 
    selectedTable, 
    columns, 
    paginatedData, 
    handleEditClick, 
    handleDelete 
}) {
    if (!paginatedData || paginatedData.length === 0) return null;

    return (
        <div className="table-overflow">
            <table className="db-table" style={{ 
                width: columns.length > 7 ? 'max-content' : '100%', 
                tableLayout: columns.length > 7 ? 'auto' : 'fixed' 
            }}>
                <thead>
                    <tr>
                        <th className="actions-header" style={{
                            width: '110px',
                            left: 0
                        }}>ACTIONS</th>
                        {columns.map(col => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => {
                        return (
                            <tr key={idx}>
                                <td className="actions-cell" style={{
                                    left: 0
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
