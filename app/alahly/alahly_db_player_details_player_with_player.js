"use client";

import { useMemo, useState } from "react";

export default function PlayerWithPlayerTable({ stats }) {
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });

    const { assistsFrom, assistsTo } = stats.playerWithPlayerStats || { assistsFrom: {}, assistsTo: {} };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    // Combine and Filter
    const partners = useMemo(() => {
        const map = {};
        Object.entries(assistsFrom).forEach(([name, count]) => {
            if (!map[name]) map[name] = { given: 0, received: 0 };
            map[name].received += count;
        });
        Object.entries(assistsTo).forEach(([name, count]) => {
            if (!map[name]) map[name] = { given: 0, received: 0 };
            map[name].given += count;
        });

        let list = Object.entries(map)
            .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
            .map(([name, s]) => ({
                name,
                given: s.given,
                received: s.received,
                total: s.given + s.received
            }));

        // Apply Sorting
        list.sort((a, b) => {
            const aV = a[sortConfig.key];
            const bV = b[sortConfig.key];

            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
            }

            if (sortConfig.direction === 'asc') return aV - bV;
            return bV - aV;
        });

        return list;
    }, [assistsFrom, assistsTo, search, sortConfig]);

    // Calculate Totals
    const totals = useMemo(() => {
        return partners.reduce((acc, p) => {
            acc.given += p.given;
            acc.received += p.received;
            acc.total += p.total;
            return acc;
        }, { given: 0, received: 0, total: 0 });
    }, [partners]);

    const getSortArrow = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.2 }}>↕</span>;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>TEAMMATE INTERACTION (P W P)</div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                <div className="search-wrap-premium" style={{ flex: 'none', width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="SEARCH TEAMMATE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-search-input"
                        style={{ textAlign: 'center' }}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table vs-teams-table sortable-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                PLAYER (TEAMMATE) {getSortArrow('name')}
                            </th>
                            <th onClick={() => handleSort('given')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                ASSISTS GIVEN {getSortArrow('given')}
                            </th>
                            <th onClick={() => handleSort('received')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                                ASSISTS RECEIVED {getSortArrow('received')}
                            </th>
                            <th onClick={() => handleSort('total')} style={{ textAlign: 'center', cursor: 'pointer', background: 'rgba(201, 168, 76, 0.03)' }}>
                                TOTAL {getSortArrow('total')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {partners.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No partnership data available.</td>
                            </tr>
                        ) : (
                            partners.map((p, i) => (
                                <tr key={p.name}>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono', color: '#999', fontSize: '11px' }}>{i + 1}</td>
                                    <td style={{ fontWeight: '800', color: 'var(--player-dark)' }}>{p.name}</td>
                                    <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: '900', fontSize: '20px' }}>{p.given || "-"}</td>
                                    <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '20px' }}>{p.received || "-"}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '950', fontSize: '22px', fontFamily: 'Bebas Neue', color: '#000', background: 'rgba(201, 168, 76, 0.03)' }}>{p.total || "-"}</td>
                                </tr>
                            ))
                        )}
                        {partners.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', color: 'var(--player-gold)', fontWeight: '900' }}>∑</td>
                                <td style={{ fontWeight: '950', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '15px' }}>TOTAL</td>
                                <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: '900', fontSize: '24px' }}>{totals.given || "-"}</td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '950', fontSize: '24px' }}>{totals.received || "-"}</td>
                                <td style={{ textAlign: 'center', fontWeight: '950', fontSize: '28px', fontFamily: 'Bebas Neue', color: '#000' }}>{totals.total || "-"}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
