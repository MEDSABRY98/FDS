"use client";

import { useState, useEffect } from "react";
import { 
    Download, 
    SlidersHorizontal, 
    X, 
    LayoutDashboard, 
    Trophy, 
    Users, 
    User, 
    Menu, 
    ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { AhlyVZamalekService } from "./ahly_v_zamalek_service";
import AhlyVZamalekDashboard from "./ahly_v_zamalek_dashboard";
import AhlyVZamalekMatches from "./ahly_v_zamalek_matches";
import AhlyVZamalekPlayers from "./ahly_v_zamalek_players";
import AhlyVZamalekManagers from "./ahly_v_zamalek_managers";
import AhlyVZamalekFilters from "./ahly_v_zamalek_filters";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";
import "../lib/AlahlySidebar.css";

export default function AhlyVZamalekDatabase() {
    const [activeTab, setActiveTab] = useState("avz_dashboard");
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [matchesData, setMatchesData] = useState([]);
    const [lineupsData, setLineupsData] = useState([]);
    const [playersData, setPlayersData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const tabs = [
        { id: 'avz_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'avz_matches', label: 'Matches', icon: Trophy },
        { id: 'avz_players', label: 'Players', icon: Users },
        { id: 'avz_managers', label: 'Managers', icon: User }
    ];

    useEffect(() => {
        fetchAvZData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedMatchId, activeTab]);

    async function fetchAvZData() {
        setLoading(true);
        try {
            const [matches, lineups, players] = await Promise.all([
                AhlyVZamalekService.getAllMatches(),
                AhlyVZamalekService.getAllLineups(),
                AhlyVZamalekService.getAllPlayerDetails()
            ]);

            setMatchesData(matches);
            setLineupsData(lineups);
            setPlayersData(players);
            setFilteredData(matches);
        } catch (error) {
            console.error("Error fetching Ahly vs Zamalek data:", error);
        } finally {
            setLoading(false);
        }
    }

    const renderAppContent = () => {
        if (selectedMatchId) {
            return (
                <div style={{ padding: '40px', color: '#0a0a0a', textAlign: 'center' }}>
                    <h2 style={{ color: '#c9a84c' }}>MATCH DETAILS [ID: {selectedMatchId}]</h2>
                    <p style={{ opacity: 0.7 }}>Coming soon... Drilling down into specific derby details.</p>
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
            case "avz_dashboard":
                return <AhlyVZamalekDashboard derbyData={filteredData} />;
            case "avz_matches":
                return <AhlyVZamalekMatches derbyData={filteredData} onSelectMatch={(id) => setSelectedMatchId(id)} />;
            case "avz_players":
                return <AhlyVZamalekPlayers playersData={playersData} matchesData={matchesData} lineupsData={lineupsData} />;
            case "avz_managers":
                return <AhlyVZamalekManagers derbyData={filteredData} />;

            default:
                return null;
        }
    };

    if (loading) {
        return <Loading_db title="AHLY VS ZAMALEK" subtitle="DERBY DATABASE" />;
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
                        <div className="alahly-sidebar-logo-hex" style={{ background: '#da1b22' }}>
                            <span className="alahly-sidebar-logo-text" style={{ color: '#fff' }}>V</span>
                        </div>
                        <div className="alahly-sidebar-brand-name">
                            AHLY <span>VS</span> ZAMALEK
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
                                    setSelectedMatchId(null);
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
                        onClick={() => window.dispatchEvent(new CustomEvent('avz-export-excel'))}
                        title="DOWNLOAD CURRENT VIEW AS EXCEL"
                    >
                        <Download size={14} />
                        <span>EXPORT TO EXCEL</span>
                    </button>
                    <button 
                        className="alahly-sidebar-action-btn filter-btn" 
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN DATABASE FILTERS"
                    >
                        <SlidersHorizontal size={14} />
                        <span>FILTERS</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="alahly-main-content">
                {/* Mobile Top Bar */}
                <header className="alahly-mobile-top-bar" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
                                AHLY <span>VS</span> ZAMALEK
                            </div>
                        </Link>
                    </div>
                    <div className="alahly-mobile-actions">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('avz-export-excel'))} 
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

                <main className="alahly-content-viewport" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                    {renderAppContent()}
                </main>
            </div>

            <AhlyVZamalekFilters
                data={matchesData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
}
