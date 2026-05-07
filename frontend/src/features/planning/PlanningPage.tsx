"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getDailyPlan, getWeeklyPlan } from "./api";
import type {
  DailyPlan,
  PlanningWeeklyTaskOccurrence,
  WeeklyPlan,
  WeeklyPlanDay,
} from "./types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { DailyTask } from "@/features/tasks/types";

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatEventTime(event: CalendarEvent) {
  if (!event.start_time && !event.end_time) {
    return "All day";
  }
  if (event.start_time && event.end_time) {
    return `${event.start_time.slice(0, 5)}-${event.end_time.slice(0, 5)}`;
  }
  if (event.start_time) {
    return event.start_time.slice(0, 5);
  }
  return `Until ${event.end_time?.slice(0, 5)}`;
}

function DailyTaskList({ tasks }: { tasks: DailyTask[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-600">No daily tasks.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div className="rounded border border-neutral-200 px-3 py-2" key={task.id}>
          <p
            className={`text-sm font-medium ${
              task.is_completed ? "text-neutral-500 line-through" : "text-neutral-950"
            }`}
          >
            {task.title}
          </p>
          {task.description ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {task.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WeeklyTaskList({ tasks }: { tasks: PlanningWeeklyTaskOccurrence[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-neutral-600">No weekly tasks scheduled.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div className="rounded border border-neutral-200 px-3 py-2" key={task.id}>
          <p
            className={`text-sm font-medium ${
              task.is_completed ? "text-neutral-500 line-through" : "text-neutral-950"
            }`}
          >
            {task.title}
          </p>
          {task.description ? (
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {task.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CalendarEventList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-neutral-600">No calendar events.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div className="rounded border border-neutral-200 px-3 py-2" key={event.id}>
          <p className="text-sm font-medium text-neutral-950">{event.title}</p>
          <p className="mt-1 text-xs text-neutral-600">{formatEventTime(event)}</p>
          {event.location ? (
            <p className="mt-1 text-xs text-neutral-600">{event.location}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WeeklyDayCard({ day }: { day: WeeklyPlanDay }) {
  const itemCount =
    day.daily_tasks.length + day.weekly_tasks.length + day.calendar_events.length;

  return (
    <section className="rounded border border-neutral-300 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{formatDisplayDate(day.date)}</h3>
        <span className="text-xs font-semibold text-neutral-500">
          {itemCount} items
        </span>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
            Daily
          </p>
          <DailyTaskList tasks={day.daily_tasks} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
            Weekly
          </p>
          <WeeklyTaskList tasks={day.weekly_tasks} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">
            Calendar
          </p>
          <CalendarEventList events={day.calendar_events} />
        </div>
      </div>
    </section>
  );
}

export function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate],
  );

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getDailyPlan(selectedDate), getWeeklyPlan(selectedDate)])
      .then(([daily, weekly]) => {
        setDailyPlan(daily);
        setWeeklyPlan(weekly);
      })
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, [selectedDate]);

  return (
    <main className="min-h-screen px-6 py-8 text-neutral-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-950">Planning</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
              A simple read-only plan composed from tasks and calendar events.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-sm font-medium">
              Date
              <input
                className="ml-2 rounded border border-neutral-300 px-3 py-2"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
            <Link
              className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
              href="/tasks"
            >
              Open Tasks
            </Link>
            <Link
              className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
              href="/calendar"
            >
              Open Calendar
            </Link>
          </div>
        </header>

        {error ? (
          <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <section className="rounded border border-neutral-300 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-600">Loading planning data...</p>
          </section>
        ) : dailyPlan && weeklyPlan ? (
          <>
            <section className="rounded border border-neutral-300 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-teal-700">
                    Daily Plan
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {selectedDateLabel}
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Daily Tasks</h3>
                  <DailyTaskList tasks={dailyPlan.daily_tasks} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Weekly Tasks</h3>
                  <WeeklyTaskList tasks={dailyPlan.weekly_tasks} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Calendar Events</h3>
                  <CalendarEventList events={dailyPlan.calendar_events} />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase text-teal-700">
                  Weekly Plan
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {formatDisplayDate(weeklyPlan.week_start)} -{" "}
                  {formatDisplayDate(weeklyPlan.week_end)}
                </h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {weeklyPlan.days.map((day) => (
                  <WeeklyDayCard day={day} key={day.date} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded border border-neutral-300 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-600">
              Planning data could not be loaded.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
