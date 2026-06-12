"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Menu } from "lucide-react";
import * as XLSX from "xlsx";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";
import { useNotification } from "../lib/Notification_db";
import "../EgyptNT/egypt_nt_sidebar.css";
import "./EgyptNTdbManagement.css"; // Newly extracted styles

// Import Custom Hooks
import { useTableData } from "./Hooks/UseTableData";
import { useMergeRecords } from "./Hooks/UseMergeRecords";
import { useEditRecord } from "./Hooks/UseEditRecord";

// Import Components
import { DatabaseSidebar } from "./Components/DatabaseSidebar";
import { DatabaseToolbar } from "./Components/DatabaseToolbar";
import { DynamicTable } from "./Components/DynamicTable";
import { Pagination } from "./Components/Pagination";

// Import Modals
import { EditRecordModal } from "./Modals/EditRecordModal";
import { MergePlayersModal } from "./Modals/MergePlayersModal";

export default function EgyptDatabaseManagement() {
    const { addNotification } = useNotification();
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Initialize Hooks
    const {
        availableTables,
        selectedTable,
        setSelectedTable,
        columns,
        loading,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedData,
        filteredData,
        fetchTableData
    } = useTableData(addNotification);

    const {
        selectedRows,
        isMerging,
        showMergeModal,
        setShowMergeModal,
        isConfirmingMerge,
        setIsConfirmingMerge,
        mergeTargetName,
        setMergeTargetName,
        handleToggleSelect,
        handleMergeTrigger,
        handleConfirmMerge
    } = useMergeRecords(selectedTable, fetchTableData, addNotification);

    const {
        editingRow,
        setEditingRow,
        editForm,
        setEditForm,
        saving,
        handleEditClick,
        handleSaveEdit,
        handleDelete
    } = useEditRecord(selectedTable, columns, fetchTableData, addNotification);

    const handleDownloadExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            addNotification("No data available to download.", "warn");
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
            addNotification("An error occurred while generating the Excel file.", "error");
        }
    };

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div id="db-management-page" className={`egypt-container egyptnt-db-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Backdrop for mobile drawer */}
                <div 
                    className={`egypt-sidebar-backdrop ${isSidebarMobileOpen ? 'active' : ''}`} 
                    onClick={() => setIsSidebarMobileOpen(false)}
                />

                <DatabaseSidebar 
                    isSidebarMobileOpen={isSidebarMobileOpen}
                    setIsSidebarMobileOpen={setIsSidebarMobileOpen}
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    availableTables={availableTables}
                    selectedTable={selectedTable}
                    setSelectedTable={setSelectedTable}
                    handleDownloadExcel={handleDownloadExcel}
                />

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
                        {loading ? (
                            <Loading_db title="EGYPT NATIONAL TEAM" subtitle="DATABASE" message="SYNCING WITH DATABASE..." inline={true} />
                        ) : (
                            <>
                                <DatabaseToolbar 
                                    searchTerm={searchTerm} 
                                    setSearchTerm={setSearchTerm} 
                                    recordCount={filteredData ? filteredData.length : 0} 
                                    loading={loading}
                                />

                                {["egy_NT_SQUAD", "egy_NT_PLAYERDETAILS"].includes(selectedTable) && selectedRows.length > 0 && (
                                    <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: '#C8102E' }}>{selectedRows.length}</span> records selected
                                        </div>
                                        <button
                                            onClick={handleMergeTrigger}
                                            disabled={isMerging}
                                            style={{
                                                background: '#C8102E',
                                                color: '#fff',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                boxShadow: '0 4px 10px rgba(200,16,46,0.2)'
                                            }}
                                        >
                                            {isMerging ? "MERGING..." : `MERGE RECORDS`}
                                        </button>
                                    </div>
                                )}

                                <DynamicTable 
                                    selectedTable={selectedTable}
                                    columns={columns}
                                    paginatedData={paginatedData}
                                    selectedRows={selectedRows}
                                    handleToggleSelect={handleToggleSelect}
                                    handleEditClick={handleEditClick}
                                    handleDelete={handleDelete}
                                />
                                <Pagination 
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    totalPages={totalPages}
                                />
                            </>
                        )}
                    </main>

                    {editingRow && (
                        <EditRecordModal 
                            selectedTable={selectedTable}
                            columns={columns}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            saving={saving}
                            setEditingRow={setEditingRow}
                            handleSaveEdit={handleSaveEdit}
                        />
                    )}

                    {showMergeModal && (
                        <MergePlayersModal 
                            selectedTable={selectedTable}
                            selectedRows={selectedRows}
                            isConfirmingMerge={isConfirmingMerge}
                            setIsConfirmingMerge={setIsConfirmingMerge}
                            setShowMergeModal={setShowMergeModal}
                            mergeTargetName={mergeTargetName}
                            setMergeTargetName={setMergeTargetName}
                            handleConfirmMerge={handleConfirmMerge}
                        />
                    )}
                </div>

            </div>
        </Login_db>
    );
}
