"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export default function PlayerWithAgainstTable({ data = [], title, isAgainst = false }) {
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'matches', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    // Calculate Win Rate for each partner
    const processedData = useMemo(() => {
        return data.map(item => {
            const winRate = item.matches > 0 ? ((item.wins / item.matches) * 100) : 0;
            return {
                ...item,
                winRate
            };
        });
    }, [data]);

    // Filter and Sort
    const filteredAndSortedList = useMemo(() => {
        let list = processedData.filter(p => 
            String(p.name || "").toLowerCase().includes(search.toLowerCase())
        );

        list.sort((a, b) => {
            const aV = a[sortConfig.key];
            const bV = b[sortConfig.key];

            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' 
                    ? String(aV).localeCompare(String(bV)) 
                    : String(bV).localeCompare(String(aV));
            }

            if (sortConfig.direction === 'asc') return aV - bV;
            return bV - aV;
        });

        return list;
    }, [processedData, search, sortConfig]);

    // Calculate Totals
    const totals = useMemo(() => {
        return filteredAndSortedList.reduce((acc, p) => {
            acc.matches += p.matches;
            acc.wins += p.wins;
            acc.draws += p.draws;
            acc.losses += p.losses;
            return acc;
        }, { matches: 0, wins: 0, draws: 0, losses: 0 });
    }, [filteredAndSortedList]);

    const overallWinRate = useMemo(() => {
        return totals.matches > 0 ? ((totals.wins / totals.matches) * 100).toFixed(1) : "0.0";
    }, [totals]);

    const getSortArrow = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.2 }}>↕</span>;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="history-section fade-in">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <SearchBar_db
                        value={search}
                        onChange={setSearch}
                        placeholder={isAgainst ? "SEARCH OPPONENT PLAYER..." : "SEARCH TEAMMATE..."}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                {filteredAndSortedList.length === 0 ? (
                    <NoData_db message={isAgainst ? "No opponent data available." : "No teammate data available."} />
                ) : (
                    <table className="player-match-table vs-teams-table sortable-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                    PLAYER NAME {getSortArrow('name')}
                                </th>
                                <th onClick={() => handleSort('matches')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                    MATCHES {getSortArrow('matches')}
                                </th>
                                <th onClick={() => handleSort('wins')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                    WINS {getSortArrow('wins')}
                                </th>
                                <th onClick={() => handleSort('draws')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                    DRAWS {getSortArrow('draws')}
                                </th>
                                <th onClick={() => handleSort('losses')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                    LOSSES {getSortArrow('losses')}
                                </th>
                                <th onClick={() => handleSort('winRate')} style={{ textAlign: 'center', cursor: 'pointer', background: 'rgba(201, 168, 76, 0.03)' }}>
                                    WIN RATE % {getSortArrow('winRate')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedList.map((p, i) => (
                                <tr key={p.name}>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono', color: '#999', fontSize: '11px' }}>{i + 1}</td>
                                    <td style={{ fontWeight: '800', color: 'var(--player-dark)' }}>{p.name}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '18px' }}>{p.matches}</td>
                                    <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: '900', fontSize: '18px' }}>{p.wins || "-"}</td>
                                    <td style={{ textAlign: 'center', color: '#f39c12', fontWeight: '900', fontSize: '18px' }}>{p.draws || "-"}</td>
                                    <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '900', fontSize: '18px' }}>{p.losses || "-"}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '950', fontSize: '18px', fontFamily: 'Bebas Neue', color: 'var(--player-gold)', background: 'rgba(201, 168, 76, 0.03)' }}>
                                        {p.winRate.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', color: 'var(--player-gold)', fontWeight: '900' }}>∑</td>
                                <td style={{ fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '15px' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', fontWeight: '950', fontSize: '20px', color: '#000' }}>{totals.matches}</td>
                                <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: '950', fontSize: '20px' }}>{totals.wins}</td>
                                <td style={{ textAlign: 'center', color: '#f39c12', fontWeight: '950', fontSize: '20px' }}>{totals.draws}</td>
                                <td style={{ textAlign: 'center', color: '#e74c3c', fontWeight: '950', fontSize: '20px' }}>{totals.losses}</td>
                                <td style={{ textAlign: 'center', fontWeight: '950', fontSize: '22px', fontFamily: 'Bebas Neue', color: 'var(--player-gold)' }}>{overallWinRate}%</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .sortable-table th:hover {
                    color: var(--player-gold) !important;
                    background: rgba(201, 168, 76, 0.03);
                }
                .sortable-table th {
                    transition: 0.2s;
                    user-select: none;
                }
            `}</style>
        </div>
    );
}
