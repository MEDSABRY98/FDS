"use client";

import { useMemo, useState, useEffect } from "react";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import { GK_TABS, buildEgyptNTGkStats } from "./egypt_nt_db_gk_details_utils";
import EgyptNTGKOverview from "./egypt_nt_db_gk_details_overview";
import EgyptNTGKMatches from "./egypt_nt_db_gk_details_matches";
import EgyptNTGKChampionships from "./egypt_nt_db_gk_details_championships";
import EgyptNTGKSeasons from "./egypt_nt_db_gk_details_seasons";
import EgyptNTGKVSTeams from "./egypt_nt_db_gk_details_vs_teams";
import "../../Alahly/PlayerDetails/alahly_db_player_details.css";

export default function EgyptNTGKDetails({ gkName, gkDetails, howPenMissed, masterMatches, playerDetails, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedComps, setSelectedComps] = useState([]);
    const [selectedSYs, setSelectedSYs] = useState([]);
    const [selectedOpps, setSelectedOpps] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [activeTab]);

    const { stats, gkTeams, gkComps, gkSYs, gkOpps } = useMemo(
        () => buildEgyptNTGkStats({
            gkName,
            gkDetails,
            masterMatches,
            howPenMissed,
            playerDetails,
            selectedTeams,
            selectedComps,
            selectedSYs,
            selectedOpps,
        }),
        [gkName, gkDetails, masterMatches, howPenMissed, playerDetails, selectedTeams, selectedComps, selectedSYs, selectedOpps]
    );

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [stats, activeTab]);

    const handleExport = () => {
        let exportData = [];
        let filename = `EgyptNT_GK_${gkName}_${activeTab}`;
        switch (activeTab) {
            case 'overview':
                exportData = [
                    { "METRIC": "Matches", "VALUE": stats.caps },
                    { "METRIC": "GC", "VALUE": stats.goalsConceded },
                    { "METRIC": "CS", "VALUE": stats.cleanSheets },
                    { "METRIC": "PEN(F)", "VALUE": stats.penaltiesFaced },
                    { "METRIC": "PR", "VALUE": stats.penaltiesReceived },
                    { "METRIC": "PS", "VALUE": stats.penaltiesSaved },
                    { "METRIC": "PEN(M)", "VALUE": stats.penaltiesMissed },
                ];
                break;
            case 'matches':
                exportData = stats.matchHistory.map((m, i) => ({
                    "#": i + 1, "DATE": m.date, "CHAMPION": m.champion, "SEASON": m.season, "SY": m.sy, "OPPONENT": m.opponent, "MINS": m.mins, "GC": m.gc, "CLEAN": m.clean ? "YES" : "NO", "PSM": m.psm, "PG": m.pg
                }));
                break;
            case 'championships':
                exportData = Object.keys(stats.compStats).map((c, i) => {
                    const s = stats.compStats[c];
                    return { "#": i + 1, "CHAMPION": c, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GS": s.gs, "GA": s.ga, "GK-GC": s.gc, "GK-CS": s.cs, "GK-PS": s.ps };
                });
                break;
            case 'season':
                exportData = Object.keys(stats.statsBySY).sort((a, b) => b.localeCompare(a)).map((sy, i) => {
                    const s = stats.statsBySY[sy];
                    return { "#": i + 1, "SY": sy, "MP": s.matches, "W": s.wins, "D": s.draws, "L": s.losses, "GC": s.gc, "CS": s.cs, "PS": s.ps };
                });
                break;
            case 'vs_teams':
                exportData = Object.keys(stats.statsByOpponent || {}).sort((a, b) => stats.statsByOpponent[b].matches - stats.statsByOpponent[a].matches).map((opp, i) => {
                    const s = stats.statsByOpponent[opp];
                    return { "#": i + 1, "OPPONENT": opp, "MP": s.matches, "CS": s.cs, "GC": s.gc, "PR": s.pr, "PS": s.ps };
                });
                break;
        }
        if (exportData.length > 0) EgyptNTExcelExport.exportToExcel(exportData, filename);
    };

    if (!gkName) return null;

    return (
        <div className="player-details-container">
            <div className="player-hero">
                <div className="hero-content">
                    <button className="back-btn-modern" onClick={onBack}><span>←</span> All GK's</button>
                    <h1 className="player-main-name">
                        {gkName.split(' ').slice(0, -1).join(' ')} <span>{gkName.split(' ').slice(-1)}</span>
                    </h1>
                </div>
                <div className="hero-stats-quick" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="advanced-filter-btn" onClick={() => setIsFilterModalOpen(true)}>ADVANCED FILTERS</button>
                    <div className="quick-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'Space Mono', letterSpacing: '2px' }}>MATCHES</div>
                        <div style={{ color: 'var(--gold)', fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '2px' }}>{stats.caps}</div>
                    </div>
                </div>
            </div>

            {isFilterModalOpen && (
                <div className="p-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="p-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p-modal-header">
                            <h2>GK ADVANCED FILTERS</h2>
                            <button className="p-close-btn" onClick={() => setIsFilterModalOpen(false)}>×</button>
                        </div>
                        <div className="p-modal-body">
                            <div className="filter-group">
                                <label>TEAMS REPRESENTED</label>
                                <div className="checkbox-grid">
                                    {gkTeams.map(team => (
                                        <div key={team} className={`check-item ${selectedTeams.includes(team) ? 'active' : ''}`}
                                            onClick={() => selectedTeams.includes(team) ? setSelectedTeams(selectedTeams.filter(t => t !== team)) : setSelectedTeams([...selectedTeams, team])}>
                                            <div className="custom-check"></div>
                                            <span>{team}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>COMPETITIONS</label>
                                <div className="checkbox-grid">
                                    {gkComps.map(comp => (
                                        <div key={comp} className={`check-item ${selectedComps.includes(comp) ? 'active' : ''}`}
                                            onClick={() => selectedComps.includes(comp) ? setSelectedComps(selectedComps.filter(c => c !== comp)) : setSelectedComps([...selectedComps, comp])}>
                                            <div className="custom-check"></div>
                                            <span>{comp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>SEASONS (SY)</label>
                                <div className="checkbox-grid">
                                    {gkSYs.map(sy => (
                                        <div key={sy} className={`check-item ${selectedSYs.includes(sy) ? 'active' : ''}`}
                                            onClick={() => selectedSYs.includes(sy) ? setSelectedSYs(selectedSYs.filter(s => s !== sy)) : setSelectedSYs([...selectedSYs, sy])}>
                                            <div className="custom-check"></div>
                                            <span>{sy}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>OPPONENTS FACED</label>
                                <div className="checkbox-grid">
                                    {gkOpps.map(opp => (
                                        <div key={opp} className={`check-item ${selectedOpps.includes(opp) ? 'active' : ''}`}
                                            onClick={() => selectedOpps.includes(opp) ? setSelectedOpps(selectedOpps.filter(o => o !== opp)) : setSelectedOpps([...selectedOpps, opp])}>
                                            <div className="custom-check"></div>
                                            <span>{opp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-modal-footer">
                            <button className="clear-btn" onClick={() => { setSelectedTeams([]); setSelectedComps([]); setSelectedSYs([]); setSelectedOpps([]); }}>CLEAR ALL</button>
                            <button className="apply-btn" onClick={() => setIsFilterModalOpen(false)}>APPLY FILTERS</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="player-details-tabs gk-details-tabs">
                {GK_TABS.map((tab) => (
                    <div
                        key={tab.id}
                        className={`player-tab-item ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-title">{tab.label}</span>
                    </div>
                ))}
            </div>

            <div className="details-tab-content" style={{ marginTop: '30px' }}>
                {activeTab === 'overview' && <EgyptNTGKOverview stats={stats} />}
                {activeTab === 'matches' && (
                    <EgyptNTGKMatches
                        stats={stats}
                        renderEventsCell={(m) => (
                            <div className="m-stats-cell" style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' }}>
                                {m.gc > 0 && <div className="m-mini-pill mini-g" style={{ background: '#e74c3c', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: '800' }}>{m.gc} GC</div>}
                                {m.clean && <div className="m-mini-pill" style={{ background: '#2ecc71', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>CS</div>}
                                {m.psm > 0 && <div className="m-mini-pill mini-a" style={{ background: '#3498db', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>{m.psm} PS</div>}
                                {m.pg > 0 && <div className="m-mini-pill mini-p" style={{ background: '#9b59b6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>{m.pg} PG</div>}
                                {m.gc === 0 && !m.clean && m.psm === 0 && <span style={{ color: '#eee' }}>—</span>}
                            </div>
                        )}
                    />
                )}
                {activeTab === 'championships' && <EgyptNTGKChampionships stats={stats} />}
                {activeTab === 'season' && <EgyptNTGKSeasons stats={stats} />}
                {activeTab === 'vs_teams' && <EgyptNTGKVSTeams stats={stats} />}
            </div>

            <style jsx>{`
                .gk-details-tabs {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 15px;
                    width: 100%;
                }
                .advanced-filter-btn { background: rgba(201, 168, 76, 0.1); border: 1px solid var(--gold); color: var(--gold); padding: 12px 24px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 700; font-size: 11px; cursor: pointer; transition: 0.3s; }
                .advanced-filter-btn:hover { background: var(--gold); color: #000; box-shadow: 0 0 20px rgba(201,168,76,0.2); }
                .p-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
                .p-modal-content { background: #fff; border: 1px solid #eee; width: 90%; max-width: 700px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.1); animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes modalPop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .p-modal-header { padding: 25px 35px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
                .p-modal-header h2 { font-family: 'Bebas Neue'; color: #000; letter-spacing: 2px; margin: 0; font-size: 24px; }
                .p-close-btn { background: none; border: none; color: #999; font-size: 32px; cursor: pointer; transition: 0.3s; }
                .p-close-btn:hover { color: #000; }
                .p-modal-body { padding: 35px; max-height: 60vh; overflow-y: auto; }
                .filter-group { margin-bottom: 35px; }
                .filter-group label { display: block; color: var(--gold); font-family: 'Space Mono'; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
                .checkbox-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                .check-item { background: #f9f9f9; padding: 14px 20px; border-radius: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s; border: 1px solid #eee; }
                .check-item:hover { background: #f0f0f0; border-color: #ddd; }
                .check-item.active { background: rgba(201, 168, 76, 0.05); border-color: var(--gold); }
                .custom-check { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; position: relative; transition: 0.2s; background: #fff; }
                .check-item.active .custom-check { border-color: var(--gold); background: var(--gold); }
                .check-item.active .custom-check::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -52%); color: #000; font-size: 12px; font-weight: 900; }
                .check-item span { color: #333; font-size: 13px; font-weight: 600; font-family: 'Outfit'; }
                .p-modal-footer { padding: 25px 35px; background: #fafafa; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 20px; }
                .clear-btn { background: none; border: none; color: #999; font-family: 'Space Mono'; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .clear-btn:hover { color: #333; }
                .apply-btn { background: var(--gold); color: #000; border: none; padding: 12px 35px; border-radius: 12px; font-family: 'Space Mono'; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .apply-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(201,168,76,0.15); }
            `}</style>
        </div>
    );
}
