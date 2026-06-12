import { useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { TABLES_TO_SORT_BY_ROW_ID } from "../Constants/DbConstants";

export function useTableData(selectedTable, addNotification) {
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTableData = useCallback(async () => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            let allData = [];
            let from = 0;
            const step = 1000;
            let finished = false;

            while (!finished) {
                let query = supabase.from(selectedTable).select("*");

                // Deterministic ordering based on table type
                if (selectedTable === "alahly_PLAYERDATABASE") {
                    query = query.order("PLAYER NAME", { ascending: true }).order("ROW_ID", { ascending: true });
                } else if (selectedTable === "alahly_MATCHDETAILS" || selectedTable === "alahly_vs_zamalek_MATCHDETAILS") {
                    query = query.order("DATE", { ascending: false }).order("ROW_ID", { ascending: true });
                } else if (selectedTable.includes("DETAILS") || selectedTable.includes("MISSED")) {
                    query = query.order("MATCH_ID", { ascending: false }).order("ROW_ID", { ascending: true });
                } else {
                    query = query.order("ROW_ID", { ascending: true });
                }

                const { data, error } = await query.range(from, from + step - 1);

                if (error) throw error;
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += step;
                    if (data.length < step) finished = true;
                } else {
                    finished = true;
                }
            }

            if (allData.length > 0) {
                let cols = Object.keys(allData[0]);
                // Force ROW_ID to the front (case-insensitive check)
                const rowIdIdx = cols.findIndex(c => c.toUpperCase() === "ROW_ID");
                if (rowIdIdx > -1) {
                    const rowIdKey = cols[rowIdIdx];
                    cols.splice(rowIdIdx, 1);
                    cols.unshift(rowIdKey);
                }
                setColumns(cols);

                // Fetch match dates for joined sorting if table is alahly_MEDIATRACKER or alahly_PLAYERDETAILS
                let matchDateMap = {};
                if (['alahly_MEDIATRACKER', 'alahly_PLAYERDETAILS', 'alahly_vs_zamalek_LINEUPDETAILS', 'alahly_vs_zamalek_PLAYERDETAILS'].includes(selectedTable) && cols.includes('MATCH_ID')) {
                    try {
                        const matchTable = selectedTable.startsWith('alahly_vs_zamalek') ? 'alahly_vs_zamalek_MATCHDETAILS' : 'alahly_MATCHDETAILS';
                        const { data: datesData } = await supabase.from(matchTable).select('MATCH_ID, DATE');
                        if (datesData) {
                            datesData.forEach(d => {
                                matchDateMap[d.MATCH_ID] = new Date(d.DATE).getTime();
                                if (isNaN(matchDateMap[d.MATCH_ID]) && d.DATE && d.DATE.includes('/')) {
                                    const [day, month, year] = d.DATE.split('/');
                                    matchDateMap[d.MATCH_ID] = new Date(`${year}-${month}-${day}`).getTime();
                                }
                            });
                        }
                    } catch (err) { console.error("Error fetching dates for sort:", err); }
                }

                // Deterministic secondary sorting logic
                const ridKey = cols.find(c => c.toUpperCase() === "ROW_ID");

                if ((selectedTable === 'alahly_MATCHDETAILS' || selectedTable === 'alahly_vs_zamalek_MATCHDETAILS') && cols.includes('DATE')) {
                    const parseDate = (d) => {
                        if (!d) return 0;
                        if (String(d).includes('/')) {
                            const [day, month, year] = String(d).split('/');
                            const dateObj = new Date(`${year}-${month}-${day}`);
                            return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
                        }
                        const dateObj = new Date(d);
                        return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
                    };
                    allData.sort((a, b) => parseDate(b.DATE) - parseDate(a.DATE));
                } else if (selectedTable === 'alahly_MEDIATRACKER' && cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        const dateA = matchDateMap[a.MATCH_ID] || 0;
                        const dateB = matchDateMap[b.MATCH_ID] || 0;
                        // 1. Primary Sort: Date Descending (Latest first)
                        if (dateB !== dateA) return dateB - dateA;

                        // 2. Secondary Sort: Match ID if dates are equal/missing
                        return String(b.MATCH_ID).localeCompare(String(a.MATCH_ID), undefined, { numeric: true });
                    });
                } else if (selectedTable === 'alahly_vs_zamalek_LINEUPDETAILS' && cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        const dateA = matchDateMap[a.MATCH_ID] || 0;
                        const dateB = matchDateMap[b.MATCH_ID] || 0;
                        // 1. Primary: Date Descending
                        if (dateB !== dateA) return dateB - dateA;
                        
                        // 2. Secondary: Team
                        const teamA = String(a.TEAM || "").toUpperCase();
                        const teamB = String(b.TEAM || "").toUpperCase();
                        if (teamA !== teamB) return teamA.localeCompare(teamB);

                        // 3. Tertiary: ROW_ID Ascending
                        const ridA = a.ROW_ID ? parseInt(a.ROW_ID) : 0;
                        const ridB = b.ROW_ID ? parseInt(b.ROW_ID) : 0;
                        return ridA - ridB;
                    });
                } else if (selectedTable === 'alahly_PLAYERDETAILS' && cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        const dateA = matchDateMap[a.MATCH_ID] || 0;
                        const dateB = matchDateMap[b.MATCH_ID] || 0;

                        // 1. Primary Sort: Date Descending (Latest first)
                        if (dateB !== dateA) return dateB - dateA;

                        // 2. Secondary Sort: EVENT_ID Ascending within same match
                        if (cols.includes('EVENT_ID')) {
                            const getNum = (id) => {
                                if (!id) return 0;
                                const parts = String(id).split('-');
                                const last = parts[parts.length - 1];
                                const n = parseInt(last);
                                return isNaN(n) ? 0 : n;
                            };
                            return getNum(a.EVENT_ID) - getNum(b.EVENT_ID);
                        }
                        return 0;
                    });
                } else if (TABLES_TO_SORT_BY_ROW_ID.includes(selectedTable) && ridKey) {
                    allData.sort((a, b) => String(a[ridKey]).localeCompare(String(b[ridKey]), undefined, { numeric: true }));
                } else if (cols.includes('MATCH_ID')) {
                    allData.sort((a, b) => {
                        // 1. Primary Sort: MATCH_ID Descending (Latest matches first)
                        if (String(a.MATCH_ID) !== String(b.MATCH_ID)) {
                            return String(b.MATCH_ID).localeCompare(String(a.MATCH_ID), undefined, { numeric: true });
                        }

                        // 2. Secondary Sort: depends on table columns
                        if (cols.includes('EVENT_ID')) {
                            const getNum = (id) => {
                                if (!id) return 0;
                                const parts = String(id).split('-');
                                const last = parts[parts.length - 1];
                                const n = parseInt(last);
                                return isNaN(n) ? 0 : n;
                            };
                            return getNum(a.EVENT_ID) - getNum(b.EVENT_ID);
                        } else if (cols.includes('PLAYER NAME')) {
                            return String(a["PLAYER NAME"]).localeCompare(String(b["PLAYER NAME"]));
                        }
                        return 0;
                    });
                }

                // Custom sorting for FINALS tables (handling mixed date formats)
                if (selectedTable.startsWith('alahly_FINALS_') && cols.includes('DATE')) {
                    const ridKey = cols.find(c => c.toUpperCase() === "ROW_ID");
                    allData.sort((a, b) => {
                        const parseDate = (d) => {
                            if (!d) return 0;
                            if (d.includes('/')) {
                                const [day, month, year] = d.split('/');
                                return new Date(`${year}-${month}-${day}`).getTime();
                            }
                            return new Date(d).getTime();
                        };

                        const dateA = parseDate(a.DATE);
                        const dateB = parseDate(b.DATE);

                        // 1. Primary Sort: Date Descending (Latest first)
                        if (dateB !== dateA) return dateB - dateA;

                        // 2. Secondary Sort: ROW_ID Ascending (for Lineup and Player details)
                        if (ridKey && (selectedTable.includes('LINEUPDETAILS') || selectedTable.includes('PLAYERDETAILS'))) {
                            return String(a[ridKey]).localeCompare(String(b[ridKey]), undefined, { numeric: true });
                        }
                        return 0;
                    });
                }

                setTableData(allData);
            } else {
                setTableData([]);
                setColumns([]);
            }
        } catch (error) {
            console.error("Error fetching table data:", error.message);
            addNotification("Error: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [selectedTable, addNotification]);

    return { tableData, columns, loading, fetchTableData };
}
