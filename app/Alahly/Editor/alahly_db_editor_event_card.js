"use client";

export default function EditorEventCard({
    row,
    index,
    isSaving,
    savingModal,
    onEdit,
    onDelete,
    tableName,
    setRows,
    title,
    meta,
    description,
    extra,
}) {
    const isDirty = row._isNew || row._isDirty;

    return (
        <div className={`player-event-card player-event-card-single${isDirty ? " player-event-card-dirty" : ""}`}>
            <div className="player-event-card-head player-event-card-head-row">
                <span className="player-event-id">{row.EVENT_ID || "—"}</span>
                <div className="player-event-item-actions">
                    <button
                        type="button"
                        className="player-event-action-btn player-event-action-edit"
                        title="Edit"
                        disabled={isSaving || savingModal}
                        onClick={() => onEdit(row, index)}
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        className="player-event-action-btn player-event-action-delete"
                        title="Delete"
                        disabled={isSaving || savingModal}
                        onClick={() => onDelete(row, index, tableName, setRows)}
                    >
                        ✕
                    </button>
                </div>
            </div>
            {title && <div className="player-event-card-name">{title}</div>}
            {meta && <div className="player-event-card-meta">{meta}</div>}
            {description && <div className="player-event-card-desc">{description}</div>}
            {extra}
        </div>
    );
}
