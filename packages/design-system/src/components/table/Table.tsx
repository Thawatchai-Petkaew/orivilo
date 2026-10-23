"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { collatorFor } from "../../i18n/format";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { Checkbox, type CheckedState } from "../checkbox/Checkbox";
import { cx } from "../cx";
import { ChevronDownIcon, SpinnerIcon } from "../icons";

export type TableDensity = "comfortable" | "compact";
export type SortDirection = "ascending" | "descending";

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<Row> {
  /** The field read from the row when `cell` is not given, and the sort key. */
  key: string;
  /** A string: it is read aloud with the sort and printed before the value at phone width. */
  header: string;
  /** End-aligned mono tabular figures: digits, a unit and a sign only, never Thai text. */
  numeric?: boolean | undefined;
  align?: "start" | "end" | undefined;
  sortable?: boolean | undefined;
  /** The value to sort by when it is not the field itself. */
  sortValue?: ((row: Row) => string | number | null | undefined) | undefined;
  /** One line with an ellipsis at `width`; off by default, because the default wraps. */
  truncate?: boolean | undefined;
  /** A CSS width for the column (layout, so any unit). */
  width?: string | undefined;
  cell?: ((row: Row) => ReactNode) | undefined;
}

export interface TableEmpty {
  /** The catalog's `table.empty` by default. */
  title?: ReactNode;
  description?: ReactNode;
  /** The action the empty state invites (DESIGN.md §7). */
  action?: ReactNode;
}

export interface TableError {
  /** What went wrong and how to fix it. */
  message: ReactNode;
  /** A retry or an alternative. */
  action?: ReactNode;
}

export interface TableProps<Row> {
  /** The table's accessible name; shown above the rows unless `captionHidden`. */
  caption: ReactNode;
  captionHidden?: boolean | undefined;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** The profile decides density (DESIGN.md §3.3); a page passes it through. */
  density?: TableDensity | undefined;
  /** Controlled sort; leave undefined for the table's own. */
  sort?: TableSort | null | undefined;
  defaultSort?: TableSort | null | undefined;
  onSortChange?: ((sort: TableSort | null) => void) | undefined;
  /** A checkbox per row and one in the header that selects or clears every row. */
  selectable?: boolean | undefined;
  selectedKeys?: ReadonlySet<string> | undefined;
  defaultSelectedKeys?: ReadonlySet<string> | undefined;
  onSelectionChange?: ((keys: ReadonlySet<string>) => void) | undefined;
  /** Names a row's checkbox; the row key by default. */
  rowLabel?: ((row: Row) => string) | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
  empty?: TableEmpty | undefined;
  error?: TableError | null | undefined;
  /** What a missing cell says; never blank (DESIGN.md §4). */
  missingLabel?: string | undefined;
  className?: string | undefined;
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function fieldOf<Row>(row: Row, column: TableColumn<Row>): unknown {
  return (row as Record<string, unknown>)[column.key];
}

function compareValues(a: unknown, b: unknown, collator: Intl.Collator): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

/** Sorted by the column; missing values last in both directions. */
function sortRows<Row>(
  rows: readonly Row[],
  columns: readonly TableColumn<Row>[],
  sort: TableSort | null,
  collator: Intl.Collator,
): readonly Row[] {
  if (!sort) return rows;
  const column = columns.find((c) => c.key === sort.key);
  if (!column) return rows;
  const valueOf = column.sortValue ?? ((row: Row) => fieldOf(row, column) as string | number);
  const present = rows.filter((row) => !isMissing(valueOf(row)));
  const missing = rows.filter((row) => isMissing(valueOf(row)));
  const sign = sort.direction === "ascending" ? 1 : -1;
  const sorted = [...present].sort(
    (a, b) => sign * compareValues(valueOf(a), valueOf(b), collator),
  );
  return [...sorted, ...missing];
}

function nextSort(current: TableSort | null, key: string): TableSort {
  if (current?.key === key && current.direction === "ascending") {
    return { key, direction: "descending" };
  }
  return { key, direction: "ascending" };
}

/**
 * Rows of the same shape that are scanned or compared (DESIGN.md §6). The frame is a card on the
 * canvas and the header a well; numeric columns sit end-aligned in mono; a missing cell says so
 * instead of staying blank; under 480 px the recipe turns each row into a block that prints the
 * column name before every value, so nothing scrolls sideways. Loading, empty and error are rows
 * inside the table, so the surface never disappears under the user.
 */
export function Table<Row>({
  caption,
  captionHidden = false,
  columns,
  rows,
  rowKey,
  density = "comfortable",
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  selectable = false,
  selectedKeys: selectedProp,
  defaultSelectedKeys,
  onSelectionChange,
  rowLabel,
  loading = false,
  loadingLabel,
  empty,
  error,
  missingLabel,
  className,
}: TableProps<Row>) {
  const m = useMessages();
  const collator = collatorFor(useLocale());
  const [ownSort, setOwnSort] = useState<TableSort | null>(defaultSort);
  const sort = sortProp === undefined ? ownSort : sortProp;
  const [ownSelected, setOwnSelected] = useState<ReadonlySet<string>>(
    () => defaultSelectedKeys ?? new Set<string>(),
  );
  const selected = selectedProp ?? ownSelected;

  const setSort = (next: TableSort | null) => {
    if (sortProp === undefined) setOwnSort(next);
    onSortChange?.(next);
  };
  const setSelected = (next: ReadonlySet<string>) => {
    if (selectedProp === undefined) setOwnSelected(next);
    onSelectionChange?.(next);
  };

  const ordered = sortRows(rows, columns, sort, collator);
  const keys = ordered.map(rowKey);
  const selectedCount = keys.filter((key) => selected.has(key)).length;
  const headerState: CheckedState =
    keys.length > 0 && selectedCount === keys.length
      ? true
      : selectedCount > 0
        ? "indeterminate"
        : false;
  const sortedColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;
  const announcement =
    sort && sortedColumn
      ? fill(m.table.sortedBy, { column: sortedColumn.header, direction: m.table[sort.direction] })
      : "";
  const span = columns.length + (selectable ? 1 : 0);
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className={cx("ds-table__frame", className)} data-density={density}>
      <table
        className="ds-table"
        role="table"
        aria-busy={loading || undefined}
        data-selectable={selectable ? "" : undefined}
      >
        <caption className={captionHidden ? "sr-only" : "ds-table__caption"}>{caption}</caption>
        <thead className="ds-table__head" role="rowgroup">
          <tr role="row">
            {selectable ? (
              <th className="ds-table__th" role="columnheader" scope="col" data-select="">
                <Checkbox
                  size="sm"
                  label={<span className="sr-only">{m.table.selectAll}</span>}
                  checked={headerState}
                  disabled={loading || keys.length === 0}
                  onCheckedChange={(state) =>
                    setSelected(state === true ? new Set(keys) : new Set())
                  }
                />
              </th>
            ) : null}
            {columns.map((column) => {
              const align = column.align ?? (column.numeric ? "end" : "start");
              const isSorted = sort?.key === column.key;
              const style: CSSProperties | undefined = column.width
                ? { width: column.width }
                : undefined;
              return (
                <th
                  key={column.key}
                  className="ds-table__th"
                  role="columnheader"
                  scope="col"
                  data-align={align}
                  aria-sort={
                    column.sortable ? (isSorted && sort ? sort.direction : "none") : undefined
                  }
                  style={style}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="ds-table__sort"
                      disabled={loading}
                      onClick={() => setSort(nextSort(sort, column.key))}
                    >
                      {column.header}
                      {isSorted && sort ? (
                        <ChevronDownIcon
                          className="ds-table__sort-glyph size-4"
                          data-direction={sort.direction}
                        />
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="ds-table__body" role="rowgroup">
          {ordered.map((row, index) => {
            const key = keys[index] ?? String(index);
            const isSelected = selected.has(key);
            return (
              <tr
                key={key}
                className="ds-table__row"
                role="row"
                data-selected={isSelected ? "" : undefined}
              >
                {selectable ? (
                  <td
                    className="ds-table__td"
                    role="cell"
                    data-select=""
                    data-label={m.table.select}
                  >
                    <Checkbox
                      size="sm"
                      label={<span className="sr-only">{rowLabel ? rowLabel(row) : key}</span>}
                      checked={isSelected}
                      disabled={loading}
                      onCheckedChange={(state) => {
                        const next = new Set(selected);
                        if (state === true) next.add(key);
                        else next.delete(key);
                        setSelected(next);
                      }}
                    />
                  </td>
                ) : null}
                {columns.map((column) => {
                  const align = column.align ?? (column.numeric ? "end" : "start");
                  const value = column.cell ? column.cell(row) : fieldOf(row, column);
                  const content = isMissing(value) ? (
                    <span className="ds-table__missing">{missingLabel ?? m.table.missing}</span>
                  ) : (
                    (value as ReactNode)
                  );
                  return (
                    <td
                      key={column.key}
                      className="ds-table__td"
                      role="cell"
                      data-align={align}
                      data-numeric={column.numeric ? "" : undefined}
                      data-truncate={column.truncate ? "" : undefined}
                      data-label={column.header}
                    >
                      <span className="ds-table__cell">{content}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {loading ? (
            <tr role="row">
              <td className="ds-table__status" role="cell" colSpan={span}>
                <div className="ds-table__status-inner" role="status">
                  <SpinnerIcon className="ds-spin size-5" />
                  <p className="ds-table__status-text">{loadingLabel ?? m.table.loading}</p>
                </div>
              </td>
            </tr>
          ) : null}
          {error ? (
            <tr role="row">
              <td className="ds-table__status" role="cell" colSpan={span} data-tone="error">
                <div className="ds-table__status-inner" role="alert">
                  <p className="ds-table__status-text">{error.message}</p>
                  {error.action}
                </div>
              </td>
            </tr>
          ) : null}
          {showEmpty ? (
            <tr role="row">
              <td className="ds-table__status" role="cell" colSpan={span}>
                <div className="ds-table__status-inner">
                  <p className="ds-table__status-title">{empty?.title ?? m.table.empty}</p>
                  {empty?.description ? (
                    <p className="ds-table__status-text">{empty.description}</p>
                  ) : null}
                  {empty?.action}
                </div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
