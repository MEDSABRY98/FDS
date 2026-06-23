"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
    Download, 
    SlidersHorizontal, 
    X, 
    LayoutDashboard, 
    Trophy, 
    Calendar, 
    CalendarDays, 
    Users, 
    Shield, 
    User, 
    GitCompare, 
    Menu, 
    ArrowLeft,
    Award,
    Edit,
    Building2
} from "lucide-react";
import Link from "next/link";

import { EgyptNTService } from "./Service/egypt_nt_db_service";
import { supabase } from "../Database";
import EgyptNTDashboard from "./Dashboard/egypt_nt_db_dashboard";
import EgyptNTMatches from "./Matches/egypt_nt_db_matches";
import EgyptNTSeasons from "./Seasons/egypt_nt_db_seasons";
import EgyptNTYears from "./Years/egypt_nt_db_years";
import EgyptNTPlayers from "./Players/egypt_nt_db_players";
import EgyptNTGKs from "./Gks/egypt_nt_db_gks";
import EgyptNTManagers from "./Managers/egypt_nt_db_managers";
import EgyptNTFilters from "./Filters/egypt_nt_db_filters";
import EgyptNTSquad from "./Squad/egypt_nt_db_squad";
import EgyptNTSquadEditor from "./SquadEditor/egypt_nt_db_squad_editor";
import EgyptNTEditor from "./Editor/egypt_nt_db_editor";
import EgyptNTClubBackfill from "./ClubBackfill/egypt_nt_club_backfill";
import EgyptNTClubStats from "./ClubStats/egypt_nt_db_club_stats";
import { buildMatchContextMap, isEgyptScorerEvent } from "./ClubStats/egypt_nt_db_club_stats_utils";

import EgyptNTMatchDetails from "./MatchDetails/egypt_nt_db_match_details";
import EgyptNTChampions from "./Champions/egypt_nt_db_champions";
import EgyptNTReferees from "./Referees/egypt_nt_db_referees";
import EgyptNTH2H from "./HeadToHead/egypt_nt_db_h2h";
import Loading_db from "../lib/Loading_db";
import "./Sidebar/egypt_nt_sidebar.css";

export default function EgyptNTDatabase() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [matches, setMatches] = useState([]);
    const [playerDetails, setPlayerDetails] = useState([]);
    const [lineupDetails, setLineupDetails] = useState([]);
    const [gkDetails, setGkDetails] = useState([]);
    const [howPenMissed, setHowPenMissed] = useState([]);
    const [squadData, setSquadData] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const matchesListScrollY = useRef(0);

    // Date Range State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [dbFilters, setDbFilters] = useState({
        player_club: 'All',
        match_id: 'All',
        age: 'All',
        champion_system: 'All',
        system_kind: 'All',
        year: 'All',
        champion: 'All',
        champion_type: 'All',
        season: 'All',
        egypt_manager: 'All',
        opponent_manager: 'All',
        referee: 'All',
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
        note: 'All',
        country: 'All',
        continent: 'All'
    });

    useEffect(() => {
        fetchMatchData();
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab");
            if (tabParam) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    async function fetchMatchData(silent = false) {
        if (!silent) setLoading(true);
        const { data: countriesData } = await supabase.from('db_COUNTRIES').select('*');
        if (countriesData) setCountries(countriesData);
        
        const data = await EgyptNTService.getAllMatches();
        
        const { data: champTypes } = await supabase.from('db_CHAMPION_TYPE').select('*');
        const mappedMatches = data.map(m => {
            const champRow = champTypes?.find(c => c.CHAMPION_NAME === m.CHAMPION);
            return {
                ...m,
                CHAMPION_TYPE: champRow ? champRow.CHAMPION_TYPE : 'غير محدد'
            };
        });

        const pData = await EgyptNTService.getAllPlayerDetails();
        const lData = await EgyptNTService.getAllLineupDetails();
        const gData = await EgyptNTService.getAllGKDetails();
        const hData = await EgyptNTService.getAllHowPenMissed();
        const sqData = await EgyptNTService.getAllSquad();

        setMatches(mappedMatches);
        setPlayerDetails(pData);
        setLineupDetails(lData);
        setGkDetails(gData);
        setHowPenMissed(hData);
        setSquadData(sqData);
        if (!silent) setLoading(false);
    }

    const matchContextMap = useMemo(() => buildMatchContextMap(matches), [matches]);

    const matchHasPlayerClub = (m, clubName) => {
        if (!clubName || clubName === 'All') return true;
        const matchId = String(m.MATCH_ID || "");
        const ctx = matchContextMap[matchId];
        if (!ctx) return false;
        return playerDetails.some(row => {
            if (String(row.MATCH_ID || "") !== matchId) return false;
            const club = String(row.CLUB || "").trim();
            if (!club || club !== clubName) return false;
            return isEgyptScorerEvent(row, ctx);
        });
    };

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
            if (val === 'دول عربية') {
                return countryRow && countryRow.IS_ARAB === true;
            }
            return countryRow && countryRow.CONTINENT === val;
        }

        if (key === 'player_club') {
            return matchHasPlayerClub(m, val);
        }
        
        const colMap = {
            match_id: 'MATCH_ID',
            age: 'AGE',
            champion_system: 'CHAMPION_SYSTEM',
            champion: 'CHAMPION',
            champion_type: 'CHAMPION_TYPE',
            season: 'SEASON',
            egypt_manager: 'EGYPT MANAGER',
            opponent_manager: 'OPPONENT MANAGER',
            referee: 'REFREE',
            round: 'ROUND',
            han: 'H-A-N',
            place: 'PLACE',
            egypt_team: 'Egypt TEAM',
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
                
            const hasArab = countries.some(c => c.IS_ARAB === true && (
                matchCountryNames.includes(c.COUNTRY_NAME.toLowerCase()) || 
                (c.COUNTRY_NAME_EN && matchCountryNames.includes(c.COUNTRY_NAME_EN.toLowerCase()))
            ));
            
            const uniqueContinents = new Set(continentOpts);
            if (hasArab) uniqueContinents.add("دول عربية");
                
            return ["All", ...uniqueContinents].sort((a, b) => a.localeCompare(b, 'ar'));
        }

        if (key === 'player_club') {
            const partialMatchIds = new Set(partialMatches.map(m => String(m.MATCH_ID)));
            const clubs = new Set();
            playerDetails.forEach(row => {
                const matchId = String(row.MATCH_ID || "");
                if (!partialMatchIds.has(matchId)) return;
                const club = String(row.CLUB || "").trim();
                if (!club) return;
                const ctx = matchContextMap[matchId];
                if (!ctx || !isEgyptScorerEvent(row, ctx)) return;
                clubs.add(club);
            });
            return ["All", ...[...clubs].sort((a, b) => a.localeCompare(b, 'ar'))];
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
            player_clubs: getOptionsForField('player_club', null),
            match_ids: getOptionsForField('match_id', 'MATCH_ID'),
            ages: getOptionsForField('age', 'AGE'),
            champion_systems: getOptionsForField('champion_system', 'CHAMPION_SYSTEM'),
            years: getOptionsForField('year', null),
            champions: getOptionsForField('champion', 'CHAMPION'),
            champion_types: getOptionsForField('champion_type', 'CHAMPION_TYPE'),
            seasons: getOptionsForField('season', 'SEASON'),
            egy_managers: getOptionsForField('egypt_manager', 'EGYPT MANAGER'),
            opponent_managers: getOptionsForField('opponent_manager', 'OPPONENT MANAGER'),
            referees: getOptionsForField('referee', 'REFREE'),
            rounds: getOptionsForField('round', 'ROUND'),
            places: getOptionsForField('place', 'PLACE'),
            han: getOptionsForField('han', 'H-A-N'),
            egy_teams: getOptionsForField('egypt_team', 'Egypt TEAM'),
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
    }, [matches, dbFilters, countries, startDate, endDate, playerDetails, matchContextMap]);

    const updateFilter = (key, value) => {
        setDbFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setDbFilters({
            player_club: 'All',
            match_id: 'All',
            age: 'All',
            champion_system: 'All',
            year: 'All',
            champion: 'All',
            champion_type: 'All',
            season: 'All',
            egypt_manager: 'All',
            opponent_manager: 'All',
            referee: 'All',
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
                const mYear = mDate.getFullYear().toString();

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
                    if (dbFilters.continent === "دول عربية") {
                        passContinent = countryRow && countryRow.IS_ARAB === true;
                    } else {
                        passContinent = countryRow && countryRow.CONTINENT === dbFilters.continent;
                    }
                }
            }

            return (
                withinRange &&
                passCountry &&
                passContinent &&
                matchHasPlayerClub(m, dbFilters.player_club) &&
                check('match_id', 'MATCH_ID') &&
                check('age', 'AGE') &&
                check('champion_system', 'CHAMPION_SYSTEM') &&
                check('champion', 'CHAMPION') &&
                check('champion_type', 'CHAMPION_TYPE') &&
                check('season', 'SEASON') &&
                check('egypt_manager', 'EGYPT MANAGER') &&
                check('opponent_manager', 'OPPONENT MANAGER') &&
                check('referee', 'REFREE') &&
                check('round', 'ROUND') &&
                check('han', 'H-A-N') &&
                check('place', 'PLACE') &&
                check('egypt_team', 'Egypt TEAM') &&
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
    }, [matches, dbFilters, startDate, endDate, countries, playerDetails, matchContextMap]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'matches', label: 'Matches', icon: Trophy },
        { id: 'editor', label: 'Editor', icon: Edit },
        { id: 'club_backfill', label: 'Club Backfill', icon: Building2 },
        { id: 'squad', label: 'Squad List', icon: Users },
        { id: 'add_squad', label: 'Add Squad', icon: Users },
        { id: 'champions', label: 'Champions', icon: Award },
        { id: 'seasons', label: 'Seasons', icon: Calendar },
        { id: 'years', label: 'Years', icon: Calendar },
        { id: 'players', label: 'Players', icon: Users },
        { id: 'club_stats', label: 'Club Stats', icon: Building2 },
        { id: 'gks', label: 'Gks', icon: Shield },
        { id: 'managers', label: 'Managers', icon: User },
        { id: 'referees', label: 'Referees', icon: Shield },
        { id: 'h2h', label: 'H2h', icon: GitCompare }
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
                            <span className="egypt-sidebar-logo-text">EG</span>
                        </div>
                        <div className="egypt-sidebar-brand-name">
                            EGYPT <span>NT</span>
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
                        onClick={() => window.dispatchEvent(new CustomEvent('egyptnt-export-excel'))}
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
                                EGYPT <span>NT</span>
                            </div>
                        </Link>
                    </div>
                    <div className="egypt-mobile-actions">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('egyptnt-export-excel'))} 
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
                    {loading ? (
                        <Loading_db title="EGYPT NT" subtitle="DATABASE" message="SYNCING DATA" inline={true} />
                    ) : (
                        <>
                            {activeTab === 'dashboard' && <EgyptNTDashboard matches={filteredMatches} season={dbFilters.season} />}
                            {activeTab === 'matches' && (
                                <>
                                    <div hidden={!!selectedMatchId}>
                                        <EgyptNTMatches
                                            matches={filteredMatches}
                                            onMatchClick={(id) => {
                                                matchesListScrollY.current = window.scrollY;
                                                setSelectedMatchId(id);
                                            }}
                                        />
                                    </div>
                                    {selectedMatchId && (
                                        <EgyptNTMatchDetails
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
                                            onRefresh={() => fetchMatchData(true)}
                                        />
                                    )}
                                </>
                            )}
                            {activeTab === 'squad' && (
                                <EgyptNTSquad
                                    squadData={squadData}
                                    matches={matches}
                                    lineupDetails={lineupDetails}
                                    playerDetails={playerDetails}
                                    gkDetails={gkDetails}
                                />
                            )}
                            {activeTab === 'add_squad' && <EgyptNTSquadEditor />}
                            {activeTab === 'seasons' && <EgyptNTSeasons matches={filteredMatches} />}
                            {activeTab === 'years' && <EgyptNTYears matches={filteredMatches} />}
                            {activeTab === 'players' && <EgyptNTPlayers playerDetails={playerDetails} lineupDetails={lineupDetails} filteredMatches={filteredMatches} gkDetails={gkDetails} howPenMissed={howPenMissed} />}
                            {activeTab === 'club_stats' && (
                                <EgyptNTClubStats
                                    playerDetails={playerDetails}
                                    filteredMatches={filteredMatches}
                                />
                            )}
                            {activeTab === 'gks' && <EgyptNTGKs gkDetails={gkDetails} howPenMissed={howPenMissed} filteredMatches={filteredMatches} playerDetails={playerDetails} />}
                            {activeTab === 'managers' && <EgyptNTManagers matches={filteredMatches} playerDetails={playerDetails} lineupDetails={lineupDetails} />}
                            {activeTab === 'h2h' && <EgyptNTH2H matches={filteredMatches} />}
                            {activeTab === 'referees' && <EgyptNTReferees matches={filteredMatches} playerDetails={playerDetails} howPenMissed={howPenMissed} />}
                            {activeTab === 'champions' && <EgyptNTChampions matchesData={filteredMatches} />}
                            {activeTab === 'editor' && <EgyptNTEditor />}
                            {activeTab === 'club_backfill' && (
                                <EgyptNTClubBackfill
                                    matches={matches}
                                    playerDetails={playerDetails}
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
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: '1200px',
                        height: 'min(720px, calc(100vh - 40px))',
                        maxHeight: 'calc(100vh - 40px)',
                        borderRadius: '0',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '5px solid #C8102E',
                        boxShadow: 'none',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
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
                                DATABASE <span style={{ color: '#C8102E' }}>FILTERS</span>
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
                                onMouseOver={(e) => e.currentTarget.style.color = '#C8102E'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#fff'}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            <EgyptNTFilters
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
                                onMouseOver={(e) => { e.currentTarget.style.color = '#C8102E'; e.currentTarget.style.borderColor = '#C8102E'; e.currentTarget.style.background = 'rgba(200,16,46,0.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                RESET ALL FILTERS
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    background: '#0a0a0a',
                                    color: '#fff',
                                    border: '1px solid #C8102E',
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
                                onMouseOver={(e) => { e.currentTarget.style.background = '#C8102E'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#0a0a0a'; }}
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
