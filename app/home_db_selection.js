"use client";

import { useState } from "react";
import Link from "next/link";
import "./home_db_selection.css";

export default function HomeDbSelection() {
    const [activeTab, setActiveTab] = useState("alahly");

    // Tab content data
    const tabContents = {
        alahly: [
            { href: "/AlahlydbManagement", label: "AL AHLY DB MANAGEMENT", initial: "DB" },
            { href: "/Alahly", label: "AL AHLY SC", initial: "A" },
            { href: "/AlahlyPKS", label: "AL AHLY PKs", initial: "PK" },
            { href: "/AlahlyFinals", label: "AL AHLY FINALS", initial: "F" },
        ],
        derby: [
            { href: "/AhlyVZamalek", label: "CAIRO DERBY", initial: "D" }
        ],
        egypt_nt: [
            { href: "/EgyptNTdbManagement", label: "EGYPT NT DB MANAGEMENT", initial: "DB" },
            { href: "/EgyptNT", label: "EGYPT NT", initial: "EG" },
            { href: "/EgyptNTPKS", label: "EGYPT NT PKs", initial: "PK" }
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
            </div>

            <div className="section-cards">
                {tabContents[activeTab].map((item, idx) => (
                    <Link key={idx} href={item.href} className="section-card">
                        <div className="card-icon-wrap">
                            <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>{item.initial}</span>
                        </div>
                        <div className="card-name">{item.label}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
