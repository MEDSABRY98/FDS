"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Send, Trash2, ArrowLeft, Bot, User, BrainCircuit } from "lucide-react";
import "./ai_assistant.css";

export default function AIAssistantPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async (textToSend) => {
        const queryText = textToSend || input;
        if (!queryText.trim() || isLoading) return;

        setError("");
        setInput("");
        setIsLoading(true);

        const newMessages = [...messages, { role: "user", content: queryText }];
        setMessages(newMessages);

        try {
            const response = await fetch("/AIAssistant/api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!response.ok) {
                let errMsg = "An error occurred while connecting to the server. Please check your API key and connection.";
                try {
                    const errData = await response.json();
                    if (errData.error) {
                        errMsg = `Error: ${errData.error}`;
                    }
                } catch (e) {}
                throw new Error(errMsg);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        } catch (err) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        if (window.confirm("Are you sure you want to clear the AI conversation history?")) {
            setMessages([
                {
                    role: "assistant",
                    content: "Conversation cleared. How can I help you today with football history and statistics?"
                }
            ]);
            setError("");
        }
    };

    // Custom Markdown parser to render titles, bullets, bold and tables beautifully
    const formatMessageContent = (text) => {
        if (!text) return "";
        const lines = text.split("\n");
        let inTable = false;
        let tableHeaders = [];
        let tableRows = [];
        const formattedElements = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
                const cells = trimmed.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
                if (line.includes("---")) {
                    return;
                }
                if (!inTable) {
                    inTable = true;
                    tableHeaders = cells;
                } else {
                    tableRows.push(cells);
                }
                return;
            } else if (inTable) {
                formattedElements.push(renderTable(tableHeaders, tableRows, `table-${index}`));
                inTable = false;
                tableHeaders = [];
                tableRows = [];
            }

            if (trimmed.startsWith("###")) {
                formattedElements.push(<h4 key={index} className="ai-md-h3">{parseInlineStyles(trimmed.substring(3).trim())}</h4>);
            } else if (trimmed.startsWith("##")) {
                formattedElements.push(<h3 key={index} className="ai-md-h2">{parseInlineStyles(trimmed.substring(2).trim())}</h3>);
            } else if (trimmed.startsWith("#")) {
                formattedElements.push(<h2 key={index} className="ai-md-h1">{parseInlineStyles(trimmed.substring(1).trim())}</h2>);
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                formattedElements.push(
                    <ul key={index} className="ai-md-list">
                        <li>{parseInlineStyles(trimmed.substring(2))}</li>
                    </ul>
                );
            } else if (trimmed === "") {
                formattedElements.push(<div key={index} className="ai-md-spacer" />);
            } else {
                formattedElements.push(<p key={index} className="ai-md-p">{parseInlineStyles(trimmed)}</p>);
            }
        });

        if (inTable) {
            formattedElements.push(renderTable(tableHeaders, tableRows, `table-end`));
        }

        return formattedElements;
    };

    const renderTable = (headers, rows, key) => (
        <div key={key} className="ai-md-table-wrapper">
            <table className="ai-md-table">
                <thead>
                    <tr>
                        {headers.map((h, i) => <th key={i}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri}>
                            {row.map((cell, ci) => <td key={ci}>{parseInlineStyles(cell)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const parseInlineStyles = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            const codeParts = part.split(/(`.*?`)/g);
            return codeParts.map((subPart, j) => {
                if (subPart.startsWith("`") && subPart.endsWith("`")) {
                    return <code key={`${i}-${j}`} className="ai-md-code">{subPart.slice(1, -1)}</code>;
                }
                return subPart;
            });
        });
    };

    return (
        <div id="ai-assistant-page">
            <div className="ai-topbar" />
            <div className="ai-bg-grid" />

            <div className="ai-container">
                {/* Header Section */}
                <header className="ai-header">
                    <div className="ai-nav-back">
                        <Link href="/" className="ai-btn-back">
                            <ArrowLeft size={16} />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                    <div className="ai-title-section">
                        <div className="ai-icon-glow">
                            <BrainCircuit size={32} />
                        </div>
                        <div className="ai-title-text">
                            <h1>FOOTBALL <span>AI ASSISTANT</span></h1>
                        </div>
                    </div>
                    <div className="ai-header-actions">
                    </div>
                </header>

                {/* Main Layout Area */}
                <div className="ai-chat-viewport">
                    <div className="ai-chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`ai-message-row ${msg.role === "user" ? "user-row" : "assistant-row"}`}>
                                <div className="ai-avatar">
                                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className="ai-message-bubble">
                                    <div className="ai-bubble-content">
                                        {formatMessageContent(msg.content)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ai-message-row assistant-row">
                                <div className="ai-avatar ai-avatar-loading">
                                    <Bot size={16} />
                                </div>
                                <div className="ai-message-bubble loading-bubble">
                                    <div className="ai-typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="ai-error-banner">
                                <span className="error-icon">⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>



                    {/* Input Bar */}
                    <div className="ai-input-bar">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Ask me about Al Ahly stats, Egypt NT, or player comparisons..."
                            disabled={isLoading}
                        />
                        <button 
                            className="ai-btn-send" 
                            onClick={() => handleSendMessage()} 
                            disabled={!input.trim() || isLoading}
                        >
                            <Send size={18} />
                            <span>Send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
