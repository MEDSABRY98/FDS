"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { IntTrophyService } from "../Service/int_trophy_service";
import { NormalizeFilterDropdownOptions, buildCascadingFilterOptions, pruneInvalidFilterSelections } from "../../lib/Filters_db";
import "../../lib/Filters_db.css";

const FILTER_DEFS = [
    { key: "type", label: "TYPE", col: "TYPE", optionsKey: "types" },
    { key: "area", label: "AREA", col: "AREA", optionsKey: "areas" },
    { key: "game", label: "GAME", col: "GAME", optionsKey: "games" },
    { key: "competition", label: "COMPETITION", col: "COMPETITION", optionsKey: "competitions" },
    { key: "season", label: "SEASON", col: "SEASON", optionsKey: "seasons" },
    { key: "team", label: "TEAM", optionsKey: "teams", type: "team" },
    { key: "place", label: "PLACE", col: "PLACE", optionsKey: "places" },
    { key: "w_manager", label: "W-MANAGER", col: "W-MANAGER", optionsKey: "w_managers" },
    { key: "l_manager", label: "L-MANAGER", col: "L-MANAGER", optionsKey: "l_managers" },
];

function SearchableDropdown({ label, options, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
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

    const normalizedOptions = useMemo(() => NormalizeFilterDropdownOptions(options), [options]);

    const selectedValues = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (value === "All") return [];
        return [value];
    }, [value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        const q = searchTerm.toLowerCase();
        return normalizedOptions.filter((opt) => String(opt).toLowerCase().includes(q));
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
            <label className="dropdown-label">{label}</label>
            <div className={`dropdown-trigger ${isOpen ? "active" : ""}`} onClick={() => setIsOpen((p) => !p)}>
                <span className="current-value" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "85%" }}>
                    {displayLabel}
                </span>
                <span className="arrow">▼</span>
            </div>
            {isOpen && (
                <div className="dropdown-menu">
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

function rowMatchesFilter(row, def, val) {
    if (!val || val === "All" || (Array.isArray(val) && (val.length === 0 || val.includes("All")))) return true;
    const selected = String(val);
    if (def.type === "team") {
        const champ = String(row.CHAMPION ?? "");
        const runnerUp = String(row["RUNNER-UP"] ?? "");
        return Array.isArray(val) ? (val.includes(champ) || val.includes(runnerUp)) : (champ === val || runnerUp === val);
    }
    const rowVal = String(row[def.col] ?? "");
    return Array.isArray(val) ? val.map(String).includes(rowVal) : rowVal === val;
}

function applyFilters(data, filters) {
    return (data || []).filter((row) => FILTER_DEFS.every((def) => rowMatchesFilter(row, def, filters[def.key])));
}

export default function IntTrophyFilters({ data, onFilter, isOpen, onClose }) {
    const [filters, setFilters] = useState({});

    const filterOptions = useMemo(
        () => buildCascadingFilterOptions(data, FILTER_DEFS, filters, (rows) => IntTrophyService.getUniqueFilters(rows), rowMatchesFilter),
        [data, filters]
    );

    const handleFilterChange = (key, value) => {
        setFilters((prev) => {
            const next = { ...prev };
            if (value === "All" || (Array.isArray(value) && value.length === 0)) delete next[key];
            else next[key] = value;
            return pruneInvalidFilterSelections(data, FILTER_DEFS, next, (rows) => IntTrophyService.getUniqueFilters(rows), rowMatchesFilter, key);
        });
    };

    const handleApply = () => { onFilter(applyFilters(data, filters)); onClose(); };
    const handleReset = () => { setFilters({}); onFilter(data || []); };

    if (!isOpen) return null;

    return (
        <div className="filter-popup-overlay" onClick={onClose}>
            <div className="filter-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="filter-popup-header">
                    <div className="filter-popup-title">TROPHY <span className="gold-text">FILTERS</span></div>
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
