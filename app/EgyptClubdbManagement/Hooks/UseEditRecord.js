import { useState } from 'react';
import { supabase, getChangedFormFields } from "../../Database";

export function useEditRecord(selectedTable, columns, fetchTableData, addNotification) {
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // â”€â”€ Add Record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({});

    const handleOpenAdd = () => {
        const emptyForm = {};
        columns.filter(c => c.toUpperCase() !== "ROW_ID").forEach(c => { emptyForm[c] = ""; });
        setAddForm(emptyForm);
        setIsAdding(true);
    };

    const handleSaveAdd = async () => {
        setSaving(true);
        try {
            const payload = {};
            Object.keys(addForm).forEach(key => {
                payload[key] = addForm[key] === "" ? null : addForm[key];
            });
            const { error } = await supabase.from(selectedTable).insert([payload]);
            if (error) throw error;
            if (fetchTableData) await fetchTableData();
            setIsAdding(false);
            if (addNotification) addNotification("Record added successfully", "success");
        } catch (error) {
            console.error("Insert error:", error);
            if (addNotification) addNotification("Insert FAILED: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    // â”€â”€ Edit Record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                const { error } = await supabase.from(selectedTable).update(changedForm).eq(pkField, pkValue);
                if (error) throw error;
            } else {
                let query = supabase.from(selectedTable).update(changedForm);
                Object.keys(editingRow)
                    .filter(key => !['MATCH_ID', 'EVENT_ID', 'PARENT_EVENT_ID', 'ROW_ID'].includes(key))
                    .forEach(key => {
                        const val = editingRow[key];
                        query = val === null || val === undefined ? query.is(key, null) : query.eq(key, val);
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

    // â”€â”€ Delete Record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleDelete = async (row) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const pkField = columns.find(c => c.toUpperCase() === "ROW_ID") ||
                columns.find(c => c.toLowerCase() === "id") ||
                columns.find(c => c.toLowerCase().includes("id") && c.toLowerCase() !== "match_id" && c.toLowerCase() !== "parent_event_id");

            const pkValue = pkField ? row[pkField] : null;

            if (pkField && pkValue !== null && pkValue !== undefined && pkValue !== "") {
                const { error } = await supabase.from(selectedTable).delete().eq(pkField, pkValue);
                if (error) throw error;
            } else {
                let query = supabase.from(selectedTable).delete();
                Object.keys(row)
                    .filter(key => !['MATCH_ID', 'EVENT_ID', 'PARENT_EVENT_ID', 'ROW_ID'].includes(key))
                    .forEach(key => {
                        const val = row[key];
                        query = val === null || val === undefined ? query.is(key, null) : query.eq(key, val);
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
        editingRow, setEditingRow, editForm, setEditForm, saving,
        isAdding, setIsAdding, addForm, setAddForm,
        handleOpenAdd, handleSaveAdd,
        handleEditClick, handleSaveEdit, handleDelete
    };
}
