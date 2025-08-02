"use client";

import { useRouter } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";

interface SessionCardProps {
  session: {
    id: string;
    technology: string;
    company?: string;
    level: string;
    duration: number;
    status: "active" | "completed" | string;
    createdAt: string;
  };
}

export default function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/sessions/${session.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-gray-900 border border-green-700 rounded-lg p-4 flex justify-between items-center hover:bg-gray-800 transition"
    >
      <div>
        <p className="text-lg font-medium text-green-300">
          {session.technology.toUpperCase()} &mdash; {session.level}
        </p>
        <p className="text-sm text-gray-400">
          {session.company || "General"} · {session.duration} min ·{" "}
          <span
            className={
              session.status === "completed"
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(session.createdAt).toLocaleString()}
        </p>
      </div>
      <FiChevronRight size={20} className="text-gray-500" />
    </div>
  );
}
