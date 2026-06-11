import React from 'react';

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

    // Determine form columns to render
    const renderColumns = columns.filter(col => {
        if (isNew) {
            const upper = col.toUpperCase();
            // In new mode, hide auto-generated columns entirely
            if (upper === 'ROW_ID' || col.endsWith('_ID')) {
                return false;
            }
        }
        return true;
    });

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
                        return (
                            <div className="form-group" key={col} style={{ gridColumn: 'span 2' }}>
                                <label>{col.toUpperCase().replace('_', ' ')} {disabled && '(READ ONLY)'}</label>
                                <input
                                    type="text"
                                    value={editForm[col] || ''}
                                    disabled={disabled}
                                    onChange={e => handleInputChange(col, e.target.value)}
                                    placeholder={disabled ? '(Auto-generated)' : `Enter ${col.toLowerCase().replace('_', ' ')}`}
                                />
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
