"use client";

import React, { useState, useMemo } from 'react';
import './DropDownList_db.css';

/**
 * Premium Dropdown List Component with search support
 * @param {Array} options - Array of { value, label }
 * @param {any} value - Current selected value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Text shown when nothing is selected
 * @param {boolean} searchable - Whether to show a search box inside the menu
 * @param {string} className - Optional extra classes
 */
const DropDownList_db = ({ options = [], value, onChange, placeholder = "Select...", searchable = false, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchTerm) return options;
        return options.filter(opt => 
            String(opt.label || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, searchable]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`dropdown-db ${isOpen ? 'is-open' : ''} ${className}`}>
            <div className="dropdown-trigger-db" onClick={() => setIsOpen(!isOpen)}>
                <span className="current-label-db">{displayLabel}</span>
                <div className="dropdown-chevron-db">⌄</div>
            </div>

            {isOpen && (
                <>
                    <div className="dropdown-menu-db">
                        {searchable && (
                            <div className="dropdown-search-wrap-db">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="dropdown-search-input-db"
                                />
                            </div>
                        )}
                        <div className="dropdown-options-container-db">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, i) => (
                                    <div
                                        key={i}
                                        className={`dropdown-opt-db ${opt.value === value ? 'active' : ''}`}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        {opt.label}
                                    </div>
                                ))
                            ) : (
                                <div className="dropdown-no-results-db">No results found</div>
                            )}
                        </div>
                    </div>
                    <div className="dropdown-overlay-db" onClick={() => setIsOpen(false)}></div>
                </>
            )}
        </div>
    );
};

export default DropDownList_db;
