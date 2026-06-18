import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, sortGlobalDbManagementTableData } from "../../lib/supabase";
import { FetchTableSortSetting, appendSettingsTab, SETTINGS_TAB_ID } from "../../lib/supabase";
import { resolveTableColumnOrder } from "../../lib/Settings_db";

export function useTableData(addNotification) {
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    useEffect(() => {
        const loadTables = async () => {
            try {
                const { data, error } = await supabase.rpc('get_dbmanagement_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data
                        .filter(t => {
                            const name = t.table_name.toUpperCase();
                            return name !== "DB_SETTINGS";
                        })
                        .map(t => {
                            const label = t.table_name.replace('db_', '').toUpperCase();
                            return { name: t.table_name, label };
                        }).sort((a, b) => a.label.localeCompare(b.label));
                    
                    setAvailableTables(appendSettingsTab(sorted));
                    setSelectedTable(sorted[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch tables:", err);
                if (addNotification) addNotification("Failed to fetch tables: " + err.message, "error");
            }
        };
        loadTables();
    }, [addNotification]);

    const fetchTableData = useCallback(async () => {
        if (!selectedTable || selectedTable === SETTINGS_TAB_ID) return;
        setLoading(true);
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(selectedTable)
                    .select("*")
                    .range(from, from + step - 1);

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
                cols = await resolveTableColumnOrder(selectedTable, cols);

                setColumns(cols);
                const sortSetting = await FetchTableSortSetting(selectedTable);
                setTableData(sortGlobalDbManagementTableData(allData, cols, sortSetting));
            } else {
                setTableData([]);
                setColumns([]);
            }
        } catch (error) {
            console.error("Error fetching table data:", error.message);
            if (addNotification) addNotification("Error: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [selectedTable, addNotification]);

    useEffect(() => {
        if (selectedTable && selectedTable !== SETTINGS_TAB_ID) {
            fetchTableData();
        }
    }, [selectedTable, fetchTableData]);

    useEffect(() => {
        const onSettingsSaved = (event) => {
            const savedTable = event.detail?.tableName;
            if (!savedTable || savedTable === selectedTable) {
                fetchTableData();
            }
        };
        window.addEventListener("fdbase-table-settings-saved", onSettingsSaved);
        return () => window.removeEventListener("fdbase-table-settings-saved", onSettingsSaved);
    }, [selectedTable, fetchTableData]);

    const changeSelectedTable = (newTable) => {
        if (newTable !== selectedTable) {
            if (newTable !== SETTINGS_TAB_ID) {
                setLoading(true);
            }
            setTableData([]);
            setColumns([]);
            setSelectedTable(newTable);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTable, searchTerm]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return tableData;
        const lowerSearch = searchTerm.toLowerCase();
        return tableData.filter(row => {
            return columns.some(col => String(row[col]).toLowerCase().includes(lowerSearch));
        });
    }, [tableData, searchTerm, columns]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return {
        availableTables,
        selectedTable,
        setSelectedTable: changeSelectedTable,
        tableData,
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
    };
}
