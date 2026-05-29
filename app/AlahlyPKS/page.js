"use client";

import { useState, useEffect } from "react";
import { 
    Download, 
    SlidersHorizontal, 
    X, 
    LayoutDashboard, 
    Trophy, 
    FileText, 
    Users, 
    Shield, 
    User, 
    GitCompare, 
    Menu, 
    ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { AlAhlyService } from "../alahly/alahly_db_service";
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
import "../lib/AlahlySidebar.css";


export default function AlAhlyPKsDatabase() {
    const [activeTab, setActiveTab] = useState("alahly_pks_dashboard");
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [pksData, setPksData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPksId, setSelectedPksId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const tabs = [
        { id: 'alahly_pks_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'alahly_pks_matches', label: 'Matches', icon: Trophy },
        { id: 'alahly_pks_editor', label: 'Editors', icon: FileText },
        { id: 'alahly_pks_champions', label: 'Champions', icon: Trophy },
        { id: 'alahly_pks_players', label: 'Players', icon: Users },
        { id: 'alahly_pks_gks', label: 'GKs', icon: Shield },
        { id: 'alahly_pks_managers', label: 'Managers', icon: User },
        { id: 'alahly_pks_h2h', label: 'H2H', icon: GitCompare }
    ];

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
        <div id="main-app" className={`alahly-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                            AL AHLY <span>PKS</span>
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
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`alahly-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSelectedPksId(null);
                                    setIsSidebarMobileOpen(false);
                                }}
                            >
                                <Icon size={16} className="alahly-sidebar-item-icon" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
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
                        className="alahly-sidebar-action-btn export-btn" 
                        onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                        title="DOWNLOAD CURRENT VIEW AS EXCEL"
                    >
                        <Download size={14} />
                        <span>EXPORT TO EXCEL</span>
                    </button>
                    <button 
                        className="alahly-sidebar-action-btn filter-btn" 
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN ADVANCED FILTERS"
                    >
                        <SlidersHorizontal size={14} />
                        <span>FILTERS</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
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
                                AL AHLY <span>PKS</span>
                            </div>
                        </Link>
                    </div>
                    <div className="alahly-mobile-actions">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))} 
                            className="alahly-mobile-action-icon"
                            title="DOWNLOAD CURRENT VIEW AS EXCEL"
                        >
                            <Download size={16} />
                        </button>
                        <button 
                            onClick={() => setIsFilterOpen(true)} 
                            className="alahly-mobile-action-icon"
                            title="OPEN DATABASE FILTERS"
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>
                </header>

                <main className="alahly-content-viewport" style={{ padding: '0', maxWidth: (activeTab === 'alahly_pks_h2h' || activeTab === 'alahly_pks_champions' || activeTab === 'alahly_pks_managers' || activeTab === 'alahly_pks_editor') ? '100%' : '1200px', margin: '0 auto', width: '100%' }}>
                    {renderAppContent()}
                </main>
            </div>

            <AlAhlyPKsFilter
                data={pksData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
}
