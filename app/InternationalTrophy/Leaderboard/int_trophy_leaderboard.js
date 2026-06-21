"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import { IntTrophyService } from "../Service/int_trophy_service";
import IntTrophyTeamDetails from "../TeamDetails/int_trophy_team_details";
import "./int_trophy_leaderboard.css";

const PER_PAGE = 50;
const TYPE_OPTIONS = ["All", "Club", "NT"];

export default function IntTrophyLeaderboard({ trophies }) {
    const [typeFilter, setTypeFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedChampion, setSelectedChampion] = useState(null);

    const leaderboard = useMemo(
        () => IntTrophyService.getLeaderboard(trophies, typeFilter),
        [trophies, typeFilter]
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return leaderboard;
        const q = search.toLowerCase();
        return leaderboard.filter((item) => item.champion.toLowerCase().includes(q));
    }, [leaderboard, search]);

    const podium = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (!trophies?.length) return <NoData_db message="NO TROPHY RECORDS FOUND" />;

    if (selectedChampion) {
        return (
            <IntTrophyTeamDetails
                championName={selectedChampion}
                trophies={trophies}
                typeFilter={typeFilter}
                onBack={() => setSelectedChampion(null)}
            />
        );
    }

    return (
        <div className="int-trophy-lb">
            <div className="int-trophy-lb-header">
                <h1>TROPHY <span className="gold">COUNT</span></h1>
                <div className="int-trophy-type-toggle">
                    {TYPE_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={typeFilter === opt ? "active" : ""}
                            onClick={() => { setTypeFilter(opt); setPage(1); }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
            <SearchBar_db value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search champion..." />

            {podium.length > 0 && (
                <div className="int-trophy-podium">
                    {podium.map((item, idx) => (
                        <div key={item.champion} className={`podium-item rank-${idx + 1}`}>
                            <div className="rank">#{idx + 1}</div>
                            <div className="name">{item.champion}</div>
                            <div className="count">{item.count} trophies</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="int-trophy-table-wrap">
                <table className="int-trophy-table">
                    <thead>
                        <tr><th>#</th><th>CHAMPION</th><th>TROPHIES</th><th></th></tr>
                    </thead>
                    <tbody>
                        {paginated.map((item, idx) => (
                            <tr key={item.champion}>
                                <td>{(page - 1) * PER_PAGE + idx + 1}</td>
                                <td><strong>{item.champion}</strong></td>
                                <td>{item.count}</td>
                                <td>
                                    <button type="button" className="int-trophy-view-btn" onClick={() => setSelectedChampion(item.champion)}>
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="int-trophy-pagination">
                    <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← PREV</button>
                    <span className="page-info">PAGE {page} OF {totalPages}</span>
                    <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>NEXT →</button>
                </div>
            )}
        </div>
    );
}
