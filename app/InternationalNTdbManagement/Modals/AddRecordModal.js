export function AddRecordModal({ selectedTable, columns, addForm, setAddForm, saving, setIsAdding, handleSaveAdd }) {
    // Exclude auto-generated columns from the form
    const editableColumns = columns.filter(col => col.toUpperCase() !== "ROW_ID");

    return (
        <div className="edit-modal-wrap">
            <div className="edit-modal">
                <h3>Add New Record — {selectedTable}</h3>
                <div className="modal-form">
                    {editableColumns.map(col => (
                        <div key={col} className="form-group">
                            <label>{col}</label>
                            <input
                                type="text"
                                placeholder={`Enter ${col}...`}
                                value={addForm[col] || ""}
                                onChange={(e) => setAddForm({ ...addForm, [col]: e.target.value })}
                            />
                        </div>
                    ))}
                </div>
                <div className="modal-actions" style={{ justifyContent: "center" }}>
                    <button className="cancel-btn" onClick={() => setIsAdding(false)} disabled={saving}>
                        CANCEL
                    </button>
                    <button className="save-btn" onClick={handleSaveAdd} disabled={saving}>
                        {saving ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner"></div>
                                <span>SAVING...</span>
                            </div>
                        ) : "ADD RECORD"}
                    </button>
                </div>
            </div>
        </div>
    );
}
