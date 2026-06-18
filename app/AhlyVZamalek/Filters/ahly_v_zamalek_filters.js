"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AhlyVZamalekService } from "../Service/ahly_v_zamalek_service";
import { UseColumnOrder, SortFilterFields } from "../../lib/Settings_db";
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

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        return normalizedOptions.filter(opt =>
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [normalizedOptions, searchTerm]);

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <label className="dropdown-label">{label}</label>
            <div
                className={`dropdown-trigger ${isOpen ? "active" : ""}`}
                onClick={handleToggle}
            >
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

export default function AhlyVZamalekFilters({ data, onFilter, isOpen, onClose }) {
    const [filterOptions, setFilterOptions] = useState({});
    const [selectedFilters, setSelectedFilters] = useState({
        champion_system: "All",
        year: "All",
        champion: "All",
        season: "All",
        ahly_manager: "All",
        zamalek_manager: "All",
        referee: "All",
        round: "All",
        han: "All",
        stad: "All",
        wdl: "All",
        clean_sheet: "All"
    });

    useEffect(() => {
        if (data && data.length > 0) {
            setFilterOptions(AhlyVZamalekService.getUniqueFilters(data));
        }
    }, [data]);

    const handleApply = () => {
        const filtered = data.filter(m => {
            const matchYear = (() => {
                if (!m.DATE) return null;
                const parts = m.DATE.split("/");
                if (parts.length === 3) return parts[2];
                const date = new Date(m.DATE);
                return isNaN(date.getFullYear()) ? null : String(date.getFullYear());
            })();

            if (selectedFilters.champion_system !== "All" && m["CHAMPION SYSTEM"] !== selectedFilters.champion_system) return false;
            if (selectedFilters.year !== "All" && matchYear !== selectedFilters.year) return false;
            if (selectedFilters.champion !== "All" && m["CHAMPION"] !== selectedFilters.champion) return false;
            if (selectedFilters.season !== "All" && m["SEASON - NAME"] !== selectedFilters.season) return false;
            if (selectedFilters.ahly_manager !== "All" && m["AHLY MANAGER"] !== selectedFilters.ahly_manager) return false;
            if (selectedFilters.zamalek_manager !== "All" && m["ZAMALEK MANAGER"] !== selectedFilters.zamalek_manager) return false;
            if (selectedFilters.referee !== "All" && m["REFEREE"] !== selectedFilters.referee) return false;
            if (selectedFilters.round !== "All" && m["ROUND"] !== selectedFilters.round) return false;
            if (selectedFilters.han !== "All" && m["H-A-N"] !== selectedFilters.han) return false;
            if (selectedFilters.stad !== "All" && m["STAD"] !== selectedFilters.stad) return false;
            if (selectedFilters.wdl !== "All" && m["W-D-L"] !== selectedFilters.wdl) return false;
            if (selectedFilters.clean_sheet !== "All" && m["CLEAN SHEET"] !== selectedFilters.clean_sheet) return false;

            return true;
        });

        onFilter(filtered);
        onClose();
    };

    const handleFilterChange = (key, value) => {
        setSelectedFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setSelectedFilters({
            champion_system: "All",
            year: "All",
            champion: "All",
            season: "All",
            ahly_manager: "All",
            zamalek_manager: "All",
            referee: "All",
            round: "All",
            han: "All",
            stad: "All",
            wdl: "All",
            clean_sheet: "All"
        });
        onFilter(data);
    };

    const ColumnOrder = UseColumnOrder(TABLE_NAME);

    const SortedFilterConfigs = useMemo(() => {
        const FilterConfigs = [
            { key: "champion_system", label: "CHAMPION SYSTEM", options: filterOptions.champion_systems, dbColumn: "CHAMPION SYSTEM" },
            { key: "champion", label: "CHAMPION", options: filterOptions.champions, dbColumn: "CHAMPION" },
            { key: "year", label: "YEAR", options: filterOptions.years, dbColumn: "DATE" },
            { key: "season", label: "SEASON", options: filterOptions.seasons, dbColumn: "SEASON - NAME" },
            { key: "round", label: "ROUND", options: filterOptions.rounds, dbColumn: "ROUND" },
            { key: "stad", label: "STADIUM", options: filterOptions.stads, dbColumn: "STAD" },
            { key: "ahly_manager", label: "AHLY MANAGER", options: filterOptions.ahly_managers, dbColumn: "AHLY MANAGER" },
            { key: "zamalek_manager", label: "ZAMALEK MANAGER", options: filterOptions.zamalek_managers, dbColumn: "OPPONENT MANAGER" },
            { key: "referee", label: "REFEREE", options: filterOptions.referees, dbColumn: "REFREE" },
            { key: "han", label: "H-A-N", options: filterOptions.han, dbColumn: "H-A-N" },
            { key: "wdl", label: "W-D-L", options: filterOptions.wdl, dbColumn: "W-D-L" },
            { key: "clean_sheet", label: "CLEAN SHEET", options: filterOptions.clean_sheets, dbColumn: "CLEAN SHEET" }
        ];
        return SortFilterFields(FilterConfigs, ColumnOrder);
    }, [ColumnOrder, filterOptions]);

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
                        {SortedFilterConfigs.map(config => (
                            <SearchableDropdown
                                key={config.key}
                                label={config.label}
                                options={NormalizeFilterDropdownOptions(config.options)}
                                value={selectedFilters[config.key]}
                                onChange={(val) => handleFilterChange(config.key, val)}
                            />
                        ))}
                    </div>
                </div>

                <div className="filter-popup-footer">
                    <button className="filter-popup-reset-btn" onClick={resetFilters} type="button">
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
