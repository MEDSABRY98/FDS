"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Filter, X, RotateCcw, Search, ChevronDown, Check } from "lucide-react";
import "./alahly_pks_filters.css";

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

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <label className="dropdown-label">{label.replace(/_/g, ' ')}</label>
            <div 
                className={`dropdown-trigger ${isOpen ? 'active' : ''}`} 
                onClick={handleToggle}
            >
                <span className="current-value">{value || "All"}</span>
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
                        {filteredOptions.length === 0 ? (
                            <div className="no-results">No results</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt} 
                                    className={`option-item ${value === opt ? 'selected' : ''}`}
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

export default function AlAhlyPKsFilter({ data, onFilter, isOpen, onClose }) {
    const [activeFilters, setActiveFilters] = useState({});

    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        const firstRecord = data[0];
        if (!firstRecord) return [];
        return Object.keys(firstRecord).filter(col => col.toUpperCase() !== "ROW_ID" && col.toUpperCase() !== "MATCH_ID");
    }, [data]);

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
        Object.keys(activeFilters).forEach(col => {
            filtered = filtered.filter(item => String(item[col] || "") === activeFilters[col]);
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
        <div className="pks-filter-overlay" onClick={onClose}>
            <div className="pks-filter-container" onClick={e => e.stopPropagation()}>
                <div className="filter-header">
                    <div className="header-title">
                        DATABASE <span className="gold-text">FILTERS</span>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="filter-scrollable-body">
                    <div className="filter-grid">
                        {columns.length === 0 ? (
                            <div className="no-data">NO DATA AVAILABLE TO FILTER</div>
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

                <div className="filter-footer">
                    <button className="reset-btn" onClick={handleReset}>RESET ALL FILTERS</button>
                    <button className="apply-btn" onClick={handleApply}>APPLY FILTERS & CLOSE</button>
                </div>
            </div>
        </div>
    );
}
