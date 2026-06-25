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
    { key: "matchup", label: "MATCHUP", optionsKey: "matchups", type: "matchup" },
    { key: "wdl", label: "W-D-L", col: "W-D-L", optionsKey: "wdl" },
    { key: "clean_sheet", label: "CLEAN SHEET", col: "CLEAN SHEET", optionsKey: "clean_sheets" },
    { key: "country", label: "COUNTRY", optionsKey: "countries", type: "country" },
    { key: "continent", label: "CONTINENT", optionsKey: "continents", type: "continent" },
];

function getRegionWeight(r) {
    const lower = String(r).toLowerCase();
    if (lower === "أفريقيا" || lower === "africa") return 1;
    if (lower === "اسيا" || lower === "asia") return 2;
    if (lower === "دول عربية") return 3;
    return 10;
}

function sortMatchupRegions(a, b) {
    const wa = getRegionWeight(a);
    const wb = getRegionWeight(b);
    if (wa !== wb) return wa - wb;
    return a.localeCompare(b, 'ar');
}

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

    const handleToggle = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setOpenUp(window.innerHeight - rect.bottom < 350);
        }
        setIsOpen((prev) => !prev);
    };

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
            <div className={`dropdown-trigger ${isOpen ? "active" : ""}`} onClick={handleToggle}>
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

export default function IntNtFilters({ data, countries, onFilter, isOpen, onClose }) {
    const [filters, setFilters] = useState({});

    const countryRowMap = useMemo(() => {
        const map = new Map();
        (countries || []).forEach(c => {
            if (c.COUNTRY_NAME) map.set(c.COUNTRY_NAME.toLowerCase(), c);
            if (c.COUNTRY_NAME_EN) map.set(c.COUNTRY_NAME_EN.toLowerCase(), c);
        });
        return map;
    }, [countries]);

    const myRowMatchesFilter = (row, def, val, currentFilters) => {
        if (!val || val === "All" || (Array.isArray(val) && (val.length === 0 || val.includes("All")))) return true;
        const selected = String(val);
        
        if (def.type === "team") {
            const teamA = String(row.TEAMA ?? "");
            const teamB = String(row.TEAMB ?? "");
            return Array.isArray(val) ? (val.includes(teamA) || val.includes(teamB)) : (teamA === val || teamB === val);
        }
        
        if (def.key === "matchup") {
            const tA = String(row.TEAMA ?? "").toLowerCase();
            const tB = String(row.TEAMB ?? "").toLowerCase();

            const cA = countryRowMap.get(tA);
            const cB = countryRowMap.get(tB);

            const rA = [];
            if (cA?.CONTINENT) rA.push(cA.CONTINENT);
            if (cA?.IS_ARAB) rA.push("دول عربية");

            const rB = [];
            if (cB?.CONTINENT) rB.push(cB.CONTINENT);
            if (cB?.IS_ARAB) rB.push("دول عربية");

            let matchesMatchup = false;
            rA.forEach(a => {
                rB.forEach(b => {
                    const sorted = [a, b].sort(sortMatchupRegions);
                    const matchupVal = `${sorted[0]} VS ${sorted[1]}`;
                    if (Array.isArray(val) ? val.includes(matchupVal) : matchupVal === val) matchesMatchup = true;
                });
            });
            return matchesMatchup;
        }
        
        if (def.key === "country") {
            const tA = String(row.TEAMA ?? "").toLowerCase();
            const tB = String(row.TEAMB ?? "").toLowerCase();
            const cA = countryRowMap.get(tA);
            const cB = countryRowMap.get(tB);
            if (Array.isArray(val)) {
                return (cA && val.includes(cA.COUNTRY_NAME)) || (cB && val.includes(cB.COUNTRY_NAME));
            }
            return (cA && cA.COUNTRY_NAME === val) || (cB && cB.COUNTRY_NAME === val);
        }
        
        if (def.key === "continent") {
            const tA = String(row.TEAMA ?? "").toLowerCase();
            const tB = String(row.TEAMB ?? "").toLowerCase();
            const cA = countryRowMap.get(tA);
            const cB = countryRowMap.get(tB);

            const checkContinent = (cRow, v) => {
                if (v === "دول عربية") return cRow?.IS_ARAB === true;
                return cRow?.CONTINENT === v;
            };

            if (Array.isArray(val)) {
                return val.some(v => checkContinent(cA, v) || checkContinent(cB, v));
            }
            return checkContinent(cA, val) || checkContinent(cB, val);
        }
        
        if (def.key === "wdl") {
            const teamFilter = currentFilters && currentFilters.team && currentFilters.team !== "All" ? currentFilters.team : null;
            let outcome = String(row.OUTCOME ?? "");
            
            if (teamFilter) {
                if (Array.isArray(teamFilter)) {
                    if (teamFilter.includes(row.TEAMA)) {
                        // relative to TEAMA
                    } else if (teamFilter.includes(row.TEAMB)) {
                        if (outcome === "W") outcome = "L";
                        else if (outcome === "L") outcome = "W";
                    }
                } else {
                    if (row.TEAMA === teamFilter) {
                        // outcome is already relative to TEAMA
                    } else if (row.TEAMB === teamFilter) {
                        if (outcome === "W") outcome = "L";
                        else if (outcome === "L") outcome = "W";
                    }
                }
            }
            
            if (Array.isArray(val)) {
                return val.some(v => {
                    if (v === "W") return outcome === "W";
                    if (v === "L") return outcome === "L";
                    if (v === "D") return outcome.startsWith("D");
                    return false;
                });
            } else {
                if (val === "W") return outcome === "W";
                if (val === "L") return outcome === "L";
                if (val === "D") return outcome.startsWith("D");
            }
        }
        
        const rowVal = String(row[def.col] ?? "");
        return Array.isArray(val) ? val.map(String).includes(rowVal) : rowVal === val;
    };

    const applyFilters = (data, filters) => {
        return (data || []).filter((row) => FILTER_DEFS.every((def) => myRowMatchesFilter(row, def, filters[def.key], filters)));
    };

    const getExtendedUniqueFilters = (rows) => {
        const base = IntNtService.getUniqueFilters(rows);
        
        const matchCountryNames = new Set();
        const matchupsSet = new Set();
        
        const getTeamRegions = (teamName) => {
            if (!teamName) return [];
            const c = countryRowMap.get(String(teamName).toLowerCase());
            if (!c) return [];
            const regions = [];
            if (c.CONTINENT) regions.push(c.CONTINENT);
            if (c.IS_ARAB) regions.push("دول عربية");
            return regions;
        };

        rows.forEach(m => {
            if (m.TEAMA) matchCountryNames.add(String(m.TEAMA).toLowerCase());
            if (m.TEAMB) matchCountryNames.add(String(m.TEAMB).toLowerCase());

            const rA = getTeamRegions(m.TEAMA);
            const rB = getTeamRegions(m.TEAMB);
            
            rA.forEach(a => {
                rB.forEach(b => {
                    const sorted = [a, b].sort(sortMatchupRegions);
                    matchupsSet.add(`${sorted[0]} VS ${sorted[1]}`);
                });
            });
        });
        
        base.matchups = ["All", ...matchupsSet].sort((a, b) => a.localeCompare(b, 'ar'));
        
        const countryOpts = (countries || [])
            .filter(c => c.COUNTRY_NAME && (
                matchCountryNames.has(c.COUNTRY_NAME.toLowerCase()) ||
                (c.COUNTRY_NAME_EN && matchCountryNames.has(c.COUNTRY_NAME_EN.toLowerCase()))
            ))
            .map(c => c.COUNTRY_NAME);
            
        base.countries = ["All", ...new Set(countryOpts)].sort((a, b) => a.localeCompare(b, 'ar'));
        
        const continentOpts = (countries || [])
            .filter(c => c.CONTINENT && (
                matchCountryNames.has(c.COUNTRY_NAME.toLowerCase()) ||
                (c.COUNTRY_NAME_EN && matchCountryNames.has(c.COUNTRY_NAME_EN.toLowerCase()))
            ))
            .map(c => c.CONTINENT);
            
        const hasArab = (countries || []).some(c => c.IS_ARAB === true && (
            matchCountryNames.has(c.COUNTRY_NAME.toLowerCase()) ||
            (c.COUNTRY_NAME_EN && matchCountryNames.has(c.COUNTRY_NAME_EN.toLowerCase()))
        ));
        
        const uniqueContinents = new Set(continentOpts);
        if (hasArab) uniqueContinents.add("دول عربية");
        
        base.continents = ["All", ...uniqueContinents].sort((a, b) => a.localeCompare(b, 'ar'));
        
        return base;
    };

    const filterOptions = useMemo(
        () => buildCascadingFilterOptions(
            data, 
            FILTER_DEFS, 
            filters, 
            getExtendedUniqueFilters, 
            (row, def, val) => myRowMatchesFilter(row, def, val, filters)
        ),
        [data, filters, countries]
    );

    const handleFilterChange = (key, value) => {
        setFilters((prev) => {
            const next = { ...prev };
            if (value === "All" || (Array.isArray(value) && value.length === 0)) delete next[key];
            else next[key] = value;
            return pruneInvalidFilterSelections(
                data, 
                FILTER_DEFS, 
                next, 
                getExtendedUniqueFilters, 
                (row, def, val) => myRowMatchesFilter(row, def, val, next), 
                key
            );
        });
    };

    const handleApply = () => { onFilter(applyFilters(data, filters), filters); onClose(); };
    const handleReset = () => { setFilters({}); onFilter(data || [], {}); };

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
