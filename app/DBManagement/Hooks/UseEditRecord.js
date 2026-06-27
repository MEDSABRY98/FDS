import { useState } from "react";
import { supabase, resolveCatalogFieldsInForm, getChangedFormFields } from "../../Database";

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

    const handleSaveEdit = async () => {
        if (!editingRow) return;
        setSaving(true);
        try {
            const isNew = editingRow.isNew;

            if (!isNew && Object.keys(getChangedFormFields(editingRow, editForm)).length === 0) {
                addNotification("No changes to save.", "info");
                setSaving(false);
                return;
            }

            const resolvedForm = await resolveCatalogFieldsInForm(
                selectedTable,
                isNew ? editForm : getChangedFormFields(editingRow, editForm)
            );

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

    // ── Replace Record ────────────────────────────────────────────────────────
    const [isReplacing, setIsReplacing] = useState(false);

    const handleExecuteReplace = async (column, oldValue, newValue) => {
        if (!column) {
            if (addNotification) addNotification("Please select a column.", "warn");
            return;
        }
        const trimmedOld = String(oldValue ?? "").trim();
        const trimmedNew = String(newValue ?? "").trim();
        if (trimmedOld === "" && trimmedNew === "") {
            if (addNotification) addNotification("Enter a new value to fill empty cells.", "warn");
            return;
        }
        setSaving(true);
        try {
            const payload = { [column]: trimmedNew === "" ? null : newValue };
            const updateOpts = { count: "exact" };
            let count = 0;

            if (trimmedOld === "") {
                const { error: nullError, count: nullCount } = await supabase
                    .from(selectedTable)
                    .update(payload, updateOpts)
                    .is(column, null);
                if (nullError) throw nullError;

                const { error: emptyError, count: emptyCount } = await supabase
                    .from(selectedTable)
                    .update(payload, updateOpts)
                    .eq(column, "");
                if (emptyError) throw emptyError;

                count = (nullCount ?? 0) + (emptyCount ?? 0);
            } else {
                const { error, count: matchCount } = await supabase
                    .from(selectedTable)
                    .update(payload, updateOpts)
                    .eq(column, oldValue);
                if (error) throw error;
                count = matchCount ?? 0;
            }

            if (fetchTableData) await fetchTableData();
            setIsReplacing(false);
            if (addNotification) {
                if (trimmedOld === "") {
                    addNotification(`Filled empty cells in ${column} with "${newValue}" (${count} rows).`, "success");
                } else {
                    addNotification(`Successfully replaced "${oldValue}" with "${newValue}" in ${count} rows.`, "success");
                }
            }
        } catch (error) {
            console.error("Replacement error:", error);
            if (addNotification) addNotification("Replacement FAILED: " + error.message, "error");
        } finally {
            setSaving(false);
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
        handleConfirmDelete,
        isReplacing,
        setIsReplacing,
        handleExecuteReplace
    };
}
