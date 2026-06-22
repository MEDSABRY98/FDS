import { useState, useEffect, useRef } from "react";

export function ReplaceRecordModal({ selectedTable, columns, saving, setIsReplacing, handleExecuteReplace }) {
    const replaceableColumns = columns.filter(col => 
        !["ROW_ID", "MATCH_ID", "EVENT_ID", "PARENT_EVENT_ID"].includes(col.toUpperCase())
    );

    const [selectedColumn, setSelectedColumn] = useState(replaceableColumns[0] || "");
    const [oldValue, setOldValue] = useState("");
    const [newValue, setNewValue] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onConfirmReplace = () => {
        if (!selectedColumn) {
            alert("Please select a column.");
            return;
        }
        if (!oldValue) {
            alert("Please enter the old text to find.");
            return;
        }
        handleExecuteReplace(selectedColumn, oldValue, newValue);
    };

    return (
        <div className="edit-modal-wrap">
            <div className="edit-modal">
                <h3>Replace Text — {selectedTable}</h3>
                <div className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="form-group" style={{ position: "relative" }} ref={dropdownRef}>
                        <label>COLUMN</label>
                        <div
                            onClick={() => !saving && setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                width: "100%",
                                padding: "14px 18px",
                                background: "#fff",
                                border: isDropdownOpen ? "2px solid #c9a84c" : "2px solid #eee",
                                color: "#000",
                                borderRadius: "12px",
                                fontSize: "14px",
                                fontWeight: "600",
                                fontFamily: "inherit",
                                cursor: saving ? "not-allowed" : "pointer",
                                boxSizing: "border-box",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                transition: "all 0.2s",
                                boxShadow: isDropdownOpen ? "0 0 0 4px rgba(201, 168, 76, 0.15)" : "none"
                            }}
                        >
                            <span>{selectedColumn}</span>
                            <span style={{ 
                                fontSize: "10px", 
                                color: "#888", 
                                transform: isDropdownOpen ? "rotate(180deg)" : "none",
                                transition: "transform 0.2s"
                            }}>▼</span>
                        </div>
                        {isDropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 6px)",
                                    left: "0",
                                    right: "0",
                                    background: "#fff",
                                    border: "2px solid #eee",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                    zIndex: 1000,
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    padding: "6px",
                                    boxSizing: "border-box"
                                }}
                            >
                                {replaceableColumns.map((col) => (
                                    <div
                                        key={col}
                                        onClick={() => {
                                            setSelectedColumn(col);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: selectedColumn === col ? "#c9a84c" : "#444",
                                            background: selectedColumn === col ? "rgba(201, 168, 76, 0.08)" : "transparent",
                                            cursor: "pointer",
                                            transition: "all 0.15s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedColumn !== col) {
                                                e.target.style.background = "#f5f5f5";
                                                e.target.style.color = "#000";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedColumn !== col) {
                                                e.target.style.background = "transparent";
                                                e.target.style.color = "#444";
                                            } else {
                                                e.target.style.background = "rgba(201, 168, 76, 0.08)";
                                                e.target.style.color = "#c9a84c";
                                            }
                                        }}
                                    >
                                        {col}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>OLD TEXT (FIND)</label>
                        <input
                            type="text"
                            placeholder="Enter the text to replace..."
                            value={oldValue}
                            onChange={(e) => setOldValue(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>NEW TEXT (REPLACE)</label>
                        <input
                            type="text"
                            placeholder="Enter the new replacement text..."
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-actions" style={{ justifyContent: "center", gap: "10px" }}>
                    <button className="cancel-btn" onClick={() => setIsReplacing(false)} disabled={saving}>
                        CANCEL
                    </button>
                    <button className="save-btn" onClick={onConfirmReplace} disabled={saving} style={{ background: "#cf1322", color: "#fff" }}>
                        {saving ? (
                            <div className="btn-loader-wrap">
                                <div className="btn-spinner"></div>
                                <span>REPLACING...</span>
                            </div>
                        ) : "REPLACE TEXT"}
                    </button>
                </div>
            </div>
        </div>
    );
}
