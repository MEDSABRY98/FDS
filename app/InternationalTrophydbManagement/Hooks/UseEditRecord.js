import { useState } from "react";
import { supabase, getChangedFormFields } from "../../Database";
import { IntTrophyService } from "../../InternationalTrophy/Service/int_trophy_service";

const TROPHY_TABLE = "int_TROPHY";

export function useEditRecord(selectedTable, columns, fetchTableData, addNotification) {
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({});

    const handleOpenAdd = () => {
        const emptyForm = {};
        columns.filter((c) => c.toUpperCase() !== "ROW_ID").forEach((c) => { emptyForm[c] = ""; });
        setAddForm(emptyForm);
        setIsAdding(true);
    };

    const handleSaveAdd = async () => {
        setSaving(true);
        try {
            const payload = {};
            Object.keys(addForm).forEach((key) => {
                payload[key] = addForm[key] === "" ? null : addForm[key];
            });

            if (selectedTable === TROPHY_TABLE) {
                const [rowId] = await IntTrophyService.allocateTrophyRowIds(1);
                payload.ROW_ID = rowId;
            }

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

            const pkField = columns.find((c) => c.toUpperCase() === "ROW_ID");
            const pkValue = pkField ? editingRow[pkField] : null;

            if (pkField && pkValue) {
                const { error } = await supabase.from(selectedTable).update(changedForm).eq(pkField, pkValue);
                if (error) throw error;
            } else {
                let query = supabase.from(selectedTable).update(changedForm);
                Object.keys(editingRow)
                    .filter((key) => key !== "ROW_ID")
                    .forEach((key) => {
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

    const handleDelete = async (row) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const pkField = columns.find((c) => c.toUpperCase() === "ROW_ID");
            const pkValue = pkField ? row[pkField] : null;

            if (pkField && pkValue) {
                const { error } = await supabase.from(selectedTable).delete().eq(pkField, pkValue);
                if (error) throw error;
            } else {
                let query = supabase.from(selectedTable).delete();
                Object.keys(row)
                    .filter((key) => key !== "ROW_ID")
                    .forEach((key) => {
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
        handleEditClick, handleSaveEdit, handleDelete,
    };
}
