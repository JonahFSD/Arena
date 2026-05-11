/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addUsers from "../addUsers.js";
import type * as admin from "../admin.js";
import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as bounties from "../bounties.js";
import type * as collaborators from "../collaborators.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as leadership from "../leadership.js";
import type * as memberships from "../memberships.js";
import type * as messages from "../messages.js";
import type * as nominators from "../nominators.js";
import type * as notifications from "../notifications.js";
import type * as prizes from "../prizes.js";
import type * as resetAuth from "../resetAuth.js";
import type * as seed from "../seed.js";
import type * as sidebarBadges from "../sidebarBadges.js";
import type * as storage from "../storage.js";
import type * as stripe from "../stripe.js";
import type * as submissions from "../submissions.js";
import type * as users from "../users.js";
import type * as verify from "../verify.js";
import type * as voting from "../voting.js";
import type * as votingActions from "../votingActions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addUsers: typeof addUsers;
  admin: typeof admin;
  applications: typeof applications;
  auth: typeof auth;
  bounties: typeof bounties;
  collaborators: typeof collaborators;
  crons: typeof crons;
  email: typeof email;
  helpers: typeof helpers;
  http: typeof http;
  leadership: typeof leadership;
  memberships: typeof memberships;
  messages: typeof messages;
  nominators: typeof nominators;
  notifications: typeof notifications;
  prizes: typeof prizes;
  resetAuth: typeof resetAuth;
  seed: typeof seed;
  sidebarBadges: typeof sidebarBadges;
  storage: typeof storage;
  stripe: typeof stripe;
  submissions: typeof submissions;
  users: typeof users;
  verify: typeof verify;
  voting: typeof voting;
  votingActions: typeof votingActions;
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
