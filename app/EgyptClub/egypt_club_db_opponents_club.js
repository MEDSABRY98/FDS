"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import { ChevronRight, ArrowLeft, Users, Trophy, Zap, ShieldAlert } from "lucide-react";
import EgyptClubOpponentsDashboard from "./egypt_club_opponents_dashboard";
import EgyptClubOpponentsMatches from "./egypt_club_opponents_matches";
import EgyptClubOpponentsEgyClubs from "./egypt_club_opponents_egy_clubs";
import EgyptClubOpponentsCompetitions from "./egypt_club_opponents_competitions";

import { exportSummaryToExcel } from "./egypt_club_excel_export";
import "./egypt_club_db_opponents_club.css";

export default function EgyptClubOpponents({ matches }) {
    const [selectedOpponent, setSelectedOpponent] = useState(null);
    const [profileTab, setProfileTab] = useState("dashboard");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [matches]);

    // Calculate aggregate stats for all Opponents
    const opponentsData = useMemo(() => {
        const stats = {};
        matches.forEach(m => {
            const name = m["OPPONENT TEAM"];
            if (!name) return;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    played: 0,
                    wins: 0,    // Opponent wins (Egypt Club loses: L)
                    draws: 0,
                    losses: 0,  // Opponent loses (Egypt Club wins: W)
                    gf: 0,      // Opponent goals (match GA)
                    ga: 0,      // Opponent conceded (match GF)
                    csf: 0,
                    csa: 0
                };
            }

            const opp = stats[name];
            opp.played++;
            if (m["W-D-L"] === "L") opp.wins++;
            else if (m["W-D-L"] === "W") opp.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) opp.draws++;

            opp.gf += (Number(m.GA) || 0);
            opp.ga += (Number(m.GF) || 0);
            
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") opp.csf++;
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") opp.csa++;
        });

        return Object.values(stats).sort((a, b) => b.played - a.played || b.wins - a.wins);
    }, [matches]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedOpponent) {
                exportSummaryToExcel(opponentsData, "EgyptClubs_Opponents_Summary", "name", "OPPONENT CLUB");
            }
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [opponentsData, selectedOpponent]);

    // Calculate drill-down stats for selected Opponent
    const opponentProfile = useMemo(() => {
        if (!selectedOpponent) return null;

        const oppMatches = matches.filter(m => m["OPPONENT TEAM"] === selectedOpponent);

        const played = oppMatches.length;
        const wins = oppMatches.filter(m => m["W-D-L"] === "L").length;
        const losses = oppMatches.filter(m => m["W-D-L"] === "W").length;
        const draws = oppMatches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;
        const gf = oppMatches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
        const ga = oppMatches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const gd = gf - ga;
        const cs = oppMatches.filter(m => m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH").length;
        const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

        // Group by Egyptian Club
        const clubs = {};
        oppMatches.forEach(m => {
            const clubName = m["EGYPT TEAM"];
            if (!clubName) return;
            if (!clubs[clubName]) {
                clubs[clubName] = { name: clubName, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
            }
            const c = clubs[clubName];
            c.played++;
            if (m["W-D-L"] === "L") c.wins++;
            else if (m["W-D-L"] === "W") c.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) c.draws++;
            c.gf += (Number(m.GA) || 0); // opponent goals
            c.ga += (Number(m.GF) || 0); // opponent conceded
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") c.csf++;
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") c.csa++;
        });

        return {
            name: selectedOpponent,
            played,
            wins,
            draws,
            losses,
            gf,
            ga,
            gd,
            cs,
            winRate,
            matches: oppMatches,
            egyptClubs: Object.values(clubs).sort((a, b) => b.played - a.played)
        };
    }, [selectedOpponent, matches]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    if (selectedOpponent && opponentProfile) {
        return (
            <div className="profile-wrap fade-in">
                {/* Back Header */}
                <div className="profile-back-header">
                    <button 
                        onClick={() => setSelectedOpponent(null)}
                        className="back-button"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="profile-title">
                            {opponentProfile.name} <span className="accent">PROFILE</span>
                        </h2>
                    </div>
                </div>

                <div className="gold-line" style={{ margin: '-10px 0 30px' }}></div>

                {/* Sub Tab Navigation */}
                <div className="profile-tabs">
                    {[
                        { id: 'dashboard', label: 'DASHBOARD' },
                        { id: 'matches', label: 'MATCHES' },
                        { id: 'egy_clubs', label: 'EGYPTIAN CLUBS' },
                        { id: 'competitions', label: 'COMPETITIONS' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setProfileTab(t.id)}
                            className={`profile-tab-btn ${profileTab === t.id ? 'active' : ''}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {profileTab === 'dashboard' && (
                    <EgyptClubOpponentsDashboard 
                        opponentProfile={opponentProfile} 
                    />
                )}
                {profileTab === 'matches' && (
                    <EgyptClubOpponentsMatches 
                        opponentProfile={opponentProfile} 
                        formatDate={formatDate}
                    />
                )}
                {profileTab === 'egy_clubs' && (
                    <EgyptClubOpponentsEgyClubs 
                        egyptClubs={opponentProfile.egyptClubs} 
                    />
                )}
                {profileTab === 'competitions' && (
                    <EgyptClubOpponentsCompetitions 
                        matches={opponentProfile.matches} 
                    />
                )}
            </div>
        );
    }

    return (
        <div className="tab-content" id="tab-opponents">
            <div className="opponents-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">OPPONENT <span className="accent">CLUBS</span></div>
                </div>
                <div className="gold-line" style={{ margin: '15px 0 30px' }}></div>

                {opponentsData.length === 0 ? (
                    <NoData_db message="No opponent data found." />
                ) : (() => {
                    const pageSize = 50;
                    const paginatedOpps = opponentsData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                    const totalPages = Math.ceil(opponentsData.length / pageSize);
                    
                    const totals = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
                    opponentsData.forEach(o => {
                        totals.played += o.played;
                        totals.wins += o.wins;
                        totals.draws += o.draws;
                        totals.losses += o.losses;
                        totals.gf += o.gf;
                        totals.ga += o.ga;
                        totals.csf += o.csf;
                        totals.csa += o.csa;
                    });
                    const totalsWinRate = totals.played > 0 ? Math.round((totals.wins / totals.played) * 100) : 0;

                    return (
                        <div className="table-container">
                            <table className="opponents-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%' }}>OPPONENT CLUB</th>
                                        <th style={{ width: '7.5%' }}>PLAYED</th>
                                        <th style={{ color: '#00c853', width: '7.5%' }}>WON</th>
                                        <th style={{ color: 'var(--gold, #c9a84c)', width: '8%' }}>WIN%</th>
                                        <th style={{ color: 'var(--gold, #c9a84c)', width: '7.5%' }}>DRAW</th>
                                        <th style={{ color: '#ff4d4d', width: '7.5%' }}>LOSE</th>
                                        <th style={{ width: '7.5%' }}>GF</th>
                                        <th style={{ width: '7.5%' }}>GA</th>
                                        <th style={{ width: '7.5%' }}>CSF</th>
                                        <th style={{ width: '7.5%' }}>CSA</th>
                                        <th style={{ width: '7%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOpps.map((opp) => {
                                        const winRate = opp.played > 0 ? Math.round((opp.wins / opp.played) * 100) : 0;
                                        return (
                                            <tr 
                                                key={opp.name} 
                                                onClick={() => { setSelectedOpponent(opp.name); setProfileTab("dashboard"); }}
                                                className="opp-table-row"
                                            >
                                                <td className="opponent-name-cell">
                                                    🚩 {opp.name}
                                                </td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{opp.played}</td>
                                                <td style={{ color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{opp.wins}</td>
                                                <td style={{ fontWeight: 'bold', color: 'var(--gold, #c9a84c)' }}>
                                                    {winRate}%
                                                </td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{opp.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{opp.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{opp.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{opp.ga}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{opp.csf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{opp.csa}</td>
                                                <td>
                                                    <ChevronRight size={18} style={{ color: '#888' }} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    
                                    {/* Totals Row */}
                                    <tr className="opp-totals-row">
                                        <td className="totals-label">TOTAL ({opponentsData.length} Opponents)</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.played}</td>
                                        <td style={{ color: '#00c853', fontFamily: 'Space Mono, monospace' }}>{totals.wins}</td>
                                        <td style={{ color: 'var(--gold, #c9a84c)' }}>{totalsWinRate}%</td>
                                        <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{totals.draws}</td>
                                        <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{totals.losses}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.gf}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.ga}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.csf}</td>
                                        <td style={{ fontFamily: 'Space Mono, monospace' }}>{totals.csa}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className="page-btn"
                                    >
                                        ← PREV
                                    </button>
                                    <div className="page-info">
                                        PAGE {currentPage} OF {totalPages}
                                    </div>
                                    <button 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className="page-btn"
                                    >
                                        NEXT →
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
