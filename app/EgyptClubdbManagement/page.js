"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Menu } from "lucide-react";
import * as XLSX from "xlsx";
import Login_db from "../lib/Login_db";
import { useNotification } from "../lib/Notification_db";
import "../EgyptClub/egy_c_sidebar.css";
import "./EgyptClubdbManagement.css";

// Import Custom Hooks
import { useTableData } from "./Hooks/UseTableData";
import { useEditRecord } from "./Hooks/UseEditRecord";

// Import Components
import { DatabaseSidebar } from "./Components/DatabaseSidebar";
import { DatabaseToolbar } from "./Components/DatabaseToolbar";
import { DynamicTable } from "./Components/DynamicTable";
import { Pagination } from "./Components/Pagination";

// Import Modals
import { EditRecordModal } from "./Modals/EditRecordModal";

export default function EgyptClubDatabaseManagement() {
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
            const tableName = selectedTable.replace('egy_CLUB_', '').toUpperCase();
            const fileName = `EGYPT_CLUB_${tableName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error("Export Error:", error);
            addNotification("An error occurred while generating the Excel file.", "error");
        }
    };

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <div id="db-management-page" className={`egypt-container egyptclub-db-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                                    CLUBS <span>DB MGMT</span>
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
                        <DatabaseToolbar 
                            searchTerm={searchTerm} 
                            setSearchTerm={setSearchTerm} 
                            recordCount={filteredData ? filteredData.length : 0} 
                            loading={loading}
                        />

                        {loading ? (
                            <div className="db-loader-wrap">
                                <div className="db-spinner"></div>
                                <div>SYNCING WITH DATABASE...</div>
                            </div>
                        ) : (
                            <>
                                <DynamicTable 
                                    selectedTable={selectedTable}
                                    columns={columns}
                                    paginatedData={paginatedData}
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
                </div>

            </div>
        </Login_db>
    );
}
