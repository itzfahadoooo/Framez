import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from auth screens
  useEffect(() => {
    if (!loading && user) {
      console.log('User is authenticated, redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}