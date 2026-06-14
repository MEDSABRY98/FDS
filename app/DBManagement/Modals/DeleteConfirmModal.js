import React from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteConfirmModal({
    deletingRow,
    onClose,
    onConfirm,
    deleting,
    getName
}) {
    if (!deletingRow) return null;

    const displayName = getName ? getName(deletingRow) : null;

    return (
        <div className="edit-modal-wrap" onClick={onClose}>
            <div className="edit-modal confirm-delete-modal" onClick={e => e.stopPropagation()}>
                <h3 className="delete-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trash2 size={20} />
                        <span>DELETE RECORD</span>
                    </div>
                </h3>
                <div className="modal-form" style={{ gridTemplateColumns: '1fr', padding: '30px 40px', gap: '15px' }}>
                    <p style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600', margin: 0 }}>
                        Are you sure you want to permanently delete this record?
                    </p>
                    {displayName && (
                        <div style={{
                            background: '#fdf1f0',
                            borderLeft: '4px solid #cf1322',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#cf1322'
                        }}>
                            {displayName}
                        </div>
                    )}
                </div>
                <div className="modal-actions" style={{ padding: '20px 40px' }}>
                    <button className="cancel-btn" onClick={onClose} disabled={deleting} style={{ minHeight: '48px' }}>
                        CANCEL
                    </button>
                    <button 
                        className="save-btn delete-btn" 
                        onClick={onConfirm} 
                        disabled={deleting}
                        style={{
                            minHeight: '48px',
                            background: '#cf1322',
                            color: '#fff'
                        }}
                    >
                        {deleting ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>
                                <span>DELETING...</span>
                            </div>
                        ) : (
                            'CONFIRM DELETE'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
