
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '../server/_app'; // Assuming your AppRouter is exported from here

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc', // Assuming your app runs on localhost:3000
    }),
  ],
});

async function main() {
  try {
    const result = await trpc.language.updatePartnerSupportedLanguages.mutate({ 
      languages: [], // Not needed when enableAll is true
      enableAll: true 
    });
    console.log('Successfully enabled all languages:', result);
  } catch (error) {
    console.error('Error enabling languages:', error);
  }
}

main();
