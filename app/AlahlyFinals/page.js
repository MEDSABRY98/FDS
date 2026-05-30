"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Trophy, Edit, Award, Users, UserCheck, Download, Filter, ArrowLeft, X, Menu } from "lucide-react";
import "../lib/AlahlySidebar.css";
import { AlAhlyFinalsService } from "./alahly_finals_service";
import AlAhlyFinalsDashboard from "./alahly_finals_dashboard";
import AlAhlyFinalsMatches from "./alahly_finals_matches";
import AlAhlyFinalsPlayers from "./alahly_finals_players";
import AlAhlyFinalsChampions from "./alahly_finals_champions";
import AlAhlyFinalsManagers from "./alahly_finals_managers";
import AlAhlyFinalsEditor from "./alahly_finals_editor";
import AlAhlyFinalsFilter from "./alahly_finals_filters";
import Loading_db from "../lib/Loading_db";
import AlAhlyFinalsMatchDetails from "./alahly_finals_match_details";


export default function AlAhlyFinalsDatabase() {
    const [activeTab, setActiveTab] = useState("finals_dashboard");
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
            return (
                <AlAhlyFinalsMatchDetails
                    matchId={selectedMatchId}
                    matches={matchesData}
                    playerDetails={playersData}
                    lineupDetails={lineupsData}
                    onBack={() => setSelectedMatchId(null)}
                />
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
                    <AlAhlyFinalsEditor
                        matchesData={matchesData}
                        lineupsData={lineupsData}
                        playersData={playersData}
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <Loading_db subtitle="FINALS DATABASE" message="RETRIEVING CHAMPIONSHIPS" />;
    }


    return (
        <div className={`alahly-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#0a0a0a' }}>
            {/* Backdrop for mobile drawer */}
            <div
                className={`alahly-sidebar-backdrop ${isSidebarMobileOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarMobileOpen(false)}
            />

            {/* Sidebar navigation */}
            <aside className={`alahly-sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''}`}>
                <div className="alahly-sidebar-header">
                    <Link href="/" className="alahly-sidebar-brand">
                        <div className="alahly-sidebar-logo-hex">
                            <span className="alahly-sidebar-logo-text">A</span>
                        </div>
                        <div className="alahly-sidebar-brand-name">
                            AHLY <span>FINALS</span>
                        </div>
                    </Link>
                    <button
                        className="alahly-sidebar-close-btn"
                        onClick={() => setIsSidebarMobileOpen(false)}
                        title="CLOSE MENU"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="alahly-sidebar-menu">
                    {[
                        { id: 'finals_dashboard', label: 'DASHBOARD', icon: <LayoutDashboard size={16} className="alahly-sidebar-item-icon" /> },
                        { id: 'finals_matches', label: 'MATCHES', icon: <Trophy size={16} className="alahly-sidebar-item-icon" /> },
                        { id: 'finals_editor', label: 'EDITOR', icon: <Edit size={16} className="alahly-sidebar-item-icon" /> },
                        { id: 'finals_champions', label: 'CHAMPIONS', icon: <Award size={16} className="alahly-sidebar-item-icon" /> },
                        { id: 'finals_players', label: 'PLAYERS', icon: <Users size={16} className="alahly-sidebar-item-icon" /> },
                        { id: 'finals_managers', label: 'MANAGERS', icon: <UserCheck size={16} className="alahly-sidebar-item-icon" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`alahly-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSelectedMatchId(null);
                                setIsSidebarMobileOpen(false);
                            }}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="alahly-sidebar-actions">
                    <button
                        className="alahly-sidebar-collapse-toggle-btn"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "EXPAND MENU" : "COLLAPSE MENU"}
                    >
                        <ArrowLeft size={14} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        <span>COLLAPSE MENU</span>
                    </button>
                    <button
                        className="alahly-sidebar-action-btn filter-btn"
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN FILTERS"
                    >
                        <Filter size={14} />
                        <span>FILTERS</span>
                    </button>
                    <button
                        className="alahly-sidebar-action-btn export-btn"
                        onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                        title="DOWNLOAD AS EXCEL"
                    >
                        <Download size={14} />
                        <span>EXPORT TO EXCEL</span>
                    </button>
                </div>
            </aside>

            <div className="alahly-main-content">
                {/* Mobile Top Bar */}
                <header className="alahly-mobile-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="alahly-menu-toggle-btn"
                            onClick={() => setIsSidebarMobileOpen(true)}
                            title="OPEN MENU"
                        >
                            <Menu size={22} />
                        </button>
                        <Link href="/" className="alahly-mobile-brand">
                            <div className="alahly-mobile-brand-name">
                                AHLY <span>FINALS</span>
                            </div>
                        </Link>
                    </div>
                    <div className="alahly-mobile-actions">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="alahly-mobile-action-icon"
                            title="OPEN FILTERS"
                            style={{ marginRight: '8px' }}
                        >
                            <Filter size={16} />
                        </button>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                            className="alahly-mobile-action-icon"
                            title="DOWNLOAD AS EXCEL"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </header>

                <main style={{ padding: '30px 24px', maxWidth: '100%', margin: '0' }}>
                    {renderAppContent()}
                </main>
            </div>

            <AlAhlyFinalsFilter
                data={matchesData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
}
