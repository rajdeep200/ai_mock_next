'use client';
import Link from 'next/link';

type Props = { label: string; href: string; variant?: 'primary' | 'secondary' };
export default function CTA({ label, href, variant = 'primary' }: Props) {
    const base = 'inline-flex items-center rounded-2xl px-4 py-2 text-sm font-semibold shadow';
    const styles =
        variant === 'primary'
            ? 'bg-black text-white hover:opacity-90'
            : 'bg-white text-black border hover:bg-gray-50';
    return (
        <Link href={href} className={`${base} ${styles}`}>{label}</Link>
    );
}