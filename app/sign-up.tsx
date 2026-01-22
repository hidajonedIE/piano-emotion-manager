/**
 * Sign Up Screen - Piano Emotion Manager
 * Uses Clerk's prebuilt SignUp component
 */
import { SignUp } from '@clerk/clerk-react';
import { View, StyleSheet } from 'react-native';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <SignUp 
        routing="virtual"
        signInUrl="/login"
        afterSignUpUrl="/(drawer)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
  },
});
