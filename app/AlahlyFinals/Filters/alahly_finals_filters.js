"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { UseColumnOrder, SortColumnNames } from "../../lib/Settings_db";
import "./alahly_finals_filters.css";

const TABLE_NAME = "alahly_MATCHDETAILS";

// Custom Searchable Dropdown Component
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

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    return (
        <div className="finals-dropdown-container" ref={dropdownRef}>
            <label className="finals-dropdown-label">{label.replace(/_/g, ' ')}</label>
            <div 
                className={`finals-dropdown-trigger ${isOpen ? 'active' : ''}`} 
                onClick={handleToggle}
            >
                <span className="finals-current-value">{value || "All"}</span>
                <span className="finals-arrow">▼</span>
            </div>

            {isOpen && (
                <div className={`finals-dropdown-menu ${openUp ? 'open-up' : ''}`}>
                    <input 
                        type="text" 
                        className="finals-dropdown-search"
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="finals-options-list">
                        {filteredOptions.length === 0 ? (
                            <div className="finals-no-results">No results</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt} 
                                    className={`finals-option-item ${value === opt ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    {opt}
                                </div>
                            ))
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
        if (s.includes('/')) {
            const parts = s.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        try {
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
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
            const values = [...new Set(data.map(item => String(item[col] || "")))].filter(Boolean).sort();
            options[col] = ["All", ...values];
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

        // Apply Date Range Filter
        if (startDate || endDate) {
            filtered = filtered.filter(item => {
                const itemDate = standardizeDate(item.DATE);
                if (!itemDate) return false;
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
            });
        }

        // Apply Column Filters
        Object.keys(activeFilters).forEach(col => {
            filtered = filtered.filter(item => String(item[col] || "") === activeFilters[col]);
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
        <div className="finals-filter-overlay" onClick={onClose}>
            <div className="finals-filter-container" onClick={e => e.stopPropagation()}>
                <div className="finals-filter-header">
                    <div className="finals-header-title">
                        DATABASE <span className="gold-text">FILTERS</span>
                    </div>
                    <button className="finals-close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="finals-filter-scrollable-body">
                    <div className="finals-filter-grid">
                        {columns.length === 0 ? (
                            <div className="no-data">NO DATA AVAILABLE TO FILTER</div>
                        ) : (
                            columns.flatMap(col => {
                                if (col.toUpperCase() === 'DATE') {
                                    return [
                                        <div key="date_from" className="finals-dropdown-container">
                                            <label className="finals-dropdown-label">DATE FROM</label>
                                            <input 
                                                type="date" 
                                                value={startDate} 
                                                onChange={(e) => setStartDate(e.target.value)} 
                                                className="finals-individual-date-input"
                                            />
                                        </div>,
                                        <div key="date_to" className="finals-dropdown-container">
                                            <label className="finals-dropdown-label">DATE TO</label>
                                            <input 
                                                type="date" 
                                                value={endDate} 
                                                onChange={(e) => setEndDate(e.target.value)} 
                                                className="finals-individual-date-input"
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

                <div className="finals-filter-footer">
                    <button className="finals-reset-btn" onClick={handleReset}>RESET ALL</button>
                    <button className="finals-apply-btn" onClick={handleApply}>APPLY FILTERS</button>
                </div>
            </div>
        </div>
    );
}
