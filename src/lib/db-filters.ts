import { PgTable } from "drizzle-orm/pg-core";
import {
  GetTableName,
  KeysOfType,
  TableIdColumn,
  TableProperty,
} from "./types";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  lt,
  or,
  SQL,
} from "drizzle-orm";

export const createSearchFilter = <
  T extends PgTable,
  P extends KeysOfType<T, TableProperty>,
>(
  table: T,
  search: string,
  properties: P[],
) => {
  const trimmedSearch = search.trim();
  const searchTerm = `%${trimmedSearch}%`;
  return trimmedSearch
    ? or(
        ...properties.map((property) =>
          ilike(table[property] as TableProperty, searchTerm),
        ),
      )
    : undefined;
};

export const createInArrayFilter = <
  T extends PgTable,
  P extends KeysOfType<T, TableProperty>,
  K,
>(
  table: T,
  array: readonly K[],
  property: P,
) =>
  array.length ? inArray(table[property] as TableProperty, array) : undefined;

// Build each sort option so the pagination follows the correct direction each time
export const createSortByMap = <
  T extends PgTable & { id: TableIdColumn<GetTableName<T>> },
  P extends KeysOfType<T, TableProperty>,
  SortOptions extends {
    readonly option: string;
    order: "asc" | "desc";
    property: P;
  }[],
  K extends SortOptions[number]["option"],
  S,
>(
  table: T,
  nextCursor: { id: string; marker: S } | null,
  sortByOptions: SortOptions,
) =>
  Object.fromEntries(
    sortByOptions.map((option) => {
      const sqlWrapper =
        option.order === "asc"
          ? { sort: asc, cursor: gt }
          : { sort: desc, cursor: lt };
      const tableProperty = table[option.property] as TableProperty;

      // Use the unique ID to decide when there are ties
      const sortBy = [
        sqlWrapper.sort(tableProperty),
        sqlWrapper.sort(table.id),
      ];
      // Find the items beyond the cursor's sort value or ID depending on the case
      const cursorFilter =
        nextCursor?.marker && nextCursor?.id
          ? or(
              sqlWrapper.cursor(tableProperty, nextCursor.marker),
              and(
                eq(tableProperty, nextCursor.marker),
                sqlWrapper.cursor(table.id, nextCursor.id),
              ),
            )
          : undefined;
      return [
        option.option,
        {
          sortBy,
          cursorFilter,
          nextCursorField: option.property,
        },
      ];
    }),
  ) as Record<
    K,
    {
      cursorFilter: SQL<unknown> | undefined;
      sortBy: SQL<unknown>[];
      nextCursorField: SortOptions[number]["property"];
    }
  >;
