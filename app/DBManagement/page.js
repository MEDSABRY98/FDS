"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";
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
import MergeToolModal from "./Modals/MergeToolModal";
import DeleteConfirmModal from "./Modals/DeleteConfirmModal";
import DuplicatesPanel from "./Components/DuplicatesPanel";
import Settings_db from "../lib/Settings_db";
import { SETTINGS_TAB_ID } from "../Database";
import { useDuplicateSuggestions } from "./Hooks/UseDuplicateSuggestions";

import { Plus, GitMerge, X, Replace } from "lucide-react";
import ReplaceRecordModal from "./Modals/ReplaceRecordModal";

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
        handleDelete,
        deletingRow,
        setDeletingRow,
        handleConfirmDelete,
        isReplacing,
        setIsReplacing,
        handleExecuteReplace
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
        getRowKey,
        handleToggleSelect,
        handleMergeTrigger,
        handleConfirmMerge
    } = useMergeRecords(selectedTable, fetchTableData, addNotification);

    const [statsEntity, setStatsEntity] = useState(null);
    const [showMergeTool, setShowMergeTool] = useState(false);
    const [catalogView, setCatalogView] = useState("normal");

    const isUtilityTab = selectedTable === SETTINGS_TAB_ID;

    const {
        isDuplicateTable,
        duplicatePairs,
        totalSuggestions,
        hiddenCount,
        computing,
        mergingKey,
        getKeepTarget,
        setKeepTarget,
        handleIgnore,
        handleMergePair,
    } = useDuplicateSuggestions(
        selectedTable,
        tableData,
        fetchTableData,
        addNotification,
        catalogView === 'duplicates'
    );

    // Clear selected rows when changing table
    useEffect(() => {
        setSelectedRows([]);
    }, [selectedTable, setSelectedRows]);

    useEffect(() => {
        setCatalogView("normal");
    }, [selectedTable]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedTable]);

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

    const showFullLoading = !isUtilityTab && (tableLoading || saving || deleting) && tableData.length === 0;

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
                        {showFullLoading ? (
                            <Loading_db inline={true} />
                        ) : selectedTable === SETTINGS_TAB_ID ? (
                            <Settings_db addNotification={addNotification} />
                        ) : (
                            <>
                                {isDuplicateTable && (
                                    <div className="catalog-view-tabs">
                                        <button
                                            type="button"
                                            className={`catalog-view-tab ${catalogView === 'normal' ? 'active' : ''}`}
                                            onClick={() => setCatalogView('normal')}
                                        >
                                            NORMAL
                                        </button>
                                        <button
                                            type="button"
                                            className={`catalog-view-tab ${catalogView === 'duplicates' ? 'active' : ''}`}
                                            onClick={() => setCatalogView('duplicates')}
                                        >
                                            DUPLICATES
                                            {!computing && duplicatePairs.length > 0 && (
                                                <span className="catalog-view-badge">{duplicatePairs.length}</span>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {catalogView === 'normal' && (
                                    <>
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

                                                {selectedTable && selectedTable !== SETTINGS_TAB_ID && (
                                                    <button
                                                        onClick={() => setIsReplacing(true)}
                                                        title="REPLACE TEXT"
                                                        style={{
                                                            background: 'transparent',
                                                            border: '2px solid #c9a84c',
                                                            color: '#c9a84c',
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 4px 10px rgba(201,168,76,0.05)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
                                                            e.currentTarget.style.transform = 'scale(1.05)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        <Replace size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={handleAddClick}
                                                    title="ADD RECORD"
                                                    style={{
                                                        background: '#c9a84c',
                                                        color: '#000',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 10px rgba(201,168,76,0.2)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#b8943e';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#c9a84c';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                </button>

                                                <button
                                                    onClick={() => setShowMergeTool(true)}
                                                    title="MERGE PLAYER RECORDS"
                                                    style={{
                                                        background: '#cf1322',
                                                        color: '#fff',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 10px rgba(207,19,34,0.2)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#a6101b';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#cf1322';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <GitMerge size={16} />
                                                </button>

                                                {selectedRows.length > 1 && (
                                                    <button
                                                        onClick={handleMergeTrigger}
                                                        disabled={isMerging}
                                                        title={isMerging ? "MERGING RECORDS..." : `MERGE ${selectedRows.length} SELECTED RECORDS`}
                                                        style={{
                                                            background: '#cf1322',
                                                            color: '#fff',
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 4px 10px rgba(207,19,34,0.2)',
                                                            position: 'relative',
                                                            opacity: isMerging ? 0.7 : 1,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isMerging) {
                                                                e.currentTarget.style.background = '#a6101b';
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isMerging) {
                                                                e.currentTarget.style.background = '#cf1322';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }
                                                        }}
                                                    >
                                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <GitMerge size={16} />
                                                            <span
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '-10px',
                                                                    right: '-10px',
                                                                    background: '#fff',
                                                                    color: '#cf1322',
                                                                    borderRadius: '50%',
                                                                    width: '15px',
                                                                    height: '15px',
                                                                    fontSize: '9px',
                                                                    fontWeight: '800',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                                                    fontFamily: 'Space Mono, monospace'
                                                                }}
                                                            >
                                                                {selectedRows.length}
                                                            </span>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <DynamicTable
                                            columns={columns}
                                            paginatedData={paginatedData}
                                            selectedRows={selectedRows}
                                            onToggleSelect={handleToggleSelect}
                                            onEdit={handleEditClick}
                                            onDelete={handleDelete}
                                            getName={getName}
                                            getRowKey={getRowKey}
                                            onEntityClick={(entityId, row) => setStatsEntity({ id: entityId, row })}
                                        />

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                        />
                                    </>
                                )}

                                {catalogView === 'duplicates' && isDuplicateTable && (
                                    <>
                                        <div className="duplicates-toolbar">
                                            <span className="duplicates-summary">
                                                {computing
                                                    ? 'SCANNING FOR DUPLICATES...'
                                                    : `${duplicatePairs.length} SUGGESTED PAIRS${totalSuggestions > duplicatePairs.length ? ` Â· ${hiddenCount} HIDDEN` : ''}`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowMergeTool(true)}
                                                className="duplicates-merge-tool-btn"
                                            >
                                                <GitMerge size={14} />
                                                OPEN MERGE TOOL
                                            </button>
                                        </div>

                                        <DuplicatesPanel
                                            duplicatePairs={duplicatePairs}
                                            hiddenCount={hiddenCount}
                                            computing={computing}
                                            mergingKey={mergingKey}
                                            getKeepTarget={getKeepTarget}
                                            setKeepTarget={setKeepTarget}
                                            onIgnore={handleIgnore}
                                            onMerge={handleMergePair}
                                        />
                                    </>
                                )}
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
                    isOpen={!!statsEntity}
                    onClose={() => setStatsEntity(null)}
                    entityTable={selectedTable}
                    entityId={statsEntity?.id}
                    entityLabel={statsEntity ? getName(statsEntity.row) : ''}
                />

                {showMergeTool && (
                    <MergeToolModal
                        selectedTable={selectedTable}
                        tableData={tableData}
                        onClose={() => setShowMergeTool(false)}
                        onMergeComplete={fetchTableData}
                        addNotification={addNotification}
                    />
                )}

                {deletingRow && (
                    <DeleteConfirmModal
                        deletingRow={deletingRow}
                        onClose={() => setDeletingRow(null)}
                        onConfirm={handleConfirmDelete}
                        deleting={deleting}
                        getName={getName}
                    />
                )}
                {isReplacing && (
                    <ReplaceRecordModal
                        selectedTable={selectedTable}
                        columns={columns}
                        saving={saving}
                        setIsReplacing={setIsReplacing}
                        handleExecuteReplace={handleExecuteReplace}
                    />
                )}
                {/* Floating Merge Widget */}
                {catalogView === 'normal' && selectedRows.length > 1 && (
                    <div className="floating-merge-widget">
                        <button
                            className="floating-merge-btn"
                            onClick={handleMergeTrigger}
                            disabled={isMerging}
                            title={`Merge ${selectedRows.length} selected records`}
                        >
                            <GitMerge size={16} className={isMerging ? "spinning-merge-icon" : "floating-merge-icon"} />
                            <span>{isMerging ? "MERGING..." : `MERGE (${selectedRows.length})`}</span>
                        </button>
                        <button
                            className="floating-clear-btn"
                            onClick={() => setSelectedRows([])}
                            title="Deselect all records"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                </div>
            </DatabaseSidebar>
        </Login_db>
    );
}
