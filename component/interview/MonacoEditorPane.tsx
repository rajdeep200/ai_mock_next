// components/interview/MonacoEditorPane.tsx
"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[260px] rounded-xl border border-gray-800 bg-black/40 text-gray-400">
            Loading editor…
        </div>
    ),
});

export default function MonacoEditorPane({
    language,
    value,
    onChange,
    onSubmit,
    disabled,
}: {
    language: string;
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
}) {
    const monacoEditorRef =
        useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);

    const handleMount = (
        editor: import("monaco-editor").editor.IStandaloneCodeEditor,
        monaco: typeof import("monaco-editor")
    ) => {
        monacoEditorRef.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            if (!disabled) onSubmit();
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black/40">
                <MonacoEditor
                    height="320px"
                    language={language}
                    theme="vs-dark"
                    value={value}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontLigatures: true,
                        smoothScrolling: true,
                        scrollBeyondLastLine: false,
                        renderWhitespace: "selection",
                        automaticLayout: true,
                        lineNumbers: "on",
                        wordWrap: "on",
                        tabSize: 2,
                    }}
                    onMount={handleMount}
                    onChange={(val) => onChange(val ?? "")}
                />
            </div>
            <button
                onClick={onSubmit}
                disabled={disabled}
                className="cursor-pointer mt-4 self-end inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
          bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500
          hover:from-emerald-500 hover:via-green-500 hover:to-emerald-400
          font-semibold text-white transition disabled:opacity-50"
            >
                Submit Code
            </button>
        </div>
    );
}
