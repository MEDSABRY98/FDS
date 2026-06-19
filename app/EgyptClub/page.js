"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Download,
    SlidersHorizontal,
    X,
    LayoutDashboard,
    Trophy,
    Calendar,
    Users,
    Shield,
    GitCompare,
    Menu,
    ArrowLeft,
    Award,
    Plus
} from "lucide-react";
import Link from "next/link";

import { EgyptClubService } from "./Service/egy_c_service";
import { supabase } from "../Database";
import EgyptClubDashboard from "./Dashboard/egy_c_dashboard";
import EgyptClubMatches from "./Matches/egy_c_matches";
import EgyptClubClubs from "./EgyptClubs/egy_c_egypt_clubs";
import EgyptClubOpponents from "./Opponents/egy_c_opponents_club";
import EgyptClubH2H from "./HeadToHead/egy_c_h2h";
import EgyptClubSeasons from "./Seasons/egy_c_seasons";
import EgyptClubYears from "./Years/egy_c_years";
import EgyptClubAddMatches from "./AddMatches/egy_c_add_matches";
import EgyptClubFilters from "./Filters/egy_c_filters";
import { exportMatchesToExcel } from "./ExcelExport/egy_c_excel_export";
import Loading_db from "../lib/Loading_db";
import "./Sidebar/egy_c_sidebar.css";

export default function EgyptClubDatabase() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [matches, setMatches] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [dbFilters, setDbFilters] = useState({
        match_id: 'All',
        champion_system: 'All',
        year: 'All',
        champion: 'All',
        season: 'All',
        round: 'All',
        han: 'All',
        place: 'All',
        egypt_team: 'All',
        gf: 'All',
        ga: 'All',
        et: 'All',
        pen: 'All',
        opponent_team: 'All',
        wdl: 'All',
        clean_sheet: 'All',
        wl_q_f: 'All',
        note: 'All',
        country: 'All',
        continent: 'All'
    });

    useEffect(() => {
        fetchMatchData();
    }, []);

    async function fetchMatchData(silent = false) {
        if (!silent) setLoading(true);
        const { data: countriesData } = await supabase.from('db_COUNTRIES').select('*');
        if (countriesData) setCountries(countriesData);

        const data = await EgyptClubService.getAllMatches();
        setMatches(data);
        if (!silent) setLoading(false);
    }

    const getMatchCountryName = (opponentTeam) => {
        if (!opponentTeam) return null;
        const parts = opponentTeam.split(' - ');
        return parts[parts.length - 1].trim().toLowerCase();
    };

    const checkMatchPassesFilter = (m, key, val, countriesList, startD, endD) => {
        if (val === 'All') return true;
        
        if (key === 'year') {
            const mYear = m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : null);
            return mYear === val;
        }
        
        if (key === 'country') {
            const mCountry = getMatchCountryName(m["OPPONENT TEAM"]);
            if (!mCountry) return false;
            const targetRows = countriesList.filter(c => c.COUNTRY_NAME === val);
            return targetRows.some(c => 
                (c.COUNTRY_NAME && c.COUNTRY_NAME.toLowerCase() === mCountry) ||
                (c.COUNTRY_NAME_EN && c.COUNTRY_NAME_EN.toLowerCase() === mCountry)
            );
        }
        
        if (key === 'continent') {
            const mCountry = getMatchCountryName(m["OPPONENT TEAM"]);
            if (!mCountry) return false;
            const countryRow = countriesList.find(c =>
                (c.COUNTRY_NAME && c.COUNTRY_NAME.toLowerCase() === mCountry) ||
                (c.COUNTRY_NAME_EN && c.COUNTRY_NAME_EN.toLowerCase() === mCountry)
            );
            return countryRow && countryRow.CONTINENT === val;
        }
        
        const colMap = {
            match_id: 'MATCH_ID',
            champion_system: 'CHAMPION SYSTEM',
            champion: 'CHAMPION',
            season: 'SEASON',
            round: 'ROUND',
            place: 'PLACE',
            han: 'H-A-N',
            egypt_team: 'EGYPT TEAM',
            gf: 'GF',
            ga: 'GA',
            et: 'ET',
            pen: 'PEN',
            opponent_team: 'OPPONENT TEAM',
            wdl: 'W-D-L',
            clean_sheet: 'CLEAN SHEET',
            wl_q_f: 'W-L Q & F',
            note: 'NOTE'
        };
        
        const colName = colMap[key];
        if (!colName) return true;
        return String(m[colName]) === String(val);
    };

    const getOptionsForField = (key, colName) => {
        const partialMatches = matches.filter(m => {
            let withinRange = true;
            if (m.DATE) {
                const mDate = new Date(m.DATE);
                if (startDate && mDate < new Date(startDate)) withinRange = false;
                if (endDate && mDate > new Date(endDate)) withinRange = false;
            } else if (startDate || endDate) {
                withinRange = false;
            }
            if (!withinRange) return false;

            for (const k of Object.keys(dbFilters)) {
                if (k === key) continue;
                if (!checkMatchPassesFilter(m, k, dbFilters[k], countries, startDate, endDate)) {
                    return false;
                }
            }
            return true;
        });

        if (key === 'year') {
            const years = partialMatches.map(m => m.YEAR || (m.DATE ? new Date(m.DATE).getFullYear().toString() : null)).filter(Boolean);
            return ["All", ...new Set(years)].sort((a, b) => b - a);
        }
        
        if (key === 'country') {
            const matchCountryNames = partialMatches.map(m => {
                return getMatchCountryName(m["OPPONENT TEAM"]);
            }).filter(Boolean);
            
            const countryOpts = countries
                .filter(c => c.COUNTRY_NAME && (
                    matchCountryNames.includes(c.COUNTRY_NAME.toLowerCase()) || 
                    (c.COUNTRY_NAME_EN && matchCountryNames.includes(c.COUNTRY_NAME_EN.toLowerCase()))
                ))
                .map(c => c.COUNTRY_NAME);
                
            return ["All", ...new Set(countryOpts)].sort((a, b) => a.localeCompare(b, 'ar'));
        }
        
        if (key === 'continent') {
            const matchCountryNames = partialMatches.map(m => {
                return getMatchCountryName(m["OPPONENT TEAM"]);
            }).filter(Boolean);
            
            const continentOpts = countries
                .filter(c => c.CONTINENT && (
                    matchCountryNames.includes(c.COUNTRY_NAME.toLowerCase()) || 
                    (c.COUNTRY_NAME_EN && matchCountryNames.includes(c.COUNTRY_NAME_EN.toLowerCase()))
                ))
                .map(c => c.CONTINENT);
                
            return ["All", ...new Set(continentOpts)].sort((a, b) => a.localeCompare(b, 'ar'));
        }
        
        const vals = partialMatches.map(m => m[colName]).filter(v => v !== null && v !== undefined && v !== '');
        const uniqueVals = [...new Set(vals)].sort();
        if (['SEASON', 'DATE'].includes(colName)) {
            uniqueVals.reverse();
        }
        return ["All", ...uniqueVals];
    };

    // Dynamic Filter Options for ALL columns
    const filterOptions = useMemo(() => {
        return {
            match_ids: getOptionsForField('match_id', 'MATCH_ID'),
            champion_systems: getOptionsForField('champion_system', 'CHAMPION SYSTEM'),
            years: getOptionsForField('year', null),
            champions: getOptionsForField('champion', 'CHAMPION'),
            seasons: getOptionsForField('season', 'SEASON'),
            rounds: getOptionsForField('round', 'ROUND'),
            places: getOptionsForField('place', 'PLACE'),
            han: getOptionsForField('han', 'H-A-N'),
            egy_teams: getOptionsForField('egypt_team', 'EGYPT TEAM'),
            gf: getOptionsForField('gf', 'GF'),
            ga: getOptionsForField('ga', 'GA'),
            et: getOptionsForField('et', 'ET'),
            pen: getOptionsForField('pen', 'PEN'),
            opponent_teams: getOptionsForField('opponent_team', 'OPPONENT TEAM'),
            wdl: getOptionsForField('wdl', 'W-D-L'),
            clean_sheets: getOptionsForField('clean_sheet', 'CLEAN SHEET'),
            wl_q_fs: getOptionsForField('wl_q_f', 'W-L Q & F'),
            notes: getOptionsForField('note', 'NOTE'),
            countries: getOptionsForField('country', null),
            continents: getOptionsForField('continent', null)
        };
    }, [matches, dbFilters, countries, startDate, endDate]);

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
            round: 'All',
            han: 'All',
            place: 'All',
            egypt_team: 'All',
            gf: 'All',
            ga: 'All',
            et: 'All',
            pen: 'All',
            opponent_team: 'All',
            wdl: 'All',
            clean_sheet: 'All',
            wl_q_f: 'All',
            note: 'All',
            country: 'All',
            continent: 'All'
        });
    };

    // Filter matches
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            const check = (key, col) => dbFilters[key] === 'All' || String(m[col]) === String(dbFilters[key]);

            const matchDateStr = m.DATE ? m.DATE : null;
            let withinRange = true;
            if (matchDateStr) {
                const mDate = new Date(matchDateStr);
                const mYear = m.YEAR || mDate.getFullYear().toString();

                if (dbFilters.year !== 'All' && mYear !== dbFilters.year) withinRange = false;
                if (startDate && mDate < new Date(startDate)) withinRange = false;
                if (endDate && mDate > new Date(endDate)) withinRange = false;
            } else if (startDate || endDate || dbFilters.year !== 'All') {
                withinRange = false;
            }

            let passCountry = true;
            if (dbFilters.country !== 'All') {
                const mCountry = getMatchCountryName(m["OPPONENT TEAM"]);
                if (!mCountry) {
                    passCountry = false;
                } else {
                    const targetRows = countries.filter(c => c.COUNTRY_NAME === dbFilters.country);
                    passCountry = targetRows.some(c => 
                        (c.COUNTRY_NAME && c.COUNTRY_NAME.toLowerCase() === mCountry) ||
                        (c.COUNTRY_NAME_EN && c.COUNTRY_NAME_EN.toLowerCase() === mCountry)
                    );
                }
            }

            let passContinent = true;
            if (dbFilters.continent !== 'All') {
                const mCountry = getMatchCountryName(m["OPPONENT TEAM"]);
                if (!mCountry) {
                    passContinent = false;
                } else {
                    const countryRow = countries.find(c =>
                        (c.COUNTRY_NAME && c.COUNTRY_NAME.toLowerCase() === mCountry) ||
                        (c.COUNTRY_NAME_EN && c.COUNTRY_NAME_EN.toLowerCase() === mCountry)
                    );
                    passContinent = countryRow && countryRow.CONTINENT === dbFilters.continent;
                }
            }

            return (
                withinRange &&
                passCountry &&
                passContinent &&
                check('match_id', 'MATCH_ID') &&
                check('champion_system', 'CHAMPION SYSTEM') &&
                check('champion', 'CHAMPION') &&
                check('season', 'SEASON') &&
                check('round', 'ROUND') &&
                check('han', 'H-A-N') &&
                check('place', 'PLACE') &&
                check('egypt_team', 'EGYPT TEAM') &&
                check('gf', 'GF') &&
                check('ga', 'GA') &&
                check('et', 'ET') &&
                check('pen', 'PEN') &&
                check('opponent_team', 'OPPONENT TEAM') &&
                check('wdl', 'W-D-L') &&
                check('clean_sheet', 'CLEAN SHEET') &&
                check('wl_q_f', 'W-L Q & F') &&
                check('note', 'NOTE')
            );
        });
    }, [matches, dbFilters, startDate, endDate, countries]);

    const handleExportExcel = async () => {
        window.dispatchEvent(new CustomEvent('egypt-club-export-excel'));
    };

    useEffect(() => {
        const handleGlobalExport = () => {
            if (activeTab === 'dashboard') {
                exportMatchesToExcel(filteredMatches, "EgyptClubs_Dashboard_Matches");
            }
        };
        window.addEventListener('egypt-club-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egypt-club-export-excel', handleGlobalExport);
    }, [activeTab, filteredMatches]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'matches', label: 'Matches', icon: Trophy },
        { id: 'add_matches', label: 'Add Matches', icon: Plus },
        { id: 'clubs', label: 'Egyptian Clubs', icon: Shield },
        { id: 'opponents', label: 'Opponents Club', icon: Users },
        { id: 'h2h', label: 'H2H Comparison', icon: GitCompare },
        { id: 'seasons', label: 'Seasons', icon: Calendar },
        { id: 'years', label: 'Years', icon: Calendar },
    ];

    return (
        <div id="main-app" className={`egypt-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Backdrop for mobile drawer */}
            <div
                className={`egypt-sidebar-backdrop ${isSidebarMobileOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarMobileOpen(false)}
            />

            {/* Sidebar navigation */}
            <aside className={`egypt-sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''}`}>
                <div className="egypt-sidebar-header">
                    <Link href="/" className="egypt-sidebar-brand">
                        <div className="egypt-sidebar-logo-hex">
                            <span className="egypt-sidebar-logo-text">EC</span>
                        </div>
                        <div className="egypt-sidebar-brand-name">
                            EGYPT <span>CLUBS</span>
                        </div>
                    </Link>
                    <button
                        className="egypt-sidebar-close-btn"
                        onClick={() => setIsSidebarMobileOpen(false)}
                        title="CLOSE MENU"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="egypt-sidebar-menu">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`egypt-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setIsSidebarMobileOpen(false);
                                }}
                            >
                                <Icon size={16} className="egypt-sidebar-item-icon" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="egypt-sidebar-actions">
                    <button
                        className="egypt-sidebar-collapse-toggle-btn"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "EXPAND MENU" : "COLLAPSE MENU"}
                    >
                        <ArrowLeft size={14} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        <span>COLLAPSE MENU</span>
                    </button>
                    <button
                        className="egypt-sidebar-action-btn export-btn"
                        onClick={handleExportExcel}
                        title="DOWNLOAD CURRENT VIEW AS EXCEL"
                        disabled={loading}
                        style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        <Download size={14} />
                        <span>EXPORT TO EXCEL</span>
                    </button>
                    <button
                        className="egypt-sidebar-action-btn filter-btn"
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN DATABASE FILTERS"
                        disabled={loading}
                        style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        <SlidersHorizontal size={14} />
                        <span>FILTERS</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="egypt-main-content">
                {/* Mobile Top Bar */}
                <header className="egypt-mobile-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="egypt-menu-toggle-btn"
                            onClick={() => setIsSidebarMobileOpen(true)}
                            title="OPEN MENU"
                        >
                            <Menu size={22} />
                        </button>
                        <Link href="/" className="egypt-mobile-brand">
                            <div className="egypt-mobile-brand-name">
                                EGYPT <span>CLUBS</span>
                            </div>
                        </Link>
                    </div>
                    <div className="egypt-mobile-actions">
                        <button
                            onClick={handleExportExcel}
                            className="egypt-mobile-action-icon"
                            title="DOWNLOAD CURRENT VIEW AS EXCEL"
                            disabled={loading}
                            style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="egypt-mobile-action-icon"
                            title="OPEN DATABASE FILTERS"
                            disabled={loading}
                            style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>
                </header>

                <main className="egypt-content-viewport">
                    {loading && activeTab !== "add_matches" ? (
                        <Loading_db title="EGYPT CLUBS" subtitle="DATABASE" message="SYNCING DATA" inline={true} />
                    ) : (
                        <>
                            {activeTab === 'dashboard' && <EgyptClubDashboard matches={filteredMatches} />}
                            {activeTab === 'matches' && <EgyptClubMatches matches={filteredMatches} />}
                            {activeTab === 'clubs' && <EgyptClubClubs matches={filteredMatches} />}
                            {activeTab === 'opponents' && <EgyptClubOpponents matches={filteredMatches} />}
                            {activeTab === 'h2h' && <EgyptClubH2H matches={filteredMatches} />}
                            {activeTab === 'seasons' && <EgyptClubSeasons matches={filteredMatches} />}
                            {activeTab === 'years' && <EgyptClubYears matches={filteredMatches} />}
                            {activeTab === 'add_matches' && (
                                <EgyptClubAddMatches
                                    matches={matches}
                                    onRefresh={() => fetchMatchData(true)}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* FILTER POPUP MODAL */}
            {isFilterOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 100000,
                    background: 'rgba(0,0,0,0.5)',
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
                        border: '5px solid var(--gold, #c9a84c)',
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
                                DATABASE <span style={{ color: 'var(--gold, #c9a84c)' }}>FILTERS</span>
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
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold, #c9a84c)'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#fff'}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <EgyptClubFilters
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
                                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--gold, #c9a84c)'; e.currentTarget.style.borderColor = 'var(--gold, #c9a84c)'; e.currentTarget.style.background = 'rgba(201,168,76,0.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                RESET ALL FILTERS
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    background: '#0a0a0a',
                                    color: '#fff',
                                    border: '1px solid var(--gold, #c9a84c)',
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
                                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--gold, #c9a84c)'; e.currentTarget.style.color = '#000'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#fff'; }}
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
