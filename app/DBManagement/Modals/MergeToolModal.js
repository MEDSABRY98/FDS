import React, { useState, useMemo } from 'react';
import { Search, Plus, X, AlertTriangle, GitMerge } from 'lucide-react';
import { DBManagementService } from "../db_management_service";

export default function MergeToolModal({
    selectedTable,
    tableData,
    onClose,
    onMergeComplete,
    addNotification,
    getName
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNames, setSelectedNames] = useState([]);
    const [targetName, setTargetName] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const [merging, setMerging] = useState(false);

    // Determine entity type name
    const getEntityType = () => {
        if (selectedTable === 'db_PLAYERS') return 'PLAYER';
        if (selectedTable === 'db_MANAGERS') return 'MANAGER';
        if (selectedTable === 'db_REFEREES') return 'REFEREE';
        return 'STADIUM';
    };

    const entityType = getEntityType();

    // Map tableData to distinct sorted names
    const allPossibleNames = useMemo(() => {
        if (!tableData) return [];
        const names = tableData.map(row => getName(row)).filter(Boolean);
        return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'ar'));
    }, [tableData, getName]);

    // Filter names based on search query
    const searchResults = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query.length < 2) return [];
        return allPossibleNames.filter(name => 
            name.toLowerCase().includes(query) && !selectedNames.includes(name)
        ).slice(0, 10); // Limit to 10 results for performance
    }, [searchQuery, allPossibleNames, selectedNames]);

    const handleAddName = (name) => {
        setSelectedNames(prev => {
            const next = [...prev, name];
            if (next.length === 1) {
                setTargetName(name); // Auto-set first added name as target
            }
            return next;
        });
        setSearchQuery(""); // Clear search bar
    };

    const handleRemoveName = (name) => {
        setSelectedNames(prev => {
            const next = prev.filter(n => n !== name);
            if (targetName === name) {
                setTargetName(next[0] || ""); // Auto-reset target to first remaining
            }
            return next;
        });
    };

    const handleExecuteMerge = async () => {
        if (selectedNames.length < 2) {
            addNotification("Please select at least two names to merge.", "warn");
            return;
        }
        if (!targetName) {
            addNotification("Please select the target name to keep.", "warn");
            return;
        }

        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        setMerging(true);
        try {
            await DBManagementService.mergeEntities(selectedTable, targetName.trim(), selectedNames);
            addNotification("Merge completed successfully across all tables.", "success");
            if (onMergeComplete) await onMergeComplete();
            onClose();
        } catch (error) {
            addNotification("Merge failed: " + error.message, "error");
        } finally {
            setMerging(false);
            setIsConfirming(false);
        }
    };

    const sourceNames = selectedNames.filter(n => n !== targetName);

    return (
        <div className="edit-modal-wrap" onClick={onClose}>
            <div className="edit-modal merge-tool-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GitMerge size={24} style={{ color: '#c9a84c' }} />
                    MERGE TOOL: {entityType}S
                </h3>

                <div className="modal-form" style={{ display: 'grid', gridTemplateColumns: isConfirming ? '1fr' : '1.1fr 0.9fr', gap: '30px', padding: '30px' }}>
                    
                    {!isConfirming ? (
                        <>
                            {/* Left Side: Search and Select */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: '800', letterSpacing: '1.5px' }}>
                                    Search & Add Names to Merge
                                </label>
                                <div className="search-wrap" style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                    <input
                                        type="text"
                                        placeholder="Type 2+ letters to search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            padding: '12px 12px 12px 45px',
                                            borderRadius: '8px',
                                            border: '2px solid #eee',
                                            fontSize: '14px',
                                            width: '100%',
                                            textAlign: 'left',
                                            boxShadow: 'none'
                                        }}
                                    />
                                </div>

                                {/* Results Area */}
                                <div style={{ border: '1px solid #f0f0f0', borderRadius: '10px', minHeight: '180px', maxHeight: '250px', overflowY: 'auto', background: '#fafafa' }}>
                                    {searchQuery.trim().length < 2 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                                            Type at least 2 characters to search names
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                                            No matching names found
                                        </div>
                                    ) : (
                                        searchResults.map(name => (
                                            <div 
                                                key={name} 
                                                onClick={() => handleAddName(name)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 15px',
                                                    borderBottom: '1px solid #f5f5f5',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '13px',
                                                    fontWeight: '600'
                                                }}
                                                className="search-result-item"
                                            >
                                                <span style={{ flex: 1 }}>{name}</span>
                                                <Plus size={16} style={{ color: '#c9a84c' }} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Selected Names List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: '800', letterSpacing: '1.5px' }}>
                                    Selected Names ({selectedNames.length})
                                </label>

                                {selectedNames.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #f0f0f0', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                                        No names selected. Use search to add names.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                                        {selectedNames.map(name => {
                                            const isTarget = targetName === name;
                                            return (
                                                <div 
                                                    key={name}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        background: isTarget ? '#fdfaf0' : '#f5f5f5',
                                                        border: isTarget ? '1.5px solid #c9a84c' : '1px solid transparent',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        id={`target-${name}`}
                                                        name="targetNameGroup"
                                                        checked={isTarget}
                                                        onChange={() => setTargetName(name)}
                                                        style={{ width: '16px', height: '16px', accentColor: '#c9a84c', cursor: 'pointer' }}
                                                    />
                                                    <label 
                                                        htmlFor={`target-${name}`}
                                                        style={{ flex: 1, fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: isTarget ? '#c9a84c' : '#000', marginBottom: 0 }}
                                                    >
                                                        {name} {isTarget && <span style={{ fontSize: '9px', background: '#c9a84c', color: '#000', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontWeight: 'bold' }}>KEEP (TARGET)</span>}
                                                    </label>
                                                    <button 
                                                        onClick={() => handleRemoveName(name)}
                                                        style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Confirmation view */
                        <div className="merge-warning-box" style={{ padding: '20px 30px', background: '#fff1f0', borderRadius: '12px', border: '2px dashed #cf1322', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '15px' }}>⚠️</div>
                            <h4 style={{ color: '#cf1322', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '900' }}>PERMANENT CASCADE DATA CHANGE</h4>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                                Are you absolutely sure about this merge? <br />
                                Every historical instance of the names: <br />
                                <span style={{ display: 'inline-block', marginTop: '8px', background: '#fff', color: '#cf1322', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ffa39e', fontWeight: 'bold' }}>
                                    {sourceNames.join(', ')}
                                </span> <br />
                                will be renamed to <strong style={{ color: '#000', fontSize: '16px' }}>"{targetName}"</strong> across ALL match details, events, lineups, and squad tables.
                            </p>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '15px' }}>This action will delete the obsolete catalog records and cannot be undone.</p>
                        </div>
                    )}

                </div>

                <div className="modal-actions" style={{ padding: '20px 30px', display: 'flex', gap: '15px', background: '#fafafa', borderTop: '1px solid #eee' }}>
                    <button className="cancel-btn" onClick={() => { if (isConfirming) setIsConfirming(false); else onClose(); }} disabled={merging} style={{ flex: 1, height: '48px', minHeight: '48px' }}>
                        {isConfirming ? "GO BACK" : "ABORT"}
                    </button>
                    <button 
                        className="save-btn" 
                        onClick={handleExecuteMerge} 
                        disabled={merging || (!isConfirming && selectedNames.length < 2)}
                        style={{ 
                            background: isConfirming ? '#cf1322' : '#000', 
                            color: isConfirming ? '#fff' : '#c9a84c',
                            flex: 1,
                            height: '48px',
                            minHeight: '48px'
                        }}
                    >
                        {merging ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner"></div>
                                <span>MERGING...</span>
                            </div>
                        ) : isConfirming ? (
                            "YES, EXECUTE PERMANENT MERGE"
                        ) : (
                            "PROCEED TO CONFIRM"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
