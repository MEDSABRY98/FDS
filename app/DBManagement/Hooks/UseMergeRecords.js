import { useState } from 'react';
import { DBManagementService } from "../db_management_service";
import { collectCatalogMergeNames, getCatalogRowMergeName } from "../../Database/CatalogBilingual_db";

export function useMergeRecords(selectedTable, fetchTableData, addNotification) {
    const [selectedRows, setSelectedRows] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isConfirmingMerge, setIsConfirmingMerge] = useState(false);
    const [mergeTargetName, setMergeTargetName] = useState("");

    const getName = (row) => getCatalogRowMergeName(row, selectedTable);

    const getRowKey = (row) => {
        if (!row) return "";
        return row.PLAYER_ID || row.MANAGER_ID || row.STADIUM_ID || row.REFEREE_ID || row.TEAM_ID || row.COUNTRY_ID || getName(row);
    };

    const handleToggleSelect = (row) => {
        const key = getRowKey(row);
        if (!key) return;

        if (selectedRows.some(r => getRowKey(r) === key)) {
            setSelectedRows(selectedRows.filter(r => getRowKey(r) !== key));
        } else {
            setSelectedRows([...selectedRows, row]);
        }
    };

    const handleMergeTrigger = () => {
        if (selectedRows.length < 2) {
            if (addNotification) addNotification("Please select at least two records to merge.", "warn");
            return;
        }

        const names = collectCatalogMergeNames(selectedRows, selectedTable);
        if (names.length < 2) {
            if (addNotification) addNotification("Please select records with different Arabic or English names to merge.", "warn");
            return;
        }

        setMergeTargetName(getName(selectedRows[0]) || names[0]);
        setShowMergeModal(true);
    };

    const handleConfirmMerge = async () => {
        const names = collectCatalogMergeNames(selectedRows, selectedTable);
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
        getRowKey,
        handleToggleSelect,
        handleMergeTrigger,
        handleConfirmMerge
    };
}
