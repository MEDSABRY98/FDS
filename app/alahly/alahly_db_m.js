"use client";

import "./alahly_db_m.css";

export default function AlAhlyMobileNav({ activeTab, setActiveTab }) {
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
        { id: 'filters', label: 'FILTERS', icon: 'F' }
    ];

    return (
        <nav className="bottom-nav"
            onWheel={(e) => {
                if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                }
            }}
            style={{ overflowX: 'auto' }}
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
    );
}
