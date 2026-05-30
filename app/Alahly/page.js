"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    Download, 
    SlidersHorizontal, 
    X, 
    LayoutDashboard, 
    Trophy, 
    FileText, 
    Calendar, 
    CalendarDays, 
    Users, 
    Shield, 
    User, 
    GitCompare, 
    Tv, 
    Menu, 
    ArrowLeft,
    Award
} from "lucide-react";
import Link from "next/link";

import { AlAhlyService } from "./alahly_db_service";
import AlAhlyDashboard from "./alahly_db_dashboard";
import AlAhlyMatches from "./alahly_db_matches";
import AlAhlySeasons from "./alahly_db_seasons_name";
import AlAhlySeasonsN from "./alahly_db_seasons_number";
import AlAhlyYears from "./alahly_db_years";
import AlAhlyPlayers from "./alahly_db_players";
import AlAhlyGKs from "./alahly_db_gks";
import AlAhlyManagers from "./alahly_db_managers";
import AlAhlyFilters from "./alahly_db_filters";

import AlAhlyMatchDetails from "./alahly_db_match_details";
import AlAhlyEditor from "./alahly_db_editor";
import AlAhlyChampions from "./alahly_db_champions";
import AlAhlyReferees from "./alahly_db_referees";
import AlAhlyH2H from "./alahly_db_h2h";
import AlAhlyMediaTracker from "./alahly_db_media_tracker";
import Loading_db from "../lib/Loading_db";
import "../lib/AlahlySidebar.css";

export default function AlAhlyDatabase() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [matches, setMatches] = useState([]);
    const [playerDetails, setPlayerDetails] = useState([]);
    const [lineupDetails, setLineupDetails] = useState([]);
    const [gkDetails, setGkDetails] = useState([]);
    const [howPenMissed, setHowPenMissed] = useState([]);
    const [mediaTrackerData, setMediaTrackerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Comprehensive Filters state
    const [dbFilters, setDbFilters] = useState({
        match_id: 'All',
        champion_system: 'All',
        year: 'All',
        champion: 'All',
        season: 'All',
        sy: 'All',
        ahly_manager: 'All',
        opponent_manager: 'All',
        referee: 'All',
        round: 'All',
        han: 'All',
        stad: 'All',
        ahly_team: 'All',
        gf: 'All',
        ga: 'All',
        et: 'All',
        pen: 'All',
        opponent_team: 'All',
        wdl: 'All',
        clean_sheet: 'All',
        note: 'All'
    });

    useEffect(() => {
        fetchMatchData();
    }, []);

    async function fetchMatchData(silent = false) {
        if (!silent) setLoading(true);
        const data = await AlAhlyService.getAllMatches();
        const pData = await AlAhlyService.getAllPlayerDetails();
        const lData = await AlAhlyService.getAllLineupDetails();
        const gData = await AlAhlyService.getAllGKDetails();
        const hData = await AlAhlyService.getAllHowPenMissed();
        const mTrackerData = await AlAhlyService.getAllMediaTracker();
        setMatches(data);
        setPlayerDetails(pData);
        setLineupDetails(lData);
        setGkDetails(gData);
        setHowPenMissed(hData);
        setMediaTrackerData(mTrackerData);
        if (!silent) setLoading(false);
    }

    // Dynamic Filter Options for ALL columns
    const filterOptions = useMemo(() => {
        return AlAhlyService.getUniqueFilters(matches);
    }, [matches]);

    const updateFilter = (key, value) => {
        setDbFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setDbFilters({
            match_id: 'All',
            champion_system: 'All',
            year: 'All',
            champion: 'All',
            season: 'All',
            sy: 'All',
            ahly_manager: 'All',
            opponent_manager: 'All',
            referee: 'All',
            round: 'All',
            han: 'All',
            stad: 'All',
            ahly_team: 'All',
            gf: 'All',
            ga: 'All',
            et: 'All',
            pen: 'All',
            opponent_team: 'All',
            wdl: 'All',
            clean_sheet: 'All',
            note: 'All'
        });
    };

    // Advanced Comprehensive Filter Logic with Date Range & Year
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            const check = (key, col) => dbFilters[key] === 'All' || String(m[col]) === String(dbFilters[key]);

            // Date Range Check
            const matchDateStr = m.DATE ? m.DATE : null;
            let withinRange = true;
            if (matchDateStr) {
                const mDate = new Date(matchDateStr);
                const mYear = mDate.getFullYear().toString();

                // If Year filter is active, it must match
                if (dbFilters.year !== 'All' && mYear !== dbFilters.year) withinRange = false;

                // If Date Range is active, it must be within range
                if (startDate && mDate < new Date(startDate)) withinRange = false;
                if (endDate && mDate > new Date(endDate)) withinRange = false;
            } else if (startDate || endDate || dbFilters.year !== 'All') {
                withinRange = false;
            }

            return (
                withinRange &&
                check('match_id', 'MATCH_ID') &&
                check('champion_system', 'CHAMPION SYSTEM') &&
                check('champion', 'CHAMPION') &&
                check('season', 'SEASON - NAME') &&
                check('sy', 'SEASON - NUMBER') &&
                check('ahly_manager', 'AHLY MANAGER') &&
                check('opponent_manager', 'OPPONENT MANAGER') &&
                check('referee', 'REFREE') &&
                check('round', 'ROUND') &&
                check('han', 'H-A-N') &&
                check('stad', 'STAD') &&
                check('ahly_team', 'AHLY TEAM') &&
                check('gf', 'GF') &&
                check('ga', 'GA') &&
                check('et', 'ET') &&
                check('pen', 'PEN') &&
                check('opponent_team', 'OPPONENT TEAM') &&
                check('wdl', 'W-D-L') &&
                check('clean_sheet', 'CLEAN SHEET') &&
                check('note', 'NOTE')
            );
        });
    }, [matches, dbFilters, startDate, endDate]);

    if (loading) {
        return <Loading_db message="SYNCING DATA" />;
    }

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'matches', label: 'Matches', icon: Trophy },
        { id: 'editor', label: 'Editor', icon: FileText },
        { id: 'champions', label: 'Champions', icon: Award },
        { id: 'seasons', label: 'Seasons - Name', icon: Calendar },
        { id: 'seasons_n', label: 'Seasons - Number', icon: CalendarDays },
        { id: 'years', label: 'Years', icon: Calendar },
        { id: 'players', label: 'Players', icon: Users },
        { id: 'gks', label: 'Gks', icon: Shield },
        { id: 'managers', label: 'Managers', icon: User },
        { id: 'referees', label: 'Referees', icon: Shield },
        { id: 'h2h', label: 'H2h', icon: GitCompare },
        { id: 'media-tracker', label: 'Media Tracker', icon: Tv }
    ];

    return (
        <div id="main-app" className={`alahly-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Backdrop for mobile drawer */}
            <div 
                className={`alahly-sidebar-backdrop ${isSidebarMobileOpen ? 'active' : ''}`} 
                onClick={() => setIsSidebarMobileOpen(false)}
            />

            {/* Sidebar navigation */}
            <aside className={`alahly-sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''}`}>
                <div className="alahly-sidebar-header">
                    <Link href="/" className="alahly-sidebar-brand">
                        <div className="alahly-sidebar-logo-hex">
                            <span className="alahly-sidebar-logo-text">A</span>
                        </div>
                        <div className="alahly-sidebar-brand-name">
                            AL AHLY <span>SC</span>
                        </div>
                    </Link>
                    <button 
                        className="alahly-sidebar-close-btn" 
                        onClick={() => setIsSidebarMobileOpen(false)}
                        title="CLOSE MENU"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="alahly-sidebar-menu">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`alahly-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setIsSidebarMobileOpen(false);
                                }}
                            >
                                <Icon size={16} className="alahly-sidebar-item-icon" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="alahly-sidebar-actions">
                    <button
                        className="alahly-sidebar-collapse-toggle-btn"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "EXPAND MENU" : "COLLAPSE MENU"}
                    >
                        <ArrowLeft size={14} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        <span>COLLAPSE MENU</span>
                    </button>
                    <button 
                        className="alahly-sidebar-action-btn export-btn" 
                        onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                        title="DOWNLOAD CURRENT VIEW AS EXCEL"
                    >
                        <Download size={14} />
                        <span>EXPORT TO EXCEL</span>
                    </button>
                    <button 
                        className="alahly-sidebar-action-btn filter-btn" 
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN DATABASE FILTERS"
                    >
                        <SlidersHorizontal size={14} />
                        <span>FILTERS</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="alahly-main-content">
                {/* Mobile Top Bar */}
                <header className="alahly-mobile-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            className="alahly-menu-toggle-btn" 
                            onClick={() => setIsSidebarMobileOpen(true)}
                            title="OPEN MENU"
                        >
                            <Menu size={22} />
                        </button>
                        <Link href="/" className="alahly-mobile-brand">
                            <div className="alahly-mobile-brand-name">
                                AL AHLY <span>SC</span>
                            </div>
                        </Link>
                    </div>
                    <div className="alahly-mobile-actions">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))} 
                            className="alahly-mobile-action-icon"
                            title="DOWNLOAD CURRENT VIEW AS EXCEL"
                        >
                            <Download size={16} />
                        </button>
                        <button 
                            onClick={() => setIsFilterOpen(true)} 
                            className="alahly-mobile-action-icon"
                            title="OPEN DATABASE FILTERS"
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>
                </header>

                <main className="alahly-content-viewport">
                    {activeTab === 'dashboard' && <AlAhlyDashboard matches={filteredMatches} season={dbFilters.season} />}
                    {activeTab === 'matches' && (
                        !selectedMatchId ? (
                            <AlAhlyMatches matches={filteredMatches} onMatchClick={(id) => { setSelectedMatchId(id); }} />
                        ) : (
                            <AlAhlyMatchDetails
                                matchId={selectedMatchId}
                                matches={matches}
                                playerDetails={playerDetails}
                                lineupDetails={lineupDetails}
                                gkDetails={gkDetails}
                                howPenMissed={howPenMissed}
                                onBack={() => setSelectedMatchId(null)}
                            />
                        )
                    )}
                    {activeTab === 'seasons' && <AlAhlySeasons matches={filteredMatches} />}
                    {activeTab === 'seasons_n' && <AlAhlySeasonsN matches={filteredMatches} />}
                    {activeTab === 'years' && <AlAhlyYears matches={filteredMatches} />}
                    {activeTab === 'players' && <AlAhlyPlayers playerDetails={playerDetails} lineupDetails={lineupDetails} filteredMatches={filteredMatches} gkDetails={gkDetails} howPenMissed={howPenMissed} />}
                    {activeTab === 'gks' && <AlAhlyGKs gkDetails={gkDetails} howPenMissed={howPenMissed} filteredMatches={filteredMatches} playerDetails={playerDetails} />}
                    {activeTab === 'managers' && <AlAhlyManagers matches={filteredMatches} playerDetails={playerDetails} lineupDetails={lineupDetails} />}
                    {activeTab === 'h2h' && <AlAhlyH2H matches={filteredMatches} />}
                    {activeTab === 'referees' && <AlAhlyReferees matches={filteredMatches} playerDetails={playerDetails} howPenMissed={howPenMissed} />}
                    {activeTab === 'media-tracker' && <AlAhlyMediaTracker matches={filteredMatches} mediaTrackerData={mediaTrackerData} onDataChange={fetchMatchData} />}
                    {activeTab === 'editor' && <AlAhlyEditor />}
                    {activeTab === 'champions' && <AlAhlyChampions matchesData={filteredMatches} />}
                </main>
            </div>

            {/* FILTER POPUP MODAL */}
            {isFilterOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 100000,
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: '1200px',
                        maxHeight: '90vh',
                        borderRadius: '0',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '5px solid var(--gold)',
                        boxShadow: 'none'
                    }}>
                        <div style={{
                            padding: '20px 30px',
                            background: '#0a0a0a',
                            color: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: '24px', letterSpacing: '2px' }}>
                                DATABASE <span style={{ color: 'var(--gold)' }}>FILTERS</span>
                            </div>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    transition: '0.3s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold)'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#fff'}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <AlAhlyFilters
                                dbFilters={dbFilters}
                                updateFilter={updateFilter}
                                resetFilters={resetFilters}
                                filterOptions={filterOptions}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate}
                            />
                        </div>

                        <div style={{
                            padding: '20px 40px',
                            background: '#f9f9f9',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '20px',
                            borderTop: '1px solid #eee'
                        }}>
                            <button
                                onClick={resetFilters}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #ddd',
                                    color: '#888',
                                    padding: '0 30px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: "'Space Mono', monospace",
                                    fontSize: '11px',
                                    letterSpacing: '2px',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    textTransform: 'uppercase',
                                    borderRadius: '2px'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(201,168,76,0.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                RESET ALL FILTERS
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    background: '#0a0a0a',
                                    color: 'var(--gold)',
                                    border: '1px solid var(--gold)',
                                    padding: '0 40px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'Bebas Neue',
                                    fontSize: '18px',
                                    letterSpacing: '1px',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                            >
                                APPLY FILTERS & CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
