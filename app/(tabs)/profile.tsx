import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const ProfileScreen = function () {

    const { session } = useAuth();

    async function handleSignOut() {
        const result = await supabase.auth.signOut();
        if (result.error) {
            console.error("Error signing out", result.error)
        }
    }
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Profile Page</Text>
            <Text style={styles.emailText}>
                Logged in as: {session?.user?.email || 'Unknown User'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
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