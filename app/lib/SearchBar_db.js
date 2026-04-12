"use client";

import React from 'react';
import './Components_db.css';

/**
 * Premium Search Bar Component
 * @param {string} value - Current value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {string} className - Optional extra classes
 */
const SearchBar_db = ({ value, onChange, placeholder = "Search...", className = "" }) => {
    return (
        <div className={`search-bar-db ${className}`}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <div className="search-icon-db">🔍</div>
        </div>
    );
};

export default SearchBar_db;
