"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, X, Info, Pencil, Trash2 } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import Loading_db from "../../lib/Loading_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { useNotification } from "../../lib/Notification_db";
import { AutocompleteInput, fetchCatalogDisplayNames, supabase } from "../../Database";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import "./egypt_nt_db_cancelled.css";

const PAGE_SIZE = 50;
const TABLE_NAME = "egy_NT_MATCHDETAILS";

const EMPTY_FORM = {
    DATE: "",
    SEASON: "",
    ROUND: "",
    PLACE: "",
    "Egypt TEAM": "",
    GF: "",
    GA: "",
    "OPPONENT TEAM": "",
    NOTE: "",
};

function rowToForm(row = {}) {
    let date = String(row.DATE ?? "").trim();
    if (date) {
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
            date = date.slice(0, 10);
        } else {
            const parsed = new Date(date);
            if (!Number.isNaN(parsed.getTime())) {
                date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
            }
        }
    }

    return {
        DATE: date,
        SEASON: row.SEASON ?? "",
        ROUND: row.ROUND ?? "",
        PLACE: row.PLACE ?? "",
        "Egypt TEAM": row["Egypt TEAM"] ?? "",
        GF: row.GF ?? "",
        GA: row.GA ?? "",
        "OPPONENT TEAM": row["OPPONENT TEAM"] ?? "",
        NOTE: row.NOTE ?? "",
    };
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function fetchUniqueColumnValues(tableName, column) {
    const results = [];
    let from = 0;

    while (true) {
        const { data, error } = await supabase
            .from(tableName)
            .select(`"${column}"`)
            .range(from, from + 999);

        if (error) throw error;
        if (!data || data.length === 0) break;

        results.push(...data.map((row) => row[column]).filter(Boolean));
        if (data.length < 1000) break;
        from += 1000;
    }

    return [...new Set(results)].sort((a, b) => String(a).localeCompare(String(b), "ar"));
}

function isDbAuthed() {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("db_auth_access") === "true";
}

function CancelledModalField({ label, children, highlight = false, className = "" }) {
    return (
        <div className={`cancelled-modal-field ${className}`.trim()}>
            <div className={`cancelled-modal-field-label ${highlight ? "is-highlight" : ""}`}>{label}</div>
            {children}
        </div>
    );
}

export default function EgyptNTCancelled() {
    const { addNotification } = useNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalPhase, setModalPhase] = useState("form");
    const [passwordInput, setPasswordInput] = useState("");
    const [authError, setAuthError] = useState("");
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [deletingRowId, setDeletingRowId] = useState(null);
    const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
    const [editRowId, setEditRowId] = useState(null);
    const [pendingAfterAuth, setPendingAfterAuth] = useState(null);
    const [notePopupRow, setNotePopupRow] = useState(null);
    const [fieldOptions, setFieldOptions] = useState({
        SEASON: [],
        ROUND: [],
        PLACE: [],
        teams: [],
    });

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            const data = await EgyptNTService.getCancelledMatches();
            setRows(data);
        } catch (err) {
            addNotification(err?.message || "Failed to load cancelled matches.", "error");
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        loadRows();
    }, [loadRows]);

    useEffect(() => {
        let cancelled = false;

        const loadOptions = async () => {
            try {
                const [seasons, rounds, places, teams] = await Promise.all([
                    fetchUniqueColumnValues(TABLE_NAME, "SEASON"),
                    fetchUniqueColumnValues(TABLE_NAME, "ROUND"),
                    fetchUniqueColumnValues(TABLE_NAME, "PLACE"),
                    fetchCatalogDisplayNames("db_TEAMS"),
                ]);

                if (cancelled) return;
                setFieldOptions({
                    SEASON: seasons,
                    ROUND: rounds,
                    PLACE: places,
                    teams,
                });
            } catch (err) {
                console.error("Failed to load cancelled match field options:", err);
            }
        };

        loadOptions();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredRows = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((row) =>
            [
                row.ROW_ID,
                row.DATE,
                row.SEASON,
                row.ROUND,
                row.PLACE,
                row["Egypt TEAM"],
                row.GF,
                row.GA,
                row["OPPONENT TEAM"],
                row.NOTE,
            ]
                .map((v) => String(v ?? "").toLowerCase())
                .some((v) => v.includes(q))
        );
    }, [rows, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const runWithAuth = useCallback((action) => {
        if (isDbAuthed()) {
            action();
            return;
        }
        setPendingAfterAuth(() => action);
        setEditRowId(null);
        setForm({ ...EMPTY_FORM });
        setPasswordInput("");
        setAuthError("");
        setModalPhase("auth");
        setModalOpen(true);
    }, []);

    const openAddModal = () => {
        setEditRowId(null);
        setForm({ ...EMPTY_FORM });
        setPasswordInput("");
        setAuthError("");
        setPendingAfterAuth(null);
        setModalPhase(isDbAuthed() ? "form" : "auth");
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        runWithAuth(() => {
            setEditRowId(row.ROW_ID);
            setForm(rowToForm(row));
            setPasswordInput("");
            setAuthError("");
            setPendingAfterAuth(null);
            setModalPhase("form");
            setModalOpen(true);
        });
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditRowId(null);
        setPendingAfterAuth(null);
        setPasswordInput("");
        setAuthError("");
    };

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === "951753") {
            sessionStorage.setItem("db_auth_access", "true");
            setAuthError("");
            if (pendingAfterAuth) {
                const action = pendingAfterAuth;
                setPendingAfterAuth(null);
                closeModal();
                action();
                return;
            }
            setModalPhase("form");
            return;
        }
        setAuthError("INCORRECT ACCESS KEY");
        setPasswordInput("");
    };

    const updateFormField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editRowId) {
                await EgyptNTService.updateCancelledMatch(editRowId, form);
                addNotification("Cancelled match updated successfully.", "success");
            } else {
                await EgyptNTService.insertCancelledMatch(form);
                addNotification("Cancelled match added successfully.", "success");
            }
            closeModal();
            await loadRows();
        } catch (err) {
            addNotification(err?.message || "Failed to save cancelled match.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (row) => {
        runWithAuth(() => {
            setDeleteConfirmRow(row);
        });
    };

    const cancelDelete = () => {
        if (deletingRowId) return;
        setDeleteConfirmRow(null);
    };

    const executeDelete = async () => {
        if (!deleteConfirmRow?.ROW_ID) return;

        setDeletingRowId(deleteConfirmRow.ROW_ID);
        try {
            await EgyptNTService.deleteCancelledMatch(deleteConfirmRow.ROW_ID);
            addNotification("Cancelled match deleted.", "success");
            setDeleteConfirmRow(null);
            await loadRows();
        } catch (err) {
            addNotification(err?.message || "Failed to delete cancelled match.", "error");
        } finally {
            setDeletingRowId(null);
        }
    };

    return (
        <div className="tab-content" id="tab-cancelled">
            <div className="cancelled-wrap">
                <div className="cancelled-header">
                    <div className="cancelled-title-row">
                        <div className="section-title">
                            CANCELLED <span className="accent">MATCHES</span>
                        </div>
                        <button
                            type="button"
                            className="cancelled-add-btn"
                            onClick={openAddModal}
                            title="Add cancelled match"
                            aria-label="Add cancelled match"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                <div className="cancelled-controls">
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search cancelled matches..."
                        className="cancelled-search"
                    />
                </div>

                <div className="cancelled-table-wrap">
                    {loading ? (
                        <div className="cancelled-loading-wrap">
                            <Loading_db inline={true} />
                        </div>
                    ) : (
                    <table className="cancelled-table">
                        <colgroup>
                            <col className="col-date" />
                            <col className="col-season" />
                            <col className="col-round" />
                            <col className="col-place" />
                            <col className="col-egypt-team" />
                            <col className="col-gf" />
                            <col className="col-ga" />
                            <col className="col-opponent-team" />
                            <col className="col-note" />
                            <col className="col-action" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>SEASON</th>
                                <th>ROUND</th>
                                <th>PLACE</th>
                                <th>EGYPT TEAM</th>
                                <th>GF</th>
                                <th>GA</th>
                                <th>OPPONENT TEAM</th>
                                <th>NOTE</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.length === 0 ? (
                                <NoData_db
                                    isTable
                                    colSpan={10}
                                    message="No cancelled matches found."
                                />
                            ) : (
                                pageRows.map((row) => {
                                    const noteText = String(row.NOTE ?? "").trim();
                                    return (
                                    <tr key={row.ROW_ID}>
                                        <td className="cancelled-cell-clip" title={formatDisplayDate(row.DATE)}>{formatDisplayDate(row.DATE)}</td>
                                        <td className="cancelled-cell-clip" title={row.SEASON || ""}>{row.SEASON || "—"}</td>
                                        <td className="cancelled-cell-clip" title={row.ROUND || ""}>{row.ROUND || "—"}</td>
                                        <td className="cancelled-cell-clip" title={row.PLACE || ""}>{row.PLACE || "—"}</td>
                                        <td className="cancelled-cell-clip" title={row["Egypt TEAM"] || ""}>{row["Egypt TEAM"] || "—"}</td>
                                        <td>{row.GF ?? "—"}</td>
                                        <td>{row.GA ?? "—"}</td>
                                        <td className="cancelled-cell-clip" title={row["OPPONENT TEAM"] || ""}>{row["OPPONENT TEAM"] || "—"}</td>
                                        <td className="cancelled-note-cell">
                                            {noteText ? (
                                                <button
                                                    type="button"
                                                    className="cancelled-note-btn"
                                                    title="View note"
                                                    aria-label="View note"
                                                    onClick={() => setNotePopupRow(row)}
                                                >
                                                    <Info size={15} />
                                                </button>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="cancelled-action-cell">
                                            <button
                                                type="button"
                                                className="cancelled-action-btn cancelled-action-btn-edit"
                                                title="Edit row"
                                                aria-label="Edit row"
                                                onClick={() => openEditModal(row)}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="cancelled-action-btn cancelled-action-btn-delete"
                                                title="Delete row"
                                                aria-label="Delete row"
                                                disabled={deletingRowId === row.ROW_ID}
                                                onClick={() => handleDelete(row)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="cancelled-pagination">
                        <button
                            type="button"
                            className="cancelled-page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                            ← PREV
                        </button>
                        <div className="cancelled-page-info">
                            PAGE <span>{currentPage}</span> OF <span>{totalPages}</span>
                        </div>
                        <button
                            type="button"
                            className="cancelled-page-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        >
                            NEXT →
                        </button>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="cancelled-modal-overlay" onClick={closeModal}>
                    <div className="cancelled-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cancelled-modal-header">
                            <div className="cancelled-modal-title-wrap">
                                <div className="cancelled-modal-indicator" />
                                <div>
                                    <div className="cancelled-modal-title">
                                        {modalPhase === "auth"
                                            ? "AUTHORIZATION"
                                            : editRowId
                                              ? "EDIT CANCELLED MATCH"
                                              : "NEW CANCELLED MATCH"}
                                    </div>
                                    {modalPhase === "form" && (
                                        <div className="cancelled-modal-subtitle">
                                            {editRowId
                                                ? "Update match details in cancelled records"
                                                : "Enter match details to save in cancelled records"}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="cancelled-modal-close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="cancelled-modal-body">
                            {modalPhase === "auth" ? (
                                <form className="cancelled-auth-form" onSubmit={handleAuthSubmit}>
                                    <div className="cancelled-auth-icon">🔐</div>
                                    <p className="cancelled-auth-text">Authorization required for this action.</p>
                                    <input
                                        type="password"
                                        className={`cancelled-modal-field-input ${authError ? "has-error" : ""}`}
                                        placeholder="Access key"
                                        value={passwordInput}
                                        onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            if (authError) setAuthError("");
                                        }}
                                        autoFocus
                                    />
                                    {authError && <div className="cancelled-auth-error">{authError}</div>}
                                    <button type="submit" className="cancelled-modal-primary-btn">
                                        AUTHORIZE ACCESS
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <div className="cancelled-form-section">
                                        <div className="cancelled-form-section-title">Match Info</div>
                                        <div className="cancelled-form-grid">
                                            <CancelledModalField label="DATE">
                                                <input
                                                    type="date"
                                                    className="cancelled-modal-field-input"
                                                    value={form.DATE}
                                                    onChange={(e) => updateFormField("DATE", e.target.value)}
                                                />
                                            </CancelledModalField>
                                            <CancelledModalField label="SEASON">
                                                <AutocompleteInput
                                                    value={form.SEASON}
                                                    options={fieldOptions.SEASON}
                                                    onChange={(val) => updateFormField("SEASON", val)}
                                                    placeholder="Season..."
                                                    className="cancelled-modal-field-input"
                                                />
                                            </CancelledModalField>
                                            <CancelledModalField label="ROUND">
                                                <AutocompleteInput
                                                    value={form.ROUND}
                                                    options={fieldOptions.ROUND}
                                                    onChange={(val) => updateFormField("ROUND", val)}
                                                    placeholder="Round..."
                                                    className="cancelled-modal-field-input"
                                                />
                                            </CancelledModalField>
                                            <CancelledModalField label="PLACE">
                                                <AutocompleteInput
                                                    value={form.PLACE}
                                                    options={fieldOptions.PLACE}
                                                    onChange={(val) => updateFormField("PLACE", val)}
                                                    placeholder="Place..."
                                                    className="cancelled-modal-field-input"
                                                />
                                            </CancelledModalField>
                                        </div>
                                    </div>

                                    <div className="cancelled-form-section">
                                        <div className="cancelled-form-section-title">Teams & Result</div>
                                        <div className="cancelled-form-grid">
                                            <CancelledModalField label="EGYPT TEAM">
                                                <AutocompleteInput
                                                    value={form["Egypt TEAM"]}
                                                    options={fieldOptions.teams}
                                                    onChange={(val) => updateFormField("Egypt TEAM", val)}
                                                    placeholder="Egypt team..."
                                                    className="cancelled-modal-field-input"
                                                />
                                            </CancelledModalField>
                                            <CancelledModalField label="OPPONENT TEAM">
                                                <AutocompleteInput
                                                    value={form["OPPONENT TEAM"]}
                                                    options={fieldOptions.teams}
                                                    onChange={(val) => updateFormField("OPPONENT TEAM", val)}
                                                    placeholder="Opponent team..."
                                                    className="cancelled-modal-field-input"
                                                />
                                            </CancelledModalField>
                                        </div>
                                        <div className="cancelled-score-row">
                                            <CancelledModalField label="GF">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="cancelled-modal-field-input cancelled-score-input"
                                                    value={form.GF}
                                                    onChange={(e) => updateFormField("GF", e.target.value)}
                                                    placeholder="0"
                                                />
                                            </CancelledModalField>
                                            <div className="cancelled-score-separator">—</div>
                                            <CancelledModalField label="GA">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="cancelled-modal-field-input cancelled-score-input"
                                                    value={form.GA}
                                                    onChange={(e) => updateFormField("GA", e.target.value)}
                                                    placeholder="0"
                                                />
                                            </CancelledModalField>
                                        </div>
                                    </div>

                                    <div className="cancelled-form-section">
                                        <div className="cancelled-form-section-title">Note</div>
                                        <CancelledModalField label="NOTE" className="cancelled-modal-field-span2">
                                            <textarea
                                                className="cancelled-modal-field-textarea"
                                                value={form.NOTE}
                                                onChange={(e) => updateFormField("NOTE", e.target.value)}
                                                placeholder="Cancellation reason or additional details..."
                                                rows={4}
                                            />
                                        </CancelledModalField>
                                    </div>
                                </>
                            )}
                        </div>

                        {modalPhase === "form" && (
                            <div className="cancelled-modal-footer">
                                <button type="button" className="cancelled-modal-secondary-btn" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="cancelled-modal-primary-btn"
                                    disabled={saving}
                                    onClick={handleSave}
                                >
                                    <Save size={15} />
                                    {saving ? "Saving..." : editRowId ? "Update Match" : "Save Match"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {notePopupRow && (
                <div className="cancelled-note-overlay" onClick={() => setNotePopupRow(null)}>
                    <div className="cancelled-note-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="cancelled-note-popup-header">
                            <h3>MATCH NOTE</h3>
                            <button
                                type="button"
                                className="cancelled-note-popup-close"
                                onClick={() => setNotePopupRow(null)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="cancelled-note-popup-meta">
                            {formatDisplayDate(notePopupRow.DATE)}
                            {notePopupRow.SEASON ? ` · ${notePopupRow.SEASON}` : ""}
                            {notePopupRow["OPPONENT TEAM"] ? ` · vs ${notePopupRow["OPPONENT TEAM"]}` : ""}
                        </div>
                        <div className="cancelled-note-popup-body">
                            {String(notePopupRow.NOTE ?? "").trim() || "—"}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmRow && (
                <div className="cancelled-delete-overlay" onClick={cancelDelete}>
                    <div className="cancelled-delete-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cancelled-delete-icon">!</div>
                        <div className="cancelled-delete-title">Delete Cancelled Match?</div>
                        <p className="cancelled-delete-text">
                            Are you sure you want to delete this cancelled match record? This action cannot be undone.
                        </p>
                        <div className="cancelled-delete-meta">
                            {formatDisplayDate(deleteConfirmRow.DATE)}
                            {deleteConfirmRow.SEASON ? ` · ${deleteConfirmRow.SEASON}` : ""}
                            {deleteConfirmRow["OPPONENT TEAM"] ? ` · vs ${deleteConfirmRow["OPPONENT TEAM"]}` : ""}
                        </div>
                        <div className="cancelled-delete-actions">
                            <button
                                type="button"
                                className="cancelled-delete-btn cancelled-delete-btn-cancel"
                                disabled={Boolean(deletingRowId)}
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="cancelled-delete-btn cancelled-delete-btn-confirm"
                                disabled={Boolean(deletingRowId)}
                                onClick={executeDelete}
                            >
                                {deletingRowId ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
