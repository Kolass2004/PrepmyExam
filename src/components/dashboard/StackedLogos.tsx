"use client";

import { cn } from "@/lib/utils";

export function StackedLogos({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
            {/* OpenAI / ChatGPT */}
            <div className="relative z-10 w-11 h-11 rounded-full bg-white border-2 border-background flex items-center justify-center shadow-sm">
                <img src="/ailogo/openai.svg" alt="ChatGPT" className="w-7 h-7 object-contain" />
            </div>

            {/* Claude */}
            <div className="relative z-20 w-11 h-11 rounded-full bg-[#fbf5ed] border-2 border-background flex items-center justify-center shadow-sm">
                <img src="/ailogo/claude-color.svg" alt="Claude" className="w-8 h-8 object-contain p-1" />
            </div>

            {/* Gemini */}
            <div className="relative z-30 w-11 h-11 rounded-full bg-white border-2 border-background flex items-center justify-center shadow-sm">
                <img src="/ailogo/gemini-color.svg" alt="Gemini" className="w-8 h-8 object-contain p-1" />
            </div>

            {/* DeepSeek */}
            <div className="relative z-40 w-11 h-11 rounded-full bg-white border-2 border-background flex items-center justify-center shadow-sm">
                <img src="/ailogo/deepseek-color.svg" alt="DeepSeek" className="w-8 h-8 object-contain p-1" />
            </div>

            {/* Perplexity */}
            <div className="relative z-50 w-11 h-11 rounded-full bg-white border-2 border-background flex items-center justify-center shadow-sm">
                <img src="/ailogo/perplexity-color.svg" alt="Perplexity" className="w-8 h-8 object-contain p-1" />
            </div>
        </div>
    );
}
