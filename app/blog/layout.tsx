import type { ReactNode } from 'react';


export const metadata = {
    title: {
        default: 'MockQube Blog',
        template: '%s | MockQube Blog',
    },
    alternates: { types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'MockQube RSS' }] } },
};


export default function BlogLayout({ children }: { children: ReactNode }) {
    return (
        <div className="prose mx-auto px-4 py-8">
            {children}
        </div>
    );
}