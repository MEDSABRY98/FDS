"use client";

import { useMemo, useState } from "react";

export default function Referee_Dashboard_Module({
    stats,
    playerComps,
    selectedComps,
    setSelectedComps,
    isCompOpen,
    setIsCompOpen,
    seasonLimit,
    setSeasonLimit,
    sortedSeasons
}) {
    // 1. Filter Seasons based on limit
    const filteredSeasonsList = seasonLimit ? sortedSeasons.slice(0, parseInt(seasonLimit)) : sortedSeasons;

    // 2. Data Prep for Competitions (Filtered)
    const filteredCompKeys = playerComps.filter(c => selectedComps.length === 0 || selectedComps.includes(c));

    // Aggregate data for Competition Performance
    const compPerformance = useMemo(() => {
        return filteredCompKeys.map(name => {
            const c = stats.compStats[name] || { matches: 0, wins: 0, draws: 0, losses: 0 };
            return {
                name,
                matches: c.matches,
                wins: c.wins,
                draws: c.draws,
                losses: c.losses
            };
        }).sort((a, b) => b.matches - a.matches);
    }, [stats, filteredCompKeys]);

    const maxValComp = useMemo(() => {
        return Math.max(...compPerformance.map(c => Math.max(c.wins, c.draws, c.losses, 1)), 1);
    }, [compPerformance]);

    // 3. Data Prep for Seasonal Performance
    const seasonalPerformance = useMemo(() => {
        return filteredSeasonsList.map(season => {
            const s = stats.seasonalStats[season] || { matches: 0, wins: 0, draws: 0, losses: 0 };
            return {
                season,
                wins: s.wins,
                draws: s.draws,
                losses: s.losses
            };
        });
    }, [stats, filteredSeasonsList]);

    const maxValSeason = useMemo(() => {
        return Math.max(...seasonalPerformance.map(s => Math.max(s.wins, s.draws, s.losses, 1)), 1);
    }, [seasonalPerformance]);

    return (
        <div className="dashboard-grid fade-in">
            {/* NEW CENTERED TOP FILTERS BAR */}
            <div className="dashboard-filters-container" style={{
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '40px',
                marginBottom: '20px',
                padding: '20px',
                background: '#fff',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid #f0f0f0',
                flexWrap: 'wrap'
            }}>
                {/* Tournament Multi-Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'Space Mono', color: '#999', letterSpacing: '1px' }}>COMPETITIONS:</span>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsCompOpen(!isCompOpen)}
                            style={{
                                padding: '12px 25px',
                                borderRadius: '12px',
                                border: '1px solid #eee',
                                background: '#f9f9f9',
                                fontFamily: 'Space Mono',
                                fontSize: '11px',
                                fontWeight: '800',
                                color: 'var(--player-dark)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                transition: '0.3s',
                                minWidth: '240px',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span>{selectedComps.length === 0 ? "ALL COMPETITIONS" : `${selectedComps.length} SELECTED`}</span>
                            <span style={{ transform: isCompOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
                        </button>

                        {isCompOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#fff',
                                borderRadius: '15px',
                                boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                                border: '1px solid #eee',
                                zIndex: 100,
                                marginTop: '8px',
                                padding: '15px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                <div
                                    onClick={() => setSelectedComps([])}
                                    style={{
                                        padding: '8px 10px',
                                        fontSize: '11px',
                                        fontFamily: 'Space Mono',
                                        fontWeight: '800',
                                        color: 'var(--player-gold)',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0',
                                        marginBottom: '10px'
                                    }}
                                >
                                    SELECT ALL
                                </div>
                                {playerComps.map(comp => (
                                    <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', cursor: 'pointer', borderRadius: '8px', transition: '0.2s' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedComps.includes(comp)}
                                            onChange={() => {
                                                if (selectedComps.includes(comp)) {
                                                    setSelectedComps(selectedComps.filter(c => c !== comp));
                                                } else {
                                                    setSelectedComps([...selectedComps, comp]);
                                                }
                                            }}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--player-gold)' }}
                                        />
                                        <span style={{ fontSize: '11px', fontFamily: 'Space Mono', fontWeight: '700', textTransform: 'uppercase' }}>{comp}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '30px', background: '#eee' }}></div>

                {/* Seasonal Filter Input */}
                <div className="seasonal-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'Space Mono', color: '#999', letterSpacing: '1px' }}>VIEW LAST:</span>
                    <input
                        type="number"
                        value={seasonLimit}
                        onChange={(e) => setSeasonLimit(e.target.value)}
                        placeholder="All"
                        style={{
                            width: '80px',
                            padding: '10px 15px',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            fontFamily: 'Space Mono',
                            fontSize: '16px',
                            fontWeight: '800',
                            textAlign: 'center',
                            outline: 'none',
                            background: '#f9f9f9',
                            color: 'var(--player-gold)'
                        }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'Space Mono', color: '#999', letterSpacing: '1px' }}>SEASONS</span>
                </div>
            </div>

            {/* 1. COMPETITION PERFORMANCE (W-D-L) */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>COMPETITION RECORD (W-D-L)</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <LegendItem color="#27ae60" label="WINS" />
                    <LegendItem color="#e67e22" label="DRAWS" />
                    <LegendItem color="#e74c3c" label="LOSSES" />
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '420px', alignItems: 'flex-end', gap: '60px', paddingBottom: '30px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {compPerformance.map(comp => (
                        <div key={comp.name} className="chart-item-comp" style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                            <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', position: 'relative', overflow: 'visible' }}>
                                <Bar value={comp.wins} max={maxValComp} color="#27ae60" label="WINS" />
                                <Bar value={comp.draws} max={maxValComp} color="#e67e22" label="DRAWS" />
                                <Bar value={comp.losses} max={maxValComp} color="#e74c3c" label="LOSSES" />
                            </div>
                            <div style={{ marginTop: '20px', fontSize: '14px', fontWeight: '900', fontFamily: 'Space Mono', color: '#000', textTransform: 'uppercase', lineHeight: '1.2' }}>{comp.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. SEASONAL PERFORMANCE (W-D-L) */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>SEASONAL RECORD (W-D-L)</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <LegendItem color="#27ae60" label="WINS" />
                    <LegendItem color="#e67e22" label="DRAWS" />
                    <LegendItem color="#e74c3c" label="LOSSES" />
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '420px', alignItems: 'flex-end', gap: '60px', paddingBottom: '30px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {seasonalPerformance.map(s => (
                        <div key={s.season} className="chart-item-season" style={{ flex: 1, minWidth: '160px', textAlign: 'center' }}>
                            <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '14px', position: 'relative', overflow: 'visible' }}>
                                <Bar value={s.wins} max={maxValSeason} color="#27ae60" label="WINS" />
                                <Bar value={s.draws} max={maxValSeason} color="#e67e22" label="DRAWS" />
                                <Bar value={s.losses} max={maxValSeason} color="#e74c3c" label="LOSSES" />
                            </div>
                            <div style={{ marginTop: '20px', fontSize: '15px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111' }}>{s.season}</div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .dashboard-header-modern .history-title { 
                    text-transform: uppercase; 
                    font-size: 26px; 
                    font-family: 'Bebas Neue'; 
                    color: var(--player-gold); 
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: color }}></div>
            <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>{label}</span>
        </div>
    );
}

function Bar({ value, max, color, label }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px', color: color, fontFamily: 'Space Mono' }}>{value}</span>
            <div className="bar-single" style={{ height: `${(value / max) * 85}%`, width: '24px', background: color, borderRadius: '6px 6px 0 0' }} title={`${label ? label + ': ' : ''}${value}`}></div>
        </div>
    );
}
