import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

export default function DynamicTable({
    columns,
    paginatedData,
    selectedRows,
    onToggleSelect,
    onEdit,
    onDelete,
    getName
}) {
    if (paginatedData.length === 0) {
        return (
            <div className="db-loader" style={{ animation: 'none', color: '#888' }}>
                NO DATA AVAILABLE
            </div>
        );
    }

    return (
        <div className="table-overflow">
            <table className="db-table">
                <thead>
                    <tr>
                        <th className="select-header">Merge Select</th>
                        {columns.map(col => (
                            <th key={col}>{col.toUpperCase().replace('_', ' ')}</th>
                        ))}
                        <th className="actions-header">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => {
                        const nameKey = getName(row);
                        const isSelected = selectedRows.some(r => getName(r) === nameKey);
                        
                        return (
                            <tr key={row.ROW_ID || idx} className={isSelected ? 'selected-row' : ''}>
                                <td className="select-cell">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(row)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c9a84c' }}
                                    />
                                </td>
                                {columns.map(col => (
                                    <td key={col} title={row[col] || ''}>
                                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                    </td>
                                ))}
                                <td className="actions-cell">
                                    <div className="actions-flex">
                                        <button
                                            className="edit-row-btn"
                                            onClick={() => onEdit(row)}
                                            title="Edit Record"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                        <button
                                            className="delete-row-btn"
                                            onClick={() => onDelete(row)}
                                            title="Delete Record"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
