"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import "./alahly_db_media_tracker.css";
import { AlAhlyService } from "../Service/alahly_db_service";
import { Save, Edit2, CheckCircle2 } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { useNotification } from "../../lib/Notification_db";

// Custom Premium Searchable Dropdown Component

export default function AlAhlyMediaTracker({ matches, mediaTrackerData, onDataChange }) {
    const { addNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState("");
    const [mediaStatusFilter, setMediaStatusFilter] = useState("");
    const [champFilter, setChampFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState(null);

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

    // Merge match data with media tracker data
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
                const isFull = item["FULL MATCH"] === "YES";
                const isHigh = item["HIGHLIGHT"] === "YES";

                if (mediaStatusFilter === "Have Both") return isFull && isHigh;
                if (mediaStatusFilter === "Only Full Match") return isFull && !isHigh;
                if (mediaStatusFilter === "Only Highlight") return !isFull && isHigh;
                if (mediaStatusFilter === "Missing Both") return !isFull && !isHigh;
                if (mediaStatusFilter === "Missing Full Match") return !isFull;
                if (mediaStatusFilter === "Missing Highlight") return !isHigh;
                
                return true;
            });
        }

        // Search logic
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            list = list.filter(item => {
                const opp = String(item.matchInfo["OPPONENT TEAM"] || "").toLowerCase();
                const notes = String(item.NOTES || "").toLowerCase();
                const mId = String(item.MATCH_ID || "").toLowerCase();
                return opp.includes(lowerSearch) || notes.includes(lowerSearch) || mId.includes(lowerSearch);
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

    const handleEdit = (mt) => {
        setEditingId(mt.ROW_ID);
        setEditForm({
            "FULL MATCH": mt["FULL MATCH"] || "",
            "COUNT FULL MATCH": mt["COUNT FULL MATCH"] || "",
            "HIGHLIGHT": mt.HIGHLIGHT || "",
            "COUNT HIGHLIGHT": mt["COUNT HIGHLIGHT"] || "",
            "MEDIA PATH": mt["MEDIA PATH"] || "",
            "NOTES": mt.NOTES || ""
        });
    };

    const handleSave = async (rowId) => {
        setSaving(true);
        try {
            await AlAhlyService.updateMediaRecord(rowId, editForm);
            if (onDataChange) await onDataChange(true);
            setEditingId(null);
            setSavedId(rowId);
            setTimeout(() => setSavedId(null), 3000);
            addNotification("Record saved successfully.", "success");
        } catch (error) {
            addNotification("Failed to save record.", "error");
        }
        setSaving(false);
    };

    const handleChange = (e, field) => {
        setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <div className="mt-fade-in" id="mt-tab-media-tracker">
            <div className="mt-wrapper">
                <div className="mt-header-container">
                    <div className="mt-section-title">AL AHLY <span className="mt-accent">MEDIA TRACKER</span></div>
                </div>
                <div className="mt-gold-line"></div>
                
                <div className="mt-controls">
                    <div className="mt-search-wrap" style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1200px', flexWrap: 'nowrap', justifyContent: 'center' }}>
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Type opponent, Match ID, or notes..."
                            className="search-wrap-premium"
                            style={{ width: '320px', flex: 'none' }}
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
                            className="mt-dropdown-container"
                            style={{ width: '230px', flex: 'none' }}
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
                            className="mt-dropdown-container"
                            style={{ width: '230px', flex: 'none' }}
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
                            className="mt-dropdown-container"
                            style={{ width: '230px', flex: 'none' }}
                        />
                    </div>
                </div>

                <div className="mt-table-container">
                    {combinedData.length === 0 ? (
                        <NoData_db message="No media tracker records found." />
                    ) : (
                        <table className="mt-modern-table mt-fade-in">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>#</th>
                                <th style={{ width: '200px' }}>MATCH INFO</th>
                                <th style={{ width: '150px' }}>SEASON</th>
                                <th>FULL MATCH</th>
                                <th style={{ width: '60px' }}>COUNT</th>
                                <th>HIGHLIGHT</th>
                                <th style={{ width: '60px' }}>COUNT</th>
                                <th style={{ width: '200px' }}>MEDIA PATH</th>
                                <th>NOTES</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, i) => {
                                    const actualIndex = (currentPage - 1) * pageSize + i;
                                    const isEditing = editingId === item.ROW_ID;
                                    
                                    return (
                                        <tr key={item.ROW_ID} className={isEditing ? 'mt-editing-row' : ''}>
                                            <td><span className="mt-rank-badge">{actualIndex + 1}</span></td>
                                            <td>
                                                <div className="mt-match-info">
                                                    <div className="mt-text-opp">{item.matchInfo["OPPONENT TEAM"] || "N/A"}</div>
                                                    <div className="mt-text-date">{item.matchInfo.DATE || "N/A"}</div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--gold)' }}>{item.matchInfo["SEASON - NAME"] || "N/A"}</td>
                                            
                                            {/* FULL MATCH */}
                                            <td>
                                                {isEditing ? (
                                                    <select className="mt-cell-input mt-center-text" value={editForm["FULL MATCH"]} onChange={(e) => handleChange(e, "FULL MATCH")}>
                                                        <option value="">-</option>
                                                        <option value="YES">YES</option>
                                                    </select>
                                                ) : (
                                                    <span style={{ 
                                                        color: item["FULL MATCH"] === "YES" ? "#2ecc71" : "inherit",
                                                        fontWeight: item["FULL MATCH"] === "YES" ? "800" : "600"
                                                    }}>
                                                        {item["FULL MATCH"] || "-"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* COUNT FULL MATCH */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input mt-center-text" value={editForm["COUNT FULL MATCH"]} onChange={(e) => handleChange(e, "COUNT FULL MATCH")} />
                                                ) : (
                                                    <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{item["COUNT FULL MATCH"] || "-"}</span>
                                                )}
                                            </td>

                                            {/* HIGHLIGHT */}
                                            <td>
                                                {isEditing ? (
                                                    <select className="mt-cell-input mt-center-text" value={editForm["HIGHLIGHT"]} onChange={(e) => handleChange(e, "HIGHLIGHT")}>
                                                        <option value="">-</option>
                                                        <option value="YES">YES</option>
                                                    </select>
                                                ) : (
                                                    <span style={{ 
                                                        color: item["HIGHLIGHT"] === "YES" ? "#2ecc71" : "inherit",
                                                        fontWeight: item["HIGHLIGHT"] === "YES" ? "800" : "600"
                                                    }}>
                                                        {item["HIGHLIGHT"] || "-"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* COUNT HIGHLIGHT */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input mt-center-text" value={editForm["COUNT HIGHLIGHT"]} onChange={(e) => handleChange(e, "COUNT HIGHLIGHT")} />
                                                ) : (
                                                    <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{item["COUNT HIGHLIGHT"] || "-"}</span>
                                                )}
                                            </td>

                                            {/* MEDIA PATH */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input" value={editForm["MEDIA PATH"]} onChange={(e) => handleChange(e, "MEDIA PATH")} placeholder="/vids/..." />
                                                ) : (
                                                    <span className="mt-truncate-text" title={item["MEDIA PATH"] || ""}>{item["MEDIA PATH"] || "-"}</span>
                                                )}
                                            </td>

                                            {/* NOTES */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input" value={editForm["NOTES"]} onChange={(e) => handleChange(e, "NOTES")} />
                                                ) : (
                                                    <span className="mt-truncate-text" title={item.NOTES || ""}>{item.NOTES || "-"}</span>
                                                )}
                                            </td>

                                            {/* ACTIONS */}
                                            <td style={{ textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <button 
                                                        className={`mt-action-btn mt-save-btn ${saving ? 'mt-loading' : ''}`}
                                                        onClick={() => handleSave(item.ROW_ID)}
                                                        disabled={saving}
                                                        title="Save Changes"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button 
                                                            className="mt-action-btn mt-edit-btn"
                                                            onClick={() => handleEdit(item)}
                                                            title="Edit Record"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
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
