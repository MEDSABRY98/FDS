import { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../lib/supabase";
import { TABLES_TO_SORT_BY_ROWID } from '../Constants/DbConstants';

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
                const { data, error } = await supabase.rpc('get_egyptnt_tables');
                if (error) throw error;
                if (data && data.length > 0) {
                    const sorted = data.map(t => {
                        const label = t.table_name.replace('egy_NT_', '').replace(/_/g, ' ');
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
            fetchTableData();
        }
    }, [selectedTable]);

    const changeSelectedTable = (newTable) => {
        if (newTable !== selectedTable) {
            setLoading(true);
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
                let query = supabase.from(selectedTable).select("*");

                // Deterministic ordering based on table type
                if (selectedTable === "egy_NT_SQUAD") {
                    query = query.order("ROW_ID", { ascending: true });
                } else if (selectedTable === "egy_NT_MATCHDETAILS") {
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

                let matchDateMap = {};
                if (['egy_NT_PLAYERDETAILS'].includes(selectedTable) && cols.includes('MATCH_ID')) {
                    try {
                        const { data: datesData } = await supabase.from('egy_NT_MATCHDETAILS').select('MATCH_ID, DATE');
                        if (datesData) {
                            datesData.forEach(d => {
                                matchDateMap[d.MATCH_ID] = new Date(d.DATE).getTime();
                                if (isNaN(matchDateMap[d.MATCH_ID]) && d.DATE && d.DATE.includes('/')) {
                                    const [day, month, year] = d.DATE.split('/');
                                    matchDateMap[d.MATCH_ID] = new Date(`${year}-${month}-${day}`).getTime();
                                }
                            });
                        }
                    } catch (err) { console.error("Error fetching dates for sort:", err); }
                }

                const ridKey = cols.find(c => c.toUpperCase() === "ROW_ID");

                if (selectedTable === 'egy_NT_MATCHDETAILS' && cols.includes('DATE')) {
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
                } else if (selectedTable === 'egy_NT_PLAYERDETAILS' && cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        const dateA = matchDateMap[a.MATCH_ID] || 0;
                        const dateB = matchDateMap[b.MATCH_ID] || 0;
                        if (dateB !== dateA) return dateB - dateA;
                        if (cols.includes('EVENT_ID')) {
                            const getNum = (id) => {
                                if (!id) return 0;
                                const parts = String(id).split('-');
                                const last = parts[parts.length - 1];
                                const n = parseInt(last);
                                return isNaN(n) ? 0 : n;
                            };
                            return getNum(a.EVENT_ID) - getNum(b.EVENT_ID);
                        }
                        return 0;
                    });
                } else if (TABLES_TO_SORT_BY_ROWID.includes(selectedTable) && ridKey) {
                    allData.sort((a, b) => String(a[ridKey]).localeCompare(String(b[ridKey]), undefined, { numeric: true }));
                } else if (cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        if (String(a.MATCH_ID) !== String(b.MATCH_ID)) {
                            return String(b.MATCH_ID).localeCompare(String(a.MATCH_ID), undefined, { numeric: true });
                        }
                        if (cols.includes('EVENT_ID')) {
                            const getNum = (id) => {
                                if (!id) return 0;
                                const parts = String(id).split('-');
                                const last = parts[parts.length - 1];
                                const n = parseInt(last);
                                return isNaN(n) ? 0 : n;
                            };
                            return getNum(a.EVENT_ID) - getNum(b.EVENT_ID);
                        } else if (cols.includes('PLAYER NAME')) {
                            return String(a["PLAYER NAME"]).localeCompare(String(b["PLAYER NAME"]));
                        } else if (cols.includes('PLAYERNAME')) {
                            return String(a["PLAYERNAME"]).localeCompare(String(b["PLAYERNAME"]));
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
