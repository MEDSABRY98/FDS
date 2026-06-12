"use client";

import React, { useState, useEffect } from 'react';
import './Loading_db.css';

const Loading_db = ({ inline = false }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    return 95;
                }
                
                let inc = 0;
                if (prev < 60) {
                    // Fast initial progress
                    inc = Math.floor(Math.random() * 10) + 5;
                } else if (prev < 85) {
                    // Slow down
                    inc = Math.floor(Math.random() * 4) + 1;
                } else if (prev < 93) {
                    // Slow down even more
                    inc = Math.floor(Math.random() * 2) + 0.5;
                } else {
                    // Creep forward slowly
                    inc = Math.random() > 0.8 ? 0.1 : 0;
                }
                
                // Keep percentage clean (one decimal place if not integer, or just round it)
                const nextVal = prev + inc;
                return nextVal >= 95 ? 95 : parseFloat(nextVal.toFixed(1));
            });
        }, 100);
        
        return () => clearInterval(interval);
    }, []);

    // Display rounded value for visual simplicity
    const displayProgress = Math.floor(progress);

    return (
        <div className={`loading-container ${inline ? 'inline' : ''}`}>
            <div className="loading-logo">
                DATABASE <span>LOADING...</span>
            </div>

            <div className="loading-spinner-container">
                <div className="loading-spinner-outer"></div>
                <div className="loading-spinner-inner"></div>
                <div className="loading-percentage">{displayProgress}%</div>
            </div>
        </div>
    );
};

export default Loading_db;
