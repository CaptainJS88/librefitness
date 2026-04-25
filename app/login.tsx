import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';

const LoginScreen = function () {
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Signs an existing user in with email + password.
  async function signInWithEmail() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Error', error.message);
    }

    setLoading(false);
  }

  // Creates a new user account with email + password.
  async function signUpWithEmail() {
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the confirmation link!');
    }

    setLoading(false);
  }

  // Handles Google OAuth sign in.
  async function performGoogleOAuth() {
    setLoading(true);

    const redirectUrl = makeRedirectUri();
    console.log('Redirecting to:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      Alert.alert('Google Auth Error', error.message);
      setLoading(false);
      return;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      // On mobile, Supabase gives us tokens back through the redirect URL.
      // We extract them and set the session manually.
      if (result.type === 'success' && result.url) {
        const { params, errorCode } = QueryParams.getQueryParams(result.url);

        if (errorCode) {
          console.error('OAuth Error:', errorCode);
          setLoading(false);
          return;
        }

        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError.message);
          }
        }
      }
    }

    setLoading(false);
  }

  return (
    <ThemedView variant="background" style={styles.container}>
      <ThemedText style={styles.header}>Libre Fitness</ThemedText>

      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={signInWithEmail}
        disabled={loading}
      >
        <ThemedText style={[styles.buttonText, { color: colors.buttonText }]}>
          Sign In
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.outlineButton,
          { borderColor: colors.primary },
        ]}
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <ThemedText style={[styles.outlineText, { color: colors.primary }]}>
          Sign Up
        </ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.dividerContainer}>
        <ThemedView style={[styles.line, { backgroundColor: colors.border }]} />
        <ThemedText variant="textMuted" style={styles.dividerText}>
          OR
        </ThemedText>
        <ThemedView style={[styles.line, { backgroundColor: colors.border }]} />
      </ThemedView>

      <TouchableOpacity
        style={[
          styles.button,
          styles.socialButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={performGoogleOAuth}
        disabled={loading}
      >
        <ThemedText style={[styles.socialText, { color: colors.text }]}>
          Continue with Google
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  outlineText: {
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  socialButton: {
    borderWidth: 1,
  },
  socialText: {
    fontWeight: '600',
  },
});

export default LoginScreen;
