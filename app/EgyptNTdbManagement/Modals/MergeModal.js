export function MergePlayersModal({ 
    selectedTable, 
    selectedRows, 
    isConfirmingMerge, 
    setIsConfirmingMerge, 
    setShowMergeModal, 
    mergeTargetName, 
    setMergeTargetName, 
    handleConfirmMerge 
}) {
    return (
        <div className="edit-modal-wrap">
            <div className="edit-modal merge-modal">
                <h3>MERGE PLAYER RECORDS</h3>
                <div className="modal-form">
                    {!isConfirmingMerge ? (
                        <>
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                                You are merging references for {selectedRows.length} player records. All historical events, lineups, and squad stats will be linked to the chosen target name.
                            </p>

                            <div className="form-group">
                                <label>ENTER FINAL NAME TO KEEP (TARGET)</label>
                                <input
                                    type="text"
                                    value={mergeTargetName}
                                    onChange={(e) => setMergeTargetName(e.target.value)}
                                    placeholder="Type the permanent name..."
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        background: '#fff',
                                        border: '2px solid #eee',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                />
                            </div>

                            <div className="selected-preview-list">
                                <label style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>Names to be replaced/merged:</label>
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {[...new Set(selectedRows.map(r => selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"]))].filter(n => n !== mergeTargetName).map(n => (
                                        <span key={n} style={{ background: '#fff1f0', color: '#cf1322', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', border: '1px solid #ffa39e' }}>{n}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="merge-warning-box" style={{ padding: '30px', background: '#fff1f0', borderRadius: '12px', border: '2px dashed #cf1322', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '15px' }}>⚠️</div>
                            <h4 style={{ color: '#cf1322', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '900' }}>PERMANENT DATA CHANGE</h4>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                                Are you absolutely sure which name is correct? <br />
                                Every instance of <strong style={{ color: '#000' }}>[{[...new Set(selectedRows.map(r => selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"]))].join(', ')}]</strong> will be renamed to <strong style={{ color: '#000', fontSize: '18px' }}>"{mergeTargetName}"</strong> across ALL tables in the database.
                            </p>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '15px' }}>This action cannot be undone.</p>
                        </div>
                    )}
                </div>
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => { if (isConfirmingMerge) setIsConfirmingMerge(false); else setShowMergeModal(false); }}>{isConfirmingMerge ? "GO BACK" : "ABORT"}</button>
                    <button className="save-btn merge-confirm-btn" onClick={handleConfirmMerge}>
                        {isConfirmingMerge ? "YES, EXECUTE PERMANENT MERGE" : "PROCEED TO CONFIRM"}
                    </button>
                </div>
            </div>
        </div>
    );
}
