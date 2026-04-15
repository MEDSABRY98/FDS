"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./Login_db.css";

/**
 * Premium Login Wrapper Component
 * Standardizes authentication across the application.
 */
export default function Login_db({ children, title = "PRIVATE ACCESS", subtitle = "DATABASE CONTROL CENTER" }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check if already authenticated in this session
        const authStatus = sessionStorage.getItem("db_auth_access");
        if (authStatus === "true") {
            setIsAuthenticated(true);
        }
        setChecking(false);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        
        // Use the centralized master key
        if (passwordInput === "951753") {
            setIsAuthenticated(true);
            sessionStorage.setItem("db_auth_access", "true");
            setError("");
        } else {
            setError("INCORRECT ACCESS KEY");
            setPasswordInput("");
        }
    };

    // If still verifying session, don't flash anything
    if (checking) return null;

    // If not authenticated, show the premium login screen
    if (!isAuthenticated) {
        return (
            <div className="login-db-container">
                <div className="login-db-card">
                    <div className="login-db-icon">🔐</div>
                    <h2 className="login-db-title">{title}</h2>
                    <p className="login-db-subtitle">{subtitle}</p>

                    <form className="login-db-form" onSubmit={handleLogin}>
                        <div className="login-db-input-group">
                            <input
                                type="password"
                                className={`login-db-input ${error ? 'error' : ''}`}
                                placeholder="••••••"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    if (error) setError("");
                                }}
                                autoFocus
                            />
                            {error && <div className="login-db-error-msg">{error}</div>}
                        </div>

                        <button type="submit" className="login-db-submit">
                            AUTHORIZE ACCESS
                        </button>
                    </form>

                    <button 
                        type="button" 
                        className="login-db-back"
                        onClick={() => router.push("/")}
                    >
                        ← RETURN TO HOMEPAGE
                    </button>
                </div>
            </div>
        );
    }

    // If authenticated, render the children
    return <>{children}</>;
}
