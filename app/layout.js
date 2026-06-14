import './globals.css'
import { NotificationProvider } from './lib/Notification_db'
import MobileBlocker from './lib/MobileBlocker'

export const metadata = {
    title: 'Football Database',
    description: 'Premium Analytics for Football',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body suppressHydrationWarning>
                <div className="app-main-wrapper">
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </div>
                <MobileBlocker />
            </body>
        </html>
    )
}
