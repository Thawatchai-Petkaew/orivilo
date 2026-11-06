"use client";

import {
  DayPicker,
  type Formatters,
  type Labels,
  type NavProps,
  type WeekdaysProps,
} from "react-day-picker";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { type IsoDate, formatDate, fromIsoDate, toIsoDate } from "../../i18n/date";
import { fill } from "../../i18n/messages/index";
import { WEEK_START } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

export interface CalendarProps {
  /** One date. A range comes with its own story. */
  mode?: "single" | undefined;
  /** A `YYYY-MM-DD` Gregorian date, never a `Date` and never a Buddhist year (`date-value-1`). The calendar is controlled when this key is present, even as `undefined`, which shows no selected day. */
  value?: IsoDate | undefined;
  /** The date an uncontrolled calendar starts on. */
  defaultValue?: IsoDate | undefined;
  /** Called with the date pressed. Pressing the selected date again calls nothing; clearing is the caller's job. */
  onChange?: ((value: IsoDate) => void) | undefined;
  /** The first date that can be pressed, inclusive. Previous month stops at its month. */
  min?: IsoDate | undefined;
  /** The last date that can be pressed, inclusive. Next month stops at its month. */
  max?: IsoDate | undefined;
  /** A date that cannot be pressed, such as a day the caller has no data for. */
  isDateDisabled?: ((date: IsoDate) => boolean) | undefined;
  /** The date marked as today. Defaults to the viewer's local date, read after mount. */
  today?: IsoDate | undefined;
  /** A date inside the month to open on when there is no value. */
  defaultMonth?: IsoDate | undefined;
  /** One month or two side by side. Two need a viewport of about 690 px; pass 1 below `md`. */
  months?: 1 | 2 | undefined;
  /** For layout only. */
  className?: string | undefined;
}

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Our class for each slot of the engine; the engine ships no stylesheet here and we load none. */
const CLASS_NAMES = {
  root: "ds-calendar",
  months: "ds-calendar__months",
  nav: "ds-calendar__nav",
  month: "ds-calendar__month",
  month_caption: "ds-calendar__caption",
  caption_label: "ds-calendar__heading",
  month_grid: "ds-calendar__grid",
  weekdays: "ds-calendar__weekdays",
  weekday: "ds-calendar__weekday",
  weeks: "ds-calendar__weeks",
  week: "ds-calendar__week",
  day: "ds-calendar__day",
  day_button: "ds-calendar__day-button",
};

/**
 * Previous and next month are our Button, in a labelled group. The engine draws a `nav` landmark
 * here; two calendars on a page would then carry two landmarks of one name, which axe fails
 * (`landmark-unique`), and a date grid is not a site navigation. A month the bounds put out of reach
 * takes the native `disabled` (cal-bounds-1).
 */
function Nav({ onPreviousClick, onNextClick, previousMonth, nextMonth, ...group }: NavProps) {
  const m = useMessages();
  return (
    <div role="group" {...group}>
      <Button
        iconOnly
        variant="ghost"
        size="sm"
        aria-label={m.calendar.previousMonth}
        disabled={!previousMonth}
        onClick={onPreviousClick}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <Button
        iconOnly
        variant="ghost"
        size="sm"
        aria-label={m.calendar.nextMonth}
        disabled={!nextMonth}
        onClick={onNextClick}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
}

/**
 * The engine hides its weekday row from assistive technology because a day button already says its
 * weekday. The spec asks each column to carry its full name (cal-names-1), so the row stays in the tree.
 */
function Weekdays(props: WeekdaysProps) {
  return (
    <thead>
      <tr {...props} />
    </thead>
  );
}

const COMPONENTS = { Nav, Weekdays };

/** A date prop read once: the date, or undefined when it is absent or not a real date (`date-value-1`). */
const dateOf = (value: IsoDate | undefined) =>
  value === undefined ? undefined : fromIsoDate(value);

/** A clock that never ticks: the server snapshot is undefined, so a hydrated page marks no day until mount. */
const subscribeNever = () => () => {};
const readLocalToday = () => toIsoDate(new Date());
const readNoToday = () => undefined;

/**
 * A month grid for one date (spec ORV-231). `react-day-picker` supplies the grid, the roving focus
 * and the keys (ADR 0020); this file gives it our words, our dates, our look and our Button. Every
 * date in and out is an `IsoDate`, Gregorian; Thai shows the Buddhist Era year only in the text it
 * draws. The dates in the stories are mock.
 */
export function Calendar(props: CalendarProps) {
  const {
    value,
    defaultValue,
    onChange,
    min,
    max,
    isDateDisabled,
    today,
    defaultMonth,
    months = 1,
    className,
  } = props;
  const locale = useLocale();
  const m = useMessages();
  // Controlled when the `value` key is present, even as `undefined`: the caller then clears the date
  // by passing `undefined`, and a press calls `onChange` and keeps nothing (cal-api-1).
  const controlled = "value" in props;
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const clock = useSyncExternalStore(subscribeNever, readLocalToday, readNoToday);
  // A false `today` gives way to the viewer's local date (cal-today-1).
  const todayDate = dateOf(today) ?? dateOf(clock);

  const weekdays = useMemo(() => {
    const c = m.calendar;
    return {
      short: [
        c.weekdayShortSun,
        c.weekdayShortMon,
        c.weekdayShortTue,
        c.weekdayShortWed,
        c.weekdayShortThu,
        c.weekdayShortFri,
        c.weekdayShortSat,
      ] as const,
      full: [
        c.weekdayFullSun,
        c.weekdayFullMon,
        c.weekdayFullTue,
        c.weekdayFullWed,
        c.weekdayFullThu,
        c.weekdayFullFri,
        c.weekdayFullSat,
      ] as const,
    };
  }, [m]);

  const formatters = useMemo<Partial<Formatters>>(
    () => ({
      formatCaption: (month) => formatDate(toIsoDate(month), "monthYear", locale),
      formatDay: (date) => String(date.getDate()),
      formatWeekdayName: (weekday) => weekdays.short[weekday.getDay() as WeekdayIndex],
    }),
    [locale, weekdays],
  );

  const labels = useMemo<Partial<Labels>>(
    () => ({
      labelNav: () => m.calendar.navigation,
      labelGrid: (month) => formatDate(toIsoDate(month), "monthYear", locale),
      labelWeekday: (weekday) => weekdays.full[weekday.getDay() as WeekdayIndex],
      labelDayButton: (date, modifiers) => {
        const full = formatDate(toIsoDate(date), "full", locale);
        if (modifiers.today && modifiers.selected)
          return fill(m.calendar.dayTodaySelected, { date: full });
        if (modifiers.today) return fill(m.calendar.dayToday, { date: full });
        if (modifiers.selected) return fill(m.calendar.daySelected, { date: full });
        return full;
      },
    }),
    [locale, m, weekdays],
  );

  // A bound is read as a date before it is compared (cal-bounds-1). One that is present and not a
  // real date cannot be read, so no day can be pressed: access defaults to deny. It gives the month
  // buttons no limit, since there is no month to stop at.
  const startMonth = dateOf(min);
  const endMonth = dateOf(max);
  const unreadable =
    (min !== undefined && startMonth === undefined) ||
    (max !== undefined && endMonth === undefined);

  const disabled = useCallback(
    (date: Date) => {
      if (unreadable) return true;
      // Past the check above every bound that is set is a real `YYYY-MM-DD`, so a string compare is a date compare.
      const iso = toIsoDate(date);
      return (
        (min !== undefined && iso < min) ||
        (max !== undefined && iso > max) ||
        isDateDisabled?.(iso) === true
      );
    },
    [unreadable, min, max, isDateDisabled],
  );

  // The engine's own props refuse an explicit undefined, so a missing bound is a missing key.
  const bounds = {
    ...(startMonth && { startMonth }),
    ...(endMonth && { endMonth }),
  };

  const selected = dateOf(current);
  // A false `defaultMonth` gives way to `today` (cal-today-1).
  const opensOn = selected ?? dateOf(defaultMonth) ?? todayDate;
  // Nothing says which month to open on until the clock is read: draw the empty tile and wait.
  if (!opensOn) return <div className={cx("ds-calendar", className)} />;

  return (
    <DayPicker
      mode="single"
      required
      selected={selected}
      onSelect={(next) => {
        const iso = toIsoDate(next);
        if (iso === current) return;
        if (!controlled) setOwn(iso);
        onChange?.(iso);
      }}
      disabled={disabled}
      {...bounds}
      defaultMonth={opensOn}
      // No library clock: before the clock is read the engine gets a day no calendar shows, so none is marked.
      today={todayDate ?? new Date(0)}
      numberOfMonths={months}
      weekStartsOn={WEEK_START[locale]}
      captionLayout="label"
      showOutsideDays={false}
      numerals="latn"
      lang={locale}
      classNames={CLASS_NAMES}
      components={COMPONENTS}
      formatters={formatters}
      labels={labels}
      className={cx(className)}
      data-months={months}
    />
  );
}
