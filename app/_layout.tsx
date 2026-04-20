import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

  // Wrapping everything inside AuthProvider
  const InitialLayout = () => {
    const { session, initialized } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
      // If auth not initialized, return
      if (!initialized) {
        return;
      }

      // Check if user is inside the 'tabs' folder, such as progress or tracker, and if so, they must be logged in. 
      const inAuthGroup = segments[0] === '(tabs)';

      // if they are logged in but not in a 'tabs' group, send em to the tracker screen, as they're logged in.
      if (session && !inAuthGroup) {
        router.replace('/(tabs)/tracker');
      }

      // If they are not logged in, but trying to access a 'tabs' group, make em login/signup
      else if (!session && inAuthGroup) {
        router.replace('/login');
      }
    }, [session, initialized, segments])
    return <Slot />;
  }
 
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );}
