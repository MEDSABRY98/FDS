import { useState } from 'react';
import { DBManagementService } from "../db_management_service";

export function useMergeRecords(selectedTable, fetchTableData, addNotification) {
    const [selectedRows, setSelectedRows] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isConfirmingMerge, setIsConfirmingMerge] = useState(false);
    const [mergeTargetName, setMergeTargetName] = useState("");

    const getName = (row) => {
        if (!row) return "";
        return row.PLAYER_NAME || row.MANAGER_NAME || row.STADIUM_NAME || row.REFEREE_NAME || row.TEAM_NAME || row.COUNTRY_NAME || "";
    };

    const handleToggleSelect = (row) => {
        const key = getName(row);
        if (!key) return;

        if (selectedRows.some(r => getName(r) === key)) {
            setSelectedRows(selectedRows.filter(r => getName(r) !== key));
        } else {
            setSelectedRows([...selectedRows, row]);
        }
    };

    const handleMergeTrigger = () => {
        const names = [...new Set(selectedRows.map(r => getName(r)).filter(Boolean))];
        if (names.length < 2) {
            if (addNotification) addNotification("Please select at least two DIFFERENT records to merge.", "warn");
            return;
        }
        setMergeTargetName(names[0]);
        setShowMergeModal(true);
    };

    const handleConfirmMerge = async () => {
        const names = [...new Set(selectedRows.map(r => getName(r)).filter(Boolean))];
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
            await DBManagementService.mergeEntities(selectedTable, mergeTargetName.trim(), names);
            setSelectedRows([]);
            if (fetchTableData) await fetchTableData();
            if (addNotification) addNotification("Merge completed successfully across all tables.", "success");
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
        getName,
        handleToggleSelect,
        handleMergeTrigger,
        handleConfirmMerge
    };
}
