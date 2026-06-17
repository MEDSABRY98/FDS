import { useState, useEffect, useMemo } from 'react';
import { supabase, sortManagementTableData } from "../../lib/supabase";
import { FetchTableSortSetting, appendSettingsTab, SETTINGS_TAB_ID } from "../../lib/supabase";

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
                const { data, error } = await supabase.rpc('get_egyptclub_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data.map(t => {
                        const label = t.table_name.replace('egy_CLUB_', '').replace(/_/g, ' ');
                        return { name: t.table_name, label };
                    }).sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableTables(appendSettingsTab(sorted));
                    setSelectedTable(sorted[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch tables:", err);
            }
        };
        loadTables();
    }, []);

    useEffect(() => {
        if (selectedTable && selectedTable !== SETTINGS_TAB_ID) {
            fetchTableData();
        }
    }, [selectedTable]);

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

    async function fetchTableData() {
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
                    .order("ROW_ID", { ascending: false })
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
                
                // Fetch saved order from db_COLUMN_ORDERS
                let dbOrder = null;
                try {
                    const { data: orderData } = await supabase
                        .from("db_COLUMN_ORDERS")
                        .select("COLUMN_ORDER")
                        .eq("TABLE_NAME", selectedTable)
                        .maybeSingle();
                    if (orderData && orderData.COLUMN_ORDER) {
                        dbOrder = orderData.COLUMN_ORDER;
                    }
                } catch (err) {
                    console.error("Failed to fetch column order from database:", err);
                }

                const preferredOrder = dbOrder;
                if (preferredOrder) {
                    const normalizedOrder = preferredOrder.map(c => c.toUpperCase());
                    cols.sort((a, b) => {
                        const idxA = normalizedOrder.indexOf(a.toUpperCase());
                        const idxB = normalizedOrder.indexOf(b.toUpperCase());
                        if (idxA === -1 && idxB === -1) return 0;
                        if (idxA === -1) return 1;
                        if (idxB === -1) return -1;
                        return idxA - idxB;
                    });
                } else {
                    const rowIdIdx = cols.findIndex(c => c.toUpperCase() === "ROW_ID");
                    if (rowIdIdx > -1) {
                        const rowIdKey = cols[rowIdIdx];
                        cols.splice(rowIdIdx, 1);
                        cols.unshift(rowIdKey);
                    }
                }
                setColumns(cols);
                const sortSetting = await FetchTableSortSetting(selectedTable);
                setTableData(sortManagementTableData(allData, cols, sortSetting));
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
    }

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
