"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { UseColumnOrder, SortColumnNames } from "../../lib/Settings_db";
import { NormalizeFilterDropdownOptions } from "../../lib/Filters_db";
import "../../lib/Filters_db.css";

const TABLE_NAME = "egy_NT_PKS";

// Custom Searchable Dropdown Component (Matching Al Ahly Style)
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
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - rect.bottom;
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
            <label className="dropdown-label">{label.replace(/_/g, ' ')}</label>
            <div
                className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
                onClick={handleToggle}
            >
                <span className="current-value" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "85%" }}>
                    {displayLabel}
                </span>
                <span className="arrow">▼</span>
            </div>

            {isOpen && (
                <div className={`dropdown-menu ${openUp ? 'open-up' : ''}`}>
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
                                        className={`option-item ${isChecked ? 'selected' : ''}`}
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

export default function EgyptNTPKSFilters({ data, onFilter, isOpen, onClose }) {
    const [activeFilters, setActiveFilters] = useState({});
    const ColumnOrder = UseColumnOrder(TABLE_NAME);

    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        const firstRecord = data[0];
        if (!firstRecord) return [];
        const RawColumns = Object.keys(firstRecord).filter(col =>
            col.toUpperCase() !== "ROW_ID" &&
            col.toUpperCase() !== "MATCH_ID" &&
            !["Egypt PLAYER", "OPPONENT PLAYER", "EGYPT HOW MISS", "OPPONENT HOW MISS"].includes(col)
        );
        return SortColumnNames(RawColumns, ColumnOrder);
    }, [data, ColumnOrder]);

    const filterOptions = useMemo(() => {
        const options = {};
        columns.forEach(col => {
            const values = [...new Set(data.map(item => String(item[col] || "")))].filter(Boolean).sort();
            options[col] = NormalizeFilterDropdownOptions(values);
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
        Object.keys(activeFilters).forEach(col => {
            const filterVal = activeFilters[col];
            if (filterVal === "All" || (Array.isArray(filterVal) && (filterVal.length === 0 || filterVal.includes("All")))) {
                // Keep all
            } else {
                filtered = filtered.filter(item => {
                    const itemVal = String(item[col] || "");
                    return Array.isArray(filterVal) ? filterVal.map(String).includes(itemVal) : itemVal === String(filterVal);
                });
            }
        });
        onFilter(filtered);
        onClose();
    };

    const handleReset = () => {
        setActiveFilters({});
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
                            columns.map(col => (
                                <SearchableDropdown
                                    key={col}
                                    label={col}
                                    options={filterOptions[col] || ["All"]}
                                    value={activeFilters[col]}
                                    onChange={(val) => handleFilterChange(col, val)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="filter-popup-footer">
                    <button className="filter-popup-reset-btn" onClick={handleReset} type="button">
                        RESET ALL FILTERS
                    </button>
                    <button className="filter-popup-apply-btn" onClick={handleApply} type="button">
                        APPLY FILTERS & CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
}
