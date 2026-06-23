"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
    Award,
    History
} from "lucide-react";
import Link from "next/link";

import { AlAhlyService } from "./Service/alahly_db_service";
import { supabase } from "../Database";
import AlAhlyDashboard from "./Dashboard/alahly_db_dashboard";
import AlAhlyMatches from "./Matches/alahly_db_matches";
import AlAhlySeasons from "./SeasonsName/alahly_db_seasons_name";
import AlAhlySeasonsN from "./SeasonsNumber/alahly_db_seasons_number";
import AlAhlyYears from "./Years/alahly_db_years";
import AlAhlyPlayers from "./Players/alahly_db_players";
import AlAhlyGKs from "./Gks/alahly_db_gks";
import AlAhlyManagers from "./Managers/alahly_db_managers";
import AlAhlyFilters from "./Filters/alahly_db_filters";

import AlAhlyMatchDetails from "./MatchDetails/alahly_db_match_details";
import AlAhlyEditor from "./Editor/alahly_db_editor";
import AlAhlyChampions from "./Champions/alahly_db_champions";
import AlAhlyReferees from "./Referees/alahly_db_referees";
import AlAhlyH2H from "./HeadToHead/alahly_db_h2h";
import AlAhlyMediaTracker from "./MediaTracker/alahly_db_media_tracker";
import AlAhlyOTD from "./OnThisDay/alahly_db_otd";
import Loading_db from "../lib/Loading_db";
import SideBar_db from "../lib/SideBar_db";

export default function AlAhlyDatabase() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [matches, setMatches] = useState([]);
    const [playerDetails, setPlayerDetails] = useState([]);
    const [lineupDetails, setLineupDetails] = useState([]);
    const [gkDetails, setGkDetails] = useState([]);
    const [howPenMissed, setHowPenMissed] = useState([]);
    const [mediaTrackerData, setMediaTrackerData] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const matchesListScrollY = useRef(0);

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

    const getMatchCountryName = (opponentTeam) => {
        if (!opponentTeam) return null;
        const parts = opponentTeam.split(' - ');
        return parts[parts.length - 1].trim().toLowerCase();
    };

    const checkMatchPassesFilter = (m, key, val, countriesList, startD, endD) => {
        if (val === 'All') return true;
        
        if (key === 'year') {
            if (!m.DATE) return false;
            const mYear = new Date(m.DATE).getFullYear().toString();
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
            season: 'SEASON - NAME',
            sy: 'SEASON - NUMBER',
            ahly_manager: 'AHLY MANAGER',
            opponent_manager: 'OPPONENT MANAGER',
            referee: 'REFREE',
            round: 'ROUND',
            han: 'H-A-N',
            stad: 'STAD',
            ahly_team: 'AHLY TEAM',
            gf: 'GF',
            ga: 'GA',
            et: 'ET',
            pen: 'PEN',
            opponent_team: 'OPPONENT TEAM',
            wdl: 'W-D-L',
            clean_sheet: 'CLEAN SHEET',
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
            const years = partialMatches.map(m => m.DATE ? new Date(m.DATE).getFullYear() : null).filter(Boolean);
            return ["All", ...new Set(years)].sort((a, b) => b - a);
        }
        
        if (key === 'country') {
            const matchCountryNames = partialMatches.map(m => {
                if (!m["OPPONENT TEAM"]) return null;
                const parts = m["OPPONENT TEAM"].split(' - ');
                return parts[parts.length - 1].trim().toLowerCase();
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
                if (!m["OPPONENT TEAM"]) return null;
                const parts = m["OPPONENT TEAM"].split(' - ');
                return parts[parts.length - 1].trim().toLowerCase();
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
        if (['SEASON - NAME', 'DATE'].includes(colName)) {
            uniqueVals.reverse();
        }
        return ["All", ...uniqueVals];
    };

    // Dynamic Filter Options for ALL columns (Cascading dependent filters)
    const filterOptions = useMemo(() => {
        return {
            match_ids: getOptionsForField('match_id', 'MATCH_ID'),
            champion_systems: getOptionsForField('champion_system', 'CHAMPION SYSTEM'),
            years: getOptionsForField('year', null),
            champions: getOptionsForField('champion', 'CHAMPION'),
            seasons: getOptionsForField('season', 'SEASON - NAME'),
            sy: getOptionsForField('sy', 'SEASON - NUMBER'),
            ahly_managers: getOptionsForField('ahly_manager', 'AHLY MANAGER'),
            opponent_managers: getOptionsForField('opponent_manager', 'OPPONENT MANAGER'),
            referees: getOptionsForField('referee', 'REFREE'),
            rounds: getOptionsForField('round', 'ROUND'),
            han: getOptionsForField('han', 'H-A-N'),
            stadiums: getOptionsForField('stad', 'STAD'),
            ahly_teams: getOptionsForField('ahly_team', 'AHLY TEAM'),
            gf: getOptionsForField('gf', 'GF'),
            ga: getOptionsForField('ga', 'GA'),
            et: getOptionsForField('et', 'ET'),
            pen: getOptionsForField('pen', 'PEN'),
            opponent_teams: getOptionsForField('opponent_team', 'OPPONENT TEAM'),
            wdl: getOptionsForField('wdl', 'W-D-L'),
            clean_sheets: getOptionsForField('clean_sheet', 'CLEAN SHEET'),
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
            note: 'All',
            country: 'All',
            continent: 'All'
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
    }, [matches, dbFilters, startDate, endDate, countries]);


    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'matches', label: 'Matches', icon: Trophy },
        { id: 'otd', label: 'OTD', icon: History },
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
        <SideBar_db
            brandTitle="AL AHLY"
            brandSubtitle="SC"
            logoText="A"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={(tabId) => {
                setActiveTab(tabId);
                setSelectedMatchId(null);
            }}
            actions={[
                {
                    label: "EXPORT TO EXCEL",
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('alahly-export-excel')),
                    className: "export-btn",
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    label: "FILTERS",
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    className: "filter-btn",
                    title: "OPEN ADVANCED FILTERS"
                }
            ]}
            mobileBrandName="AL AHLY SC"
            mobileActions={[
                {
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('alahly-export-excel')),
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    title: "OPEN DATABASE FILTERS"
                }
            ]}
        >
            <main className="alahly-content-viewport">
                {loading ? (
                    <Loading_db message="SYNCING DATA" inline={true} />
                ) : (
                    <>
                        {activeTab === 'dashboard' && <AlAhlyDashboard matches={filteredMatches} season={dbFilters.season} />}
                        {activeTab === 'matches' && (
                            <>
                                <div hidden={!!selectedMatchId}>
                                    <AlAhlyMatches
                                        matches={filteredMatches}
                                        onMatchClick={(id) => {
                                            matchesListScrollY.current = window.scrollY;
                                            setSelectedMatchId(id);
                                        }}
                                    />
                                </div>
                                {selectedMatchId && (
                                    <AlAhlyMatchDetails
                                        matchId={selectedMatchId}
                                        matches={matches}
                                        playerDetails={playerDetails}
                                        lineupDetails={lineupDetails}
                                        gkDetails={gkDetails}
                                        howPenMissed={howPenMissed}
                                        onBack={() => {
                                            setSelectedMatchId(null);
                                            requestAnimationFrame(() => {
                                                requestAnimationFrame(() => {
                                                    window.scrollTo({ top: matchesListScrollY.current, left: 0 });
                                                });
                                            });
                                        }}
                                    />
                                )}
                            </>
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
                        {activeTab === 'otd' && <AlAhlyOTD matches={filteredMatches} />}
                    </>
                )}
            </main>

            {/* FILTER POPUP MODAL */}
            {isFilterOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 100000,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
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
        </SideBar_db>
    );
}
