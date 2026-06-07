import { useState } from 'react';
import { EgyptNTService } from "../../EgyptNT/egypt_nt_db_service";

export function useMergeRecords(selectedTable, fetchTableData, addNotification) {
    const [selectedRows, setSelectedRows] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isConfirmingMerge, setIsConfirmingMerge] = useState(false);
    const [mergeTargetName, setMergeTargetName] = useState("");

    const handleToggleSelect = (row) => {
        const key = selectedTable === "egy_NT_SQUAD" ? row["PLAYERNAME"] : row["PLAYER NAME"];
        if (selectedRows.some(r => {
            const rKey = selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"];
            return rKey === key;
        })) {
            setSelectedRows(selectedRows.filter(r => {
                const rKey = selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"];
                return rKey !== key;
            }));
        } else {
            setSelectedRows([...selectedRows, row]);
        }
    };

    const handleMergeTrigger = () => {
        const names = [...new Set(selectedRows.map(r => selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"]))];
        if (names.length < 2) {
            if (addNotification) addNotification("Please select at least two DIFFERENT names to merge.", "warn");
            return;
        }
        setMergeTargetName(names[0]);
        setShowMergeModal(true);
    };

    const handleConfirmMerge = async () => {
        const names = [...new Set(selectedRows.map(r => selectedTable === "egy_NT_SQUAD" ? r["PLAYERNAME"] : r["PLAYER NAME"]))];
        if (!mergeTargetName.trim()) {
            if (addNotification) addNotification("Please enter a valid target name.", "warn");
            return;
        }

        if (!isConfirmingMerge) {
            setIsConfirmingMerge(true);
            return;
        }

        setIsMerging(true);
        setIsConfirmingMerge(false);
        setShowMergeModal(false);
        try {
            await EgyptNTService.mergePlayers(mergeTargetName.trim(), names);
            setSelectedRows([]);
            if (fetchTableData) await fetchTableData();
            if (addNotification) addNotification("Merge completed successfully.", "success");
        } catch (error) {
            if (addNotification) addNotification("Merge failed: " + error.message, "error");
        } finally {
            setIsMerging(false);
        }
    };

    return {
        selectedRows,
        setSelectedRows,
        isMerging,
        showMergeModal,
        setShowMergeModal,
        isConfirmingMerge,
        setIsConfirmingMerge,
        mergeTargetName,
        setMergeTargetName,
        handleToggleSelect,
        handleMergeTrigger,
        handleConfirmMerge
    };
}
