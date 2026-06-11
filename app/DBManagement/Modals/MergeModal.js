import React from 'react';

export default function MergeModal({ 
    selectedTable, 
    selectedRows, 
    isConfirmingMerge, 
    setIsConfirmingMerge, 
    setShowMergeModal, 
    mergeTargetName, 
    setMergeTargetName, 
    handleConfirmMerge,
    getName
}) {
    const getEntityType = () => {
        if (selectedTable === 'db_PLAYERS') return 'PLAYER';
        if (selectedTable === 'db_MANAGERS') return 'MANAGER';
        if (selectedTable === 'db_REFEREES') return 'REFEREE';
        return 'STADIUM';
    };

    const entityType = getEntityType();
    const allNames = [...new Set(selectedRows.map(r => getName(r)).filter(Boolean))];

    return (
        <div className="edit-modal-wrap" onClick={() => { if (isConfirmingMerge) setIsConfirmingMerge(false); else setShowMergeModal(false); }}>
            <div className="edit-modal merge-modal" onClick={e => e.stopPropagation()}>
                <h3>MERGE {entityType} RECORDS</h3>
                <div className="modal-form" style={{ display: 'block' }}>
                    {!isConfirmingMerge ? (
                        <>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                                You are merging references for {selectedRows.length} {entityType.toLowerCase()} records. All historical occurrences of this entity across all database tables (lineups, match details, squads, events) will be updated to point to the target name.
                            </p>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', marginBottom: '8px', fontWeight: '800', letterSpacing: '1.5px' }}>
                                    ENTER FINAL NAME TO KEEP (TARGET)
                                </label>
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
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                />
                            </div>

                            <div className="selected-preview-list">
                                <label style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800' }}>
                                    Names to be merged/replaced:
                                </label>
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allNames.filter(n => n !== mergeTargetName).map(n => (
                                        <span key={n} style={{ background: '#fff1f0', color: '#cf1322', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', border: '1px solid #ffa39e', fontWeight: '700' }}>
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="merge-warning-box" style={{ padding: '30px', background: '#fff1f0', borderRadius: '12px', border: '2px dashed #cf1322', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '15px' }}>⚠️</div>
                            <h4 style={{ color: '#cf1322', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '900' }}>PERMANENT CASCADE DATA CHANGE</h4>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                                Are you absolutely sure about this merge? <br />
                                Every instance of <strong style={{ color: '#000' }}>[{allNames.join(', ')}]</strong> will be renamed to <strong style={{ color: '#000', fontSize: '18px' }}>"{mergeTargetName}"</strong> across ALL match details, events, lineups, and squad tables.
                            </p>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '15px' }}>This action will delete the obsolete database catalog rows and cannot be undone.</p>
                        </div>
                    )}
                </div>
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => { if (isConfirmingMerge) setIsConfirmingMerge(false); else setShowMergeModal(false); }}>
                        {isConfirmingMerge ? "GO BACK" : "ABORT"}
                    </button>
                    <button className="save-btn" style={{ background: isConfirmingMerge ? '#cf1322' : '#000', color: isConfirmingMerge ? '#fff' : '#c9a84c' }} onClick={handleConfirmMerge}>
                        {isConfirmingMerge ? "YES, EXECUTE PERMANENT MERGE" : "PROCEED TO CONFIRM"}
                    </button>
                </div>
            </div>
        </div>
    );
}
