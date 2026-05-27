"use client";

import { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import { AlAhlyFinalsService } from "../Alahly/alahly_finals_service";
import AlAhlyFinalsDashboard from "./alahly_finals_dashboard";
import AlAhlyFinalsMatches from "./alahly_finals_matches";
import AlAhlyFinalsPlayers from "./alahly_finals_players";
import AlAhlyFinalsChampions from "./alahly_finals_champions";
import AlAhlyFinalsManagers from "./alahly_finals_managers";
import AlAhlyFinalsEditor from "./alahly_finals_editor";
import AlAhlyFinalsFilter from "./alahly_finals_filters";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";


export default function AlAhlyFinalsDatabase() {
    const [activeTab, setActiveTab] = useState("finals_dashboard");
    const [matchesData, setMatchesData] = useState([]);
    const [lineupsData, setLineupsData] = useState([]);
    const [playersData, setPlayersData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchFinalsData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedMatchId, activeTab]);

    async function fetchFinalsData() {
        setLoading(true);
        try {
            const [matches, lineups, players] = await Promise.all([
                AlAhlyFinalsService.getAllFinalsMatches(),
                AlAhlyFinalsService.getAllFinalsLineups(),
                AlAhlyFinalsService.getAllFinalsPlayerDetails()
            ]);

            setMatchesData(matches);
            setLineupsData(lineups);
            setPlayersData(players);
            setFilteredData(matches);
        } catch (error) {
            console.error("Error fetching finals data:", error);
        } finally {
            setLoading(false);
        }
    }

    const renderAppContent = () => {
        // Handle Match Details drill-down if needed
        if (selectedMatchId) {
            // Placeholder: Could create AlAhlyFinalsMatchDetails if required
            const matchInfo = matchesData.find(m => m.MATCH_ID === selectedMatchId || m.FINAL_ID === selectedMatchId);
            return (
                <div style={{ padding: '40px', color: '#0a0a0a', textAlign: 'center' }}>
                    <h2 style={{ color: '#c9a84c' }}>MATCH DETAILS [ID: {selectedMatchId}]</h2>
                    <p style={{ opacity: 0.7 }}>Coming soon... Drilling down into specific finals details.</p>
                    <button
                        onClick={() => setSelectedMatchId(null)}
                        style={{ background: '#c9a84c', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '5px', marginTop: '20px', cursor: 'pointer' }}
                    >
                        BACK TO LIST
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case "finals_dashboard":
                return <AlAhlyFinalsDashboard finalsData={filteredData} />;
            case "finals_matches":
                return <AlAhlyFinalsMatches finalsData={filteredData} onSelectMatch={(id) => setSelectedMatchId(id)} />;
            case "finals_players":
                return <AlAhlyFinalsPlayers playersData={playersData} matchesData={matchesData} lineupsData={lineupsData} />;
            case "finals_champions":
                return <AlAhlyFinalsChampions finalsData={filteredData} />;
            case "finals_managers":
                return <AlAhlyFinalsManagers finalsData={filteredData} />;
            case "finals_editor":
                return (
                    <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
                        <AlAhlyFinalsEditor
                            matchesData={matchesData}
                            lineupsData={lineupsData}
                            playersData={playersData}
                        />
                    </Login_db>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <Loading_db subtitle="FINALS DATABASE" message="RETRIEVING CHAMPIONSHIPS" />;
    }


    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '100px', color: '#0a0a0a' }}>
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
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ position: 'absolute', left: '25px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                        title="DOWNLOAD AS EXCEL"
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
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN FILTERS"
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

                <div style={{ display: 'flex', gap: '5px' }}>
                    {[
                        { id: 'finals_dashboard', label: 'DASHBOARD', icon: 'D' },
                        { id: 'finals_matches', label: 'MATCHES', icon: 'M' },
                        { id: 'finals_editor', label: 'EDITOR', icon: 'E' },
                        { id: 'finals_champions', label: 'CHAMPIONS', icon: 'C' },
                        { id: 'finals_players', label: 'PLAYERS', icon: 'P' },
                        { id: 'finals_managers', label: 'MANAGERS', icon: 'M' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedMatchId(null); }}
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

            <main style={{ padding: '30px 0', maxWidth: (activeTab === 'finals_editor') ? '100%' : '1400px', margin: '0 auto' }}>
                {renderAppContent()}
            </main>

            <AlAhlyFinalsFilter
                data={matchesData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
}
