import { Dispatch, SetStateAction } from "react";
import { socialProviders } from "./constants";

export type ParamsId<T extends string> = {
  params: Promise<Record<T, string>>;
};
// export type SearchParamsType = { searchParams: Promise<SearchParams> };
export type SetterType<T> = Dispatch<SetStateAction<T>>;
export type UnwrapAsync<T extends (...params: never[]) => unknown> =
  NonNullable<Awaited<ReturnType<T>>>;

export type SocialProvider = (typeof socialProviders)[number];
