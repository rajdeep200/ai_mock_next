export default function Callout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="my-6 rounded-xl border bg-gray-50 p-4">
            <div className="mb-2 font-semibold">{title}</div>
            <div className="text-sm leading-6">{children}</div>
        </div>
    );
}