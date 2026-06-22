import { useState } from "react";
import { supabase, getChangedFormFields } from "../../Database";

export function useEditRecord(selectedTable, columns, fetchTableData, addNotification) {
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false); // For delete operations

    const handleEditClick = (row) => {
        setEditingRow(row);
        setEditForm({ ...row });
    };

    const handleSaveEdit = async () => {
        if (!editingRow) return;
        setSaving(true);
        try {
            const changedForm = getChangedFormFields(editingRow, editForm);
            if (Object.keys(changedForm).length === 0) {
                addNotification("No changes to save.", "info");
                setSaving(false);
                return;
            }

            // Find a unique identifier: 'ROW_ID', 'id' (exact), or anything ending in 'id'
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") ||
                columns.find(c => c.toLowerCase() === "id") ||
                columns.find(c => c.toLowerCase().includes("id") && c.toLowerCase() !== "match_id" && c.toLowerCase() !== "parent_event_id");

            const pkValue = pkField ? editingRow[pkField] : null;

            if (pkField && pkValue !== null && pkValue !== undefined && pkValue !== "") {
                const { error } = await supabase
                    .from(selectedTable)
                    .update(changedForm)
                    .eq(pkField, pkValue);
                if (error) throw error;
            } else {
                // Fallback: Composite Key Matching
                let query = supabase.from(selectedTable).update(changedForm);
                Object.keys(editingRow).filter(key => !['MATCH_ID', 'EVENT_ID', 'PARENT_EVENT_ID', 'ROW_ID'].includes(key)).forEach(key => {
                    const val = editingRow[key];
                    if (val === null || val === undefined) {
                        query = query.is(key, null);
                    } else {
                        query = query.eq(key, val);
                    }
                });
                const { error } = await query;
                if (error) throw error;
            }

            await fetchTableData();
            setEditingRow(null);
        } catch (error) {
            console.error("Update error:", error);
            addNotification("Update FAILED: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row) => {
        if (!confirm("Are you sure you want to delete this record? This is permanent.")) return;
        setLoading(true);
        try {
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") ||
                columns.find(c => c.toLowerCase() === "id") ||
                columns.find(c => c.toLowerCase().includes("id") && c.toLowerCase() !== "match_id" && c.toLowerCase() !== "parent_event_id");

            const pkValue = pkField ? row[pkField] : null;

            if (pkField && pkValue !== null && pkValue !== undefined && pkValue !== "") {
                const { error } = await supabase
                    .from(selectedTable)
                    .delete()
                    .eq(pkField, pkValue);
                if (error) throw error;
            } else {
                let query = supabase.from(selectedTable).delete();
                Object.keys(row).forEach(key => {
                    const val = row[key];
                    if (val === null || val === undefined) {
                        query = query.is(key, null);
                    } else {
                        query = query.eq(key, val);
                    }
                });
                const { error } = await query;
                if (error) throw error;
            }

            addNotification("Record deleted successfully.", "success");
            await fetchTableData();
        } catch (error) {
            console.error("Delete error:", error);
            addNotification("Delete FAILED: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // ── Replace Record ────────────────────────────────────────────────────────
    const [isReplacing, setIsReplacing] = useState(false);

    const handleExecuteReplace = async (column, oldValue, newValue) => {
        if (!column || !oldValue) {
            if (addNotification) addNotification("Please specify both a column and the old value.", "warn");
            return;
        }
        setSaving(true);
        try {
            const { error, count } = await supabase
                .from(selectedTable)
                .update({ [column]: newValue === "" ? null : newValue })
                .eq(column, oldValue);

            if (error) throw error;
            if (fetchTableData) await fetchTableData();
            setIsReplacing(false);
            if (addNotification) {
                addNotification(`Successfully replaced "${oldValue}" with "${newValue}" in ${count ?? 'matching'} rows.`, "success");
            }
        } catch (error) {
            console.error("Replacement error:", error);
            if (addNotification) addNotification("Replacement FAILED: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return {
        editingRow, setEditingRow,
        editForm, setEditForm,
        saving,
        loading,
        handleEditClick,
        handleSaveEdit,
        handleDelete,
        isReplacing,
        setIsReplacing,
        handleExecuteReplace
    };
}
