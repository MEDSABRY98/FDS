"use client";

import React from 'react';
import './NoData_db.css';

/**
 * Standardized No Data component for the application.
 * Supports rendering as a standalone div or a table row.
 * 
 * @param {string} message - Custom message to display.
 * @param {boolean} isTable - Whether to render as a <tr> (default: false).
 * @param {number} colSpan - colSpan for the table cell (default: 1).
 * @param {string} height - Optional height for the container.
 * @param {React.ReactNode} icon - Optional custom icon.
 */
const NoData_db = ({ 
    message = "NO DATA RECORDS FOUND", 
    isTable = false, 
    colSpan = 1, 
    height = "auto",
    icon = null
}) => {
    
    const content = (
        <div className="nodata-premium-container fade-in-up" style={{ minHeight: height }}>
            <div className="nodata-icon-wrapper">
                <div className="nodata-icon-bg"></div>
                {icon ? (
                    <div className="nodata-main-icon">{icon}</div>
                ) : (
                    <svg 
                        className="nodata-main-icon" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M10 14l2-2m0 0l2 2m-2-2v4" 
                        />
                    </svg>
                )}
            </div>
            
            <div className="nodata-content">
                <div className="nodata-title">Empty Results</div>
                <p className="nodata-message">{message}</p>
            </div>
            
            <div className="nodata-decoration"></div>
        </div>
    );

    if (isTable) {
        return (
            <tr className="nodata-table-row">
                <td colSpan={colSpan}>
                    {content}
                </td>
            </tr>
        );
    }

    return content;
};

export default NoData_db;
