"use client";

import { cn } from "@/lib/utils";

export function StackedLogos({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
            {/* OpenAI / ChatGPT */}
            <div className="relative z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <img src="/ailogo/openai.svg" alt="ChatGPT" className="w-6 h-6 object-contain" />
            </div>

            {/* Claude */}
            <div className="relative z-20 w-10 h-10 rounded-full bg-[#fbf5ed] flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <img src="/ailogo/claude-color.svg" alt="Claude" className="w-7 h-7 object-contain p-0.5" />
            </div>

            {/* Gemini */}
            <div className="relative z-30 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <img src="/ailogo/gemini-color.svg" alt="Gemini" className="w-7 h-7 object-contain p-0.5" />
            </div>

            {/* DeepSeek */}
            <div className="relative z-40 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <img src="/ailogo/deepseek-color.svg" alt="DeepSeek" className="w-7 h-7 object-contain p-0.5" />
            </div>

            {/* Perplexity */}
            <div className="relative z-50 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <img src="/ailogo/perplexity-color.svg" alt="Perplexity" className="w-7 h-7 object-contain p-0.5" />
            </div>
        </div>
    );
}
