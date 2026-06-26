"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useNotification } from "../lib/Notification_db";
import { runFullBackup } from "./Service/backup_service";
import "./backup.css";

export default function BackupPickup() {
    const { addNotification } = useNotification();
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(null);

    const handleDownload = async () => {
        if (exporting) return;

        setExporting(true);
        setProgress(null);

        try {
            const { tableCount } = await runFullBackup(({ current, total, tableName }) => {
                setProgress({ current, total, tableName });
            });

            addNotification(
                `Full backup downloaded successfully (${tableCount} tables).`,
                "success",
                5000
            );
        } catch (err) {
            console.error("Backup failed:", err);
            const tableHint = progress?.tableName ? ` (failed at ${progress.tableName})` : "";
            addNotification(
                `Backup failed${tableHint}: ${err?.message || "Unknown error"}`,
                "error",
                6000
            );
        } finally {
            setExporting(false);
            setProgress(null);
        }
    };

    return (
        <div className="backup-pickup">
            <header className="backup-pickup-header">
                <h1 className="backup-pickup-title">
                    PICK <span className="accent">UP</span>
                </h1>
                <div className="backup-pickup-gold-line" />
                <p className="backup-pickup-subtitle">
                    Export every table from all modules into a single ZIP of styled Excel files.
                </p>
            </header>

            <div className="backup-pickup-card">
                <button
                    type="button"
                    className="backup-pickup-btn"
                    onClick={handleDownload}
                    disabled={exporting}
                >
                    <Download size={20} />
                    <span>{exporting ? "EXPORTING…" : "DOWNLOAD FULL BACKUP"}</span>
                </button>

                {exporting && progress && (
                    <p className="backup-pickup-progress">
                        Exporting table {progress.current}/{progress.total}: {progress.tableName}
                    </p>
                )}

                {exporting && !progress && (
                    <p className="backup-pickup-progress">Discovering tables…</p>
                )}
            </div>
        </div>
    );
}
