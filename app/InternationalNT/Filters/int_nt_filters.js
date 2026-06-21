"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { IntNtService } from "../Service/int_nt_service";
import { NormalizeFilterDropdownOptions, buildCascadingFilterOptions, pruneInvalidFilterSelections } from "../../lib/Filters_db";
import "../../lib/Filters_db.css";

const FILTER_DEFS = [
    { key: "game", label: "GAME", col: "GAME", optionsKey: "games" },
    { key: "age", label: "AGE", col: "AGE", optionsKey: "ages" },
    { key: "season", label: "SEASON", col: "SEASON", optionsKey: "seasons" },
    { key: "host_country", label: "HOST COUNTRY", col: "HOST COUNTRY", optionsKey: "host_countries" },
    { key: "date", label: "DATE", col: "DATE", optionsKey: "dates" },
    { key: "category", label: "CATEGORY", col: "CATEGORY", optionsKey: "categories" },
    { key: "round", label: "ROUND", col: "ROUND", optionsKey: "rounds" },
    { key: "team", label: "TEAM", optionsKey: "teams", type: "team" },
    { key: "continent", label: "CONTINENT", optionsKey: "continents", type: "continent" },
    { key: "wdl", label: "W-D-L", col: "W-D-L", optionsKey: "wdl" },
    { key: "clean_sheet", label: "CLEAN SHEET", col: "CLEAN SHEET", optionsKey: "clean_sheets" },
];

function SearchableDropdown({ label, options, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalizedOptions = useMemo(() => NormalizeFilterDropdownOptions(options), [options]);
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        const q = searchTerm.toLowerCase();
        return normalizedOptions.filter((opt) => String(opt).toLowerCase().includes(q));
    }, [normalizedOptions, searchTerm]);

    const handleToggle = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setOpenUp(window.innerHeight - rect.bottom < 350);
        }
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <label className="dropdown-label">{label}</label>
            <div className={`dropdown-trigger ${isOpen ? "active" : ""}`} onClick={handleToggle}>
                <span className="current-value">{value || "All"}</span>
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
                        {filteredOptions.length === 0 ? (
                            <div className="no-results">No results</div>
                        ) : (
                            filteredOptions.map((opt, index) => (
                                <div
                                    key={`${opt}-${index}`}
                                    className={`option-item ${value === opt ? "selected" : ""}`}
                                    onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(""); }}
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

function rowMatchesFilter(row, def, val) {
    if (!val || val === "All") return true;
    const selected = String(val);
    if (def.type === "team") {
        return String(row.TEAMA ?? "") === selected || String(row.TEAMB ?? "") === selected;
    }
    if (def.type === "continent") {
        return String(row["TEAMA CONTINENT"] ?? "") === selected || String(row["TEAMB CONTINENT"] ?? "") === selected;
    }
    if (def.key === "wdl") {
        const outcome = String(row.OUTCOME ?? "");
        if (selected === "W") return outcome === "W";
        if (selected === "L") return outcome === "L";
        if (selected === "D") return outcome.startsWith("D");
    }
    return String(row[def.col] ?? "") === selected;
}

function applyFilters(data, filters) {
    return (data || []).filter((row) => FILTER_DEFS.every((def) => rowMatchesFilter(row, def, filters[def.key])));
}

export default function IntNtFilters({ data, onFilter, isOpen, onClose }) {
    const [filters, setFilters] = useState({});

    const filterOptions = useMemo(
        () => buildCascadingFilterOptions(data, FILTER_DEFS, filters, (rows) => IntNtService.getUniqueFilters(rows), rowMatchesFilter),
        [data, filters]
    );

    const handleFilterChange = (key, value) => {
        setFilters((prev) => {
            const next = { ...prev };
            if (value === "All") delete next[key];
            else next[key] = value;
            return pruneInvalidFilterSelections(data, FILTER_DEFS, next, (rows) => IntNtService.getUniqueFilters(rows), rowMatchesFilter, key);
        });
    };

    const handleApply = () => { onFilter(applyFilters(data, filters)); onClose(); };
    const handleReset = () => { setFilters({}); onFilter(data || []); };

    if (!isOpen) return null;

    return (
        <div className="filter-popup-overlay" onClick={onClose}>
            <div className="filter-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="filter-popup-header">
                    <div className="filter-popup-title">DATABASE <span className="gold-text">FILTERS</span></div>
                    <button type="button" className="filter-popup-close-btn" onClick={onClose}><X size={24} /></button>
                </div>
                <div className="filter-popup-scroll-body">
                    <div className="filter-popup-grid">
                        {!data?.length ? (
                            <div className="filter-popup-no-data">NO DATA AVAILABLE TO FILTER</div>
                        ) : (
                            FILTER_DEFS.map(({ key, label, optionsKey }) => (
                                <SearchableDropdown
                                    key={key}
                                    label={label}
                                    options={filterOptions[optionsKey] || ["All"]}
                                    value={filters[key] || "All"}
                                    onChange={(val) => handleFilterChange(key, val)}
                                />
                            ))
                        )}
                    </div>
                </div>
                <div className="filter-popup-footer">
                    <button type="button" className="filter-popup-reset-btn" onClick={handleReset}>RESET ALL</button>
                    <button type="button" className="filter-popup-apply-btn" onClick={handleApply}>APPLY FILTERS</button>
                </div>
            </div>
        </div>
    );
}
