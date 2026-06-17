"use client";

import React, { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DropDownList_db.css';

const MENU_ESTIMATED_HEIGHT = 320;
const PORTAL_Z_INDEX = 10050;

/**
 * Premium Dropdown List Component with search support
 * @param {Array} options - Array of { value, label }
 * @param {any} value - Current selected value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Text shown when nothing is selected
 * @param {boolean} searchable - Whether to show a search box inside the menu
 * @param {boolean} allowCustom - Allow typing values not in the options list
 * @param {string} className - Optional extra classes
 */
const DropDownList_db = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    searchable = false,
    allowCustom = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);
    const hasValue = value !== null && value !== undefined && String(value).length > 0;
    const displayLabel = selectedOption
        ? selectedOption.label
        : (hasValue ? String(value) : placeholder);

    const filteredOptions = useMemo(() => {
        const typedTerm = allowCustom ? String(value || "").trim() : "";
        const menuTerm = searchable ? String(searchTerm || "").trim() : "";
        const term = typedTerm || menuTerm;
        if (!term) return options;
        const lower = term.toLowerCase();
        return options.filter(opt =>
            String(opt.label || "").toLowerCase().includes(lower)
        );
    }, [options, searchTerm, searchable, allowCustom, value]);

    const updateMenuPosition = useCallback(() => {
        const node = wrapperRef.current;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const shouldOpenUpward = spaceBelow < MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow;
        setOpenUpward(shouldOpenUpward);

        const availableSpace = shouldOpenUpward ? spaceAbove - 20 : spaceBelow - 20;
        const maxMenuHeight = Math.max(120, Math.min(320, availableSpace));

        setMenuStyle({
            position: "fixed",
            left: `${Math.max(8, rect.left)}px`,
            width: `${rect.width}px`,
            zIndex: PORTAL_Z_INDEX + 1,
            maxHeight: `${maxMenuHeight}px`,
            ...(shouldOpenUpward
                ? { bottom: `${window.innerHeight - rect.top + 10}px` }
                : { top: `${rect.bottom + 10}px` }),
        });
    }, []);

    useLayoutEffect(() => {
        if (!isOpen) {
            setOpenUpward(false);
            setMenuStyle(null);
            return undefined;
        }

        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen, filteredOptions.length, updateMenuPosition]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !allowCustom) return undefined;

        const handleClickOutside = (event) => {
            const target = event.target;
            if (wrapperRef.current?.contains(target)) return;
            if (target instanceof Element && target.closest(".dropdown-menu-db--portal")) return;
            closeMenu();
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, allowCustom]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleCustomInputChange = (event) => {
        onChange(event.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const toggleMenu = (event) => {
        event?.stopPropagation();
        setIsOpen((open) => !open);
    };

    const closeMenu = () => {
        setIsOpen(false);
        setSearchTerm("");
    };

    const showMenuSearch = searchable && !allowCustom;

    const menuContent = (
        <>
            {!allowCustom && (
                <div
                    className="dropdown-overlay-db dropdown-overlay-db--portal"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}
            <div
                className={`dropdown-menu-db dropdown-menu-db--portal ${openUpward ? "open-upward" : ""}`}
                style={menuStyle || undefined}
            >
                {showMenuSearch && (
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
                                key={`${opt.value}-${i}`}
                                className={`dropdown-opt-db ${opt.value === value ? 'active' : ''}`}
                                onClick={() => handleSelect(opt.value)}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div className="dropdown-no-results-db">
                            {allowCustom ? "No suggestions — type your own value" : "No results found"}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div
            ref={wrapperRef}
            className={`dropdown-db ${isOpen ? 'is-open' : ''} ${openUpward ? 'open-upward' : ''} ${className}`}
        >
            {allowCustom ? (
                <div className="dropdown-trigger-db dropdown-trigger-db--editable">
                    <input
                        type="text"
                        className="dropdown-input-db"
                        value={value ?? ""}
                        onChange={handleCustomInputChange}
                        placeholder={placeholder}
                    />
                    <button
                        type="button"
                        className="dropdown-chevron-btn-db"
                        onClick={toggleMenu}
                        aria-label="Toggle suggestions"
                    >
                        <span className="dropdown-chevron-db">⌄</span>
                    </button>
                </div>
            ) : (
                <div className="dropdown-trigger-db" onClick={() => setIsOpen(!isOpen)}>
                    <span className={`current-label-db ${hasValue && !selectedOption ? "current-label-db--fallback" : ""}`}>
                        {displayLabel}
                    </span>
                    <div className="dropdown-chevron-db">⌄</div>
                </div>
            )}

            {isOpen && typeof document !== "undefined" && menuStyle
                ? createPortal(menuContent, document.body)
                : null}
        </div>
    );
};

export default DropDownList_db;
