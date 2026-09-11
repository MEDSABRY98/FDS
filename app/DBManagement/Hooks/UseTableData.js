import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, sortGlobalDbManagementTableData } from "../../Database";
import { FetchTableSortSetting, appendSettingsTab, SETTINGS_TAB_ID } from "../../Database";
import { resolveTableColumnOrder } from "../../lib/Settings_db";

export function useTableData(addNotification) {
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [dataMap, setDataMap] = useState({});
    const [columnsMap, setColumnsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    const fetchSingleTable = useCallback(async (tableName, silent = false) => {
        if (!tableName || tableName === SETTINGS_TAB_ID) return;
        if (!silent) setLoading(true);
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                const { data, error } = await supabase
                    .from(tableName)
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
                cols = await resolveTableColumnOrder(tableName, cols);
                const sortSetting = await FetchTableSortSetting(tableName);
                const sortedData = sortGlobalDbManagementTableData(allData, cols, sortSetting);
                
                setColumnsMap(prev => ({ ...prev, [tableName]: cols }));
                setDataMap(prev => ({ ...prev, [tableName]: sortedData }));
            } else {
                setColumnsMap(prev => ({ ...prev, [tableName]: [] }));
                setDataMap(prev => ({ ...prev, [tableName]: [] }));
            }
        } catch (error) {
            console.error(`Error fetching table data for ${tableName}:`, error.message);
            if (addNotification) addNotification(`Error loading ${tableName}: ` + error.message, "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        const loadTables = async () => {
            try {
                const { data, error } = await supabase.rpc('get_dbmanagement_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data
                        .filter(t => t.table_name.toUpperCase() !== "DB_SETTINGS")
                        .map(t => {
                            const label = t.table_name.replace('db_', '').toUpperCase();
                            return { name: t.table_name, label };
                        }).sort((a, b) => a.label.localeCompare(b.label));
                    
                    const tables = appendSettingsTab(sorted);
                    setAvailableTables(tables);
                    setSelectedTable(tables[0].name);

                    // Fetch all actual tables in parallel
                    const tablesToFetch = tables.filter(t => t.name !== SETTINGS_TAB_ID);
                    await Promise.all(tablesToFetch.map(t => fetchSingleTable(t.name, true)));
                    setInitialLoadComplete(true);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch tables:", err);
                if (addNotification) addNotification("Failed to fetch tables: " + err.message, "error");
                setLoading(false);
            }
        };
        loadTables();
    }, [addNotification, fetchSingleTable]);

    const fetchTableData = useCallback(async () => {
        if (selectedTable && selectedTable !== SETTINGS_TAB_ID) {
            await fetchSingleTable(selectedTable);
        }
    }, [selectedTable, fetchSingleTable]);

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
            setSelectedTable(newTable);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTable, searchTerm]);

    const tableData = dataMap[selectedTable] || [];
    const columns = columnsMap[selectedTable] || [];

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
        loading: loading || !initialLoadComplete,
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
