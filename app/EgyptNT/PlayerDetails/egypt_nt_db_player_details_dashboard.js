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
    const totalApps = stats.caps || 0;
    const totalGoals = stats.goals || 0;
    const totalAssists = stats.assists || 0;
    const totalGA = totalGoals + totalAssists;
    const totalPenGoals = stats.penGoals || 0;
    const totalPenMissed = stats.penMissed || 0;
    const totalPenSaved = stats.penSaved || 0;

    const totalContributions = totalGoals + totalAssists;
    const goalsPct = totalContributions > 0 ? (totalGoals / totalContributions) * 100 : 0;
    const assistsPct = totalContributions > 0 ? (totalAssists / totalContributions) * 100 : 0;

    // Filter comps that have data
    const activeComps = Object.keys(stats.compStats).sort();
    const maxCompVal = Math.max(...activeComps.map(comp => Math.max(stats.compStats[comp].apps, stats.compStats[comp].goals, stats.compStats[comp].assists)), 1);

    return (
        <div className="dashboard-grid fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: "10px 0" }}>
            <style>{`
                .kpi-card-modern {
                    background: #ffffff;
                    border: 1px solid #f0f0f0;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .kpi-card-modern:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.06);
                }
                .kpi-icon-wrap {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }
                .dashboard-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 30px;
                }
                @media (max-width: 1024px) {
                    .dashboard-grid-modern {
                        grid-template-columns: 1fr;
                    }
                }
                .chart-card-modern {
                    background: #ffffff;
                    border: 1px solid #f0f0f0;
                    border-radius: 20px;
                    padding: 25px;
                    box-shadow: 0 4px 25px rgba(0,0,0,0.02);
                }
                .chart-row-modern {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                    margin-bottom: 20px;
                    padding: 10px;
                    border-radius: 10px;
                    transition: background-color 0.2s ease;
                }
                .chart-row-modern:hover {
                    background-color: #fafafa;
                }
                .chart-label-modern {
                    width: 100%;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 15px;
                    font-weight: 800;
                    color: #111;
                    text-align: start;
                    white-space: normal;
                    letter-spacing: normal;
                }
                .chart-bars-wrap {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .bar-container-modern {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }
                .bar-track-modern {
                    flex: 1;
                    height: 10px;
                    background-color: rgba(0, 0, 0, 0.04);
                    border-radius: 5px;
                    overflow: hidden;
                    display: flex;
                }
                .bar-fill-modern {
                    height: 100%;
                    border-radius: 5px;
                    animation: growWidth 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    width: 0;
                }
                .bar-value-modern {
                    font-family: 'Outfit', 'Inter', 'Segoe UI', Tahoma, sans-serif;
                    font-size: 18px;
                    font-weight: 900;
                    min-width: 40px;
                    text-align: left;
                    letter-spacing: normal;
                }
                @keyframes growWidth {
                    from { width: 0; }
                    to { width: var(--target-width); }
                }
            `}</style>

            {/* FILTERS BAR */}
            <div className="dashboard-filters-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '40px',
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
                                fontFamily: 'Outfit, Inter, sans-serif',
                                fontSize: '12px',
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
                                        fontSize: '12px',
                                        fontFamily: 'Outfit, Inter, sans-serif',
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
                                        <span style={{ fontSize: '12px', fontFamily: 'Outfit, Inter, sans-serif', fontWeight: '700', textTransform: 'uppercase' }}>{comp}</span>
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

            {/* KPI CARDS ROW */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginTop: '10px',
                marginBottom: '10px'
            }}>
                <div className="kpi-card-modern">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(211, 30, 54, 0.08)', color: '#D31E36' }}>🏃‍♂️</div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999', fontWeight: '800', fontFamily: 'Space Mono', letterSpacing: '1px' }}>MATCHES</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#111', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{totalApps}</div>
                    </div>
                </div>
                <div className="kpi-card-modern">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(46, 204, 113, 0.08)', color: '#2ecc71' }}>⚽</div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999', fontWeight: '800', fontFamily: 'Space Mono', letterSpacing: '1px' }}>GOALS</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#111', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{totalGoals}</div>
                    </div>
                </div>
                <div className="kpi-card-modern">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(52, 152, 219, 0.08)', color: '#3498db' }}>👟</div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999', fontWeight: '800', fontFamily: 'Space Mono', letterSpacing: '1px' }}>ASSISTS</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#111', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{totalAssists}</div>
                    </div>
                </div>
                <div className="kpi-card-modern">
                    <div className="kpi-icon-wrap" style={{ background: 'rgba(201, 168, 76, 0.08)', color: 'var(--player-gold)' }}>⭐</div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#999', fontWeight: '800', fontFamily: 'Space Mono', letterSpacing: '1px' }}>GOALS + ASSISTS</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#111', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>{totalGA}</div>
                    </div>
                </div>
            </div>

            {/* CHARTS CONTAINER */}
            <div className="dashboard-grid-modern">
                {/* Tournament Performance - Vertical List of Horizontal Bars */}
                <div className="chart-card-modern">
                    <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'Space Mono', color: '#111', letterSpacing: '1px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>TOURNAMENT BREAKDOWN</span>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '10px' }}>
                            <span style={{ color: 'var(--player-gold)' }}>■ APPS</span>
                            <span style={{ color: '#2ecc71' }}>■ GOALS</span>
                            <span style={{ color: '#3498db' }}>■ ASSISTS</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {activeComps.map(comp => (
                            <div key={comp} className="chart-row-modern">
                                <div className="chart-label-modern" title={comp}>{comp}</div>
                                <div className="chart-bars-wrap">
                                    {/* Apps Bar */}
                                    <div className="bar-container-modern">
                                        <div className="bar-track-modern">
                                            <div className="bar-fill-modern" style={{
                                                '--target-width': `${(stats.compStats[comp].apps / maxCompVal) * 100}%`,
                                                background: 'var(--player-gold)'
                                            }} title={`Apps: ${stats.compStats[comp].apps}`} />
                                        </div>
                                        <span className="bar-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.compStats[comp].apps}</span>
                                    </div>
                                    {/* Goals Bar */}
                                    {stats.compStats[comp].goals > 0 && (
                                        <div className="bar-container-modern">
                                            <div className="bar-track-modern">
                                                <div className="bar-fill-modern" style={{
                                                    '--target-width': `${(stats.compStats[comp].goals / maxCompVal) * 100}%`,
                                                    background: '#2ecc71'
                                                }} title={`Goals: ${stats.compStats[comp].goals}`} />
                                            </div>
                                            <span className="bar-value-modern" style={{ color: '#2ecc71' }}>{stats.compStats[comp].goals}</span>
                                        </div>
                                    )}
                                    {/* Assists Bar */}
                                    {stats.compStats[comp].assists > 0 && (
                                        <div className="bar-container-modern">
                                            <div className="bar-track-modern">
                                                <div className="bar-fill-modern" style={{
                                                    '--target-width': `${(stats.compStats[comp].assists / maxCompVal) * 100}%`,
                                                    background: '#3498db'
                                                }} title={`Assists: ${stats.compStats[comp].assists}`} />
                                            </div>
                                            <span className="bar-value-modern" style={{ color: '#3498db' }}>{stats.compStats[comp].assists}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seasonal Performance - Vertical List of Horizontal Bars */}
                <div className="chart-card-modern">
                    <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'Space Mono', color: '#111', letterSpacing: '1px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>SEASONAL BREAKDOWN</span>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '10px' }}>
                            <span style={{ color: 'var(--player-gold)' }}>■ APPS</span>
                            <span style={{ color: '#2ecc71' }}>■ GOALS</span>
                            <span style={{ color: '#3498db' }}>■ ASSISTS</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {sortedSeasons.map(season => (
                            <div key={season} className="chart-row-modern">
                                <div className="chart-label-modern" style={{ direction: 'ltr' }}>{season}</div>
                                <div className="chart-bars-wrap">
                                    {/* Apps Bar */}
                                    <div className="bar-container-modern">
                                        <div className="bar-track-modern">
                                            <div className="bar-fill-modern" style={{
                                                '--target-width': `${(stats.seasonalStats[season].apps / maxVal) * 100}%`,
                                                background: 'var(--player-gold)'
                                            }} title={`Apps: ${stats.seasonalStats[season].apps}`} />
                                        </div>
                                        <span className="bar-value-modern" style={{ color: 'var(--player-gold)' }}>{stats.seasonalStats[season].apps}</span>
                                    </div>
                                    {/* Goals Bar */}
                                    {stats.seasonalStats[season].goals > 0 && (
                                        <div className="bar-container-modern">
                                            <div className="bar-track-modern">
                                                <div className="bar-fill-modern" style={{
                                                    '--target-width': `${(stats.seasonalStats[season].goals / maxVal) * 100}%`,
                                                    background: '#2ecc71'
                                                }} title={`Goals: ${stats.seasonalStats[season].goals}`} />
                                            </div>
                                            <span className="bar-value-modern" style={{ color: '#2ecc71' }}>{stats.seasonalStats[season].goals}</span>
                                        </div>
                                    )}
                                    {/* Assists Bar */}
                                    {stats.seasonalStats[season].assists > 0 && (
                                        <div className="bar-container-modern">
                                            <div className="bar-track-modern">
                                                <div className="bar-fill-modern" style={{
                                                    '--target-width': `${(stats.seasonalStats[season].assists / maxVal) * 100}%`,
                                                    background: '#3498db'
                                                }} title={`Assists: ${stats.seasonalStats[season].assists}`} />
                                            </div>
                                            <span className="bar-value-modern" style={{ color: '#3498db' }}>{stats.seasonalStats[season].assists}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PENALTIES & PROFILE GRID */}
            <div className="dashboard-grid-modern" style={{ marginTop: '0px' }}>
                {/* Penalties By Tournament - Horizontal Bar Chart */}
                <div className="chart-card-modern">
                    <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'Space Mono', color: '#111', letterSpacing: '1px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>PENALTIES BY TOURNAMENT</span>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '10px' }}>
                            <span style={{ color: '#2ecc71' }}>■ SCORED</span>
                            <span style={{ color: '#e74c3c' }}>■ MISSED</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {activeComps.map(comp => {
                            const c = stats.compStats[comp];
                            const maxPenVal = Math.max(...activeComps.map(k => Math.max(stats.compStats[k].penGoals || 0, stats.compStats[k].penMissed || 0)), 1);

                            if (!c || ((c.penGoals || 0) === 0 && (c.penMissed || 0) === 0)) return null;

                            return (
                                <div key={comp} className="chart-row-modern">
                                    <div className="chart-label-modern" title={comp}>{comp}</div>
                                    <div className="chart-bars-wrap">
                                        {c.penGoals > 0 && (
                                            <div className="bar-container-modern">
                                                <div className="bar-track-modern">
                                                    <div className="bar-fill-modern" style={{
                                                        '--target-width': `${(c.penGoals / maxPenVal) * 100}%`,
                                                        background: '#2ecc71'
                                                    }} />
                                                </div>
                                                <span className="bar-value-modern" style={{ color: '#2ecc71' }}>{c.penGoals}</span>
                                            </div>
                                        )}
                                        {c.penMissed > 0 && (
                                            <div className="bar-container-modern">
                                                <div className="bar-track-modern">
                                                    <div className="bar-fill-modern" style={{
                                                        '--target-width': `${(c.penMissed / maxPenVal) * 100}%`,
                                                        background: '#e74c3c'
                                                    }} />
                                                </div>
                                                <span className="bar-value-modern" style={{ color: '#e74c3c' }}>{c.penMissed}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {Object.values(stats.compStats).every(c => (c.penGoals || 0) === 0 && (c.penMissed || 0) === 0) && (
                            <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', fontFamily: 'Space Mono', padding: '30px' }}>
                                NO PENALTIES TAKEN IN COMPETITIONS
                            </div>
                        )}
                    </div>
                </div>

                {/* Playstyle Profile Donut Ratio */}
                <div className="chart-card-modern" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'Space Mono', color: '#111', letterSpacing: '1px', marginBottom: '25px', textAlign: 'center' }}>
                        PLAYSTYLE PROFILE (SCORER VS PLAYMAKER)
                    </div>
                    
                    {totalContributions > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 20px' }}>
                            <div style={{ display: 'flex', height: '36px', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                                {goalsPct > 0 && (
                                    <div style={{
                                        width: `${goalsPct}%`,
                                        background: 'linear-gradient(90deg, #D31E36, #ff4d6d)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: '900',
                                        fontFamily: 'Space Mono',
                                        fontSize: '13px',
                                        transition: 'width 1s ease'
                                    }}>
                                        {goalsPct.toFixed(0)}% GOALS
                                    </div>
                                )}
                                {assistsPct > 0 && (
                                    <div style={{
                                        width: `${assistsPct}%`,
                                        background: 'linear-gradient(90deg, #3498db, #5dade2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: '900',
                                        fontFamily: 'Space Mono',
                                        fontSize: '13px',
                                        transition: 'width 1s ease'
                                    }}>
                                        {assistsPct.toFixed(0)}% ASSISTS
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'Space Mono', color: '#888', fontWeight: '700' }}>
                                <div style={{ textAlign: 'left' }}>
                                    🎯 GOALS: <strong>{totalGoals}</strong>
                                    <div style={{ color: '#D31E36', fontSize: '13px', fontWeight: '800', marginTop: '4px' }}>SCORER ROLE</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    👟 ASSISTS: <strong>{totalAssists}</strong>
                                    <div style={{ color: '#3498db', fontSize: '13px', fontWeight: '800', marginTop: '4px' }}>PLAYMAKER ROLE</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', fontFamily: 'Space Mono', padding: '30px' }}>
                            NO GOALS OR ASSISTS RECORDED TO PLOT PROFILE
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
