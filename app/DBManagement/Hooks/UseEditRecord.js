import { useState } from "react";
import { supabase } from "../../lib/supabase";
import {
    CATALOG_CONFIG,
    getCatalogForColumn,
    isLikelyCatalogName,
    buildCatalogError,
    isSkippableCatalogValue
} from "../../lib/catalogValidation";

export function useEditRecord(selectedTable, columns, fetchTableData, addNotification) {
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingRow, setDeletingRow] = useState(null);

    const handleEditClick = (row) => {
        setEditingRow(row);
        setEditForm({ ...row });
    };

    const handleAddClick = () => {
        setEditingRow({ isNew: true });
        // Initialize fields as empty strings
        const initialForm = {};
        columns.forEach(col => {
            initialForm[col] = "";
        });
        setEditForm(initialForm);
    };

    const getCatalogForColumnLocal = getCatalogForColumn;

    const resolutionMap = {
        "db_PLAYERS": { idCol: "PLAYER_ID", nameCol: "PLAYER_NAME" },
        "db_MANAGERS": { idCol: "MANAGER_ID", nameCol: "MANAGER_NAME" },
        "db_TEAMS": { idCol: "TEAM_ID", nameCol: "TEAM_NAME" },
        "db_STADIUMS": { idCol: "STADIUM_ID", nameCol: "STADIUM_NAME" },
        "db_REFEREES": { idCol: "REFEREE_ID", nameCol: "REFEREE_NAME" },
        "db_COUNTRIES": { idCol: "COUNTRY_ID", nameCols: ["COUNTRY_NAME", "COUNTRY_NAME_EN"] }
    };

    const isLikelyName = (val, catalog) => {
        const prefix = catalog ? CATALOG_CONFIG[catalog]?.idPrefix : null;
        return isLikelyCatalogName(val, prefix);
    };

    const lookupCatalogId = async (catalog, val) => {
        const map = resolutionMap[catalog];
        if (!map) return null;

        const nameCols = map.nameCols || [map.nameCol];
        for (const nameCol of nameCols) {
            const { data } = await supabase
                .from(catalog)
                .select(map.idCol)
                .ilike(nameCol, val.trim())
                .limit(1);

            if (data && data.length > 0) {
                return data[0][map.idCol];
            }

            const altNameCol = nameCol.replace('_', ' ');
            if (altNameCol !== nameCol) {
                const { data: altData } = await supabase
                    .from(catalog)
                    .select(map.idCol)
                    .ilike(altNameCol, val.trim())
                    .limit(1);

                if (altData && altData.length > 0) {
                    return altData[0][map.idCol];
                }
            }
        }

        return null;
    };

    const handleSaveEdit = async () => {
        if (!editingRow) return;
        setSaving(true);
        try {
            const isNew = editingRow.isNew;

            // Resolve Names to IDs if needed
            const resolvedForm = { ...editForm };
            for (const col of Object.keys(resolvedForm)) {
                const val = resolvedForm[col];
                if (typeof val === 'string' && !isSkippableCatalogValue(val)) {
                    if (col.toUpperCase().endsWith('_ID') || ['MOTM', 'STAD', 'REFEREE', 'MANAGER', 'OPPONENT', 'CHAMPION', 'CAPTAIN'].includes(col.toUpperCase())) {
                        const catalog = getCatalogForColumnLocal(col);
                        if (catalog && catalog !== 'db_STADIUMS' && isLikelyName(val, catalog)) {
                            const foundId = await lookupCatalogId(catalog, val);
                            if (foundId) {
                                resolvedForm[col] = foundId;
                            } else {
                                throw new Error(buildCatalogError(catalog, val.trim()));
                            }
                        }
                    }
                }
            }

            if (isNew) {
                // For inserts, filter out auto-generated ID columns if they are empty
                const insertData = { ...resolvedForm };
                columns.forEach(col => {
                    const upper = col.toUpperCase();
                    if (upper === "ROW_ID" || (col.endsWith("_ID") && !insertData[col])) {
                        delete insertData[col];
                    }
                });

                const { error } = await supabase
                    .from(selectedTable)
                    .insert([insertData]);

                if (error) throw error;
                addNotification("Record created successfully.", "success");
            } else {
                // Find primary key
                const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") || "ROW_ID";
                const pkValue = editingRow[pkField];

                if (!pkValue) {
                    throw new Error("Primary key value (ROW_ID) is missing.");
                }

                const { error } = await supabase
                    .from(selectedTable)
                    .update(resolvedForm)
                    .eq(pkField, pkValue);

                if (error) throw error;
                addNotification("Record updated successfully.", "success");
            }

            await fetchTableData();
            setEditingRow(null);
        } catch (error) {
            console.error("Save error:", error);
            addNotification("Save FAILED: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (row) => {
        setDeletingRow(row);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRow) return;
        setDeleting(true);
        try {
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") || "ROW_ID";
            const pkValue = deletingRow[pkField];

            if (!pkValue) {
                throw new Error("Primary key value (ROW_ID) is missing.");
            }

            const { error } = await supabase
                .from(selectedTable)
                .delete()
                .eq(pkField, pkValue);

            if (error) throw error;

            addNotification("Record deleted successfully.", "success");
            await fetchTableData();
            setDeletingRow(null);
        } catch (error) {
            console.error("Delete error:", error);
            addNotification("Delete FAILED: " + error.message, "error");
        } finally {
            setDeleting(false);
        }
    };

    return {
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
        handleConfirmDelete
    };
}
