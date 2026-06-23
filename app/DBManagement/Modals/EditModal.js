import React from 'react';
import { formatCatalogColumnLabel } from "../../Database";

const NAME_EN_COLUMNS = new Set([
    'PLAYER_NAME_EN',
    'MANAGER_NAME_EN',
    'REFEREE_NAME_EN',
    'TEAM_NAME_EN',
    'STADIUM_NAME_EN',
    'COUNTRY_NAME_EN',
]);

function sortFormColumns(columns = []) {
    const regular = [];
    const english = [];

    columns.forEach((col) => {
        if (NAME_EN_COLUMNS.has(col)) english.push(col);
        else regular.push(col);
    });

    const ordered = [];
    regular.forEach((col) => {
        ordered.push(col);
        const enCol = `${col}_EN`;
        if (english.includes(enCol)) {
            ordered.push(enCol);
            english.splice(english.indexOf(enCol), 1);
        }
    });

    return [...ordered, ...english];
}

export default function EditModal({
    editingRow,
    editForm,
    setEditForm,
    columns,
    onClose,
    onSave,
    saving
}) {
    if (!editingRow) return null;

    const isNew = editingRow.isNew;

    const renderColumns = sortFormColumns(columns.filter(col => {
        if (isNew) {
            const upper = col.toUpperCase();
            if (upper === 'ROW_ID' || col.endsWith('_ID')) {
                return false;
            }
        }
        return true;
    }));

    const isReadOnly = (col) => {
        const upper = col.toUpperCase();
        return upper === 'ROW_ID' || col.endsWith('_ID');
    };

    const handleInputChange = (col, val) => {
        setEditForm(prev => ({
            ...prev,
            [col]: val
        }));
    };

    return (
        <div className="edit-modal-wrap" onClick={onClose}>
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
                <h3>{isNew ? 'ADD NEW RECORD' : 'EDIT RECORD'}</h3>
                <div className="modal-form">
                    {renderColumns.map(col => {
                        const disabled = isReadOnly(col);
                        const isEnglishName = NAME_EN_COLUMNS.has(col);
                        return (
                            <div
                                className={`form-group ${isEnglishName ? 'form-group-name-en' : ''}`}
                                key={col}
                                style={{ gridColumn: 'span 2' }}
                            >
                                <label>
                                    {formatCatalogColumnLabel(col)} {disabled && '(READ ONLY)'}
                                </label>
                                {col === 'IS_ARAB' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', height: '40px', paddingLeft: '10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm[col] === true || String(editForm[col]).toLowerCase() === 'true'}
                                            disabled={disabled}
                                            onChange={e => handleInputChange(col, e.target.checked)}
                                            style={{ width: '20px', height: '20px', accentColor: '#c9a84c', cursor: 'pointer', margin: 0 }}
                                        />
                                        <span style={{ marginLeft: '10px', color: '#c9a84c', fontWeight: 'bold' }}>Yes / نعم</span>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={editForm[col] || ''}
                                        disabled={disabled}
                                        dir={isEnglishName ? 'ltr' : 'auto'}
                                        onChange={e => handleInputChange(col, e.target.value)}
                                        placeholder={disabled ? '(Auto-generated)' : `Enter ${formatCatalogColumnLabel(col)}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose} disabled={saving}>
                        CANCEL
                    </button>
                    <button className="save-btn" onClick={onSave} disabled={saving}>
                        {saving ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner"></div>
                                <span>SAVING...</span>
                            </div>
                        ) : (
                            'SAVE RECORD'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
