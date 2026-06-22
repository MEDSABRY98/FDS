"use client";

import { useState, useEffect } from "react";
import { Download, Menu, Replace } from "lucide-react";
import { supabase } from "../Database";
import * as XLSX from "xlsx";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";
import { useNotification } from "../lib/Notification_db";

import "./AlahlydbManagement.css";
import { useTableData } from "./Hooks/UseTableData";
import { useEditRecord } from "./Hooks/UseEditRecord";
import DatabaseSidebar from "./Components/DatabaseSidebar";
import DynamicTable from "./Components/DynamicTable";
import Pagination from "./Components/Pagination";
import EditModal from "./Modals/EditModal";
import ReplaceRecordModal from "./Modals/ReplaceRecordModal";

export default function DatabaseManagement() {
    const { addNotification } = useNotification();
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRows, setSelectedRows] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    // Load Available Tables
    useEffect(() => {
        const loadTables = async () => {
            try {
                const { data, error } = await supabase.rpc('get_alahly_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data.map(t => {
                        const label = t.table_name.replace('alahly_', '').replace(/_/g, ' ');
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

    // Custom Hooks
    const { tableData, columns, loading: tableLoading, fetchTableData, setLoading, setTableData, setColumns } = useTableData(selectedTable, addNotification);
    
    const handleTableChange = (newTable) => {
        if (newTable !== selectedTable) {
            setLoading(true);
            setTableData([]);
            setColumns([]);
            setSelectedTable(newTable);
        }
    };
    
    const { 
        editingRow, setEditingRow, 
        editForm, setEditForm, 
        saving, loading: editLoading, 
        handleEditClick, handleSaveEdit, handleDelete,
        isReplacing, setIsReplacing, handleExecuteReplace
    } = useEditRecord(selectedTable, columns, fetchTableData, addNotification);

    // Effect triggers
    useEffect(() => {
        if (selectedTable) {
            fetchTableData();
            setCurrentPage(1);
            setSelectedRows([]);
        }
    }, [selectedTable, fetchTableData]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedRows([]);
    }, [searchTerm]);

    // Computed Data
    const filteredData = tableData.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Handlers
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
            const tableName = selectedTable.replace('alahly_', '').toUpperCase();
            const fileName = `AL_AHLY_${tableName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error("Export Error:", error);
            addNotification("An error occurred while generating the Excel file.", "error");
        }
    };

    const handleToggleSelect = (row) => {
        const key = row["PLAYER NAME"];
        if (selectedRows.some(r => r["PLAYER NAME"] === key)) {
            setSelectedRows(selectedRows.filter(r => r["PLAYER NAME"] !== key));
        } else {
            setSelectedRows([...selectedRows, row]);
        }
    };

    const isLoading = tableLoading || editLoading;

    return (
        <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
            <DatabaseSidebar 
                availableTables={availableTables}
                selectedTable={selectedTable}
                setSelectedTable={handleTableChange}
                handleDownloadExcel={handleDownloadExcel}
            >
                <div className="alahly-db-page">
                    <main className="db-content">
                    {isLoading ? (
                        <Loading_db title="AL AHLY" subtitle="DATABASE" message="SYNCING REAL-TIME DATA..." inline={true} />
                    ) : (
                        <>
                            <div className="data-toolbar">
                                <div className="search-wrap">
                                    <input
                                        type="text"
                                        placeholder="SEARCH IN TABLE..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="record-count" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {selectedTable && (
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
                                    <span>{filteredData.length} RECORDS FOUND (PAGE {currentPage} OF {totalPages || 1})</span>
                                </div>
                            </div>

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
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                            />
                        </>
                    )}
                </main>

                <EditModal 
                    editingRow={editingRow}
                    setEditingRow={setEditingRow}
                    selectedTable={selectedTable}
                    columns={columns}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saving={saving}
                    handleSaveEdit={handleSaveEdit}
                />
                {isReplacing && (
                    <ReplaceRecordModal
                        selectedTable={selectedTable}
                        columns={columns}
                        saving={saving}
                        setIsReplacing={setIsReplacing}
                        handleExecuteReplace={handleExecuteReplace}
                    />
                )}
                </div>
            </DatabaseSidebar>
        </Login_db>
    );
}
