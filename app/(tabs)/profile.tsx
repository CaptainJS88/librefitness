import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';

const ProfileScreen = function () {
    const { session } = useAuth();
    const { toggleTheme } = useThemeStore();

    async function handleSignOut() {
        const result = await supabase.auth.signOut();
        if (result.error) {
            console.error("Error signing out", result.error)
        }
    }
    return (
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>Profile Page</ThemedText>
            <ThemedText style={styles.emailText}>
                Logged in as: {session?.user?.email || 'Unknown User'}
            </ThemedText>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.emailText}>
                Toggle theme
            </ThemedText>
            <TouchableOpacity style={styles.button} onPress={toggleTheme}>
                <ThemedText style={styles.buttonText}>Toggle Theme</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    emailText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40
    },
    button: {
        backgroundColor: '#ff3b30', // A nice red for a destructive action
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default ProfileScreen;