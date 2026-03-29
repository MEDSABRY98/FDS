"use client";

import { useMemo, useState } from "react";

export default function Manager_PlayersUsed_Module({ stats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'apps', direction: 'desc' });

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const playersList = useMemo(() => {
        let items = Object.values(stats.playerUsedStats || {})
            .map(p => ({ ...p, ga: (p.goals || 0) + (p.assists || 0) }))
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        if (sortConfig.key) {
            items.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (typeof aValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                return sortConfig.direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            });
        }
        return items;
    }, [stats, searchTerm, sortConfig]);

    const totals = useMemo(() => {
        return playersList.reduce((acc, p) => ({
            apps: acc.apps + p.apps,
            mins: acc.mins + p.mins,
            goals: acc.goals + p.goals,
            assists: acc.assists + p.assists,
            ga: acc.ga + p.ga
        }), { apps: 0, mins: 0, goals: 0, assists: 0, ga: 0 });
    }, [playersList]);

    const SortIndicator = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.2, marginLeft: '5px' }}>↕</span>;
        return <span style={{ marginLeft: '5px', color: 'var(--player-gold)' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: '15px' }}>PLAYERS USED BY MANAGER</div>

            {/* Search Container */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                <div className="search-wrap-premium" style={{ width: '100%', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="SEARCH PLAYER NAME..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-search-input"
                        style={{ textAlign: 'center' }}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="player-match-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700' }}>
                                #
                            </th>
                            <th
                                onClick={() => requestSort('name')}
                                style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}
                            >
                                PLAYER NAME <SortIndicator columnKey="name" />
                            </th>
                            <th
                                onClick={() => requestSort('apps')}
                                style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}
                            >
                                APPS <SortIndicator columnKey="apps" />
                            </th>
                            <th
                                onClick={() => requestSort('mins')}
                                style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}
                            >
                                MINUTES <SortIndicator columnKey="mins" />
                            </th>
                            <th
                                onClick={() => requestSort('ga')}
                                style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}
                            >
                                G + A <SortIndicator columnKey="ga" />
                            </th>
                            <th
                                onClick={() => requestSort('goals')}
                                style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}
                            >
                                GOALS <SortIndicator columnKey="goals" />
                            </th>
                            <th
                                onClick={() => requestSort('assists')}
                                style={{ textAlign: 'center', fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '2px', color: '#999', padding: '15px 10px', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}
                            >
                                ASSISTS <SortIndicator columnKey="assists" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {playersList.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
                                    No players found for this manager.
                                </td>
                            </tr>
                        ) : (
                            playersList.map((p, idx) => (
                                <tr key={p.name}>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '800', fontSize: '14px', color: '#ccc' }}>
                                        {idx + 1}
                                    </td>
                                    <td style={{ fontWeight: '800', color: 'var(--player-dark)', fontSize: '15px', fontFamily: 'Outfit' }}>
                                        {p.name}
                                    </td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '22px', color: 'var(--player-gold)' }}>
                                        {p.apps || "-"}
                                    </td>
                                    <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '800', fontSize: '18px' }}>
                                        {p.mins || "0"}
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '22px', fontFamily: 'Outfit' }}>
                                        {p.ga || "-"}
                                    </td>
                                    <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '22px', fontFamily: 'Outfit' }}>
                                        {p.goals || "-"}
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#5ef193', fontWeight: '900', fontSize: '22px', fontFamily: 'Outfit' }}>
                                        {p.assists || "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                        {playersList.length > 0 && (
                            <tr style={{ background: 'rgba(201, 168, 76, 0.05)', borderTop: '2px solid var(--player-gold)' }}>
                                <td style={{ textAlign: 'center', color: '#ccc' }}>
                                    -
                                </td>
                                <td style={{ fontWeight: '900', color: 'var(--player-gold)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontFamily: 'Outfit' }}>
                                    TOTAL
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Outfit', fontWeight: '900', fontSize: '26px' }}>
                                    {totals.apps || "-"}
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'Space Mono', fontWeight: '900', fontSize: '20px' }}>
                                    {totals.mins || "0"}
                                </td>
                                <td style={{ textAlign: 'center', color: '#2ecc71', fontWeight: '900', fontSize: '26px', fontFamily: 'Outfit' }}>
                                    {totals.ga || "-"}
                                </td>
                                <td style={{ textAlign: 'center', color: 'var(--player-gold)', fontWeight: '900', fontSize: '26px', fontFamily: 'Outfit' }}>
                                    {totals.goals || "-"}
                                </td>
                                <td style={{ textAlign: 'center', color: '#5ef193', fontWeight: '900', fontSize: '26px', fontFamily: 'Outfit' }}>
                                    {totals.assists || "-"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
