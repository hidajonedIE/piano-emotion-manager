import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import React from 'react';

function App() {
  return (
    <ClerkProvider publishableKey={"pk_test_dG91Y2hpbmctY2F0ZmlzaC04LmNsZXJrLmFjY291bnRzLmRldiQ"}>
      <TokenComponent />
    </ClerkProvider>
  );
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

export default App;
