import { useState } from 'react';
import { supabase, getChangedFormFields } from "../../Database";
import { buildIntNtMatchId, IntNtService } from "../../InternationalNT/Service/int_nt_service";
import { omitIntComputedFromPayload } from "../../InternationalNT/Service/int_nt_service";

const INTL_MATCH_TABLE = "int_nt_MATCHDETAILS";

export function useEditRecord(selectedTable, columns, fetchTableData, addNotification) {
    const [editingRow, setEditingRow] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // ── Add Record ───────────────────────────────────────────────────────────
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

            if (selectedTable === INTL_MATCH_TABLE) {
                const [rowId] = await IntNtService.allocateIntNtRowIds(1);
                payload.ROW_ID = rowId;
                payload.MATCH_ID = buildIntNtMatchId(payload.SEASON, payload.DATE, payload.TEAMA, payload.TEAMB);
            }

            const { error } = await supabase.from(selectedTable).insert([omitIntComputedFromPayload(payload)]);
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

    // ── Edit Record ──────────────────────────────────────────────────────────
    const handleEditClick = (row) => {
        setEditingRow(row);
        setEditForm({ ...row });
    };

    const handleSaveEdit = async () => {
        if (!editingRow) return;
        setSaving(true);
        try {
            const changedForm = omitIntComputedFromPayload(getChangedFormFields(editingRow, editForm));
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

    // ── Delete Record ────────────────────────────────────────────────────────
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
        editingRow, setEditingRow, editForm, setEditForm, saving,
        isAdding, setIsAdding, addForm, setAddForm,
        handleOpenAdd, handleSaveAdd,
        handleEditClick, handleSaveEdit, handleDelete,
        isReplacing, setIsReplacing, handleExecuteReplace
    };
}
