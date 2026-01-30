// import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "@sveltejs/adapter-static";
// import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */

const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.

    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    prerender: {
      entries: [
        "/",
        "/application",
        "/auth",
        "/dataview",
        "/files",
        "/home",
        "/home/dashboard",
        "/home/notifications",
        "/home/profile",
        "/home/search",
        "/home/support",
        "/home/finance",
        "/home/performance",
        "/home/publications",
        "/home/users",
        "/payment",
        "/payment/paid",
        "/home/payments",
        "/home/trademarkpubs",
        "/PaymentView",
        "/payment/status",
        "/logout",
        "/updatesmade",
        "/metadata",
        "/statussearch",
        "/statussearch/result",
        "/availabilitysearch",
        "/home/postregistration",
        "/home/opposition",
        "/home/postregistration/search",
        "/home/postregistration/merger",
        "/home/postregistration/paid",
        "/home/postregistration/registeredusers",
        "/home/postregistration/changedata",
        "/home/postregistration/assignment",
        "/home/clerical-update",
        "/home/clerical-update/paid",
        "/home/clerical-update/search",
        "/home/clerical-update/update",
        "/home/clerical-update/patentclericalupdate",
        "/home/update-files",
        "/home/update-files/search",
        "/home/update-files/update",
        "/home/admin",
        "/home/admin/updatefileinfo",
        "/home/admin/fileupdatehistory",
        "/qr",
        "/patent",
        "/home/editpatentfiles",
        "/home/editattachments",
        "/home/claim-files",
        "/home/claim-files/search",
        "/home/claimrequests",
        "/home/publications/publicationstatusupdate",
        "/home/publications/publicationstatusupdate/search",
        "/home/publications/publicationstatusupdate/result",
        "/home/publications/publicationstatusupdate/statusupdateform",
        "/opposition",
        "/opposition/paid",
        "/home/file-withdrawal",
        "/home/file-withdrawal/search",
        "/home/file-withdrawal/withdrawalform",
        "/home/file-withdrawal/file-withdrawal-result",
        "/home/profile/update",
        "/home/resources",
        "/home/resources/design",
        "/home/resources/patent",
        "/home/resources/trademark",
        "/upload",
        "/home/postregistration/patentamendment",
        "/home/postregistration/patentassignment",
        "/home/postregistration/patentassignment/result",
        "/home/postregistration/patentctc",
        " /home/postregistration/patentlicense",
        " /home/postregistration/patentlicense/result",
        " /home/postregistration/patentmerger",
        " /home/postregistration/patentmerger/result",
        " /home/postregistration/patentmortgage",
        "/home/postregistration/patentmortgage/result",
      ],
    },
  },
};

export default config;
