"use client";

import React, { useMemo, useState } from 'react';
import NoData_db from '../lib/NoData_db';

export default function PlayerTimingTable({ stats }) {
    const [viewType, setViewType] = useState('goals'); // 'goals' | 'assists'
    
    const timingData = viewType === 'goals' ? (stats.statsByMinute || {}) : (stats.assistsByMinute || {});
    
    // Convert to sorted array for display
    const sortedMinutes = useMemo(() => {
        if (!timingData) return [];
        return Object.entries(timingData)
            .filter(([min]) => min && min.trim() !== '' && min !== '?')
            .sort((a, b) => {
                // Handle injury time like "45+2" or "90+1"
                const parseMin = (m) => {
                    if (m.includes('+')) {
                        const parts = m.split('+');
                        return parseInt(parts[0]) + (parseInt(parts[1]) / 100);
                    }
                    return parseInt(m);
                };
                return parseMin(a[0]) - parseMin(b[0]);
            });
    }, [timingData]);

    // Grouping by periods
    const periods = useMemo(() => {
        const p = {
            "1-15": 0,
            "16-30": 0,
            "31-45": 0,
            "45+": 0,
            "46-60": 0,
            "61-75": 0,
            "76-90": 0,
            "90+": 0,
            "?": 0
        };

        if (!timingData) return p;

        Object.entries(timingData).forEach(([min, count]) => {
            // Handle invalid or unknown minutes
            if (!min || min.trim() === '' || min === '?') {
                p["?"] += count;
                return;
            }

            if (min.includes('+')) {
                const parts = min.split('+');
                const base = parseInt(parts[0]);
                if (isNaN(base)) {
                    p["?"] += count;
                    return;
                }

                if (base >= 90) p["90+"] += count;
                else if (base >= 45) p["45+"] += count;
                else p["?"] += count;
            } else {
                const m = parseInt(min);
                if (isNaN(m)) {
                    p["?"] += count;
                    return;
                }

                if (m <= 15) p["1-15"] += count;
                else if (m <= 30) p["16-30"] += count;
                else if (m <= 45) p["31-45"] += count;
                else if (m <= 60) p["46-60"] += count;
                else if (m <= 75) p["61-75"] += count;
                else if (m <= 90) p["76-90"] += count;
                else p["90+"] += count;
            }
        });
        return p;
    }, [timingData]);

    const maxPeriodCount = Math.max(...Object.values(periods), 1);

    return (
        <div className="timing-analysis-container fade-in">
            <div className="timing-header-section">
                <h2 className="timing-title">
                    {viewType === 'goals' ? 'SCORING' : 'PLAYMAKING'} <span className="gold-text">TIMING ANALYSIS</span>
                </h2>
                
                {/* Sub-Tabs Navigation */}
                <div className="timing-sub-tabs">
                    <button 
                        className={`sub-tab-btn ${viewType === 'goals' ? 'active' : ''}`}
                        onClick={() => setViewType('goals')}
                    >
                        GOALS
                    </button>
                    <button 
                        className={`sub-tab-btn ${viewType === 'assists' ? 'active' : ''}`}
                        onClick={() => setViewType('assists')}
                    >
                        ASSISTS
                    </button>
                </div>
            </div>

            {Object.keys(timingData || {}).length === 0 ? (
                <NoData_db message={`NO ${viewType === 'goals' ? 'GOAL' : 'ASSIST'} TIMING DATA RECORDED`} />
            ) : (
                <>
                    <div className="periods-grid">
                        {Object.entries(periods).map(([period, count]) => (
                            <div key={period} className={`period-card ${period === '?' ? 'unknown-period' : ''}`}>
                                <div className="period-bar-wrap">
                                    <div 
                                        className="period-bar-fill" 
                                        style={{ 
                                            height: `${(count / maxPeriodCount) * 100}%`,
                                            background: period === '?' ? 'linear-gradient(180deg, #666 0%, #333 100%)' : ''
                                        }}
                                    >
                                        {count > 0 && <span className="bar-val">{count}</span>}
                                    </div>
                                </div>
                                <div className="period-label">{period}</div>
                            </div>
                        ))}
                    </div>

                    <div className="detailed-minutes-section">
                        <h3 className="section-subtitle">DETAILED MINUTE-BY-MINUTE</h3>
                        <div className="minutes-matrix">
                            {sortedMinutes.map(([min, count]) => (
                                <div key={min} className="minute-box">
                                    <span className="m-val">{min}'</span>
                                    <span className="m-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .timing-analysis-container {
                    padding: 40px;
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                }
                .timing-header-section {
                    text-align: center;
                    margin-bottom: 50px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }
                .timing-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 36px;
                    letter-spacing: 2px;
                    margin: 0;
                }
                .gold-text { color: var(--player-gold); }

                .timing-sub-tabs {
                    display: flex;
                    gap: 10px;
                    background: #f8f8f8;
                    padding: 5px;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    width: 300px;
                }
                .sub-tab-btn {
                    flex: 1;
                    padding: 10px 0;
                    border-radius: 8px;
                    border: none;
                    font-family: 'Space Mono';
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: 0.3s;
                    background: transparent;
                    color: #999;
                    text-align: center;
                }
                .sub-tab-btn.active {
                    background: #fff;
                    color: var(--player-gold);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }

                .periods-grid {
                    display: grid;
                    grid-template-columns: repeat(9, 1fr);
                    gap: 15px;
                    height: 250px;
                    margin-bottom: 60px;
                    padding-bottom: 30px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .period-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                }
                .period-bar-wrap {
                    width: 100%;
                    height: 100%;
                    background: #f8f8f8;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .period-bar-fill {
                    width: 100%;
                    background: linear-gradient(180deg, var(--player-gold) 0%, #c1994c 100%);
                    border-radius: 6px 6px 0 0;
                    transition: height 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .bar-val {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 26px;
                    font-weight: 800;
                    color: #000;
                    text-shadow: 0 1px 2px rgba(255,255,255,0.3);
                }
                .period-label {
                    margin-top: 15px;
                    font-family: 'Space Mono', monospace;
                    font-size: 17px;
                    font-weight: 800;
                    color: #555;
                    letter-spacing: 1px;
                }

                .section-subtitle {
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 800;
                    font-size: 14px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-bottom: 25px;
                    color: #333;
                    text-align: center;
                }

                .minutes-matrix {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: center;
                }
                .minute-box {
                    background: #0a0a0a;
                    width: 100px;
                    height: 100px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid rgba(201, 168, 76, 0.15);
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                }
                .minute-box:hover {
                    transform: translateY(-10px) scale(1.05);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    border-color: var(--player-gold);
                    z-index: 2;
                }
                .minute-box .m-val {
                    color: rgba(255,255,255,0.7);
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 36px;
                    line-height: 0.9;
                    margin-bottom: 2px;
                }
                .minute-box .m-count {
                    color: var(--player-gold);
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 36px;
                    line-height: 0.9;
                }

                @media (max-width: 900px) {
                    .periods-grid { grid-template-columns: repeat(4, 1fr); height: auto; }
                    .period-bar-wrap { height: 120px; }
                }
            `}</style>
        </div>
    );
}
