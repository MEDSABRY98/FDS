"use client";

import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";

import { AlAhlyService } from "./alahly_db_service";
import AlAhlyDashboard from "./alahly_db_dashboard";
import AlAhlyMatches from "./alahly_db_matches";
import AlAhlySeasons from "./alahly_db_seasons";
import AlAhlySeasonsN from "./alahly_db_seasons_n";
import AlAhlyYears from "./alahly_db_years";
import AlAhlyPlayers from "./alahly_db_players";
import AlAhlyGKs from "./alahly_db_gks";
import AlAhlyManagers from "./alahly_db_managers";
import AlAhlyFilters from "./alahly_db_filters";
import AlAhlyMobileNav from "./alahly_db_m";
import AlAhlyMatchDetails from "./alahly_db_match_details";
import AlAhlyEditor from "./alahly_db_editor";
import AlAhlyReferees from "./alahly_db_referees";
import AlAhlyH2H from "./alahly_db_h2h";

export default function AlAhlyDatabase() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [matches, setMatches] = useState([]);
    const [playerDetails, setPlayerDetails] = useState([]);
    const [lineupDetails, setLineupDetails] = useState([]);
    const [gkDetails, setGkDetails] = useState([]);
    const [howPenMissed, setHowPenMissed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);

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

    async function fetchMatchData() {
        setLoading(true);
        const data = await AlAhlyService.getAllMatches();
        const pData = await AlAhlyService.getAllPlayerDetails();
        const lData = await AlAhlyService.getAllLineupDetails();
        const gData = await AlAhlyService.getAllGKDetails();
        const hData = await AlAhlyService.getAllHowPenMissed();
        setMatches(data);
        setPlayerDetails(pData);
        setLineupDetails(lData);
        setGkDetails(gData);
        setHowPenMissed(hData);
        setLoading(false);
    }

    // Dynamic Filter Options for ALL columns
    const filterOptions = useMemo(() => {
        return AlAhlyService.getUniqueFilters(matches);
    }, [matches]);

    const updateFilter = (key, value) => {
        setDbFilters(prev => ({ ...prev, [key]: value }));
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
        return (
            <div style={{
                display: 'flex',
                height: '100vh',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#0a0a0a',
                fontFamily: 'Bebas Neue, sans-serif'
            }}>
                <div style={{ fontSize: '48px', letterSpacing: '8px', marginBottom: '10px' }}>
                    AL AHLY <span style={{ color: '#c9a84c' }}>DATABASE</span>
                </div>
                <div style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '10px',
                    letterSpacing: '4px',
                    color: '#888',
                    animation: 'pulse 1.5s infinite'
                }}>
                    SYNCING REAL-TIME FOOTBALL DATA...
                </div>
                <style jsx>{`
                    @keyframes pulse {
                        0% { opacity: 0.4; }
                        50% { opacity: 1; }
                        100% { opacity: 0.4; }
                    }
                    .sub-tabs-selection { display: flex; gap: 8px; }
                    .global-export-btn:hover {
                        background: #c9a84c !important;
                        color: #000 !important;
                        transform: scale(1.1) rotate(5deg) !important;
                        box-shadow: 0 0 25px rgba(201,168,76,0.35) !important;
                        border-color: #c9a84c !important;
                    }
                    .global-export-btn:active { transform: scale(0.95); }
                `}</style>
            </div>
        );
    }

    return (
        <div id="main-app" style={{ display: 'block', minHeight: '100vh', paddingBottom: '70px', background: 'var(--bg)' }}>

            <nav className="top-nav" style={{
                position: 'sticky',
                top: 0,
                zIndex: 9999,
                background: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: '74px',
                padding: '10px 0',
                boxSizing: 'border-box',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <button
                    className="global-export-btn"
                    onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                    title="DOWNLOAD CURRENT VIEW AS EXCEL"
                    style={{
                        position: 'absolute',
                        left: '25px',
                        background: 'rgba(201, 168, 76, 0.1)',
                        color: '#c9a84c',
                        border: '1px solid rgba(201, 168, 76, 0.25)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 10000
                    }}
                >
                    <Download size={16} strokeWidth={3} />
                </button>



                <div
                    className="nav-tabs scroll-hide"
                    onWheel={(e) => {
                        if (e.deltaY !== 0) {
                            e.currentTarget.scrollLeft += e.deltaY;
                        }
                    }}
                    style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        justifyContent: 'flex-start',
                        gap: '5px',
                        zIndex: 99999,
                        pointerEvents: 'auto',
                        maxWidth: '1300px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    <style jsx global>{`
                        .scroll-hide::-webkit-scrollbar { display: none; }
                        @media (max-width: 1100px) {
                            .top-nav {
                                display: none !important;
                            }
                        }
                    `}</style>
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'D' },
                        { id: 'matches', label: 'Matches', icon: 'M' },
                        { id: 'editor', label: 'Editor', icon: 'E' },
                        { id: 'seasons', label: 'Seasons - Name', icon: 'S' },
                        { id: 'seasons_n', label: 'Seasons - Number', icon: 'N' },
                        { id: 'years', label: 'Years', icon: 'Y' },
                        { id: 'players', label: 'Players', icon: 'P' },
                        { id: 'gks', label: 'GKs', icon: 'GK' },
                        { id: 'managers', label: 'Managers', icon: 'M' },
                        { id: 'referees', label: 'Referees', icon: 'R' },
                        { id: 'h2h', label: 'H2H', icon: 'H' },
                        { id: 'filters', label: 'Filters', icon: 'F' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0 20px',
                                flexShrink: 0,
                                height: '54px',
                                color: activeTab === tab.id ? '#c9a84c' : 'rgba(255,255,255,0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                transition: '0.3s',
                                borderBottom: activeTab === tab.id ? '2px solid #c9a84c' : '2px solid transparent'
                            }}
                        >
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px' }}>{tab.icon}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <main style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
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
                {activeTab === 'filters' && (
                    <AlAhlyFilters
                        dbFilters={dbFilters}
                        updateFilter={updateFilter}
                        filterOptions={filterOptions}
                        startDate={startDate} setStartDate={setStartDate}
                        endDate={endDate} setEndDate={setEndDate}
                    />
                )}
                {activeTab === 'editor' && <AlAhlyEditor />}
            </main>

            <AlAhlyMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
}
