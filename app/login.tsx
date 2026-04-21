import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

const LoginScreen = function () {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Sign in with email
    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            Alert.alert('Error', error.message);
        }

        setLoading(false);
    }

    // Sign up with email
    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            Alert.alert('Error', error.message);
        }
        else {
            Alert.alert('Success', 'Check your email for the confirmation link!');
        }
        setLoading(false);
    }

    // Sign up/in with Google

    async function performGoogleOAuth() {
        setLoading(true);

        const redirectUrl = makeRedirectUri();

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
            },
        });

        // Error with google sign in
        if (error) {
            Alert.alert('Google Auth Error', error.message);
            setLoading(false);
            return;
        }
        // Success with google sign in
        if (data.url) {
            await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
        }

        setLoading(false);
    }

    // Email and password fields, with buttons
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Libre Fitness</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                autoCapitalize="none"
            />

            <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={signUpWithEmail} disabled={loading}>
                <Text style={styles.outlineText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.line} />
            </View>

            <TouchableOpacity style={[styles.button, styles.socialButton]} onPress={performGoogleOAuth} disabled={loading}>
                <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    header: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 },
    button: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#000' },
    outlineText: { color: '#000', fontWeight: 'bold' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: '#ccc' },
    dividerText: { marginHorizontal: 10, color: '#666', fontWeight: 'bold' },
    socialButton: { backgroundColor: '#f4f4f4', borderWidth: 1, borderColor: '#ddd' },
    socialText: { color: '#333', fontWeight: '600' }
});

export default LoginScreen;