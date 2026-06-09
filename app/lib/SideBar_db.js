"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, Menu } from "lucide-react";
import "./SideBar_db.css";

export default function SideBar_db({
    brandTitle = "DATABASE",
    brandSubtitle = "DB",
    logoText = "DB",
    menuItems = [], // Array of { id, label, icon: IconComponent }
    activeTab,
    setActiveTab,
    actions = [], // Array of { label, icon: IconComponent, onClick, className, title }
    children, // The main content goes here
    mobileBrandName = "DATABASE DB",
    mobileActions = [], // Array of { icon: IconComponent, onClick, title }
}) {
    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    return (
        <div className={`db-sidebar-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Backdrop for mobile drawer */}
            <div
                className={`db-sidebar-backdrop ${isSidebarMobileOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarMobileOpen(false)}
            />

            {/* Sidebar navigation */}
            <aside className={`db-sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''}`}>
                <div className="db-sidebar-header">
                    <Link href="/" className="db-sidebar-brand">
                        <div className="db-sidebar-logo-hex">
                            <span className="db-sidebar-logo-text">{logoText}</span>
                        </div>
                        <div className="db-sidebar-brand-name">
                            {brandTitle} <span>{brandSubtitle}</span>
                        </div>
                    </Link>
                    <button
                        className="db-sidebar-close-btn"
                        onClick={() => setIsSidebarMobileOpen(false)}
                        title="CLOSE MENU"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="db-sidebar-menu">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`db-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsSidebarMobileOpen(false);
                                }}
                            >
                                {Icon && <Icon size={16} className="db-sidebar-item-icon" />}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="db-sidebar-actions">
                    <button
                        className="db-sidebar-collapse-toggle-btn"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "EXPAND MENU" : "COLLAPSE MENU"}
                    >
                        <ArrowLeft size={14} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                        <span>COLLAPSE MENU</span>
                    </button>
                    {actions.map((act, idx) => {
                        const Icon = act.icon;
                        return (
                            <button
                                key={idx}
                                className={`db-sidebar-action-btn ${act.className || ''}`}
                                onClick={act.onClick}
                                title={act.title}
                            >
                                {Icon && <Icon size={14} />}
                                <span>{act.label}</span>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <div className="db-main-content">
                {/* Mobile Top Bar */}
                <header className="db-mobile-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="db-menu-toggle-btn"
                            onClick={() => setIsSidebarMobileOpen(true)}
                            title="OPEN MENU"
                        >
                            <Menu size={22} />
                        </button>
                        <Link href="/" className="db-mobile-brand">
                            <div className="db-mobile-brand-name">
                                {mobileBrandName}
                            </div>
                        </Link>
                    </div>
                    <div className="db-mobile-actions">
                        {mobileActions.map((act, idx) => {
                            const Icon = act.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={act.onClick}
                                    className="db-mobile-action-icon"
                                    title={act.title}
                                    style={idx < mobileActions.length - 1 ? { marginRight: '8px' } : undefined}
                                >
                                    {Icon && <Icon size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </header>

                <main style={{ width: '100%' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
