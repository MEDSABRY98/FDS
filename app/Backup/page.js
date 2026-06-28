"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import Login_db from "../lib/Login_db";
import SideBar_db from "../lib/SideBar_db";
import BackupPickup from "./backup_pickup";
import "./backup.css";

const MENU_ITEMS = [{ id: "pickup", label: "PICK UP", icon: Download }];

export default function BackupPage() {
    const [activeTab, setActiveTab] = useState("pickup");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    return (
        <Login_db title="PRIVATE ACCESS" subtitle="DATABASE BACKUP">
            <SideBar_db
                brandTitle="DATABASE"
                brandSubtitle="BACKUP"
                logoText="B"
                menuItems={MENU_ITEMS}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                mobileBrandName="DATABASE BACKUP"
            >
                <main className="backup-content-viewport">
                    {activeTab === "pickup" && <BackupPickup />}
                </main>
            </SideBar_db>
        </Login_db>
    );
}
