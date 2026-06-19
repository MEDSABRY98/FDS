import React, { useState, useEffect } from 'react';
import { Calendar, Layers, Clock, TrendingUp } from 'lucide-react';
import { supabase } from "../../Database";
import NoData_db from '../../lib/NoData_db';

function isEntityStatsEmpty(stats) {
    if (!stats) return true;

    const total = Number(stats.total_occurrences || 0);
    const hasTables = Array.isArray(stats.tables) && stats.tables.length > 0;
    const hasTimeline = Boolean(stats.first_appearance || stats.last_appearance);

    return total === 0 && !hasTables && !hasTimeline;
}

export default function EntityStatsModal({
    isOpen,
    onClose,
    entityTable,
    entityId,
    entityLabel = ''
}) {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !entityTable || !entityId) return;

        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase.rpc('get_entity_timeline_and_tables', {
                    p_table: entityTable,
                    p_entity_id: entityId
                });

                if (error) throw error;
                if (data?.error) {
                    setStats(null);
                    return;
                }
                setStats(data);
            } catch (err) {
                const message = err?.message || err?.details || err?.hint || "Unknown error";
                console.error("Failed to fetch entity stats:", message);
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isOpen, entityTable, entityId]);

    if (!isOpen) return null;

    const getEntityTypeLabel = () => {
        if (entityTable === 'db_PLAYERS') return 'PLAYER';
        if (entityTable === 'db_MANAGERS') return 'MANAGER';
        if (entityTable === 'db_REFEREES') return 'REFEREE';
        if (entityTable === 'db_TEAMS') return 'TEAM';
        if (entityTable === 'db_COUNTRIES') return 'COUNTRY';
        return 'STADIUM';
    };

    const displayName = stats?.entity_name || entityLabel || entityId;
    const hasTimeline = Boolean(stats?.first_appearance || stats?.last_appearance);
    const hasTableAppearances = Array.isArray(stats?.tables) && stats.tables.length > 0;

    return (
        <div className="edit-modal-wrap" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'none' }}>
            <div className="edit-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
                <h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '20px' }}>
                        <span>{getEntityTypeLabel()}: {displayName}</span>
                        <span style={{ fontSize: '11px', color: '#c9a84c', letterSpacing: '1px', fontWeight: '800' }}>STATISTICS & HISTORY</span>
                    </div>
                </h3>

                <div className="modal-form" style={{ display: 'block', maxHeight: '60vh' }}>
                    {loading ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <div className="db-loader" style={{ margin: '0 auto 15px auto', padding: '0', fontSize: '20px' }}>SYNCING...</div>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#888', letterSpacing: '1px' }}>FETCHING DATABASE RECORD TIMELINE...</span>
                        </div>
                    ) : error ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#cf1322', background: '#fff1f0', borderRadius: '8px', border: '1px solid #ffa39e' }}>
                            <p style={{ margin: 0, fontWeight: '700' }}>Failed to retrieve data: {error}</p>
                        </div>
                    ) : isEntityStatsEmpty(stats) ? (
                        <NoData_db
                            message="No database activity found for this entity."
                            height="220px"
                        />
                    ) : stats ? (
                        <div className="stats-modal-content">
                            {/* Highlights Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ background: '#fcfaf2', border: '1px solid #f1ebd7', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#c9a84c', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Occurrences</div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#000' }}>{stats.total_occurrences} times</div>
                                    </div>
                                </div>
                                
                                <div style={{ background: '#f9f9f9', border: '1px solid #eee', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#000', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database ID</div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#000' }}>{stats.entity_id || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {hasTimeline && (
                                <div style={{ background: '#fbfbfb', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                                    <h4 style={{ margin: '0 0 15px 0', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={16} style={{ color: '#c9a84c' }} />
                                        Historical Timeframe / Active Period
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '10px 0' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>First Appearance</div>
                                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#000', marginTop: '4px' }}>{stats.first_appearance}</div>
                                        </div>
                                        <div style={{ width: '40px', height: '2px', background: '#c9a84c', margin: '0 15px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#c9a84c', borderRadius: '50%', top: '-3px', left: '-3px' }}></div>
                                            <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#c9a84c', borderRadius: '50%', top: '-3px', right: '-3px' }}></div>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Last Appearance</div>
                                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#000', marginTop: '4px' }}>{stats.last_appearance}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasTableAppearances && (
                                <div>
                                    <h4 style={{ margin: '0 0 15px 0', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Layers size={16} style={{ color: '#c9a84c' }} />
                                        Database Table Appearances
                                    </h4>
                                    <div style={{ overflow: 'hidden', border: '1px solid #eee', borderRadius: '8px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                                    <th style={{ padding: '12px 15px', fontWeight: '800', color: '#555' }}>Table Source</th>
                                                    <th style={{ padding: '12px 15px', fontWeight: '800', color: '#555', textAlign: 'center' }}>Appearances</th>
                                                    <th style={{ padding: '12px 15px', fontWeight: '800', color: '#555', textAlign: 'right' }}>Date Range</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.tables.map((tbl, i) => (
                                                    <tr key={tbl.table_name || i} style={{ borderBottom: i < stats.tables.length - 1 ? '1px solid #eee' : 'none' }}>
                                                        <td style={{ padding: '12px 15px', fontWeight: '700', color: '#000' }}>
                                                            {tbl.table_label}
                                                        </td>
                                                        <td style={{ padding: '12px 15px', fontWeight: '800', color: '#c9a84c', textAlign: 'center' }}>
                                                            {tbl.count}
                                                        </td>
                                                        <td style={{ padding: '12px 15px', color: '#666', textAlign: 'right', fontSize: '11px', fontWeight: '600' }}>
                                                            {tbl.min_date ? `${tbl.min_date} to ${tbl.max_date}` : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NoData_db
                            message="No database activity found for this entity."
                            height="220px"
                        />
                    )}
                </div>

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose} style={{ background: '#000', color: '#c9a84c', fontWeight: '800' }}>
                        CLOSE VIEW
                    </button>
                </div>
            </div>
        </div>
    );
}
