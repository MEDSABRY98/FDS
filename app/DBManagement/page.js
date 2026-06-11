"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Login_db from "../lib/Login_db";
import { useNotification } from "../lib/Notification_db";

import "./DBManagement.css";
import { useTableData } from "./Hooks/UseTableData";
import { useEditRecord } from "./Hooks/UseEditRecord";
import { useMergeRecords } from "./Hooks/UseMergeRecords";

import DatabaseSidebar from "./Components/DatabaseSidebar";
import DynamicTable from "./Components/DynamicTable";
import Pagination from "./Components/Pagination";
import MergeModal from "./Modals/MergeModal";
import EditModal from "./Modals/EditModal";
import EntityStatsModal from "./Modals/EntityStatsModal";

import { Plus } from "lucide-react";

export default function DBManagement() {
    const { addNotification } = useNotification();

    // Table loading and data hooks
    const {
        availableTables,
        selectedTable,
        setSelectedTable,
        tableData,
        columns,
        loading: tableLoading,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedData,
        filteredData,
        fetchTableData
    } = useTableData(addNotification);

    // Edit/Add records hooks
    const {
        editingRow,
        setEditingRow,
        editForm,
        setEditForm,
        saving,
        deleting,
        handleEditClick,
        handleAddClick,
        handleSaveEdit,
        handleDelete
    } = useEditRecord(selectedTable, columns, fetchTableData, addNotification);

    // Merge record hooks
    const {
        selectedRows,
        setSelectedRows,
        isMerging,
        showMergeModal,
        setShowMergeModal,
        isConfirmingMerge,
        setIsConfirmingMerge,
        mergeTargetName,
        setMergeTargetName,
        getName,
        handleToggleSelect,
        handleMergeTrigger,
        handleConfirmMerge
    } = useMergeRecords(selectedTable, fetchTableData, addNotification);

    const [statsEntityName, setStatsEntityName] = useState(null);

    // Clear selected rows when changing table
    useEffect(() => {
        setSelectedRows([]);
    }, [selectedTable, setSelectedRows]);

    const handleDownloadExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            addNotification("No data available to download.", "warn");
            return;
        }
        try {
            const exportData = filteredData.map(row => {
                const newRow = {};
                columns.forEach(col => { newRow[col] = row[col]; });
                return newRow;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const tableName = selectedTable.replace('db_', '').toUpperCase();
            const fileName = `GLOBAL_${tableName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error("Export Error:", error);
            addNotification("An error occurred while generating the Excel file.", "error");
        }
    };

    const isLoading = tableLoading || saving || deleting;

    return (
        <Login_db title="EDITOR ACCESS" subtitle="GLOBAL DATABASE MANAGEMENT">
            <DatabaseSidebar
                availableTables={availableTables}
                selectedTable={selectedTable}
                setSelectedTable={setSelectedTable}
                handleDownloadExcel={handleDownloadExcel}
            >
                <div className="global-db-page">
                    <main className="db-content">
                    <div className="data-toolbar">
                        <div className="search-wrap">
                            <input
                                type="text"
                                placeholder="SEARCH RECORD..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="record-count" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span>{filteredData.length} RECORDS FOUND (PAGE {currentPage} OF {totalPages || 1})</span>
                            
                            {/* Add New Record Button */}
                            <button
                                onClick={handleAddClick}
                                style={{
                                    background: '#c9a84c',
                                    color: '#000',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 10px rgba(201,168,76,0.2)'
                                }}
                            >
                                <Plus size={14} />
                                ADD RECORD
                            </button>

                            {/* Merge Buttons */}
                            {selectedRows.length > 1 && (
                                <button
                                    onClick={handleMergeTrigger}
                                    disabled={isMerging}
                                    style={{
                                        background: '#cf1322',
                                        color: '#fff',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        boxShadow: '0 4px 10px rgba(207,19,34,0.2)'
                                    }}
                                >
                                    {isMerging ? "MERGING..." : `MERGE ${selectedRows.length} RECORDS`}
                                </button>
                            )}
                        </div>
                    </div>

                    {isLoading && tableData.length === 0 ? (
                        <div className="db-loader">SYNCING REAL-TIME DATA...</div>
                    ) : (
                        <>
                            <DynamicTable
                                columns={columns}
                                paginatedData={paginatedData}
                                selectedRows={selectedRows}
                                onToggleSelect={handleToggleSelect}
                                onEdit={handleEditClick}
                                onDelete={handleDelete}
                                getName={getName}
                                onNameClick={(name) => setStatsEntityName(name)}
                            />

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </main>

                {/* Modals */}
                {editingRow && (
                    <EditModal
                        editingRow={editingRow}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        columns={columns}
                        onClose={() => setEditingRow(null)}
                        onSave={handleSaveEdit}
                        saving={saving}
                    />
                )}

                {showMergeModal && (
                    <MergeModal
                        selectedTable={selectedTable}
                        selectedRows={selectedRows}
                        isConfirmingMerge={isConfirmingMerge}
                        setIsConfirmingMerge={setIsConfirmingMerge}
                        setShowMergeModal={setShowMergeModal}
                        mergeTargetName={mergeTargetName}
                        setMergeTargetName={setMergeTargetName}
                        handleConfirmMerge={handleConfirmMerge}
                        getName={getName}
                    />
                )}

                <EntityStatsModal
                    isOpen={!!statsEntityName}
                    onClose={() => setStatsEntityName(null)}
                    entityTable={selectedTable}
                    entityName={statsEntityName}
                />
                </div>
            </DatabaseSidebar>
        </Login_db>
    );
}
