import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import NoData_db from '../../lib/NoData_db';
import { formatCatalogColumnLabel } from '../../lib/supabase';

const NAME_EN_COLUMNS = new Set([
    'PLAYER_NAME_EN',
    'MANAGER_NAME_EN',
    'REFEREE_NAME_EN',
    'TEAM_NAME_EN',
    'STADIUM_NAME_EN',
    'COUNTRY_NAME_EN',
]);

function isCatalogEntityIdColumn(col) {
    const upper = String(col || '').toUpperCase();
    return upper !== 'ROW_ID' && col.endsWith('_ID');
}

function getColumnClass(col) {
    const upper = String(col || '').toUpperCase();
    if (upper === 'ROW_ID') return 'catalog-row-id-col';
    if (isCatalogEntityIdColumn(col)) return 'catalog-id-col';
    if (NAME_EN_COLUMNS.has(col)) return 'catalog-name-en-col';
    if (col.endsWith('_NAME')) return 'catalog-name-col';
    return '';
}

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
    getRowKey = getName,
    onEntityClick
}) {
    if (!paginatedData?.length) {
        return <NoData_db message="NO DATA RECORDS FOUND" height="280px" />;
    }

    return (
        <div className="table-overflow">
            <table className="db-table" style={{
                width: columns.length > 7 ? 'max-content' : '100%',
                tableLayout: columns.length > 7 ? 'auto' : 'fixed'
            }}>
                <colgroup>
                    <col className="col-select" />
                    <col className="col-actions" />
                    {columns.map(col => (
                        <col key={col} className={getColumnClass(col) || 'col-default'} />
                    ))}
                </colgroup>
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
                            <th
                                key={col}
                                className={getColumnClass(col)}
                            >
                                {formatCatalogColumnLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => {
                        const rowKey = getRowKey(row);
                        const isSelected = selectedRows.some(r => getRowKey(r) === rowKey);

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
                                    const colClass = getColumnClass(col);
                                    const isEnglishNameCol = NAME_EN_COLUMNS.has(col);
                                    const isIdCol = isCatalogEntityIdColumn(col);
                                    const displayVal = val !== null && val !== undefined ? String(val) : '-';

                                    return (
                                        <td
                                            key={col}
                                            title={colClass.includes('name') ? undefined : (val || '')}
                                            className={colClass}
                                            dir={isEnglishNameCol ? 'ltr' : 'auto'}
                                        >
                                            {isIdCol && val && onEntityClick ? (
                                                <button
                                                    type="button"
                                                    className="catalog-id-link"
                                                    onClick={() => onEntityClick(String(val), row)}
                                                    title="View timeline and table appearances"
                                                >
                                                    {displayVal}
                                                </button>
                                            ) : (
                                                displayVal
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
