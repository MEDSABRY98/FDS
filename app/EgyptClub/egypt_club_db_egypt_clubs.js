"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import { ChevronRight, ArrowLeft, Shield, Calendar, Trophy, Zap } from "lucide-react";
import EgyptClubProfileDashboard from "./egypt_club_profile_dashboard";
import EgyptClubProfileOpponents from "./egypt_club_profile_opponents";
import EgyptClubProfileCompetitions from "./egypt_club_profile_competitions";
import EgyptClubProfileMatches from "./egypt_club_profile_matches";

import { exportSummaryToExcel } from "./egypt_club_excel_export";
import "./egypt_club_db_egypt_clubs.css";

export default function EgyptClubClubs({ matches }) {
    const [selectedClub, setSelectedClub] = useState(null);
    const [profileTab, setProfileTab] = useState("dashboard");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [matches]);

    // Calculate aggregate stats for all Egyptian clubs in the current dataset
    const clubsData = useMemo(() => {
        const stats = {};
        matches.forEach(m => {
            const name = m["EGYPT TEAM"];
            if (!name) return;
            
            if (!stats[name]) {
                stats[name] = {
                    name,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    csf: 0,
                    csa: 0
                };
            }

            const club = stats[name];
            club.played++;
            if (m["W-D-L"] === "W") club.wins++;
            else if (m["W-D-L"] === "L") club.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) club.draws++;

            club.gf += (Number(m.GF) || 0);
            club.ga += (Number(m.GA) || 0);
            
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") club.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") club.csa++;
        });

        return Object.values(stats).sort((a, b) => b.wins - a.wins || b.played - a.played);
    }, [matches]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedClub) {
                exportSummaryToExcel(clubsData, "EgyptClubs_Summary", "name", "EGYPT CLUB");
            }
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [clubsData, selectedClub]);

    // Calculate drill-down stats for the selected club
    const clubProfile = useMemo(() => {
        if (!selectedClub) return null;

        const clubMatches = matches.filter(m => m["EGYPT TEAM"] === selectedClub);
        
        // Basic Stats
        const played = clubMatches.length;
        const wins = clubMatches.filter(m => m["W-D-L"] === "W").length;
        const losses = clubMatches.filter(m => m["W-D-L"] === "L").length;
        const draws = clubMatches.filter(m => m["W-D-L"] && m["W-D-L"].startsWith("D")).length;
        const gf = clubMatches.reduce((sum, m) => sum + (Number(m.GF) || 0), 0);
        const ga = clubMatches.reduce((sum, m) => sum + (Number(m.GA) || 0), 0);
        const gd = gf - ga;
        const cs = clubMatches.filter(m => m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH").length;
        const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

        // Group by Competition (CHAMPION)
        const comps = {};
        clubMatches.forEach(m => {
            const compName = m.CHAMPION || "Other";
            if (!comps[compName]) {
                comps[compName] = { name: compName, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
            }
            const c = comps[compName];
            c.played++;
            if (m["W-D-L"] === "W") c.wins++;
            else if (m["W-D-L"] === "L") c.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) c.draws++;
            c.gf += (Number(m.GF) || 0);
            c.ga += (Number(m.GA) || 0);
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") c.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") c.csa++;
        });

        // Group by Year
        const years = {};
        clubMatches.forEach(m => {
            const yr = m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : "Unknown");
            if (!years[yr]) {
                years[yr] = { year: yr, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
            }
            const y = years[yr];
            y.played++;
            if (m["W-D-L"] === "W") y.wins++;
            else if (m["W-D-L"] === "L") y.losses++;
            else if (m["W-D-L"] && m["W-D-L"].startsWith("D")) y.draws++;
            y.gf += (Number(m.GF) || 0);
            y.ga += (Number(m.GA) || 0);
            if (m["CLEAN SHEET"] === "F" || m["CLEAN SHEET"] === "BOTH") y.csf++;
            if (m["CLEAN SHEET"] === "A" || m["CLEAN SHEET"] === "BOTH") y.csa++;
        });

        return {
            name: selectedClub,
            played,
            wins,
            draws,
            losses,
            gf,
            ga,
            gd,
            cs,
            winRate,
            matches: clubMatches,
            competitions: Object.values(comps).sort((a, b) => b.played - a.played),
            years: Object.values(years).sort((a, b) => b.year.localeCompare(a.year))
        };
    }, [selectedClub, matches]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    if (selectedClub && clubProfile) {
        return (
            <div className="profile-wrap fade-in">
                {/* Back Header */}
                <div className="profile-back-header">
                    <button 
                        onClick={() => setSelectedClub(null)}
                        className="back-button"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="profile-title">
                            {clubProfile.name} <span className="accent">PROFILE</span>
                        </h2>
                    </div>
                </div>

                <div className="gold-line" style={{ margin: '-10px 0 20px' }}></div>

                {/* Sub Tab Navigation */}
                <div className="profile-tabs">
                    {[
                        { id: 'dashboard', label: 'DASHBOARD' },
                        { id: 'matches', label: 'MATCHES' },
                        { id: 'opponents', label: 'OPPONENTS FACED' },
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
                    <EgyptClubProfileDashboard 
                        clubProfile={clubProfile} 
                        formatDate={formatDate} 
                    />
                )}
                {profileTab === 'matches' && (
                    <EgyptClubProfileMatches 
                        clubProfile={clubProfile} 
                        formatDate={formatDate} 
                    />
                )}
                {profileTab === 'opponents' && (
                    <EgyptClubProfileOpponents 
                        matches={clubProfile.matches} 
                    />
                )}
                {profileTab === 'competitions' && (
                    <EgyptClubProfileCompetitions 
                        competitions={clubProfile.competitions} 
                    />
                )}
            </div>
        );
    }

    return (
        <div className="tab-content" id="tab-clubs">
            <div className="clubs-wrap">
                <div className="header-tabs-container">
                    <div className="section-title">EGYPTIAN <span className="accent">CLUBS</span></div>
                </div>
                <div className="gold-line" style={{ margin: '15px 0 30px' }}></div>

                {clubsData.length === 0 ? (
                    <NoData_db message="No Egyptian clubs data found." />
                ) : (() => {
                    const pageSize = 50;
                    const paginatedClubs = clubsData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                    const totalPages = Math.ceil(clubsData.length / pageSize);
                    
                    const totals = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csf: 0, csa: 0 };
                    clubsData.forEach(c => {
                        totals.played += c.played;
                        totals.wins += c.wins;
                        totals.draws += c.draws;
                        totals.losses += c.losses;
                        totals.gf += c.gf;
                        totals.ga += c.ga;
                        totals.csf += c.csf;
                        totals.csa += c.csa;
                    });
                    const totalsWinRate = totals.played > 0 ? Math.round((totals.wins / totals.played) * 100) : 0;

                    return (
                        <div className="table-container">
                            <table className="clubs-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%' }}>EGYPT CLUB</th>
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
                                    {paginatedClubs.map((club) => {
                                        const winRate = club.played > 0 ? Math.round((club.wins / club.played) * 100) : 0;
                                        return (
                                            <tr 
                                                key={club.name} 
                                                onClick={() => { setSelectedClub(club.name); setProfileTab("dashboard"); }}
                                                className="club-table-row"
                                            >
                                                <td className="club-name-cell">
                                                    🛡️ {club.name}
                                                </td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{club.played}</td>
                                                <td style={{ color: '#00c853', fontWeight: '600', fontFamily: 'Space Mono, monospace' }}>{club.wins}</td>
                                                <td style={{ fontWeight: 'bold', color: 'var(--gold, #c9a84c)' }}>
                                                    {winRate}%
                                                </td>
                                                <td style={{ color: 'var(--gold, #c9a84c)', fontFamily: 'Space Mono, monospace' }}>{club.draws}</td>
                                                <td style={{ color: '#ff4d4d', fontFamily: 'Space Mono, monospace' }}>{club.losses}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{club.gf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{club.ga}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{club.csf}</td>
                                                <td style={{ fontFamily: 'Space Mono, monospace' }}>{club.csa}</td>
                                                <td>
                                                    <ChevronRight size={18} style={{ color: '#888' }} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    
                                    {/* Totals Row */}
                                    <tr className="club-totals-row">
                                        <td className="totals-label">TOTAL ({clubsData.length} Clubs)</td>
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
