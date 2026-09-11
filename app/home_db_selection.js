"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Shield, Target, Trophy, Swords, Flag, Globe, Download, CheckCircle, ArrowLeft } from "lucide-react";
import "./home_db_selection.css";

const MODULES = [
    {
        id: "backup",
        label: "BACKUP",
        tag: "EXPORT",
        icon: Download,
        links: [{ href: "/Backup", label: "DATABASE BACKUP", icon: Download }],
    },
    {
        id: "db_management",
        label: "DB MANAGEMENT",
        tag: "GLOBAL",
        icon: Database,
        links: [
            { href: "/DBManagement", label: "GLOBAL DB MANAGEMENT", icon: Database },
        ],
    },
    {
        id: "check_data",
        label: "CHECK DATA",
        tag: "INTEGRITY",
        icon: CheckCircle,
        links: [
            { href: "/CheckData?module=egy_nt", label: "EGYPT NT VALIDATE", icon: Shield },
        ],
    },
    {
        id: "alahly",
        label: "AL AHLY",
        tag: "CLUB",
        icon: Shield,
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
        icon: Swords,
        links: [
            { href: "/AhlyVZamalek", label: "CAIRO DERBY", icon: Swords },
        ],
    },
    {
        id: "egypt_nt",
        label: "EGYPT NT",
        tag: "NATIONAL",
        icon: Flag,
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
        icon: Trophy,
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
        icon: Globe,
        links: [
            { href: "/InternationalNTdbManagement", label: "INTL NT DB MANAGEMENT", icon: Database },
            { href: "/InternationalNT", label: "INTERNATIONAL NT", icon: Flag },
        ],
    },
    {
        id: "international_clubs",
        label: "INTL CLUBS",
        tag: "WORLD",
        icon: Globe,
        links: [
            { href: "/InternationalClubdbManagement", label: "INTL CLUB DB MANAGEMENT", icon: Database },
            { href: "/InternationalClub", label: "INTERNATIONAL CLUBS", icon: Globe },
        ],
    },
    {
        id: "international_trophy",
        label: "INTL TROPHY",
        tag: "WORLD",
        icon: Trophy,
        links: [
            { href: "/InternationalTrophydbManagement", label: "INTL TROPHY DB MANAGEMENT", icon: Database },
            { href: "/InternationalTrophy", label: "INTERNATIONAL TROPHIES", icon: Trophy },
        ],
    },
];

export default function HomeDbSelection() {
    const [activeModuleId, setActiveModuleId] = useState(null);

    return (
        <div id="home-screen">
            <div className="home-topbar" />
            <div className="home-bg-grid" />

            {!activeModuleId && (
                <header className="home-header">
                    <div className="home-sys-name">FOOTBALL <span>DATABASE</span></div>
                </header>
            )}

            <main className="home-main-area">
                {!activeModuleId ? (
                    <div className="odoo-modules-grid">
                        {MODULES.map((mod) => {
                            const Icon = mod.icon;
                            return (
                                <button
                                    key={mod.id}
                                    type="button"
                                    className="odoo-module-card fade-in"
                                    onClick={() => setActiveModuleId(mod.id)}
                                >
                                    <div className="odoo-module-icon">
                                        <Icon size={42} strokeWidth={1.5} />
                                    </div>
                                    <div className="odoo-module-title">{mod.label}</div>
                                    <div className="odoo-module-tag">{mod.tag}</div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="odoo-links-view fade-in">
                        <button className="odoo-back-btn" onClick={() => setActiveModuleId(null)}>
                            <ArrowLeft size={18} strokeWidth={2} /> BACK TO APPS
                        </button>
                        
                        {(() => {
                            const activeModule = MODULES.find(m => m.id === activeModuleId);
                            const MainIcon = activeModule.icon;
                            return (
                                <>
                                    <div className="odoo-module-header">
                                        <div className="odoo-module-header-icon">
                                            <MainIcon size={32} strokeWidth={2} />
                                        </div>
                                        <h2>{activeModule.label}</h2>
                                    </div>
                                    <div className="odoo-links-grid">
                                        {activeModule.links.map((link) => {
                                            const LinkIcon = link.icon;
                                            return (
                                                <Link key={link.href} href={link.href} className="odoo-link-card">
                                                    <div className="odoo-link-icon">
                                                        <LinkIcon size={28} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="odoo-link-title">{link.label}</div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </main>
        </div>
    );
}
