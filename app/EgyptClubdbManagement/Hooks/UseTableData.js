import { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../lib/supabase";
import { COLUMN_ORDER, TABLES_TO_SORT_BY_ROWID } from '../Constants/DbConstants';

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
                const { data, error } = await supabase.rpc('get_egyptclub_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data.map(t => {
                        const label = t.table_name.replace('egy_CLUB_', '').replace(/_/g, ' ');
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
            setTableData([]);
            setColumns([]);
            fetchTableData();
        }
    }, [selectedTable]);

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
                let query = supabase.from(selectedTable).select("*");

                // Deterministic ordering based on table type
                if (selectedTable === "egy_CLUB_MATCHDETAILS") {
                    query = query.order("DATE", { ascending: false }).order("ROW_ID", { ascending: true });
                } else if (selectedTable.includes("DETAILS") || selectedTable.includes("MISSED")) {
                    query = query.order("MATCH_ID", { ascending: false }).order("ROW_ID", { ascending: true });
                } else {
                    query = query.order("ROW_ID", { ascending: true });
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
                
                const preferredOrder = COLUMN_ORDER[selectedTable];
                if (preferredOrder) {
                    cols.sort((a, b) => {
                        const idxA = preferredOrder.indexOf(a);
                        const idxB = preferredOrder.indexOf(b);
                        if (idxA > -1 && idxB > -1) return idxA - idxB;
                        if (idxA > -1) return -1;
                        if (idxB > -1) return 1;
                        return a.localeCompare(b);
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

                let matchDateMap = {};
                const ridKey = cols.find(c => c.toUpperCase() === "ROW_ID");

                if (selectedTable === 'egy_CLUB_MATCHDETAILS' && cols.includes('DATE')) {
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
                } else if (TABLES_TO_SORT_BY_ROWID.includes(selectedTable) && ridKey) {
                    allData.sort((a, b) => String(a[ridKey]).localeCompare(String(b[ridKey]), undefined, { numeric: true }));
                } else if (cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        if (String(a.MATCH_ID) !== String(b.MATCH_ID)) {
                            return String(b.MATCH_ID).localeCompare(String(a.MATCH_ID), undefined, { numeric: true });
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
    };
}
