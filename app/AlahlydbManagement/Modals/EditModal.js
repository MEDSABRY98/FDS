export default function EditModal({ 
    editingRow, 
    setEditingRow, 
    selectedTable, 
    columns, 
    editForm, 
    setEditForm, 
    saving, 
    handleSaveEdit 
}) {
    if (!editingRow) return null;

    return (
        <div className="edit-modal-wrap">
            <div className="edit-modal">
                <h3>Edit Record - {selectedTable}</h3>
                <div className="modal-form">
                    {columns.map(col => (
                        <div key={col} className="form-group">
                            <label>{col}</label>
                            <input
                                type="text"
                                value={editForm[col] || ''}
                                onChange={(e) => setEditForm({ ...editForm, [col]: e.target.value })}
                            />
                        </div>
                    ))}
                </div>
                <div className="modal-actions" style={{ justifyContent: 'center' }}>
                    <button className="cancel-btn" onClick={() => setEditingRow(null)} disabled={saving}>CANCEL</button>
                    <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner"></div>
                                <span>SAVING...</span>
                            </div>
                        ) : "SAVE CHANGES"}
                    </button>
                </div>
            </div>
        </div>
    );
}
