"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { UseColumnOrder, SortColumnNames } from "../../lib/Settings_db";
import { NormalizeFilterDropdownOptions } from "../../lib/Filters_db";
import "../../lib/Filters_db.css";

const TABLE_NAME = "alahly_MATCHDETAILS";

function SearchableDropdown({ label, options, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen) {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setOpenUp(spaceBelow < 350);
            }
        }
        setIsOpen(!isOpen);
    };

    const normalizedOptions = useMemo(
        () => NormalizeFilterDropdownOptions(options),
        [options]
    );

    const selectedValues = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (value === "All") return [];
        return [value];
    }, [value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        return normalizedOptions.filter(opt =>
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [normalizedOptions, searchTerm]);

    const handleToggleOption = (opt) => {
        if (opt === "All") {
            onChange("All");
            return;
        }

        let nextValues;
        if (selectedValues.includes(opt)) {
            nextValues = selectedValues.filter(v => v !== opt);
        } else {
            nextValues = [...selectedValues, opt];
        }

        if (nextValues.length === 0) {
            onChange("All");
        } else {
            onChange(nextValues);
        }
    };

    const isAllSelected = selectedValues.length === 0 || selectedValues.includes("All");

    const displayLabel = useMemo(() => {
        if (isAllSelected) return "All";
        if (selectedValues.length === 1) return selectedValues[0];
        if (selectedValues.length <= 2) return selectedValues.join(", ");
        return `${selectedValues.length} Selected`;
    }, [selectedValues, isAllSelected]);

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <label className="dropdown-label">{label.replace(/_/g, " ")}</label>
            <div
                className={`dropdown-trigger ${isOpen ? "active" : ""}`}
                onClick={handleToggle}
            >
                <span className="current-value" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "85%" }}>
                    {displayLabel}
                </span>
                <span className="arrow">▼</span>
            </div>

            {isOpen && (
                <div className={`dropdown-menu ${openUp ? "open-up" : ""}`}>
                    <input
                        type="text"
                        className="dropdown-search"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="options-list">
                        {!normalizedOptions.includes("All") && (
                            <div
                                className={`option-item ${isAllSelected ? "selected" : ""}`}
                                onClick={() => handleToggleOption("All")}
                                style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--gold)" }}
                                />
                                <span>All</span>
                            </div>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="no-results">No results</div>
                        ) : (
                            filteredOptions.map((opt, index) => {
                                if (opt === "All") return null;
                                const isChecked = selectedValues.includes(opt);
                                return (
                                    <div
                                        key={`${opt}-${index}`}
                                        className={`option-item ${isChecked ? "selected" : ""}`}
                                        onClick={() => handleToggleOption(opt)}
                                        style={{ display: "flex", alignItems: "center", gap: "10px" }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--gold)" }}
                                        />
                                        <span>{opt}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AlAhlyFinalsFilter({ data, onFilter, isOpen, onClose }) {
    const [activeFilters, setActiveFilters] = useState({});
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const ColumnOrder = UseColumnOrder(TABLE_NAME);

    const standardizeDate = (d) => {
        if (!d) return "";
        const s = String(d).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
        if (s.includes("/")) {
            const parts = s.split("/");
            if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
        }
        try {
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
        } catch (e) {}
        return s;
    };

    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        const firstRecord = data[0];
        if (!firstRecord) return [];
        const excluded = ["ROW_ID", "MATCH_ID", "FINAL_ID", "FINAL ID", "EVENT_ID", "PARENT_EVENT_ID", "ROUND"];
        const RawColumns = Object.keys(firstRecord).filter(col => !excluded.includes(col.toUpperCase()));
        return SortColumnNames(RawColumns, ColumnOrder);
    }, [data, ColumnOrder]);

    const filterOptions = useMemo(() => {
        const options = {};
        columns.forEach(col => {
            if (col.toUpperCase() === "PEN") {
                const hasPenalties = data.some(item => item[col] && String(item[col]).trim() !== "");
                options[col] = hasPenalties ? ["All", "Win", "Loss"] : ["All"];
            } else {
                const values = [...new Set(data.map(item => String(item[col] || "")))].filter(Boolean).sort();
                options[col] = NormalizeFilterDropdownOptions(values);
            }
        });
        return options;
    }, [data, columns]);

    const handleFilterChange = (col, value) => {
        const newFilters = { ...activeFilters };
        if (value === "All") {
            delete newFilters[col];
        } else {
            newFilters[col] = value;
        }
        setActiveFilters(newFilters);
    };

    const handleApply = () => {
        let filtered = [...data];

        if (startDate || endDate) {
            filtered = filtered.filter(item => {
                const itemDate = standardizeDate(item.DATE);
                if (!itemDate) return false;
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
            });
        }

        Object.keys(activeFilters).forEach(col => {
            const filterVal = activeFilters[col];
            if (filterVal === "All" || (Array.isArray(filterVal) && (filterVal.length === 0 || filterVal.includes("All")))) {
                // Keep all
            } else {
                filtered = filtered.filter(item => {
                    const itemVal = String(item[col] || "");
                    if (col.toUpperCase() === "PEN") {
                        const penVal = itemVal.toUpperCase();
                        if (Array.isArray(filterVal)) {
                            if (filterVal.includes('Win') && penVal.startsWith('W')) return true;
                            if (filterVal.includes('Loss') && penVal.startsWith('L')) return true;
                            return filterVal.includes(penVal);
                        } else {
                            if (filterVal === 'Win') return penVal.startsWith('W');
                            if (filterVal === 'Loss') return penVal.startsWith('L');
                            return penVal === String(filterVal);
                        }
                    }
                    return Array.isArray(filterVal) ? filterVal.map(String).includes(itemVal) : itemVal === String(filterVal);
                });
            }
        });

        onFilter(filtered);
        onClose();
    };

    const handleReset = () => {
        setActiveFilters({});
        setStartDate("");
        setEndDate("");
        onFilter(data);
    };

    if (!isOpen) return null;

    return (
        <div className="filter-popup-overlay" onClick={onClose}>
            <div className="filter-popup-container" onClick={e => e.stopPropagation()}>
                <div className="filter-popup-header">
                    <div className="filter-popup-title">
                        DATABASE <span className="gold-text">FILTERS</span>
                    </div>
                    <button className="filter-popup-close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <div className="filter-popup-scroll-body">
                    <div className="filter-popup-grid">
                        {columns.length === 0 ? (
                            <div className="filter-popup-no-data">NO DATA AVAILABLE TO FILTER</div>
                        ) : (
                            columns.flatMap(col => {
                                if (col.toUpperCase() === "DATE") {
                                    return [
                                        <div key="date_from" className="filter-popup-date-field">
                                            <label className="dropdown-label">DATE FROM</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="filter-popup-date-input"
                                            />
                                        </div>,
                                        <div key="date_to" className="filter-popup-date-field">
                                            <label className="dropdown-label">DATE TO</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="filter-popup-date-input"
                                            />
                                        </div>
                                    ];
                                }
                                return (
                                    <SearchableDropdown
                                        key={col}
                                        label={col}
                                        options={filterOptions[col] || ["All"]}
                                        value={activeFilters[col]}
                                        onChange={(val) => handleFilterChange(col, val)}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="filter-popup-footer">
                    <button className="filter-popup-reset-btn" onClick={handleReset} type="button">
                        RESET ALL
                    </button>
                    <button className="filter-popup-apply-btn" onClick={handleApply} type="button">
                        APPLY FILTERS
                    </button>
                </div>
            </div>
        </div>
    );
}
