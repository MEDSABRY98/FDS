"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Notification_db.css';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="notification-db-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`notification-db-toast ${toast.type}`}>
                        <div className="notification-icon">
                            {toast.type === 'success' && <CheckCircle size={22} />}
                            {toast.type === 'error' && <AlertCircle size={22} />}
                            {toast.type === 'info' && <Info size={22} />}
                            {toast.type === 'warn' && <AlertCircle size={22} />}
                        </div>
                        <div className="notification-message">{toast.message}</div>
                        <button className="notification-close" onClick={() => removeNotification(toast.id)} title="Close">
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}
