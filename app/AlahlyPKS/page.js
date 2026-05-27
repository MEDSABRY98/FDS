"use client";

import { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import { AlAhlyService } from "../Alahly/alahly_db_service";
import AlAhlyPKsMatches from "./alahly_pks_matches";
import AlAhlyPKsMatchDetails from "./alahly_pks_match_details";
import AlAhlyPKsPlayers from "./alahly_pks_players";
import AlAhlyPKsGKs from "./alahly_pks_gks";
import AlAhlyPKsChampions from "./alahly_pks_champions";
import AlAhlyPKsFilter from "./alahly_pks_filters";
import AlAhlyPKsH2H from "./alahly_pks_h2h";
import AlAhlyPKsManagers from "./alahly_pks_managers";
import AlAhlyPKsEditor from "./alahly_pks_editor";
import AlAhlyPKsDashboard from "./alahly_pks_dashboard";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";


export default function AlAhlyPKsDatabase() {
    const [activeTab, setActiveTab] = useState("alahly_pks_dashboard");
    const [pksData, setPksData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPksId, setSelectedPksId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchPKData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedPksId, activeTab]);

    async function fetchPKData() {
        setLoading(true);
        // Fetch both PKs and Matches to join manager info
        const [pks, matches] = await Promise.all([
            AlAhlyService.getAllPKs(),
            AlAhlyService.getAllMatches()
        ]);

        // Create a fast lookup map for matches
        const matchMap = new Map();
        matches.forEach(m => {
            const mId = String(m.MATCH_ID || m.id || "").trim().toUpperCase();
            if (mId) matchMap.set(mId, m);
        });

        // Enrich PKs with manager data from MATCHDETAILS
        const enrichedData = pks.map(pk => {
            const pkMatchId = String(pk.MATCH_ID || pk.PKS_ID || "").trim().toUpperCase();
            const matchInfo = matchMap.get(pkMatchId);

            // Try different possible column names for managers
            const ahlyMgr = matchInfo?.["AHLY MANAGER"] || matchInfo?.AHLY_MANAGER || pk["AHLY MANAGER"] || "---";
            const oppMgr = matchInfo?.["OPPONENT MANAGER"] || matchInfo?.OPPONENT_MANAGER || pk["OPPONENT MANAGER"] || "---";

            return {
                ...pk,
                "AHLY MANAGER": ahlyMgr,
                "OPPONENT MANAGER": oppMgr
            };
        });

        setPksData(enrichedData);
        setFilteredData(enrichedData);
        setLoading(false);
    }

    const renderAppContent = () => {
        if (selectedPksId) {
            const matchKicks = filteredData.filter(k => k.PKS_ID === selectedPksId);
            return <AlAhlyPKsMatchDetails matchPks={matchKicks} onBack={() => setSelectedPksId(null)} />;
        }

        switch (activeTab) {
            case "alahly_pks_dashboard":
                return <AlAhlyPKsDashboard pksData={filteredData} />;
            case "alahly_pks_matches":
                return <AlAhlyPKsMatches pksData={filteredData} onSelectMatch={(id) => setSelectedPksId(id)} />;
            case "alahly_pks_editor":
                return (
                    <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
                        <AlAhlyPKsEditor pksData={pksData} />
                    </Login_db>
                );
            case "alahly_pks_champions":
                return <AlAhlyPKsChampions pksData={filteredData} />;
            case "alahly_pks_players":
                return <AlAhlyPKsPlayers pksData={filteredData} />;
            case "alahly_pks_gks":
                return <AlAhlyPKsGKs pksData={filteredData} />;
            case "alahly_pks_h2h":
                return <AlAhlyPKsH2H pksData={filteredData} />;
            case "alahly_pks_managers":
                return <AlAhlyPKsManagers pksData={filteredData} />;
            default:
                return (
                    <div style={{ padding: '100px', textAlign: 'center', color: '#888' }}>
                        <h1>COMING <span style={{ color: '#c9a84c' }}>SOON</span></h1>
                    </div>
                );
        }
    };

    if (loading) {
        return <Loading_db subtitle="PKs DATABASE" message="RETRIEVING PENALTIES" />;
    }


    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', overflow: 'visible' }}>
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 9999,
                background: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: '74px',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div className="nav-action-buttons" style={{ position: 'absolute', left: '25px', display: 'flex', gap: '10px' }}>
                    <button
                        className="global-export-btn"
                        onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                        title="DOWNLOAD CURRENT VIEW AS EXCEL"
                        style={{
                            background: 'rgba(201, 168, 76, 0.1)',
                            color: '#c9a84c',
                            border: '1px solid rgba(201, 168, 76, 0.25)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 10000
                        }}
                    >
                        <Download size={16} strokeWidth={3} />
                    </button>
                    <button
                        className="global-filter-btn"
                        onClick={() => { console.log("Filter button clicked!"); setIsFilterOpen(true); }}
                        title="OPEN ADVANCED FILTERS"
                        style={{
                            background: 'rgba(201, 168, 76, 0.1)',
                            color: '#c9a84c',
                            border: '1px solid rgba(201, 168, 76, 0.25)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 10000
                        }}
                    >
                        <Filter size={16} strokeWidth={3} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {[
                        { id: 'alahly_pks_dashboard', label: 'DASHBOARD', icon: 'D' },
                        { id: 'alahly_pks_matches', label: 'MATCHES', icon: 'M' },
                        { id: 'alahly_pks_editor', label: 'EDITORS', icon: 'E' },
                        { id: 'alahly_pks_champions', label: 'CHAMPIONS', icon: 'C' },
                        { id: 'alahly_pks_players', label: 'PLAYERS', icon: 'P' },
                        { id: 'alahly_pks_gks', label: 'GKs', icon: 'GK' },
                        { id: 'alahly_pks_managers', label: 'MANAGERS', icon: 'MG' },
                        { id: 'alahly_pks_h2h', label: 'H2H', icon: 'H' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedPksId(null); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0 20px',
                                height: '54px',
                                color: activeTab === tab.id ? '#c9a84c' : 'rgba(255,255,255,0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                transition: '0.3s',
                                borderBottom: activeTab === tab.id ? '2px solid #c9a84c' : '2px solid transparent',
                                fontFamily: "'Bebas Neue', sans-serif",
                                letterSpacing: '1px'
                            }}
                        >
                            <span style={{ fontSize: '12px', opacity: 0.7 }}>[{tab.icon}]</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <main style={{ padding: '0', maxWidth: (activeTab === 'alahly_pks_h2h' || activeTab === 'alahly_pks_champions' || activeTab === 'alahly_pks_managers' || activeTab === 'alahly_pks_editor') ? '100%' : '1200px', margin: '0 auto' }}>
                {renderAppContent()}
            </main>

            <AlAhlyPKsFilter
                data={pksData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
}
