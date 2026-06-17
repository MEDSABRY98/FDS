import React from 'react';
import { GitMerge, EyeOff } from 'lucide-react';
import NoData_db from '../../lib/NoData_db';

function confidenceClass(level) {
    if (level === 'HIGH') return 'dup-confidence dup-confidence-high';
    if (level === 'MEDIUM') return 'dup-confidence dup-confidence-medium';
    return 'dup-confidence dup-confidence-review';
}

export default function DuplicatesPanel({
    duplicatePairs,
    hiddenCount,
    computing = false,
    mergingKey,
    getKeepTarget,
    setKeepTarget,
    onIgnore,
    onMerge,
}) {
    if (computing) {
        return (
            <NoData_db
                message="SCANNING FOR DUPLICATE PAIRS..."
                height="320px"
            />
        );
    }

    if (!duplicatePairs?.length) {
        return (
            <NoData_db
                message={hiddenCount > 0
                    ? `NO ACTIVE DUPLICATE SUGGESTIONS (${hiddenCount} HIDDEN)`
                    : 'NO DUPLICATE SUGGESTIONS FOUND'}
                height="320px"
            />
        );
    }

    return (
        <div className="table-overflow duplicates-panel">
            <table className="db-table duplicates-table">
                <thead>
                    <tr>
                        <th>NAME 1</th>
                        <th>NAME 2</th>
                        <th>CONFIDENCE</th>
                        <th>KEEP</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {duplicatePairs.map(pair => {
                        const keepTarget = getKeepTarget(pair);
                        const isMerging = mergingKey === pair.pairKey;

                        return (
                            <tr key={pair.pairKey}>
                                <td className="dup-name-cell">
                                    <div className="dup-name">{pair.nameA}</div>
                                    <div className="dup-id">{pair.idA}</div>
                                </td>
                                <td className="dup-name-cell">
                                    <div className="dup-name">{pair.nameB}</div>
                                    <div className="dup-id">{pair.idB}</div>
                                </td>
                                <td>
                                    <span className={confidenceClass(pair.confidence)}>
                                        {pair.confidence}
                                    </span>
                                    <div className="dup-score">{pair.score}%</div>
                                </td>
                                <td>
                                    <div className="dup-keep-picks">
                                        <button
                                            type="button"
                                            className={`dup-keep-pick ${keepTarget === pair.nameA ? 'active' : ''}`}
                                            onClick={() => setKeepTarget(pair.pairKey, pair.nameA)}
                                            disabled={isMerging}
                                        >
                                            {pair.nameA}
                                        </button>
                                        <button
                                            type="button"
                                            className={`dup-keep-pick ${keepTarget === pair.nameB ? 'active' : ''}`}
                                            onClick={() => setKeepTarget(pair.pairKey, pair.nameB)}
                                            disabled={isMerging}
                                        >
                                            {pair.nameB}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div className="dup-actions">
                                        <button
                                            type="button"
                                            className="dup-merge-btn"
                                            onClick={() => onMerge(pair)}
                                            disabled={isMerging}
                                        >
                                            <GitMerge size={14} />
                                            {isMerging ? 'MERGING...' : 'MERGE'}
                                        </button>
                                        <button
                                            type="button"
                                            className="dup-ignore-btn"
                                            onClick={() => onIgnore(pair)}
                                            disabled={isMerging}
                                            title="Hide this suggestion"
                                        >
                                            <EyeOff size={14} />
                                            IGNORE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
