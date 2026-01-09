import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = "pk_test_dG91Y2hpbmctY2F0ZmlzaC04LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function TokenComponent() {
  const { getToken } = useAuth();

  React.useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getToken();
        console.log('Token:', token);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, [getToken]);

  return <div>Check the console for the token.</div>;
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main>
        <SignedIn>
          <TokenComponent />
        </SignedIn>
        <SignedOut>
          <div>Please sign in to test token retrieval.</div>
        </SignedOut>
      </main>
    </ClerkProvider>
  );
}
