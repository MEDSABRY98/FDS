/* d:\FDS\Football Database\app\CheckData\reports\egy_NT_ScoreCheck.js */
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "../Database";
import EgyptNTFilters from "../EgyptNT/Filters/egypt_nt_db_filters";
import NoData_db from "../lib/NoData_db";

// Count a row as a goal event only if TYPE === "GOAL" exactly.
function isGoalEvent(event) {
    const type = String(event?.TYPE || "").trim().toUpperCase();
    return type === "GOAL";
}

// Fetch all rows from Supabase, bypassing the 1000 row limit
async function fetchAllRows(tableName, selectQuery) {
    let allData = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from(tableName)
            .select(selectQuery)
            .range(from, from + step - 1);

        if (error) throw error;

        allData = [...allData, ...data];
        if (data.length < step) {
            hasMore = false;
        } else {
            from += step;
        }
    }
    return allData;
}

export default function EgyptScoreCheck({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Database raw data cache
    const [rawMatches, setRawMatches] = useState([]);
    const [rawEvents, setRawEvents] = useState([]);
    const [countries, setCountries] = useState([]);

    // Pending filters (inside popup, not applied yet)
    const EMPTY_FILTERS = {
        player_club: 'All',
        match_id: 'All',
        age: 'All',
        champion_system: 'All',
        system_kind: 'All',
        year: 'All',
        champion: 'All',
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
    };
    const [pendingFilters, setPendingFilters] = useState({ ...EMPTY_FILTERS });
    const [pendingStartDate, setPendingStartDate] = useState("");
    const [pendingEndDate, setPendingEndDate] = useState("");

    // Applied filters (used for mismatch calculation — only set on Apply click)
    const [dbFilters, setDbFilters] = useState({ ...EMPTY_FILTERS });

    // Filter popup open state & applied date range
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination
    const PAGE_SIZE = 100;
    const [currentPage, setCurrentPage] = useState(1);

    // Helper functions for match filtering
    const getMatchCountryName = (opponentTeam) => {
        if (!opponentTeam) return null;
        const parts = opponentTeam.split(' - ');
        return parts[parts.length - 1].trim().toLowerCase();
    };

    const matchHasPlayerClub = (m, clubName) => {
        if (!clubName || clubName === 'All') return true;
        const matchId = String(m.MATCH_ID || "");
        return rawEvents.some(row => {
            if (String(row.MATCH_ID || "") !== matchId) return false;
            const club = String(row.CLUB || "").trim();
            if (!club || club !== clubName) return false;
            // Any goal event (TYPE=GOAL) counts, regardless of team
            return isGoalEvent(row);
        });
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

        if (key === 'player_club') {
            return matchHasPlayerClub(m, val);
        }

        const colMap = {
            match_id: 'MATCH_ID',
            age: 'AGE',
            champion_system: 'CHAMPION_SYSTEM',
            system_kind: 'SYSTEM_KIND',
            champion: 'CHAMPION',
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

    const getOptionsForField = (key, colName, matchesList, countriesList, eventsList) => {
        const partialMatches = matchesList.filter(m => {
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
                if (!checkMatchPassesFilter(m, k, dbFilters[k], countriesList, startDate, endDate)) {
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

            const countryOpts = countriesList
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

            const continentOpts = countriesList
                .filter(c => c.CONTINENT && (
                    matchCountryNames.includes(c.COUNTRY_NAME.toLowerCase()) ||
                    (c.COUNTRY_NAME_EN && matchCountryNames.includes(c.COUNTRY_NAME_EN.toLowerCase()))
                ))
                .map(c => c.CONTINENT);

            return ["All", ...new Set(continentOpts)].sort((a, b) => a.localeCompare(b, 'ar'));
        }

        if (key === 'player_club') {
            const partialMatchIds = new Set(partialMatches.map(m => String(m.MATCH_ID)));
            const clubs = new Set();
            eventsList.forEach(row => {
                const matchId = String(row.MATCH_ID || "");
                if (!partialMatchIds.has(matchId)) return;
                const club = String(row.CLUB || "").trim();
                if (!club) return;
                // Only TYPE=GOAL rows count
                if (isGoalEvent(row)) clubs.add(club);
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

    const updateFilter = (key, val) => {
        setPendingFilters(prev => ({ ...prev, [key]: val }));
    };

    const resetFilters = () => {
        setPendingFilters({ ...EMPTY_FILTERS });
        setPendingStartDate("");
        setPendingEndDate("");
        // Also clear applied filters immediately
        setDbFilters({ ...EMPTY_FILTERS });
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    };

    const filterOptions = useMemo(() => {
        if (rawMatches.length === 0) return {};
        return {
            player_clubs: getOptionsForField('player_club', null, rawMatches, countries, rawEvents),
            match_ids: getOptionsForField('match_id', 'MATCH_ID', rawMatches, countries, rawEvents),
            ages: getOptionsForField('age', 'AGE', rawMatches, countries, rawEvents),
            champion_systems: getOptionsForField('champion_system', 'CHAMPION_SYSTEM', rawMatches, countries, rawEvents),
            system_kinds: getOptionsForField('system_kind', 'SYSTEM_KIND', rawMatches, countries, rawEvents),
            years: getOptionsForField('year', null, rawMatches, countries, rawEvents),
            champions: getOptionsForField('champion', 'CHAMPION', rawMatches, countries, rawEvents),
            seasons: getOptionsForField('season', 'SEASON', rawMatches, countries, rawEvents),
            egy_managers: getOptionsForField('egypt_manager', 'EGYPT MANAGER', rawMatches, countries, rawEvents),
            opponent_managers: getOptionsForField('opponent_manager', 'OPPONENT MANAGER', rawMatches, countries, rawEvents),
            referees: getOptionsForField('referee', 'REFREE', rawMatches, countries, rawEvents),
            rounds: getOptionsForField('round', 'ROUND', rawMatches, countries, rawEvents),
            places: getOptionsForField('place', 'PLACE', rawMatches, countries, rawEvents),
            han: getOptionsForField('han', 'H-A-N', rawMatches, countries, rawEvents),
            egy_teams: getOptionsForField('egypt_team', 'Egypt TEAM', rawMatches, countries, rawEvents),
            gf: getOptionsForField('gf', 'GF', rawMatches, countries, rawEvents),
            ga: getOptionsForField('ga', 'GA', rawMatches, countries, rawEvents),
            et: getOptionsForField('et', 'ET', rawMatches, countries, rawEvents),
            pen: getOptionsForField('pen', 'PEN', rawMatches, countries, rawEvents),
            opponent_teams: getOptionsForField('opponent_team', 'OPPONENT TEAM', rawMatches, countries, rawEvents),
            wdl: getOptionsForField('wdl', 'W-D-L', rawMatches, countries, rawEvents),
            clean_sheets: getOptionsForField('clean_sheet', 'CLEAN SHEET', rawMatches, countries, rawEvents),
            notes: getOptionsForField('note', 'NOTE', rawMatches, countries, rawEvents),
            countries: getOptionsForField('country', null, rawMatches, countries, rawEvents),
            continents: getOptionsForField('continent', null, rawMatches, countries, rawEvents)
        };
    }, [rawMatches, dbFilters, startDate, endDate, countries, rawEvents]);

    // Check if any filters are active
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        Object.keys(dbFilters).forEach(key => {
            if (dbFilters[key] !== 'All') count++;
        });
        if (startDate) count++;
        if (endDate) count++;
        return count;
    }, [dbFilters, startDate, endDate]);

    // Memoized mismatch calculation — team-agnostic total goal count
    const mismatches = useMemo(() => {
        if (rawMatches.length === 0) return [];

        // 1. Group events by MATCH_ID for efficiency
        const eventsByMatch = {};
        rawEvents.forEach(event => {
            if (!event.MATCH_ID) return;
            if (!eventsByMatch[event.MATCH_ID]) eventsByMatch[event.MATCH_ID] = [];
            eventsByMatch[event.MATCH_ID].push(event);
        });

        // 2. Filter matches by active filters
        const filteredMatches = rawMatches.filter(m => {
            if (m.DATE) {
                const mDate = new Date(m.DATE);
                if (startDate && mDate < new Date(startDate)) return false;
                if (endDate && mDate > new Date(endDate)) return false;
            } else if (startDate || endDate) {
                return false;
            }
            for (const key of Object.keys(dbFilters)) {
                if (!checkMatchPassesFilter(m, key, dbFilters[key], countries, startDate, endDate)) return false;
            }
            return true;
        });

        // 3. For each match: count total GOAL+OG rows and compare to GF+GA
        const foundMismatches = [];
        filteredMatches.forEach(match => {
            const matchId = match.MATCH_ID;
            const dbGf = parseInt(match.GF, 10) || 0;
            const dbGa = parseInt(match.GA, 10) || 0;
            const dbTotal = dbGf + dbGa;

            const matchEvents = eventsByMatch[matchId] || [];
            // Count rows where TYPE = "GOAL" only
            const calcTotal = matchEvents.filter(isGoalEvent).length;

            // Show mismatch card only when goal row count ≠ scoreline total AND calcTotal > 0 (data is present)
            if (calcTotal > 0 && calcTotal !== dbTotal) {
                foundMismatches.push({
                    matchId,
                    date: match.DATE,
                    opponentTeam: match["OPPONENT TEAM"] || "OPPONENT",
                    dbGf,
                    dbGa,
                    dbTotal,
                    calcTotal,
                    champion: match.CHAMPION,
                    season: match.SEASON
                });
            }
        });

        return foundMismatches.sort((a, b) => b.matchId.localeCompare(a.matchId));
    }, [rawMatches, rawEvents, dbFilters, startDate, endDate, countries]);

    // Memoized stats based on filtered matches count
    const stats = useMemo(() => {
        const total = rawMatches.filter(m => {
            if (m.DATE) {
                const mDate = new Date(m.DATE);
                if (startDate && mDate < new Date(startDate)) return false;
                if (endDate && mDate > new Date(endDate)) return false;
            } else if (startDate || endDate) {
                return false;
            }

            for (const key of Object.keys(dbFilters)) {
                if (!checkMatchPassesFilter(m, key, dbFilters[key], countries, startDate, endDate)) {
                    return false;
                }
            }
            return true;
        }).length;

        const mismatchCount = mismatches.length;
        const integrityPercent = total > 0 ? Math.round(((total - mismatchCount) / total) * 100) : 100;
        return { totalMatches: total, mismatchCount, integrityPercent };
    }, [rawMatches, mismatches, dbFilters, startDate, endDate, countries]);

    useEffect(() => {
        runValidation();
    }, []);

    const runValidation = async () => {
        setLoading(true);
        setError("");
        try {
            // 1. Fetch all matches (bypassing 1000 limit)
            const matches = await fetchAllRows("egy_NT_MATCHDETAILS", "*");

            // 2. Fetch all player events
            const playerEvents = await fetchAllRows("egy_NT_PLAYERDETAILS", "MATCH_ID, TEAM, TYPE, TYPE_SUB, CLUB");

            // 3. Fetch countries
            const countriesData = await fetchAllRows("db_COUNTRIES", "*");

            if (countriesData) setCountries(countriesData);

            // Cache data in state variables to trigger useMemo calculations
            setRawMatches(matches || []);
            setRawEvents(playerEvents || []);

        } catch (err) {
            console.error("Validation Error:", err);
            setError(err.message || "An error occurred while fetching database records.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="report-view-container">
                <div className="report-view-header">
                    <div className="report-back-nav">
                        <button className="report-btn-back" onClick={onBack} style={{ padding: '10px', borderRadius: '50%' }} title="Back to Reports">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="report-title-wrap">
                            <h3>SCORE VS SCORERS MATCH CHECK</h3>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <button
                            className="report-btn-back"
                            onClick={() => setIsFilterOpen(true)}
                            disabled={loading}
                            style={{
                                border: activeFiltersCount > 0 ? "1.5px solid #C8102E" : "1.5px solid #ddd",
                                padding: "8px 16px",
                                borderRadius: "10px",
                                background: activeFiltersCount > 0 ? "rgba(200,16,46,0.04)" : "#fff",
                                color: activeFiltersCount > 0 ? "#C8102E" : "inherit"
                            }}
                        >
                            <SlidersHorizontal size={14} style={{ marginRight: "4px" }} />
                            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
                        </button>

                        <button className="report-btn-back" onClick={runValidation} disabled={loading} style={{ border: "1.5px solid #ddd", padding: "8px 16px", borderRadius: "10px", background: "#fff" }}>
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span>Re-run</span>
                        </button>

                        {loading ? (
                            <span className="report-status-badge loading">SYNCING...</span>
                        ) : mismatches.length > 0 ? (
                            <span className="report-status-badge error">
                                <ShieldAlert size={14} style={{ marginRight: "4px" }} />
                                {mismatches.length} DISCREPANCIES
                            </span>
                        ) : (
                            <span className="report-status-badge success">
                                <CheckCircle size={14} style={{ marginRight: "4px" }} />
                                ALL CLEAN
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1.5px solid rgba(239, 68, 68, 0.2)", borderRadius: "16px", padding: "16px", color: "#ef4444", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                        <AlertTriangle size={20} />
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{error}</p>
                    </div>
                )}

                {loading && (
                    <>
                        {/* Skeleton summary bar */}
                        <div className="report-summary-bar">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="summary-item">
                                    <div style={{ height: '36px', width: '60px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: '6px', margin: '0 auto 8px' }} />
                                    <div style={{ height: '12px', width: '90px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: '4px', margin: '0 auto' }} />
                                </div>
                            ))}
                        </div>

                        {/* Skeleton card grid */}
                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8', fontWeight: 700, marginBottom: '12px', letterSpacing: '1px' }}>
                            LOADING DATA...
                        </div>
                        <div className="mismatches-grid">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="mismatch-card" style={{ pointerEvents: 'none', cursor: 'default' }}>
                                    <div style={{ height: '18px', width: '70%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.4s ${i * 0.08}s infinite`, borderRadius: '4px', marginBottom: '8px' }} />
                                    <div style={{ height: '13px', width: '90%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.4s ${i * 0.08}s infinite`, borderRadius: '4px', marginBottom: '6px' }} />
                                    <div style={{ height: '13px', width: '55%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.4s ${i * 0.08}s infinite`, borderRadius: '4px' }} />
                                </div>
                            ))}
                        </div>
                        <style>{`
                        @keyframes shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                    </>
                )}

                {!loading && !error && (
                    <>
                        {/* No-data state when filters produce 0 matches */}
                        {stats.totalMatches === 0 ? (
                            <NoData_db
                                message="NO MATCHES FOUND FOR THE SELECTED FILTERS"
                                height="300px"
                            />
                        ) : (
                            <>
                                {/* Summary Row */}
                                <div className="report-summary-bar">
                                    <div className="summary-item">
                                        <div className="summary-value">{stats.totalMatches}</div>
                                        <div className="summary-label">Total Matches Checked</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-value mismatch-count">{stats.mismatchCount}</div>
                                        <div className="summary-label">Discrepancies Found</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-value" style={{ color: stats.integrityPercent === 100 ? "#22c55e" : "#c9a84c" }}>
                                            {stats.integrityPercent}%
                                        </div>
                                        <div className="summary-label">Data Integrity</div>
                                    </div>
                                </div>

                                {/* Mismatches Display */}
                                {mismatches.length > 0 ? (
                                    <div>
                                        {/* Pagination info */}
                                        {(() => {
                                            const totalPages = Math.ceil(mismatches.length / PAGE_SIZE);
                                            const pageStart = (currentPage - 1) * PAGE_SIZE;
                                            const pageEnd = Math.min(pageStart + PAGE_SIZE, mismatches.length);
                                            const pageMismatches = mismatches.slice(pageStart, pageEnd);
                                            return (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 700 }}>
                                                            CLICK ON A MATCH ID TO COPY IT — Showing {pageStart + 1}–{pageEnd} of {mismatches.length}
                                                        </p>
                                                        {totalPages > 1 && (
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <button
                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={currentPage === 1}
                                                                    style={{ padding: '6px 14px', border: '1.5px solid #ddd', background: currentPage === 1 ? '#f5f5f5' : '#fff', borderRadius: '6px', cursor: currentPage === 1 ? 'default' : 'pointer', fontWeight: 700, fontSize: '13px', color: currentPage === 1 ? '#aaa' : '#333' }}
                                                                >← Prev</button>
                                                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{currentPage} / {totalPages}</span>
                                                                <button
                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                    disabled={currentPage === totalPages}
                                                                    style={{ padding: '6px 14px', border: '1.5px solid #ddd', background: currentPage === totalPages ? '#f5f5f5' : '#fff', borderRadius: '6px', cursor: currentPage === totalPages ? 'default' : 'pointer', fontWeight: 700, fontSize: '13px', color: currentPage === totalPages ? '#aaa' : '#333' }}
                                                                >Next →</button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mismatches-grid">
                                                        {pageMismatches.map((m) => (
                                                            <div
                                                                key={m.matchId}
                                                                onClick={() => navigator.clipboard.writeText(m.matchId)}
                                                                className="mismatch-card"
                                                                style={{ cursor: 'copy' }}
                                                            >
                                                                <div className="mismatch-id">{m.matchId}</div>
                                                                <div className="mismatch-details">
                                                                    {m.dbGf}-{m.dbGa} &nbsp;|&nbsp; Goals in DB: {m.dbTotal} / Found: {m.calcTotal}
                                                                </div>
                                                                <div className="mismatch-teams">
                                                                    {m.opponentTeam} ({new Date(m.date).getFullYear()})
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {totalPages > 1 && (
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                                                            <button
                                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                disabled={currentPage === 1}
                                                                style={{ padding: '8px 20px', border: '1.5px solid #ddd', background: currentPage === 1 ? '#f5f5f5' : '#fff', borderRadius: '6px', cursor: currentPage === 1 ? 'default' : 'pointer', fontWeight: 700, fontSize: '13px', color: currentPage === 1 ? '#aaa' : '#333' }}
                                                            >← Prev</button>
                                                            <span style={{ padding: '8px 16px', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{currentPage} / {totalPages}</span>
                                                            <button
                                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                disabled={currentPage === totalPages}
                                                                style={{ padding: '8px 20px', border: '1.5px solid #ddd', background: currentPage === totalPages ? '#f5f5f5' : '#fff', borderRadius: '6px', cursor: currentPage === totalPages ? 'default' : 'pointer', fontWeight: 700, fontSize: '13px', color: currentPage === totalPages ? '#aaa' : '#333' }}
                                                            >Next →</button>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="clean-report-view">
                                        <span className="clean-icon">🎉</span>
                                        <h4 className="clean-title">No Goal Mismatches Found!</h4>
                                        <p className="clean-desc">All match scorelines perfectly correspond to the goalscorer details inside the database.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

            </div>

            {/* FILTER POPUP MODAL — rendered outside .report-view-container to avoid backdrop-filter stacking context */}
            {isFilterOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 100000,
                    background: 'rgba(0,0,0,0.5)',
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
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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
                                dbFilters={pendingFilters}
                                updateFilter={updateFilter}
                                resetFilters={resetFilters}
                                filterOptions={filterOptions}
                                startDate={pendingStartDate} setStartDate={setPendingStartDate}
                                endDate={pendingEndDate} setEndDate={setPendingEndDate}
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
                                onClick={() => {
                                    // Apply pending → applied on click
                                    setDbFilters({ ...pendingFilters });
                                    setStartDate(pendingStartDate);
                                    setEndDate(pendingEndDate);
                                    setCurrentPage(1);
                                    setIsFilterOpen(false);
                                }}
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
        </>
    );
}
