import { useState, useCallback } from "react";
import { supabase, sortManagementTableData } from "../../lib/supabase";
import { FetchTableSortSetting, SETTINGS_TAB_ID } from "../../lib/supabase";

export function useTableData(selectedTable, addNotification) {
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

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

                const customOrder = dbOrder;
                if (customOrder) {
                    const normalizedOrder = customOrder.map(c => c.toUpperCase());
                    cols.sort((a, b) => {
                        const indexA = normalizedOrder.indexOf(a.toUpperCase());
                        const indexB = normalizedOrder.indexOf(b.toUpperCase());
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                } else {
                    // Force ROW_ID to the front (case-insensitive check)
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
            addNotification("Error: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [selectedTable, addNotification]);

    return { tableData, columns, loading, fetchTableData, setLoading, setTableData, setColumns };
}
