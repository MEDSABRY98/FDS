import { useState } from 'react';
import { supabase, getChangedFormFields } from "../../Database";

export function useEditRecord(selectedTable, columns, fetchTableData, addNotification) {
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

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
                if (addNotification) addNotification("No changes to save.", "info");
                setSaving(false);
                return;
            }

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

            if (fetchTableData) await fetchTableData();
            setEditingRow(null);
            if (addNotification) addNotification("Record updated successfully", "success");
        } catch (error) {
            console.error("Update error:", error);
            if (addNotification) addNotification("Update FAILED: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
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
                // Fallback: Composite Key Matching
                let query = supabase.from(selectedTable).delete();
                Object.keys(row).filter(key => key !== 'MATCH_ID' && key !== 'EVENT_ID' && key !== 'PARENT_EVENT_ID' && key !== 'ROW_ID').forEach(key => {
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
            if (fetchTableData) await fetchTableData();
            if (addNotification) addNotification("Record deleted successfully", "success");
        } catch (error) {
            console.error("Delete error:", error);
            if (addNotification) addNotification("Delete FAILED: " + error.message, "error");
        }
    };

    return {
        editingRow,
        setEditingRow,
        editForm,
        setEditForm,
        saving,
        handleEditClick,
        handleSaveEdit,
        handleDelete
    };
}
