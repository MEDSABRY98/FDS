"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Shield, Target, Trophy, Swords, Flag } from "lucide-react";
import "./home_db_selection.css";

export default function HomeDbSelection() {
    const [activeTab, setActiveTab] = useState("alahly");

    // Tab content data
    const tabContents = {
        alahly: [
            { href: "/AlahlydbManagement", label: "AL AHLY DB MANAGEMENT", icon: Database },
            { href: "/Alahly", label: "AL AHLY SC", icon: Shield },
            { href: "/AlahlyPKS", label: "AL AHLY PKs", icon: Target },
            { href: "/AlahlyFinals", label: "AL AHLY FINALS", icon: Trophy },
        ],
        derby: [
            { href: "/AhlyVZamalek", label: "CAIRO DERBY", icon: Swords }
        ],
        egypt_nt: [
            { href: "/EgyptNTdbManagement", label: "EGYPT NT DB MANAGEMENT", icon: Database },
            { href: "/EgyptNT", label: "EGYPT NT", icon: Flag },
            { href: "/EgyptNTPKS", label: "EGYPT NT PKs", icon: Target }
        ],
        egypt_clubs: [
            { href: "/EgyptClubdbManagement", label: "EGYPT CLUB DB MANAGEMENT", icon: Database },
            { href: "/EgyptClub", label: "EGYPT CLUBS", icon: Trophy }
        ]
    };

    return (
        <div id="home-screen">
            <div className="home-topbar"></div>
            <div className="home-bg-grid"></div>

            <div className="home-sys-name">FOOTBALL <span>DATABASE</span></div>
            <div className="home-sys-sub">SELECT A SECTION TO CONTINUE</div>

            <div className="home-tabs-container">
                <button
                    className={`home-tab-btn ${activeTab === 'alahly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alahly')}
                >
                    AL AHLY
                </button>
                <button
                    className={`home-tab-btn ${activeTab === 'derby' ? 'active' : ''}`}
                    onClick={() => setActiveTab('derby')}
                >
                    DERBY
                </button>
                <button
                    className={`home-tab-btn ${activeTab === 'egypt_nt' ? 'active' : ''}`}
                    onClick={() => setActiveTab('egypt_nt')}
                >
                    EGYPT NT
                </button>
                <button
                    className={`home-tab-btn ${activeTab === 'egypt_clubs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('egypt_clubs')}
                >
                    EGYPT CLUBS
                </button>
            </div>

            <div className="section-cards">
                {tabContents[activeTab].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <Link key={idx} href={item.href} className="section-card">
                            <div className="card-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold, #c9a84c)' }}>
                                <Icon size={36} strokeWidth={1.5} />
                            </div>
                            <div className="card-name">{item.label}</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
