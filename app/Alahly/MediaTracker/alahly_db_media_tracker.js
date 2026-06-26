"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import "./alahly_db_media_tracker.css";
import { AlAhlyService } from "../Service/alahly_db_service";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { useNotification } from "../../lib/Notification_db";

function isMediaYes(value) {
    return String(value || "").trim().toUpperCase() === "YES";
}

function MediaYesNoToggle({ name, value, disabled, onSelect }) {
    const yesSelected = isMediaYes(value);

    return (
        <div
            className={`mt-yesno-group ${yesSelected ? "is-yes" : "is-no"}`}
            role="radiogroup"
            aria-label={name}
        >
            <div className={`mt-yesno-slider ${yesSelected ? "to-yes" : "to-no"}`} aria-hidden="true" />
            <label className={`mt-yesno-option yes ${yesSelected ? "active" : ""}`}>
                <input
                    type="radio"
                    name={name}
                    checked={yesSelected}
                    disabled={disabled}
                    onChange={() => {
                        if (!yesSelected) onSelect(true);
                    }}
                />
                <span>YES</span>
            </label>
            <label className={`mt-yesno-option no ${!yesSelected ? "active" : ""}`}>
                <input
                    type="radio"
                    name={name}
                    checked={!yesSelected}
                    disabled={disabled}
                    onChange={() => {
                        if (yesSelected) onSelect(false);
                    }}
                />
                <span>NO</span>
            </label>
        </div>
    );
}

export default function AlAhlyMediaTracker({ matches, mediaTrackerData, onDataChange }) {
    const { addNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState("");
    const [mediaStatusFilter, setMediaStatusFilter] = useState("");
    const [champFilter, setChampFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [rowSaveStates, setRowSaveStates] = useState({});
    const [optimisticValues, setOptimisticValues] = useState({});

    const uniqueChampions = useMemo(() => {
        const champs = new Set();
        (matches || []).forEach(m => {
            if (m.CHAMPION && m.CHAMPION.trim() !== "Unknown") champs.add(m.CHAMPION.trim());
        });
        return Array.from(champs).sort();
    }, [matches]);

    const uniqueSeasons = useMemo(() => {
        const seasons = new Set();
        (matches || []).forEach(m => {
            if (m["SEASON - NUMBER"] && String(m["SEASON - NUMBER"]).trim() !== "Unknown") seasons.add(String(m["SEASON - NUMBER"]).trim());
        });
        return Array.from(seasons).sort();
    }, [matches]);

    const combinedData = useMemo(() => {
        const matchesMap = new Map();
        (matches || []).forEach(m => {
            matchesMap.set(String(m.MATCH_ID).trim(), m);
        });

        let list = (mediaTrackerData || []).map(mt => {
            const mId = String(mt.MATCH_ID || "").trim();
            const matchInfo = matchesMap.get(mId) || {};
            return {
                ...mt,
                matchInfo
            };
        });

        if (champFilter) {
            list = list.filter(item => String(item.matchInfo.CHAMPION || "").trim() === champFilter);
        }
        if (seasonFilter) {
            list = list.filter(item => String(item.matchInfo["SEASON - NUMBER"] || "").trim() === seasonFilter);
        }

        if (mediaStatusFilter) {
            list = list.filter(item => {
                const isFull = isMediaYes(item["FULL MATCH"]);
                const isHigh = isMediaYes(item.HIGHLIGHT);

                if (mediaStatusFilter === "Have Both") return isFull && isHigh;
                if (mediaStatusFilter === "Only Full Match") return isFull && !isHigh;
                if (mediaStatusFilter === "Only Highlight") return !isFull && isHigh;
                if (mediaStatusFilter === "Missing Both") return !isFull && !isHigh;
                if (mediaStatusFilter === "Missing Full Match") return !isFull;
                if (mediaStatusFilter === "Missing Highlight") return !isHigh;

                return true;
            });
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            list = list.filter(item => {
                const opp = String(item.matchInfo["OPPONENT TEAM"] || "").toLowerCase();
                const mId = String(item.MATCH_ID || "").toLowerCase();
                return opp.includes(lowerSearch) || mId.includes(lowerSearch);
            });
        }

        return list.sort((a, b) => {
            const dateA = a.matchInfo.DATE ? new Date(a.matchInfo.DATE) : new Date(0);
            const dateB = b.matchInfo.DATE ? new Date(b.matchInfo.DATE) : new Date(0);
            return dateB - dateA;
        });
    }, [matches, mediaTrackerData, searchTerm, champFilter, seasonFilter, mediaStatusFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, champFilter, seasonFilter, mediaStatusFilter]);

    const paginatedData = useMemo(() => {
        return combinedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [combinedData, currentPage]);

    const totalPages = Math.ceil(combinedData.length / pageSize);

    const handleMediaToggle = useCallback(async (rowId, field, yesSelected) => {
        const cellKey = `${rowId}-${field}`;
        const dbValue = yesSelected ? "YES" : "NO";

        setOptimisticValues((prev) => ({ ...prev, [cellKey]: dbValue }));
        setRowSaveStates((prev) => ({ ...prev, [rowId]: "saving" }));

        try {
            await AlAhlyService.updateMediaRecord(rowId, { [field]: dbValue });
            if (onDataChange) await onDataChange(true);

            setRowSaveStates((prev) => ({ ...prev, [rowId]: "success" }));
            window.setTimeout(() => {
                setRowSaveStates((prev) => {
                    const next = { ...prev };
                    delete next[rowId];
                    return next;
                });
                setOptimisticValues((prev) => {
                    const next = { ...prev };
                    delete next[cellKey];
                    return next;
                });
            }, 520);
        } catch {
            setOptimisticValues((prev) => {
                const next = { ...prev };
                delete next[cellKey];
                return next;
            });
            setRowSaveStates((prev) => {
                const next = { ...prev };
                delete next[rowId];
                return next;
            });
            addNotification("Failed to save record.", "error");
        }
    }, [addNotification, onDataChange]);

    return (
        <div className="tab-content mt-fade-in" id="tab-media-tracker">
            <div className="mt-wrapper">
                <div className="mt-header-container">
                    <div className="mt-section-title">AL AHLY <span className="mt-accent">MEDIA TRACKER</span></div>
                </div>
                <div className="mt-gold-line"></div>

                <div className="mt-controls">
                    <div className="mt-controls-bar">
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Type opponent or Match ID..."
                            className="mt-search-wrap"
                        />

                        <DropDownList_db
                            value={mediaStatusFilter}
                            onChange={setMediaStatusFilter}
                            options={[
                                { value: "", label: "Show All Status" },
                                { value: "Have Both", label: "Have Both" },
                                { value: "Only Full Match", label: "Only Full Match" },
                                { value: "Only Highlight", label: "Only Highlight" },
                                { value: "Missing Both", label: "Missing Both" },
                                { value: "Missing Full Match", label: "Missing Full Match" },
                                { value: "Missing Highlight", label: "Missing Highlight" }
                            ]}
                            placeholder="Media Status"
                            className="mt-dropdown-container mt-dropdown-status"
                        />

                        <DropDownList_db
                            value={champFilter}
                            onChange={setChampFilter}
                            options={[
                                { value: "", label: "All Champions" },
                                ...uniqueChampions.map(c => ({ value: c, label: c }))
                            ]}
                            placeholder="Select Champion"
                            searchable={true}
                            className="mt-dropdown-container mt-dropdown-champ"
                        />

                        <DropDownList_db
                            value={seasonFilter}
                            onChange={setSeasonFilter}
                            options={[
                                { value: "", label: "All Seasons" },
                                ...uniqueSeasons.map(s => ({ value: s, label: s }))
                            ]}
                            placeholder="Select Season"
                            searchable={true}
                            className="mt-dropdown-container mt-dropdown-season"
                        />
                    </div>
                </div>

                <div className="mt-table-container">
                    {combinedData.length === 0 ? (
                        <NoData_db message="No media tracker records found." />
                    ) : (
                        <table className="mt-modern-table mt-fade-in">
                        <colgroup>
                            <col className="mt-col-rank" />
                            <col className="mt-col-match" />
                            <col className="mt-col-season" />
                            <col className="mt-col-status" />
                            <col className="mt-col-status" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>MATCH INFO</th>
                                <th>SEASON</th>
                                <th>FULL MATCH</th>
                                <th>HIGHLIGHT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, i) => {
                                    const actualIndex = (currentPage - 1) * pageSize + i;
                                    const rowId = item.ROW_ID;
                                    const fullKey = `${rowId}-FULL MATCH`;
                                    const highKey = `${rowId}-HIGHLIGHT`;
                                    const fullValue = optimisticValues[fullKey] ?? item["FULL MATCH"];
                                    const highValue = optimisticValues[highKey] ?? item.HIGHLIGHT;
                                    const rowSaveState = rowSaveStates[rowId];
                                    const rowClassName = rowSaveState === "saving"
                                        ? "mt-row-saving"
                                        : rowSaveState === "success"
                                            ? "mt-row-success"
                                            : "";

                                    return (
                                        <tr key={rowId} className={rowClassName}>
                                            <td className="mt-cell-rank"><span className="mt-rank-badge">{actualIndex + 1}</span></td>
                                            <td className="mt-cell-match">
                                                <div className="mt-match-info">
                                                    <div className="mt-text-opp">{item.matchInfo["OPPONENT TEAM"] || "N/A"}</div>
                                                    <div className="mt-text-date">{item.matchInfo.DATE || "N/A"}</div>
                                                </div>
                                            </td>
                                            <td className="mt-cell-season">{item.matchInfo["SEASON - NAME"] || "N/A"}</td>
                                            <td className="mt-cell-status">
                                                <MediaYesNoToggle
                                                    name={`full-${rowId}`}
                                                    value={fullValue}
                                                    disabled={rowSaveState === "saving"}
                                                    onSelect={(yes) => handleMediaToggle(rowId, "FULL MATCH", yes)}
                                                />
                                            </td>
                                            <td className="mt-cell-status">
                                                <MediaYesNoToggle
                                                    name={`high-${rowId}`}
                                                    value={highValue}
                                                    disabled={rowSaveState === "saving"}
                                                    onSelect={(yes) => handleMediaToggle(rowId, "HIGHLIGHT", yes)}
                                                />
                                            </td>
                                        </tr>
                                    );
                            })}
                        </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="mt-pagination">
                        <button
                            className="mt-page-btn"
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                        >
                            ←
                        </button>
                        <div className="mt-page-info">
                            PAGE {currentPage} OF {totalPages}
                        </div>
                        <button
                            className="mt-page-btn"
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === totalPages}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
