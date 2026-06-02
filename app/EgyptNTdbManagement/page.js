"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { EgyptNTService } from "../EgyptNT/egypt_nt_db_service";
import * as XLSX from "xlsx";
import { Download, Database, ArrowLeft, X, Menu, Edit, Trash2 } from "lucide-react";
import Login_db from "../lib/Login_db";
import "../EgyptNT/egypt_nt_sidebar.css";

export default function EgyptDatabaseManagement() {
    const router = useRouter();
    const [availableTables, setAvailableTables] = useState([]);
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [selectedTable, setSelectedTable] = useState("");
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [selectedRows, setSelectedRows] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isConfirmingMerge, setIsConfirmingMerge] = useState(false);
    const [mergeTargetName, setMergeTargetName] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;
    const [saving, setSaving] = useState(false);

    const handleDownloadExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            alert("No data available to download.");
            return;
        }

        try {
            const exportData = filteredData.map(row => {
                const newRow = {};
                columns.forEach(col => {
                    newRow[col] = row[col];
                });
                return newRow;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const tableName = selectedTable.replace('egy_NT_', '').toUpperCase();
            const fileName = `EGYPT_NT_${tableName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error("Export Error:", error);
            alert("An error occurred while generating the Excel file.");
        }
    };

    useEffect(() => {
        const loadTables = async () => {
            try {
                const { data, error } = await supabase.rpc('get_egyptnt_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data.map(t => {
                        const label = t.table_name.replace('egy_NT_', '').replace(/_/g, ' ');
                        return { name: t.table_name, label };
                    }).sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableTables(sorted);
                    setSelectedTable(sorted[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch tables:", err);
            }
        };
        loadTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchTableData();
        }
    }, [selectedTable]);

    useEffect(() => {
        setCurrentPage(1); // Reset page on table change
        setSelectedRows([]); // Clear selection
    }, [selectedTable]);

    useEffect(() => {
        setCurrentPage(1); // Reset page on search
        setSelectedRows([]); // Clear selection
    }, [searchTerm]);

    const handleToggleSelect = (row) => {
        const key = selectedTable === "egy_NT_SQUAD" ? row["PLAYERNAME"] : row["PLAYER NAME"];
        if (selectedRows.some(r => {
            const rKey = selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"];
            return rKey === key;
        })) {
            setSelectedRows(selectedRows.filter(r => {
                const rKey = selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"];
                return rKey !== key;
            }));
        } else {
            setSelectedRows([...selectedRows, row]);
        }
    };

    const handleMergeTrigger = () => {
        const names = [...new Set(selectedRows.map(r => selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"]))];
        if (names.length < 2) {
            alert("Please select at least two DIFFERENT names to merge.");
            return;
        }
        setMergeTargetName(names[0]);
        setShowMergeModal(true);
    };

    const handleConfirmMerge = async () => {
        const names = [...new Set(selectedRows.map(r => selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"]))];
        if (!mergeTargetName.trim()) {
            alert("Please enter a valid target name.");
            return;
        }

        if (!isConfirmingMerge) {
            setIsConfirmingMerge(true);
            return;
        }

        setIsMerging(true);
        setIsConfirmingMerge(false);
        setShowMergeModal(false);
        try {
            await EgyptNTService.mergePlayers(mergeTargetName.trim(), names);
            setSelectedRows([]);
            fetchTableData();
        } catch (error) {
            alert("Merge failed: " + error.message);
        } finally {
            setIsMerging(false);
        }
    };

    async function fetchTableData() {
        setLoading(true);
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                let query = supabase.from(selectedTable).select("*");

                // Deterministic ordering based on table type
                if (selectedTable === "egy_NT_SQUAD") {
                    query = query.order("PLAYERNAME", { ascending: true });
                } else if (selectedTable === "egy_NT_MATCHDETAILS") {
                    query = query.order("DATE", { ascending: false });
                } else if (selectedTable.includes("DETAILS") || selectedTable.includes("MISSED")) {
                    query = query.order("MATCH_ID", { ascending: false });
                }

                const { data, error } = await query.range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            if (allData.length > 0) {
                let cols = Object.keys(allData[0]);
                // Force ROW_ID to the front (case-insensitive check)
                const rowIdIdx = cols.findIndex(c => c.toUpperCase() === "ROW_ID");
                if (rowIdIdx > -1) {
                    const rowIdKey = cols[rowIdIdx];
                    cols.splice(rowIdIdx, 1);
                    cols.unshift(rowIdKey);
                }
                setColumns(cols);

                // Fetch match dates for joined sorting if table is egy_NT_PLAYERDETAILS
                let matchDateMap = {};
                if (['egy_NT_PLAYERDETAILS'].includes(selectedTable) && cols.includes('MATCH_ID')) {
                    try {
                        const { data: datesData } = await supabase.from('egy_NT_MATCHDETAILS').select('MATCH_ID, DATE');
                        if (datesData) {
                            datesData.forEach(d => {
                                matchDateMap[d.MATCH_ID] = new Date(d.DATE).getTime();
                                if (isNaN(matchDateMap[d.MATCH_ID]) && d.DATE && d.DATE.includes('/')) {
                                    const [day, month, year] = d.DATE.split('/');
                                    matchDateMap[d.MATCH_ID] = new Date(`${year}-${month}-${day}`).getTime();
                                }
                            });
                        }
                    } catch (err) { console.error("Error fetching dates for sort:", err); }
                }

                // Deterministic secondary sorting logic
                const tablesToSortByRowId = ['egy_NT_GKSDETAILS', 'egy_NT_HOWPENMISSED', 'egy_NT_LINEUPDETAILS'];
                const ridKey = cols.find(c => c.toUpperCase() === "ROW_ID");

                if (selectedTable === 'egy_NT_MATCHDETAILS' && cols.includes('DATE')) {
                    const parseDate = (d) => {
                        if (!d) return 0;
                        if (String(d).includes('/')) {
                            const [day, month, year] = String(d).split('/');
                            const dateObj = new Date(`${year}-${month}-${day}`);
                            return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
                        }
                        const dateObj = new Date(d);
                        return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
                    };
                    allData.sort((a, b) => parseDate(b.DATE) - parseDate(a.DATE));
                } else if (selectedTable === 'egy_NT_PLAYERDETAILS' && cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        const dateA = matchDateMap[a.MATCH_ID] || 0;
                        const dateB = matchDateMap[b.MATCH_ID] || 0;

                        // 1. Primary Sort: Date Descending (Latest first)
                        if (dateB !== dateA) return dateB - dateA;

                        // 2. Secondary Sort: EVENT_ID Ascending within same match
                        if (cols.includes('EVENT_ID')) {
                            const getNum = (id) => {
                                if (!id) return 0;
                                const parts = String(id).split('-');
                                const last = parts[parts.length - 1];
                                const n = parseInt(last);
                                return isNaN(n) ? 0 : n;
                            };
                            return getNum(a.EVENT_ID) - getNum(b.EVENT_ID);
                        }
                        return 0;
                    });
                } else if (tablesToSortByRowId.includes(selectedTable) && ridKey) {
                    allData.sort((a, b) => String(a[ridKey]).localeCompare(String(b[ridKey]), undefined, { numeric: true }));
                } else if (cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        // 1. Primary Sort: MATCH_ID Descending (Latest matches first)
                        if (String(a.MATCH_ID) !== String(b.MATCH_ID)) {
                            return String(b.MATCH_ID).localeCompare(String(a.MATCH_ID), undefined, { numeric: true });
                        }

                        // 2. Secondary Sort: depends on table columns
                        if (cols.includes('EVENT_ID')) {
                            const getNum = (id) => {
                                if (!id) return 0;
                                const parts = String(id).split('-');
                                const last = parts[parts.length - 1];
                                const n = parseInt(last);
                                return isNaN(n) ? 0 : n;
                            };
                            return getNum(a.EVENT_ID) - getNum(b.EVENT_ID);
                        } else if (cols.includes('PLAYER NAME')) {
                            return String(a["PLAYER NAME"]).localeCompare(String(b["PLAYER NAME"]));
                        } else if (cols.includes('PLAYERNAME')) {
                            return String(a["PLAYERNAME"]).localeCompare(String(b["PLAYERNAME"]));
                        }
                        return 0;
                    });
                }

                setTableData(allData);
            } else {
                setTableData([]);
                setColumns([]);
            }
        } catch (error) {
            console.error("Error fetching table data:", error.message);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleEditClick = (row) => {
        setEditingRow(row);
        setEditForm({ ...row });
    };

    const handleSaveEdit = async () => {
        if (!editingRow) return;
        setSaving(true);
        try {
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") ||
                columns.find(c => c.toLowerCase() === "id") ||
                columns.find(c => c.toLowerCase().includes("id") && c.toLowerCase() !== "match_id" && c.toLowerCase() !== "parent_event_id");

            const pkValue = pkField ? editingRow[pkField] : null;

            if (pkField && pkValue !== null && pkValue !== undefined && pkValue !== "") {
                const { error } = await supabase
                    .from(selectedTable)
                    .update(editForm)
                    .eq(pkField, pkValue);
                if (error) throw error;
            } else {
                // Fallback: Composite Key Matching
                let query = supabase.from(selectedTable).update(editForm);
                Object.keys(editForm).filter(key => key !== 'MATCH_ID' && key !== 'EVENT_ID' && key !== 'PARENT_EVENT_ID' && key !== 'ROW_ID').forEach(key => {
                    const val = editForm[key];
                    if (val === null || val === undefined) {
                        query = query.is(key, null);
                    } else {
                        query = query.eq(key, val);
                    }
                });
                const { error } = await query;
                if (error) throw error;
            }

            await fetchTableData();
            setEditingRow(null);
        } catch (error) {
            console.error("Update error:", error);
            alert("Update FAILED: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row) => {
        if (!confirm("Are you sure you want to delete this record? This is permanent.")) return;
        setLoading(true);
        try {
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") ||
                columns.find(c => c.toLowerCase() === "id") ||
                columns.find(c => c.toLowerCase().includes("id") && c.toLowerCase() !== "match_id" && c.toLowerCase() !== "parent_event_id");

            const pkValue = pkField ? row[pkField] : null;

            if (pkField && pkValue !== null && pkValue !== undefined && pkValue !== "") {
                const { error } = await supabase
                    .from(selectedTable)
                    .delete()
                    .eq(pkField, pkValue);
                if (error) throw error;
            } else {
                // Use composite key matching
                let query = supabase.from(selectedTable).delete();
                Object.keys(row).forEach(key => {
                    const val = row[key];
                    if (val === null || val === undefined) {
                        query = query.is(key, null);
                    } else {
                        query = query.eq(key, val);
                    }
                });
                const { error } = await query;
                if (error) throw error;
            }

            alert("Record deleted successfully.");
            await fetchTableData();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete FAILED: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = tableData.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div id="db-management-page" className={`egypt-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Backdrop for mobile drawer */}
                <div 
                    className={`egypt-sidebar-backdrop ${isSidebarMobileOpen ? 'active' : ''}`} 
                    onClick={() => setIsSidebarMobileOpen(false)}
                />

                {/* Sidebar navigation */}
                <aside className={`egypt-sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''}`}>
                    <div className="egypt-sidebar-header">
                        <Link href="/" className="egypt-sidebar-brand">
                            <div className="egypt-sidebar-logo-hex">
                                <span className="egypt-sidebar-logo-text">E</span>
                            </div>
                            <div className="egypt-sidebar-brand-name">
                                EGYPT <span>DB MGMT</span>
                            </div>
                        </Link>
                        <button 
                            className="egypt-sidebar-close-btn" 
                            onClick={() => setIsSidebarMobileOpen(false)}
                            title="CLOSE MENU"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="egypt-sidebar-menu">
                        {availableTables.map(t => (
                            <button
                                key={t.name}
                                className={`egypt-sidebar-item ${selectedTable === t.name ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedTable(t.name);
                                    setIsSidebarMobileOpen(false);
                                }}
                            >
                                <Database size={16} className="egypt-sidebar-item-icon" />
                                <span>{t.label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                            </button>
                        ))}
                    </div>

                    <div className="egypt-sidebar-actions">
                        <button
                            className="egypt-sidebar-collapse-toggle-btn"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            title={isSidebarCollapsed ? "EXPAND MENU" : "COLLAPSE MENU"}
                        >
                            <ArrowLeft size={14} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                            <span>COLLAPSE MENU</span>
                        </button>
                        <button 
                            className="egypt-sidebar-action-btn export-btn" 
                            onClick={handleDownloadExcel}
                            title="DOWNLOAD CURRENT VIEW AS EXCEL"
                        >
                            <Download size={14} />
                            <span>EXPORT TO EXCEL</span>
                        </button>
                    </div>
                </aside>

                <div className="egypt-main-content">
                    {/* Mobile Top Bar */}
                    <header className="egypt-mobile-top-bar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button 
                                className="egypt-menu-toggle-btn" 
                                onClick={() => setIsSidebarMobileOpen(true)}
                                title="OPEN MENU"
                            >
                                <Menu size={22} />
                            </button>
                            <Link href="/" className="egypt-mobile-brand">
                                <div className="egypt-mobile-brand-name">
                                    EGYPT <span>DB MGMT</span>
                                </div>
                            </Link>
                        </div>
                        <div className="egypt-mobile-actions">
                            <button 
                                onClick={handleDownloadExcel} 
                                className="egypt-mobile-action-icon"
                                title="DOWNLOAD CURRENT VIEW AS EXCEL"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    </header>

                    <main className="db-content">
                        <div className="data-toolbar">
                            <div className="search-wrap">
                                <input
                                    type="text"
                                    placeholder="SEARCH IN TABLE..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="record-count">{filteredData.length} RECORDS FOUND (PAGE {currentPage} OF {totalPages})</div>

                            {selectedTable === "egy_NT_SQUAD" && selectedRows.length > 1 && (
                                <button
                                    onClick={handleMergeTrigger}
                                    disabled={isMerging}
                                    style={{
                                        background: '#C8102E',
                                        color: '#fff',
                                        padding: '12px 24px',
                                        borderRadius: '30px',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        letterSpacing: '1px',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 15px rgba(200, 16, 46, 0.3)'
                                    }}
                                >
                                    {isMerging ? "MERGING..." : `MERGE ${selectedRows.length} PLAYERS`}
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="db-loader">SYNCING REAL-TIME DATA...</div>
                        ) : (
                            <>
                                <div className="table-overflow">
                                    <table className="db-table">
                                        <thead>
                                            <tr style={{ height: '54px' }}>
                                                {selectedTable === "egy_NT_SQUAD" && (
                                                    <th className="select-header" style={{ width: '60px', minWidth: '60px', position: 'sticky', left: 0, zIndex: 15 }}>SELECT</th>
                                                )}
                                                <th className="actions-header" style={{
                                                    width: '110px',
                                                    minWidth: '110px',
                                                    position: 'sticky',
                                                    left: selectedTable === "egy_NT_SQUAD" ? '60px' : '0',
                                                    zIndex: 15
                                                }}>ACTIONS</th>
                                                {columns.map(col => {
                                                    const isNarrow = ['GF', 'GA', 'ET', 'W-D-L', 'SEASON', 'ROUND', 'H-A-N', 'PEN', 'AGE'].includes(col);
                                                    return (
                                                        <th
                                                            key={col}
                                                            style={{
                                                                width: isNarrow ? '100px' : '180px',
                                                                minWidth: isNarrow ? '100px' : '180px'
                                                            }}
                                                        >
                                                            {col}
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={columns.length + (selectedTable === "egy_NT_SQUAD" ? 2 : 1)}
                                                        style={{
                                                            padding: '120px 20px',
                                                            color: '#C8102E',
                                                            fontSize: '28px',
                                                            fontWeight: '700',
                                                            background: '#fff',
                                                            letterSpacing: '3px',
                                                            fontFamily: "'Bebas Neue', sans-serif",
                                                            opacity: 0.6
                                                        }}
                                                    >
                                                        NO MATCHING RECORDS FOUND IN {selectedTable.replace('egy_NT_', '').toUpperCase()}
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedData.map((row, idx) => {
                                                    const rKey = selectedTable === "egy_NT_SQUAD" ? row["PLAYERNAME"] : row["PLAYER NAME"];
                                                    const isSelected = selectedRows.some(sr => {
                                                        const srKey = selectedTable === "egy_NT_SQUAD" ? sr["PLAYERNAME"] : sr["PLAYER NAME"];
                                                        return srKey === rKey;
                                                    });

                                                    return (
                                                        <tr key={idx} className={isSelected ? 'selected-row' : ''}>
                                                            {selectedTable === "egy_NT_SQUAD" && (
                                                                <td className="select-cell" style={{ textAlign: 'center', position: 'sticky', left: 0 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => handleToggleSelect(row)}
                                                                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                                                    />
                                                                </td>
                                                            )}
                                                            <td className="actions-cell" style={{
                                                                position: 'sticky',
                                                                left: selectedTable === "egy_NT_SQUAD" ? '60px' : '0'
                                                            }}>
                                                                <div className="actions-flex">
                                                                    <button className="edit-row-btn" onClick={() => handleEditClick(row)} title="Edit">
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button className="delete-row-btn" onClick={() => handleDelete(row)} title="Delete">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            {columns.map(col => (
                                                                <td key={col} style={col === 'W-D-L' ? { minWidth: '120px', fontWeight: 'bold' } : {}}>
                                                                    {String(row[col])}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <div className="pagination-controls">
                                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>PREVIOUS</button>
                                        <div className="page-indicator">PAGE {currentPage} OF {totalPages}</div>
                                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>NEXT</button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                    {editingRow && (
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
                    )}

                    {showMergeModal && (
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
                    )}
                </div>

                <style jsx>{`
                #db-management-page {
                    min-height: 100vh;
                    background: #f8f9fa;
                    color: #1a1a1a;
                    font-family: 'Outfit', sans-serif;
                }

                .db-content {
                    padding: 40px;
                    max-width: 1800px;
                    margin: 0 auto;
                }

                .data-toolbar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .search-wrap {
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                }

                .search-wrap input {
                    background: #fff;
                    border: 2px solid #eee;
                    padding: 18px 35px;
                    width: 100%;
                    font-size: 16px;
                    border-radius: 100px;
                    outline: none;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-weight: 600;
                    color: #000;
                }
                
                .search-wrap input:focus {
                    border-color: #C8102E;
                    box-shadow: 0 15px 50px rgba(200, 16, 46, 0.12);
                    transform: translateY(-2px);
                }

                .record-count {
                    font-size: 13px;
                    font-family: 'Space Mono', monospace;
                    color: #888;
                    letter-spacing: 2px;
                    font-weight: 700;
                }

                .table-overflow {
                    overflow-x: auto;
                    border: 1px solid #eee;
                    border-radius: 20px;
                    background: #fff;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.04);
                }

                .db-table {
                    min-width: 100%;
                    width: max-content;
                    border-collapse: separate;
                    border-spacing: 0;
                    font-size: 14px;
                    table-layout: fixed;
                }

                .db-table th {
                    background: #0a0a0a;
                    text-align: center;
                    padding: 24px 20px;
                    font-weight: 800;
                    font-size: 11px;
                    letter-spacing: 2px;
                    color: rgba(255,255,255,0.6);
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .db-table tr {
                    background: #fff;
                    transition: all 0.2s;
                }

                .db-table tr:hover {
                    background: #fff5f5;
                }

                .db-table td {
                    padding: 20px;
                    border-bottom: 1px solid #f2f2f2;
                    color: #444;
                    text-align: center;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .select-cell, .actions-cell {
                    position: sticky;
                    z-index: 5;
                    background: #fff;
                    box-shadow: 2px 0 5px rgba(0,0,0,0.02);
                }

                .select-header, .actions-header {
                    position: sticky;
                    z-index: 15 !important;
                    background: #0a0a0a !important;
                }

                .db-table tr:hover td.select-cell,
                .db-table tr:hover td.actions-cell {
                    background: #fff5f5 !important;
                }

                .db-table tr.selected-row td.select-cell,
                .db-table tr.selected-row td.actions-cell {
                    background: #ffe3e3 !important;
                }

                .actions-cell {
                    min-width: 110px;
                }
                
                .actions-flex {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                }

                .edit-row-btn, .delete-row-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .edit-row-btn {
                    background: #000;
                    color: #fff;
                }

                .edit-row-btn:hover {
                    background: #C8102E;
                    color: #fff;
                    transform: translateY(-2px);
                }

                .delete-row-btn {
                    background: #fff1f0;
                    color: #cf1322;
                }

                .delete-row-btn:hover {
                    background: #cf1322;
                    color: #fff;
                    transform: translateY(-2px);
                }

                .db-loader {
                    text-align: center;
                    padding: 150px;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 32px;
                    letter-spacing: 6px;
                    color: #C8102E;
                    animation: pulse 2s infinite;
                }

                .selected-row {
                    background: #ffe3e3 !important;
                }

                @keyframes pulse {
                    0% { opacity: 0.4; transform: scale(0.98); }
                    50% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0.4; transform: scale(0.98); }
                }

                .edit-modal-wrap {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(10px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }

                .edit-modal {
                    background: #fff;
                    width: 100%;
                    max-width: 800px;
                    max-height: 85vh;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 30px 100px rgba(0,0,0,0.5);
                    overflow: hidden;
                    animation: modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes modalEntry {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .edit-modal h3 {
                    margin: 0;
                    padding: 30px;
                    background: #0a0a0a;
                    color: #fff;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 24px;
                    letter-spacing: 3px;
                    border-bottom: 3px solid #C8102E;
                }

                .modal-form {
                    padding: 40px;
                    overflow-y: auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .form-group {
                    margin-bottom: 0;
                }

                .form-group label {
                    display: block;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #888;
                    margin-bottom: 8px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                }

                .form-group input {
                    width: 100%;
                    padding: 14px 20px;
                    border: 2px solid #f0f0f0;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #000;
                    box-sizing: border-box;
                    transition: all 0.2s;
                }

                .form-group input:focus {
                    border-color: #C8102E;
                    background: #fff5f5;
                    outline: none;
                }

                .modal-actions {
                    padding: 30px 40px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    background: #fafafa;
                    border-top: 1px solid #eee;
                }

                .cancel-btn, .save-btn {
                    flex: 1;
                    padding: 16px 30px;
                    font-size: 12px;
                    font-family: 'Outfit', sans-serif;
                    font-weight: 800;
                    letter-spacing: 1px;
                    cursor: pointer;
                    border-radius: 12px;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 54px;
                }
                
                .cancel-btn {
                    background: #eee;
                    border: none;
                    color: #666;
                }
                .cancel-btn:hover { background: #e0e0e0; color: #000; }

                .save-btn {
                    background: #000;
                    border: none;
                    color: #C8102E;
                }
                .save-btn:hover {
                    background: #C8102E;
                    color: #fff;
                    box-shadow: 0 8px 20px rgba(200, 16, 46, 0.3);
                }

                .save-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .btn-loader-wrap {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .btn-spinner {
                    width: 18px;
                    height: 18px;
                    border: 3px solid rgba(200, 16, 46, 0.3);
                    border-top-color: #C8102E;
                    border-radius: 50%;
                    animation: btnRotation 0.8s linear infinite;
                }

                @keyframes btnRotation {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .pagination-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 40px;
                    margin-top: 50px;
                    padding-bottom: 60px;
                }

                .pagination-controls button {
                    background: #fff;
                    border: 2px solid #eee;
                    padding: 15px 35px;
                    font-size: 12px;
                    font-family: 'Bebas Neue', sans-serif;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s;
                    border-radius: 50px;
                    color: #000;
                }

                .pagination-controls button:hover:not(:disabled) {
                    border-color: #C8102E;
                    color: #fff;
                    background: #000;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }

                .pagination-controls button:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .page-indicator {
                    font-family: 'Space Mono', monospace;
                    font-size: 13px;
                    font-weight: 700;
                    color: #888;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            `}</style>
            </div>
        </Login_db>
    );
}
