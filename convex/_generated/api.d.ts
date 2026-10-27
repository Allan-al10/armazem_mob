/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as products from "../products.js";
import type * as reminders from "../reminders.js";
import type * as sales from "../sales.js";
import type * as stock from "../stock.js";
import type * as stores from "../stores.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  credits: typeof credits;
  crons: typeof crons;
  customers: typeof customers;
  dashboard: typeof dashboard;
  health: typeof health;
  http: typeof http;
  lib: typeof lib;
  products: typeof products;
  reminders: typeof reminders;
  sales: typeof sales;
  stock: typeof stock;
  stores: typeof stores;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
