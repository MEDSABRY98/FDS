import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "../../lib/supabase";

export function useTableData(addNotification) {
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    
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
                    const sorted = data.map(t => {
                        const label = t.table_name.replace('db_', '').toUpperCase();
                        return { name: t.table_name, label };
                    }).sort((a, b) => a.label.localeCompare(b.label));
                    setAvailableTables(sorted);
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
        if (!selectedTable) return;
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
                
                // Keep ROW_ID at the very beginning
                const rowIdIdx = cols.findIndex(c => c.toUpperCase() === "ROW_ID");
                if (rowIdIdx > -1) {
                    const rowIdKey = cols[rowIdIdx];
                    cols.splice(rowIdIdx, 1);
                    cols.unshift(rowIdKey);
                }
                
                // Keep Entity ID (PLAYER_ID, MANAGER_ID, STADIUM_ID) in the second position
                const entityIdIdx = cols.findIndex(c => c.endsWith("_ID") && c.toUpperCase() !== "ROW_ID");
                if (entityIdIdx > -1) {
                    const entityIdKey = cols[entityIdIdx];
                    cols.splice(entityIdIdx, 1);
                    cols.splice(1, 0, entityIdKey);
                }

                setColumns(cols);

                // Sort alphabetically based on entity name using Arabic locale
                if (cols.includes("PLAYER_NAME")) {
                    allData.sort((a, b) => String(a.PLAYER_NAME || '').localeCompare(String(b.PLAYER_NAME || ''), 'ar'));
                } else if (cols.includes("MANAGER_NAME")) {
                    allData.sort((a, b) => String(a.MANAGER_NAME || '').localeCompare(String(b.MANAGER_NAME || ''), 'ar'));
                } else if (cols.includes("STADIUM_NAME")) {
                    allData.sort((a, b) => String(a.STADIUM_NAME || '').localeCompare(String(b.STADIUM_NAME || ''), 'ar'));
                } else if (cols.includes("REFEREE_NAME")) {
                    allData.sort((a, b) => String(a.REFEREE_NAME || '').localeCompare(String(b.REFEREE_NAME || ''), 'ar'));
                } else {
                    const ridKey = cols.find(c => c.toUpperCase() === "ROW_ID");
                    if (ridKey) {
                        allData.sort((a, b) => String(a[ridKey]).localeCompare(String(b[ridKey]), undefined, { numeric: true }));
                    }
                }

                setTableData(allData);
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
        if (selectedTable) {
            setTableData([]);
            setColumns([]);
            fetchTableData();
        }
    }, [selectedTable, fetchTableData]);

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
        setSelectedTable,
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
