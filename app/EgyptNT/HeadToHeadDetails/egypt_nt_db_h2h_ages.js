"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";

export default function EgyptNTH2HAges({ matches }) {
    const [sortConfig, setSortConfig] = useState({ key: 'matchesPlayed', direction: 'desc' });
    const [searchQuery, setSearchQuery] = useState('');

    const statsByAge = useMemo(() => {
        const ageMap = {};

        matches.forEach(m => {
            const rawAge = m.AGE || "Unknown";
            const age = String(rawAge).trim();

            if (!ageMap[age]) {
                ageMap[age] = {
                    age: age,
                    matchesPlayed: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    csFor: 0,
                    csAgainst: 0
                };
            }

            const s = ageMap[age];
            s.matchesPlayed++;
            
            const gf = Number(m.GF) || 0;
            const ga = Number(m.GA) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();

            s.gf += gf;
            s.ga += ga;

            if (wdl.includes('W')) s.wins++;
            else if (wdl.includes('D')) s.draws++;
            else if (wdl.includes('L')) s.losses++;

            if (ga === 0) s.csFor++;
            if (gf === 0) s.csAgainst++;
        });

        return Object.values(ageMap);
    }, [matches]);

    const filteredStats = useMemo(() => {
        if (!searchQuery) return statsByAge;
        const lowerQ = searchQuery.toLowerCase();
        return statsByAge.filter(s => String(s.age).toLowerCase().includes(lowerQ));
    }, [statsByAge, searchQuery]);

    const sortedStats = useMemo(() => {
        if (!sortConfig.key) return filteredStats;

        return [...filteredStats].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }

            const strA = String(aVal);
            const strB = String(bVal);
            return sortConfig.direction === 'asc' ? strA.localeCompare(strB, undefined, {numeric: true}) : strB.localeCompare(strA, undefined, {numeric: true});
        });
    }, [filteredStats, sortConfig]);

    const totals = useMemo(() => {
        return filteredStats.reduce((acc, curr) => {
            acc.matchesPlayed += curr.matchesPlayed;
            acc.wins += curr.wins;
            acc.draws += curr.draws;
            acc.losses += curr.losses;
            acc.gf += curr.gf;
            acc.ga += curr.ga;
            acc.csFor += curr.csFor;
            acc.csAgainst += curr.csAgainst;
            return acc;
        }, { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csFor: 0, csAgainst: 0 });
    }, [filteredStats]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (statsByAge.length === 0) {
        return <NoData_db message="No age statistics available for this opponent." />;
    }

    return (
        <div className="h2h-ages-wrap fade-in">
            <div className="h2h-ages-controls" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <input 
                    type="text" 
                    placeholder="Search Ages..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                        padding: '10px 15px', 
                        border: '1px solid #ddd', 
                        borderRadius: '2px', 
                        width: '250px', 
                        fontFamily: 'Inter',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                />
            </div>
            <div className="h2h-ages-container">
                <table className="h2h-ages-table">
                    <thead>
                        <tr>
                            <th className="sortable" onClick={() => handleSort('age')}>
                                AGE {sortConfig.key === 'age' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('matchesPlayed')}>
                                P {sortConfig.key === 'matchesPlayed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('wins')}>
                                W {sortConfig.key === 'wins' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('draws')}>
                                D {sortConfig.key === 'draws' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('losses')}>
                                L {sortConfig.key === 'losses' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('gf')}>
                                GF {sortConfig.key === 'gf' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('ga')}>
                                GA {sortConfig.key === 'ga' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('csFor')}>
                                CS FOR {sortConfig.key === 'csFor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('csAgainst')}>
                                CS AG {sortConfig.key === 'csAgainst' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStats.map((s) => (
                            <tr key={s.age}>
                                <td className="age-cell">{s.age}</td>
                                <td>{s.matchesPlayed}</td>
                                <td style={{ fontWeight: 600, color: s.wins > s.losses ? '#27ae60' : 'inherit' }}>{s.wins}</td>
                                <td>{s.draws}</td>
                                <td style={{ fontWeight: 600, color: s.losses > s.wins ? '#b71c1c' : 'inherit' }}>{s.losses}</td>
                                <td>{s.gf}</td>
                                <td>{s.ga}</td>
                                <td style={{ fontWeight: 600 }}>{s.csFor}</td>
                                <td style={{ fontWeight: 600 }}>{s.csAgainst}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td className="age-cell" style={{ textAlign: 'left', paddingLeft: '20px' }}></td>
                            <td>{totals.matchesPlayed}</td>
                            <td style={{ fontWeight: 600, color: totals.wins > totals.losses ? '#27ae60' : 'inherit' }}>{totals.wins}</td>
                            <td>{totals.draws}</td>
                            <td style={{ fontWeight: 600, color: totals.losses > totals.wins ? '#b71c1c' : 'inherit' }}>{totals.losses}</td>
                            <td>{totals.gf}</td>
                            <td>{totals.ga}</td>
                            <td style={{ fontWeight: 600 }}>{totals.csFor}</td>
                            <td style={{ fontWeight: 600 }}>{totals.csAgainst}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
