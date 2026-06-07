import { useState } from "react";
import { supabase } from "../../lib/supabase";

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
            // Find a unique identifier: 'ROW_ID', 'id' (exact), or anything ending in 'id'
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") ||
                columns.find(c => c.toLowerCase() === "id") ||
                columns.find(c => c.toLowerCase().includes("id") && c.toLowerCase() !== "match_id" && c.toLowerCase() !== "parent_event_id");

            const pkValue = pkField ? editingRow[pkField] : null;

            if (pkField && pkValue !== null && pkValue !== undefined && pkValue !== "") {
                const { error } = await supabase
                    .from(selectedTable)
                    .update(editForm)
                    .eq(pkField, pkValue);
                if (error) throw error;
            } else {
                // Fallback: Composite Key Matching
                let query = supabase.from(selectedTable).update(editForm);
                Object.keys(editForm).filter(key => key !== 'MATCH_ID' && key !== 'EVENT_ID' && key !== 'PARENT_EVENT_ID' && key !== 'ROW_ID').forEach(key => {
                    const val = editForm[key];
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

    return {
        editingRow, setEditingRow,
        editForm, setEditForm,
        saving,
        loading,
        handleEditClick,
        handleSaveEdit,
        handleDelete
    };
}
