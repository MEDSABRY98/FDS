import { useState } from "react";
import { AlAhlyService } from "../../Alahly/alahly_db_service";

export function useMergeRecords(selectedRows, setSelectedRows, fetchTableData, addNotification) {
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isConfirmingMerge, setIsConfirmingMerge] = useState(false);
    const [mergeTargetName, setMergeTargetName] = useState("");

    const handleMergeTrigger = () => {
        const names = [...new Set(selectedRows.map(r => r["PLAYER NAME"]))];
        if (names.length < 2) {
            addNotification("Please select at least two DIFFERENT names to merge.", "warn");
            return;
        }
        setMergeTargetName(names[0]);
        setShowMergeModal(true);
    };

    const handleConfirmMerge = async () => {
        const names = [...new Set(selectedRows.map(r => r["PLAYER NAME"]))];
        if (!mergeTargetName.trim()) {
            addNotification("Please enter a valid target name.", "warn");
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
            await AlAhlyService.mergePlayers(mergeTargetName.trim(), names);
            setSelectedRows([]);
            fetchTableData();
        } catch (error) {
            addNotification("Merge failed: " + error.message, "error");
        } finally {
            setIsMerging(false);
        }
    };

    return {
        isMerging,
        showMergeModal, setShowMergeModal,
        isConfirmingMerge, setIsConfirmingMerge,
        mergeTargetName, setMergeTargetName,
        handleMergeTrigger,
        handleConfirmMerge
    };
}
