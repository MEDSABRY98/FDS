"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Shield, Target, Trophy, Swords, Flag, Globe } from "lucide-react";
import "./home_db_selection.css";

const MODULES = [
    {
        id: "db_management",
        label: "DB MANAGEMENT",
        tag: "GLOBAL",
        links: [
            { href: "/DBManagement", label: "GLOBAL DB MANAGEMENT", icon: Database },
        ],
    },
    {
        id: "alahly",
        label: "AL AHLY",
        tag: "CLUB",
        links: [
            { href: "/AlahlydbManagement", label: "AL AHLY DB MANAGEMENT", icon: Database },
            { href: "/Alahly", label: "AL AHLY SC", icon: Shield },
            { href: "/AlahlyPKS", label: "AL AHLY PKs", icon: Target },
            { href: "/AlahlyFinals", label: "AL AHLY FINALS", icon: Trophy },
        ],
    },
    {
        id: "derby",
        label: "DERBY",
        tag: "SPECIAL",
        links: [
            { href: "/AhlyVZamalek", label: "CAIRO DERBY", icon: Swords },
        ],
    },
    {
        id: "egypt_nt",
        label: "EGYPT NT",
        tag: "NATIONAL",
        links: [
            { href: "/EgyptNTdbManagement", label: "EGYPT NT DB MANAGEMENT", icon: Database },
            { href: "/EgyptNT", label: "EGYPT NT", icon: Flag },
            { href: "/EgyptNTPKS", label: "EGYPT NT PKs", icon: Target },
        ],
    },
    {
        id: "egypt_clubs",
        label: "EGYPT CLUBS",
        tag: "DOMESTIC",
        links: [
            { href: "/EgyptClubdbManagement", label: "EGYPT CLUB DB MANAGEMENT", icon: Database },
            { href: "/EgyptClub", label: "EGYPT CLUBS", icon: Trophy },
            { href: "/EgyptClubTrophy", label: "EGYPT CLUBS TROPHIES", icon: Trophy },
        ],
    },
    {
        id: "international_nt",
        label: "INTL NT",
        tag: "WORLD",
        links: [
            { href: "/InternationalNTdbManagement", label: "INTL NT DB MANAGEMENT", icon: Database },
            { href: "/InternationalNT", label: "INTERNATIONAL NT", icon: Flag },
        ],
    },
    {
        id: "international_clubs",
        label: "INTL CLUBS",
        tag: "WORLD",
        links: [
            { href: "/InternationalClubdbManagement", label: "INTL CLUB DB MANAGEMENT", icon: Database },
            { href: "/InternationalClub", label: "INTERNATIONAL CLUBS", icon: Globe },
        ],
    },
    {
        id: "international_trophy",
        label: "INTL TROPHY",
        tag: "WORLD",
        links: [
            { href: "/InternationalTrophydbManagement", label: "INTL TROPHY DB MANAGEMENT", icon: Database },
            { href: "/InternationalTrophy", label: "INTERNATIONAL TROPHIES", icon: Trophy },
        ],
    },
];

export default function HomeDbSelection() {
    const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);
    const activeModule = MODULES.find((m) => m.id === activeModuleId) || MODULES[0];

    return (
        <div id="home-screen">
            <div className="home-topbar" />
            <div className="home-bg-grid" />

            <header className="home-header">
                <div className="home-sys-name">FOOTBALL <span>DATABASE</span></div>
                <div className="home-sys-sub">SELECT A MODULE TO CONTINUE</div>
            </header>

            <div className="home-layout">
                <aside className="home-sidebar" aria-label="Modules">
                    <div className="home-sidebar-label">MODULES</div>
                    <nav className="home-module-nav">
                        {MODULES.map((mod, index) => {
                            const isActive = mod.id === activeModuleId;
                            const isLast = index === MODULES.length - 1;
                            return (
                                <button
                                    key={mod.id}
                                    type="button"
                                    className={`home-module-item ${isActive ? "active" : ""}`}
                                    onClick={() => setActiveModuleId(mod.id)}
                                >
                                    <span className="home-module-track">
                                        <span className="home-module-dot" />
                                        {!isLast && <span className="home-module-line" />}
                                    </span>
                                    <span className="home-module-text">
                                        <span className="home-module-tag">{mod.tag}</span>
                                        <span className="home-module-name">{mod.label}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="home-content">
                    <header className="home-content-head">
                        <span className="home-content-tag">{activeModule.tag}</span>
                        <h2 className="home-content-title">{activeModule.label}</h2>
                    </header>

                    <nav className="home-section-tabs" aria-label={`${activeModule.label} sections`}>
                        {activeModule.links.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className="home-section-tab">
                                    <Icon size={18} strokeWidth={1.5} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </main>
            </div>
        </div>
    );
}
