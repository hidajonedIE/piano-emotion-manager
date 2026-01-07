/**
 * Email Verification Screen - Piano Emotion Manager
 * Handles email verification during sign-up
 */
import { SignUp } from '@clerk/clerk-react';
import { View, StyleSheet } from 'react-native';

export default function VerifyEmailScreen() {
  return (
    <View style={styles.container}>
      <SignUp 
        path="/sign-up/verify-email-address"
        routing="path"
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
