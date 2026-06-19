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
