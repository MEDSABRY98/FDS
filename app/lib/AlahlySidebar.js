"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, Menu } from "lucide-react";
import "./AlahlySidebar.css";

export default function AlahlySidebar({
    brandTitle = "AHLY",
    brandSubtitle = "SC",
    menuItems = [], // Array of { id, label, icon }
    activeTab,
    setActiveTab,
    actions = [], // Array of { label, icon, onClick, className, title }
    children, // The main content goes here
    mobileBrandName = "AHLY SC",
    mobileActions = [], // Array of { icon, onClick, title }
}) {
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`alahly-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                            {brandTitle} <span>{brandSubtitle}</span>
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
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            className={`alahly-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarMobileOpen(false);
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
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
                    {actions.map((act, idx) => (
                        <button 
                            key={idx}
                            className={`alahly-sidebar-action-btn ${act.className || ''}`} 
                            onClick={act.onClick}
                            title={act.title}
                        >
                            {act.icon}
                            <span>{act.label}</span>
                        </button>
                    ))}
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
                                {mobileBrandName}
                            </div>
                        </Link>
                    </div>
                    <div className="alahly-mobile-actions">
                        {mobileActions.map((act, idx) => (
                            <button 
                                key={idx}
                                onClick={act.onClick} 
                                className="alahly-mobile-action-icon"
                                title={act.title}
                                style={idx < mobileActions.length - 1 ? { marginRight: '8px' } : undefined}
                            >
                                {act.icon}
                            </button>
                        ))}
                    </div>
                </header>

                <main style={{ width: '100%' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
