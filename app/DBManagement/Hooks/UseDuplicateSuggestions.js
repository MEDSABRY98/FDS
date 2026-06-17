import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    findDuplicatePairs,
    loadIgnoredPairKeys,
    saveIgnoredPairKey,
    isDuplicateCatalogTable,
} from '../Utils/DuplicateDetection';
import { DBManagementService } from '../db_management_service';

export function useDuplicateSuggestions(selectedTable, tableData, fetchTableData, addNotification, enabled = false) {
    const [ignoredKeys, setIgnoredKeys] = useState(() => new Set());
    const [mergingKey, setMergingKey] = useState(null);
    const [keepTargets, setKeepTargets] = useState({});
    const [allPairs, setAllPairs] = useState([]);
    const [computing, setComputing] = useState(false);

    useEffect(() => {
        if (!isDuplicateCatalogTable(selectedTable)) {
            setIgnoredKeys(new Set());
            return;
        }
        setIgnoredKeys(loadIgnoredPairKeys(selectedTable));
        setKeepTargets({});
    }, [selectedTable]);

    useEffect(() => {
        if (!enabled || !isDuplicateCatalogTable(selectedTable) || !tableData?.length) {
            setAllPairs([]);
            setComputing(false);
            return;
        }

        let cancelled = false;
        setComputing(true);

        const timer = setTimeout(() => {
            try {
                const pairs = findDuplicatePairs(selectedTable, tableData);
                if (!cancelled) setAllPairs(pairs);
            } catch (error) {
                console.error('Duplicate scan failed:', error);
                if (!cancelled) setAllPairs([]);
            } finally {
                if (!cancelled) setComputing(false);
            }
        }, 0);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [enabled, selectedTable, tableData]);

    const duplicatePairs = useMemo(() => {
        return allPairs.filter(pair => !ignoredKeys.has(pair.pairKey));
    }, [allPairs, ignoredKeys]);

    const setKeepTarget = useCallback((pairKey, name) => {
        setKeepTargets(prev => ({ ...prev, [pairKey]: name }));
    }, []);

    const getKeepTarget = useCallback((pair) => {
        return keepTargets[pair.pairKey] || pair.suggestedTarget || pair.nameA;
    }, [keepTargets]);

    const handleIgnore = useCallback((pair) => {
        saveIgnoredPairKey(selectedTable, pair.pairKey);
        setIgnoredKeys(prev => new Set([...prev, pair.pairKey]));
        if (addNotification) addNotification('Suggestion hidden. Use browser storage reset to restore.', 'success');
    }, [selectedTable, addNotification]);

    const handleMergePair = useCallback(async (pair) => {
        const targetName = getKeepTarget(pair);
        const sourceName = targetName === pair.nameA ? pair.nameB : pair.nameA;

        if (!targetName || targetName === sourceName) {
            if (addNotification) addNotification('Select a different name to keep before merging.', 'warn');
            return;
        }

        setMergingKey(pair.pairKey);
        try {
            await DBManagementService.mergeEntities(
                selectedTable,
                targetName,
                [pair.nameA, pair.nameB]
            );
            if (addNotification) {
                addNotification(`Merged "${sourceName}" into "${targetName}".`, 'success');
            }
            if (fetchTableData) await fetchTableData();
        } catch (error) {
            if (addNotification) addNotification(`Merge failed: ${error.message}`, 'error');
        } finally {
            setMergingKey(null);
        }
    }, [selectedTable, getKeepTarget, fetchTableData, addNotification]);

    return {
        isDuplicateTable: isDuplicateCatalogTable(selectedTable),
        duplicatePairs,
        totalSuggestions: allPairs.length,
        hiddenCount: allPairs.length - duplicatePairs.length,
        computing,
        mergingKey,
        getKeepTarget,
        setKeepTarget,
        handleIgnore,
        handleMergePair,
    };
}
