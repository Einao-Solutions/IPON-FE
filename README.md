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
