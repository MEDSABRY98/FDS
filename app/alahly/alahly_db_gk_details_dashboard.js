"use client";

import { useState } from "react";

export default function GK_Dashboard_Component_Unique({
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
    // Apply Season Limit
    const filteredSeasons = seasonLimit ? sortedSeasons.slice(0, parseInt(seasonLimit)) : sortedSeasons;

    // 1. Data Prep for Competitions
    const compKeys = Object.keys(stats.compStats || {}).sort((a, b) => stats.compStats[b].matches - stats.compStats[a].matches);
    const maxValComp = Math.max(...compKeys.map(c => Math.max(stats.compStats[c].matches, stats.compStats[c].gc, stats.compStats[c].cs)), 1);

    // 2. Data Prep for Seasons
    const maxValSeason = Math.max(...filteredSeasons.map(s => Math.max(stats.seasonalStats[s].matches, stats.seasonalStats[s].gc, stats.seasonalStats[s].cs)), 1);

    // 3. Data Prep for Penalties by Competition
    const compsWithPens = compKeys.filter(c => (stats.compStats[c].pr || 0) > 0 || (stats.compStats[c].ps || 0) > 0);
    const maxValPenComp = Math.max(...compKeys.map(c => Math.max(stats.compStats[c].pr || 0, stats.compStats[c].ps || 0)), 1);

    // 4. Data Prep for Penalties by Season
    const seasonsWithPens = filteredSeasons.filter(s => (stats.seasonalStats[s].pr || 0) > 0 || (stats.seasonalStats[s].ps || 0) > 0);
    const maxValPenSeason = Math.max(...filteredSeasons.map(s => Math.max(stats.seasonalStats[s].pr || 0, stats.seasonalStats[s].ps || 0)), 1);

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

            {/* 1. COMPETITIONS PERFORMANCE CHART */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>COMPETITIONS PERFORMANCE</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <LegendItem color="var(--player-gold)" label="APPS" />
                    <LegendItem color="#2ecc71" label="CLEAN SHEETS" />
                    <LegendItem color="#e74c3c" label="CONCEDED" />
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {compKeys.map(comp => {
                        const c = stats.compStats[comp];
                        return (
                            <div key={comp} className="chart-item-comp" style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                                <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', position: 'relative', overflow: 'visible' }}>
                                    <Bar value={c.matches} max={maxValComp} color="var(--player-gold)" />
                                    <Bar value={c.cs} max={maxValComp} color="#2ecc71" />
                                    <Bar value={c.gc} max={maxValComp} color="#e74c3c" />
                                </div>
                                <div style={{ marginTop: '20px', fontSize: '14px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{comp}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. SEASONAL PERFORMANCE CHART */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>SEASONAL PERFORMANCE</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <LegendItem color="var(--player-gold)" label="APPS" />
                    <LegendItem color="#2ecc71" label="CLEAN SHEETS" />
                    <LegendItem color="#e74c3c" label="CONCEDED" />
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {filteredSeasons.map(season => {
                        const s = stats.seasonalStats[season];
                        return (
                            <div key={season} className="chart-item-season" style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                                <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', position: 'relative', overflow: 'visible' }}>
                                    <Bar value={s.matches} max={maxValSeason} color="var(--player-gold)" />
                                    <Bar value={s.cs} max={maxValSeason} color="#2ecc71" />
                                    <Bar value={s.gc} max={maxValSeason} color="#e74c3c" />
                                </div>
                                <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111' }}>{season}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. PENALTIES PERFORMANCE CHART (By Competition) */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>PENALTIES BY TOURNAMENT</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <LegendItem color="#e74c3c" label="CONCEDED" />
                    <LegendItem color="#3498db" label="SAVED" />
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {compsWithPens.length === 0 ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '80px', opacity: 0.3 }}>NO PENALTY RECORDS FOUND FOR THIS GK (COMPETITIONS)</div>
                    ) : (
                        compsWithPens.map(comp => {
                            const c = stats.compStats[comp];
                            return (
                                <div key={comp} className="chart-item-pen-comp" style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                                    <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', position: 'relative', overflow: 'visible' }}>
                                        <Bar value={c.pr} max={maxValPenComp} color="#e74c3c" label="CONC" />
                                        <Bar value={c.ps} max={maxValPenComp} color="#3498db" label="SAVED" />
                                    </div>
                                    <div style={{ marginTop: '20px', fontSize: '14px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{comp}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 4. PENALTIES PERFORMANCE CHART (By Season) */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>PENALTIES BY SEASON</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <LegendItem color="#e74c3c" label="CONCEDED" />
                    <LegendItem color="#3498db" label="SAVED" />
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {seasonsWithPens.length === 0 ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '80px', opacity: 0.3 }}>NO PENALTY RECORDS FOUND FOR THIS GK (SEASONS)</div>
                    ) : (
                        seasonsWithPens.map(season => {
                            const s = stats.seasonalStats[season];
                            return (
                                <div key={season} className="chart-item-pen-season" style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                                    <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', position: 'relative', overflow: 'visible' }}>
                                        <Bar value={s.pr} max={maxValPenSeason} color="#e74c3c" label="CONC" />
                                        <Bar value={s.ps} max={maxValPenSeason} color="#3498db" label="SAVED" />
                                    </div>
                                    <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111' }}>{season}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
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
            <span style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px', color: color, fontFamily: 'Space Mono' }}>{value}</span>
            <div className="bar-single" style={{ height: `${(value / max) * 85}%`, width: '28px', background: color, borderRadius: '8px 8px 0 0' }} title={`${label ? label + ': ' : ''}${value}`}></div>
        </div>
    );
}
