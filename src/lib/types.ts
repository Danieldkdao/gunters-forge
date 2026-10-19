import { Dispatch, SetStateAction } from "react";
import { socialProviders } from "./constants";
import { SearchParams } from "nuqs";
import { Column, ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

export type ParamsId<T extends string> = {
  params: Promise<Record<T, string>>;
};
export type SearchParamsType = { searchParams: Promise<SearchParams> };
export type SetterType<T> = Dispatch<SetStateAction<T>>;
export type UnwrapAsync<T extends (...params: never[]) => unknown> =
  NonNullable<Awaited<ReturnType<T>>>;

export type SocialProvider = (typeof socialProviders)[number];

export type KeysOfType<T, Condition> = {
  [K in keyof T]-?: T[K] extends Condition ? K : never;
}[keyof T];

export type TableProperty = Column<
  ColumnBaseConfig<ColumnDataType, string>,
  object,
  object
>;

export type GetTableName<T> = T extends PgTable ? T["_"]["name"] : never;

export type TableIdColumn<TableName extends string> = PgColumn<{
  name: "id";
  tableName: TableName;
  dataType: "string";
  columnType: "PgUUID";
  data: string;
  driverParam: string;
  notNull: true;
  hasDefault: true;
  isPrimaryKey: true;
  isAutoincrement: false;
  hasRuntimeDefault: false;
  enumValues: undefined;
  baseColumn: never;
  identity: undefined;
  generated: undefined;
}>;
