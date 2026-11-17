# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Completing pending payments

Applications with **Awaiting Payment** status offer **Complete Payment** in their
actions menu (including file application history and Other Applications). This
reuses the existing Remita RRR and retrieves its amount from `GetRRRCost`; it does
not generate a new reference or rely on the original form's browser storage.
The invoice resolves the registered file number from the existing file record;
the internal file ID is retained separately for payment confirmation.
If invoice loading fails, the page displays the actual error and offers Retry,
which reloads the same payment reference without generating a new RRR.

The shared resume handler returns to `/payment/complete`, verifies the RRR with
the backend, and confirms the existing application using the applicable payment
endpoint. File applications use the existing `ManualUpdate` confirmation flow;
oppositions, status searches, availability searches, and journal requests use
their dedicated endpoints. Confirmation failures remain visible and can be
retried without paying again. The existing Availability Search payment flow is
unchanged.

The same resume flow is used by the file's Make Payment button, pending data
revisions, and opposition withdrawal payments. Only applications still awaiting
payment expose the action. Missing identifiers or invalid RRR amounts are shown
as errors rather than creating a replacement payment.

Regression coverage: `npm run test:unit -- --run src/lib/utils/applicationPayment.test.ts`
and `npx playwright test tests/application-payment.spec.ts` (requires an installed
Playwright browser).

## SuperAdmin role management

The entire Users section, including direct and nested `/home/users` routes,
requires SuperAdmin access. Other signed-in users are redirected to the dashboard
before the directory renders or user requests are sent; signed-out users go to
login. Existing Tech-account restrictions remain in place.
The section includes **Users by Role** and **Role Assignment
Activity**, visible only to SuperAdmins. Role options and numeric role labels
come from `GET /api/users/roles`; member searches, actual assigners, and audit
history use server-side search and pagination through the configured backend
and shared authenticated client.
These views use the same numbered pagination controls as Support Tickets, so
available pages can be opened directly without losing the current filters.
All Users, role members, assigners, and activity history default to 10 results
per page, with 20, 50, and 100 available in the page-size selector.
The directory, role members, and activity views share a responsive card layout,
aligned filter panels, and horizontally scrollable tables on smaller screens.
User-detail sheets display selected roles as checkable cards with a pinned save
area; styling is limited to the Users module and its detail sheets.
User IDs are not displayed or offered as manual activity filters. Search uses
names and emails; opening an assigner's activity keeps their ID scoped internally.

The existing user-details sheet and role-member sheets share the role editor.
Updates send only changed catalogue IDs as `addRoles` and `removeRoles` to
`PUT /api/users/UpdateUserRoles`, without an actor ID. Failed saves preserve the
original roles and pending selection. Successful saves notify open member,
assigner, and history queries to refetch, even if the editor was closed while
saving. Inactive views are not cached and refetch when reopened.

Activity is read-only and includes additions and removals. Assigner totals count
individual roles added, not recipients; removal-only actors appear in history,
not the assigners list. Names/emails in history are historical snapshots. Date
filters use inclusive local date/time bounds converted to ISO-8601 UTC, and
displayed timestamps use the viewer's local timezone.

Audit data starts when backend tracking was introduced; empty results do not
establish that no earlier assignments occurred. Duplicate/no-op updates must
not create backend audit entries. Backend build/test validation remains pending,
and audited updates require a transaction-capable MongoDB deployment.

Regression coverage: `npm run test:unit -- --run src/lib/utils/userRolesApi.test.ts src/lib/utils/roleQuery.test.ts src/lib/utils/authFetch.test.ts`
and `npx playwright test tests/user-roles.spec.ts` (requires an installed Playwright
browser; API fixtures are confined to tests, not the application).
