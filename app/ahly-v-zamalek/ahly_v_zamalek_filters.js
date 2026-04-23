"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AhlyVZamalekService } from "./ahly_v_zamalek_service";
import "./ahly_v_zamalek_filters.css";

// Custom Searchable Dropdown Component (AVZ Version)
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
        const uniqueOptions = (options || []).filter(Boolean);
        if (!searchTerm) return uniqueOptions;
        return uniqueOptions.filter(opt => 
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    return (
        <div className="avz-filter-dropdown-container" ref={dropdownRef}>
            <label className="avz-filter-dropdown-label">{label}</label>
            <div 
                className={`avz-filter-dropdown-trigger ${isOpen ? 'active' : ''}`} 
                onClick={handleToggle}
            >
                <span className="avz-filter-current-value">{value || "All"}</span>
                <span className="avz-filter-arrow">▼</span>
            </div>

            {isOpen && (
                <div className={`avz-filter-dropdown-menu ${openUp ? 'open-up' : ''}`}>
                    <input 
                        type="text" 
                        className="avz-filter-dropdown-search"
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="avz-filter-options-list">
                        {filteredOptions.length === 0 ? (
                            <div className="avz-filter-no-results">No results</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt} 
                                    className={`avz-filter-option-item ${value === opt ? 'selected' : ''}`}
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
                const parts = m.DATE.split('/');
                if (parts.length === 3) return parts[2];
                const date = new Date(m.DATE);
                return isNaN(date.getFullYear()) ? null : String(date.getFullYear());
            })();

            if (selectedFilters.champion_system !== "All" && m['CHAMPION SYSTEM'] !== selectedFilters.champion_system) return false;
            if (selectedFilters.year !== "All" && matchYear !== selectedFilters.year) return false;
            if (selectedFilters.champion !== "All" && m['CHAMPION'] !== selectedFilters.champion) return false;
            if (selectedFilters.season !== "All" && m['SEASON - NAME'] !== selectedFilters.season) return false;
            if (selectedFilters.ahly_manager !== "All" && m['AHLY MANAGER'] !== selectedFilters.ahly_manager) return false;
            if (selectedFilters.zamalek_manager !== "All" && m['ZAMALEK MANAGER'] !== selectedFilters.zamalek_manager) return false;
            if (selectedFilters.referee !== "All" && m['REFEREE'] !== selectedFilters.referee) return false;
            if (selectedFilters.round !== "All" && m['ROUND'] !== selectedFilters.round) return false;
            if (selectedFilters.han !== "All" && m['H-A-N'] !== selectedFilters.han) return false;
            if (selectedFilters.stad !== "All" && m['STAD'] !== selectedFilters.stad) return false;
            if (selectedFilters.wdl !== "All" && m['W-D-L'] !== selectedFilters.wdl) return false;
            if (selectedFilters.clean_sheet !== "All" && m['CLEAN SHEET'] !== selectedFilters.clean_sheet) return false;

            return true;
        });

        onFilter(filtered);
        onClose();
    };

    const handleFilterChange = (key, value) => {
        setSelectedFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        const cleared = {
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
        };
        setSelectedFilters(cleared);
        onFilter(data);
    };

    if (!isOpen) return null;

    const filterConfigs = [
        { key: "champion_system", label: "CHAMPION SYSTEM", options: filterOptions.champion_systems },
        { key: "champion", label: "CHAMPION", options: filterOptions.champions },
        { key: "year", label: "YEAR", options: filterOptions.years },
        { key: "season", label: "SEASON", options: filterOptions.seasons },
        { key: "round", label: "ROUND", options: filterOptions.rounds },
        { key: "stad", label: "STADIUM", options: filterOptions.stads },
        { key: "ahly_manager", label: "AHLY MANAGER", options: filterOptions.ahly_managers },
        { key: "zamalek_manager", label: "ZAMALEK MANAGER", options: filterOptions.zamalek_managers },
        { key: "referee", label: "REFEREE", options: filterOptions.referees },
        { key: "han", label: "H-A-N", options: filterOptions.han },
        { key: "wdl", label: "W-D-L", options: filterOptions.wdl },
        { key: "clean_sheet", label: "CLEAN SHEET", options: filterOptions.clean_sheets }
    ];

    return (
        <div className="avz-filter-overlay" onClick={onClose}>
            <div className="avz-filter-container" onClick={e => e.stopPropagation()}>
                <div className="avz-filter-header">
                    <div className="avz-filter-title">
                        DATABASE <span className="avz-gold-text">FILTERS</span>
                    </div>

                    <button className="avz-filter-close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="avz-filter-body">
                    <div className="avz-filter-grid">
                        {filterConfigs.map(config => (
                            <SearchableDropdown 
                                key={config.key}
                                label={config.label}
                                options={["All", ...(config.options || [])]}
                                value={selectedFilters[config.key]}
                                onChange={(val) => handleFilterChange(config.key, val)}
                            />
                        ))}
                    </div>
                </div>

                <div className="avz-filter-footer">
                    <button className="avz-filter-reset-btn" onClick={resetFilters}>RESET ALL</button>
                    <button className="avz-filter-apply-btn" onClick={handleApply}>APPLY FILTERS</button>
                </div>
            </div>
        </div>
    );
}
