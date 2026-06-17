import { useState, useCallback } from "react";
import { supabase, sortManagementTableData } from "../../lib/supabase";
import { FetchTableSortSetting } from "../../lib/supabase";
import { resolveTableColumnOrder } from "../../lib/Settings_db";

export function useTableData(selectedTable, addNotification) {
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

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
                cols = await resolveTableColumnOrder(selectedTable, cols);
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
