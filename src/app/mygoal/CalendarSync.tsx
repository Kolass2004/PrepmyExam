
"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, differenceInCalendarWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UserGoal } from "@/lib/types";

interface CalendarSyncProps {
    goal: UserGoal;
    onWeekSelect: (week: number) => void;
    className?: string;
}

export function CalendarSync({ goal, onWeekSelect, className }: CalendarSyncProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Calculate start date (assuming goal creation is "Week 1")
    const goalStartDate = useMemo(() => new Date(goal.createdAt), [goal.createdAt]);

    // Generate calendar days
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);

        // Calculate which roadmap week this date belongs to
        const weeksDiff = differenceInCalendarWeeks(date, goalStartDate, { weekStartsOn: 0 });
        const weekNumber = Math.max(1, weeksDiff + 1);

        // Call parent to scroll
        onWeekSelect(weekNumber);
    };

    // Helper to check if a day is in the selected week range
    const isSelectedWeek = (date: Date) => {
        const startOfSelectedWeek = startOfWeek(selectedDate);
        const endOfSelectedWeek = endOfWeek(selectedDate);
        return isWithinInterval(date, { start: startOfSelectedWeek, end: endOfSelectedWeek });
    };

    return (
        <div className={`w-full h-full flex flex-col ${className}`}>
            {/* Header - Centered for Widget Look */}
            <div className="flex items-center justify-between mb-4 pl-1">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                    {format(currentMonth, "MMMM yyyy")}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Grid - Flex Grow to fill space */}
            <div className="flex-1 grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="flex items-center justify-center text-[10px] font-bold text-muted-foreground/40 uppercase">
                        {day[0]}
                    </div>
                ))}

                {days.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isWeek = isSelectedWeek(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => handleDateClick(day)}
                            className={`
                                relative w-full h-full rounded-lg text-xs font-medium transition-all
                                flex items-center justify-center
                                ${!isCurrentMonth ? "opacity-0 pointer-events-none" : "text-foreground/80"}
                                ${isWeek && !isSelected ? "bg-primary/5 text-primary" : "hover:bg-secondary"}
                                ${isSelected ? "bg-primary text-primary-foreground font-bold shadow-md scale-105" : ""}
                            `}
                        >
                            {format(day, "d")}
                            {isToday && !isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
