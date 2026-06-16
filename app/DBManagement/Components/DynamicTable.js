import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

const SELECT_COL = {
    width: '90px',
    minWidth: '90px',
    maxWidth: '90px',
    position: 'sticky',
    left: 0,
    zIndex: 6
};

const ACTIONS_COL = {
    width: '140px',
    minWidth: '140px',
    maxWidth: '140px',
    position: 'sticky',
    left: '90px',
    zIndex: 5
};

export default function DynamicTable({
    columns,
    paginatedData,
    selectedRows,
    onToggleSelect,
    onEdit,
    onDelete,
    getName,
    onNameClick
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
            <table className="db-table" style={{
                width: columns.length > 7 ? 'max-content' : '100%',
                tableLayout: columns.length > 7 ? 'auto' : 'fixed'
            }}>
                <thead>
                    <tr style={{ height: '54px' }}>
                        <th
                            className="select-header"
                            style={{ ...SELECT_COL, top: 0, zIndex: 21 }}
                        >
                            SEL
                        </th>
                        <th
                            className="actions-header"
                            style={{ ...ACTIONS_COL, top: 0, zIndex: 20 }}
                        >
                            ACTIONS
                        </th>
                        {columns.map(col => (
                            <th key={col}>{col.toUpperCase().replace('_', ' ')}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => {
                        const nameKey = getName(row);
                        const isSelected = selectedRows.some(r => getName(r) === nameKey);
                        
                        return (
                            <tr key={row.ROW_ID || idx} className={isSelected ? 'selected-row' : ''}>
                                <td className="select-cell" style={{ ...SELECT_COL, textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(row)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c9a84c' }}
                                    />
                                </td>
                                <td className="actions-cell" style={ACTIONS_COL}>
                                    <div className="actions-flex">
                                        <button
                                            className="edit-row-btn"
                                            onClick={() => onEdit(row)}
                                            title="Edit Record"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            className="delete-row-btn"
                                            onClick={() => onDelete(row)}
                                            title="Delete Record"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                                {columns.map(col => {
                                    const val = row[col];
                                    const isNameCol = col.endsWith('_NAME');
                                    return (
                                        <td key={col} title={val || ''}>
                                            {isNameCol && val ? (
                                                <span 
                                                    onClick={() => onNameClick && onNameClick(val)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {String(val)}
                                                </span>
                                            ) : (
                                                val !== null && val !== undefined ? String(val) : '-'
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
