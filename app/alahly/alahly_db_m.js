"use client";

import { Download, SlidersHorizontal } from "lucide-react";
import "./alahly_db_m.css";

export default function AlAhlyMobileNav({ activeTab, setActiveTab, setIsFilterOpen }) {
    const navItems = [
        { id: 'dashboard', label: 'DASHBOARD', icon: 'D' },
        { id: 'matches', label: 'MATCHES', icon: 'M' },
        { id: 'editor', label: 'EDITOR', icon: 'E' },
        { id: 'seasons', label: 'S-NAME', icon: 'S' },
        { id: 'seasons_n', label: 'S-NUM', icon: 'N' },
        { id: 'years', label: 'YEARS', icon: 'Y' },
        { id: 'players', label: 'PLAYERS', icon: 'P' },
        { id: 'gks', label: 'GKS', icon: 'GK' },
        { id: 'managers', label: 'MANAGERS', icon: 'M' },
        { id: 'referees', label: 'REFEREES', icon: 'R' },
        { id: 'h2h', label: 'H2H', icon: 'H' }
    ];

    return (
        <div className="bottom-nav-wrapper">
            <button
                className="global-export-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('alahly-export-excel'))}
                title="DOWNLOAD EXCEL"
                style={{
                    position: 'absolute',
                    left: '10px',
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
                    zIndex: 10001
                }}
            >
                <Download size={16} strokeWidth={3} />
            </button>

            <button
                className="global-filter-btn"
                onClick={() => setIsFilterOpen(true)}
                title="OPEN FILTERS"
                style={{
                    position: 'absolute',
                    left: '52px',
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
                    zIndex: 10001
                }}
            >
                <SlidersHorizontal size={16} strokeWidth={3} />
            </button>

            <nav className="bottom-nav"
                onWheel={(e) => {
                    if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                    }
                }}
            >
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab(item.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <span className="bottom-nav-icon" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{item.icon}</span>
                    <span className="bottom-nav-label">{item.label}</span>
                </button>
            ))}
            </nav>
        </div>
    );
}
