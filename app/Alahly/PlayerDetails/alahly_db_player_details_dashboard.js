"use client";

export default function PlayerDashboard({
    stats,
    playerComps,
    selectedComps,
    setSelectedComps,
    isCompOpen,
    setIsCompOpen,
    seasonLimit,
    setSeasonLimit,
    sortedSeasons,
    maxVal
}) {
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

            {/* Tournament Chart - Full Width Card */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>TOURNAMENT PERFORMANCE</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--player-gold)' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>APPS</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#27ae60' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>GOALS</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#2980b9' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>ASSISTS</span>
                    </div>
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {Object.keys(stats.compStats).sort().map(comp => {
                        const maxCompVal = Math.max(...Object.values(stats.compStats).map(c => Math.max(c.apps, c.goals, c.assists)), 1);
                        return (
                            <div key={comp} className="chart-item-season" style={{ flex: 1, minWidth: '180px', textAlign: 'center' }}>
                                <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', position: 'relative', overflow: 'visible' }}>
                                    {/* Apps Bar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: 'var(--player-gold)', fontFamily: 'Space Mono' }}>{stats.compStats[comp].apps}</span>
                                        <div className="bar-single" style={{ height: `${(stats.compStats[comp].apps / maxCompVal) * 85}%`, width: '22px', background: 'var(--player-gold)', borderRadius: '6px 6px 0 0' }} title={`Apps: ${stats.compStats[comp].apps}`}></div>
                                    </div>
                                    {/* Goals Bar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: '#27ae60', fontFamily: 'Space Mono' }}>{stats.compStats[comp].goals}</span>
                                        <div className="bar-single" style={{ height: `${(stats.compStats[comp].goals / maxCompVal) * 85}%`, width: '22px', background: '#27ae60', borderRadius: '6px 6px 0 0' }} title={`Goals: ${stats.compStats[comp].goals}`}></div>
                                    </div>
                                    {/* Assists Bar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: '#2980b9', fontFamily: 'Space Mono' }}>{stats.compStats[comp].assists}</span>
                                        <div className="bar-single" style={{ height: `${(stats.compStats[comp].assists / maxCompVal) * 85}%`, width: '22px', background: '#2980b9', borderRadius: '6px 6px 0 0' }} title={`Assists: ${stats.compStats[comp].assists}`}></div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', fontSize: '15px', fontWeight: '900', fontFamily: 'Space Mono', color: '#000', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{comp}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Seasonal Chart - Full Width Card */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '30px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>SEASONAL PERFORMANCE</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--player-gold)' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>APPS</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#27ae60' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>GOALS</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#2980b9' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>ASSISTS</span>
                    </div>
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {sortedSeasons.map(season => (
                        <div key={season} className="chart-item-season" style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                            <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', position: 'relative', overflow: 'visible' }}>
                                {/* Apps Bar */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px', color: 'var(--player-gold)', fontFamily: 'Space Mono' }}>{stats.seasonalStats[season].apps}</span>
                                    <div className="bar-single" style={{ height: `${(stats.seasonalStats[season].apps / maxVal) * 85}%`, width: '28px', background: 'var(--player-gold)', borderRadius: '8px 8px 0 0' }} title={`Apps: ${stats.seasonalStats[season].apps}`}></div>
                                </div>
                                {/* Goals Bar */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px', color: '#27ae60', fontFamily: 'Space Mono' }}>{stats.seasonalStats[season].goals}</span>
                                    <div className="bar-single" style={{ height: `${(stats.seasonalStats[season].goals / maxVal) * 85}%`, width: '28px', background: '#27ae60', borderRadius: '8px 8px 0 0' }} title={`Goals: ${stats.seasonalStats[season].goals}`}></div>
                                </div>
                                {/* Assists Bar */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px', color: '#2980b9', fontFamily: 'Space Mono' }}>{stats.seasonalStats[season].assists}</span>
                                    <div className="bar-single" style={{ height: `${(stats.seasonalStats[season].assists / maxVal) * 85}%`, width: '28px', background: '#2980b9', borderRadius: '8px 8px 0 0' }} title={`Assists: ${stats.seasonalStats[season].assists}`}></div>
                                </div>
                            </div>
                            <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111', whiteSpace: 'nowrap' }}>{season}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Penalties By Tournament - Full Width Card */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>PENALTIES BY TOURNAMENT</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#27ae60' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>SCORED</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#e74c3c' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333', letterSpacing: '1px' }}>MISSED</span>
                    </div>
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {Object.keys(stats.compStats).sort().map(comp => {
                        const c = stats.compStats[comp];
                        const allCompVals = Object.values(stats.compStats);
                        const maxCompPenVal = Math.max(...allCompVals.map(v => Math.max(v.penGoals || 0, v.penMissed || 0)), 1);

                        if (!c || ((c.penGoals || 0) === 0 && (c.penMissed || 0) === 0)) return null;

                        return (
                            <div key={comp} className="chart-item-season" style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
                                <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', position: 'relative', overflow: 'visible' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: '#27ae60', fontFamily: 'Space Mono' }}>{c.penGoals || 0}</span>
                                        <div className="bar-single" style={{ height: `${((c.penGoals || 0) / maxCompPenVal) * 280}px`, minHeight: (c.penGoals > 0 ? '10px' : '0'), width: '28px', background: '#27ae60', borderRadius: '6px 6px 0 0' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: '#e74c3c', fontFamily: 'Space Mono' }}>{c.penMissed || 0}</span>
                                        <div className="bar-single" style={{ height: `${((c.penMissed || 0) / maxCompPenVal) * 280}px`, minHeight: (c.penMissed > 0 ? '10px' : '0'), width: '28px', background: '#e74c3c', borderRadius: '6px 6px 0 0' }}></div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', fontSize: '15px', fontWeight: '900', fontFamily: 'Space Mono', color: '#000', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{comp}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Penalties By Season - Full Width Card */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                <div className="dashboard-header-modern" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="history-title" style={{ marginBottom: 0, paddingLeft: '20px' }}>PENALTIES BY SEASON</div>
                </div>

                <div className="chart-legend" style={{ display: 'flex', gap: '35px', marginBottom: '35px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#27ae60' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333' }}>SCORED</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#e74c3c' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'Space Mono', color: '#333' }}>MISSED</span>
                    </div>
                </div>

                <div className="seasonal-chart-container" style={{ display: 'flex', height: '400px', alignItems: 'flex-end', gap: '50px', paddingBottom: '20px', paddingTop: '50px', overflowX: 'auto', overflowY: 'visible' }}>
                    {sortedSeasons.map(season => {
                        const s = stats.seasonalStats[season];
                        const seasonsWithData = sortedSeasons.filter(k => stats.seasonalStats[k]);
                        const maxPenVal = Math.max(...seasonsWithData.map(key => Math.max(stats.seasonalStats[key].penGoals || 0, stats.seasonalStats[key].penMissed || 0)), 1);

                        if (!s || ((s.penGoals || 0) === 0 && (s.penMissed || 0) === 0)) return null;

                        return (
                            <div key={season} className="chart-item-season" style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                                <div className="bar-group" style={{ display: 'flex', height: '320px', alignItems: 'flex-end', justifyContent: 'center', gap: '20px', position: 'relative', overflow: 'visible' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px', color: '#27ae60', fontFamily: 'Space Mono' }}>{s.penGoals || 0}</span>
                                        <div className="bar-single" style={{ height: `${((s.penGoals || 0) / maxPenVal) * 280}px`, minHeight: (s.penGoals > 0 ? '10px' : '0'), width: '32px', background: '#27ae60', borderRadius: '8px 8px 0 0' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px', color: '#e74c3c', fontFamily: 'Space Mono' }}>{s.penMissed || 0}</span>
                                        <div className="bar-single" style={{ height: `${((s.penMissed || 0) / maxPenVal) * 280}px`, minHeight: (s.penMissed > 0 ? '10px' : '0'), width: '32px', background: '#e74c3c', borderRadius: '8px 8px 0 0' }}></div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: '900', fontFamily: 'Space Mono', color: '#111' }}>{season}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
