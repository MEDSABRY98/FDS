"use client";

import React from 'react';
import './Loading_db.css';

const Loading_db = ({ title = "AL AHLY", subtitle = "DATABASE", message = "INITIALIZING SYSTEM" }) => {
    return (
        <div className="loading-container">
            <div className="loading-logo">
                {title} <span>{subtitle}</span>
            </div>
            
            <div className="loading-spinner-container">
                <div className="loading-spinner-outer"></div>
                <div className="loading-spinner-inner"></div>
            </div>
            
            <div className="loading-text">
                <div className="loading-dot"></div>
                {message}
                <div className="loading-dot"></div>
            </div>
        </div>
    );
};

export default Loading_db;
