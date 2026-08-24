"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function serialize(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function DateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const parsed = parseValue(value);
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() =>
    new Date(parsed?.year ?? now.getFullYear(), parsed?.month ?? now.getMonth(), 1),
  );

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const placePopover = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const mobile = viewportWidth <= 850;
      const edge = 12;
      const bottomGuard = mobile ? 76 : edge;
      const topEdge = viewportTop + edge;
      const bottomEdge = viewportTop + viewportHeight - bottomGuard;
      const triggerRect = trigger.getBoundingClientRect();
      const width = Math.min(mobile ? 340 : 390, viewportWidth - edge * 2);
      const availableHeight = Math.max(260, bottomEdge - topEdge);
      const height = Math.min(popover.scrollHeight, availableHeight);
      const roomBelow = bottomEdge - triggerRect.bottom - 8;
      const roomAbove = triggerRect.top - topEdge - 8;
      const placeAbove = roomBelow < height && roomAbove > roomBelow;
      const top = placeAbove
        ? Math.max(topEdge, triggerRect.top - height - 8)
        : Math.min(triggerRect.bottom + 8, bottomEdge - height);
      const left = Math.min(
        Math.max(triggerRect.left, viewportLeft + edge),
        viewportLeft + viewportWidth - width - edge,
      );

      popover.style.setProperty("--picker-top", `${top}px`);
      popover.style.setProperty("--picker-left", `${left}px`);
      popover.style.setProperty("--picker-width", `${width}px`);
      popover.style.setProperty("--picker-max-height", `${availableHeight}px`);
      popover.dataset.placed = "true";
    };

    placePopover();
    window.addEventListener("resize", placePopover);
    window.addEventListener("scroll", placePopover, true);
    window.visualViewport?.addEventListener("resize", placePopover);
    window.visualViewport?.addEventListener("scroll", placePopover);
    return () => {
      window.removeEventListener("resize", placePopover);
      window.removeEventListener("scroll", placePopover, true);
      window.visualViewport?.removeEventListener("resize", placePopover);
      window.visualViewport?.removeEventListener("scroll", placePopover);
    };
  }, [open, view]);

  useEffect(() => {
    if (open && parsed) setView(new Date(parsed.year, parsed.month, 1));
    // Opening the picker is the only time its visible month needs synchronizing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = new Date(view.getFullYear(), view.getMonth(), 1);
  const firstCell = new Date(start);
  firstCell.setDate(1 - start.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstCell);
    day.setDate(firstCell.getDate() + index);
    return day;
  });
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const selectDay = (day: Date) => {
    onChange(
      serialize(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        parsed?.hour ?? 12,
        parsed?.minute ?? 0,
      ),
    );
  };

  const updateTime = (part: "hour" | "minute", next: number) => {
    const base = parsed ?? {
      year: view.getFullYear(),
      month: view.getMonth(),
      day: now.getDate(),
      hour: 12,
      minute: 0,
    };
    onChange(
      serialize(
        base.year,
        base.month,
        base.day,
        part === "hour" ? next : base.hour,
        part === "minute" ? next : base.minute,
      ),
    );
  };

  return (
    <div className="date-time-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="date-time-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays aria-hidden="true" />
        <span>{parsed ? formatter.format(new Date(value)) : "Choose date and time"}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="date-time-popover"
          role="dialog"
          aria-label="Choose event date and time"
        >
          <div className="calendar-heading">
            <strong>
              {view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </strong>
            <div>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
                }
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
                }
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday.slice(0, 1)}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day) => {
              const selected =
                parsed?.year === day.getFullYear() &&
                parsed.month === day.getMonth() &&
                parsed.day === day.getDate();
              const today =
                now.getFullYear() === day.getFullYear() &&
                now.getMonth() === day.getMonth() &&
                now.getDate() === day.getDate();
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={`${day.getMonth() !== view.getMonth() ? "outside" : ""}${selected ? " selected" : ""}`}
                  aria-label={day.toLocaleDateString(undefined, { dateStyle: "full" })}
                  aria-pressed={selected}
                  data-today={today || undefined}
                  onClick={() => selectDay(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="calendar-time">
            <Clock aria-hidden="true" />
            <span>Time</span>
            <select
              aria-label="Hour"
              value={pad(parsed?.hour ?? 12)}
              onChange={(event) => updateTime("hour", Number(event.target.value))}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={pad(hour)}>{pad(hour)}</option>
              ))}
            </select>
            <span aria-hidden="true">:</span>
            <select
              aria-label="Minute"
              value={pad(parsed?.minute ?? 0)}
              onChange={(event) => updateTime("minute", Number(event.target.value))}
            >
              {Array.from({ length: 60 }, (_, minute) => (
                <option key={minute} value={pad(minute)}>{pad(minute)}</option>
              ))}
            </select>
          </div>

          <div className="calendar-actions">
            <button type="button" onClick={() => onChange("")}>Clear</button>
            <button type="button" className="calendar-done" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
