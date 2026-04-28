import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';

const ProgressScreen = function () {
    useEffect(() => {
        async function testConnection() {
            // This queries the database. 
            // Because RLS is on and we aren't logged in, it should return an empty array [], not an error.
            const { data, error } = await supabase.from('profiles').select('*');

            if (error) {
                console.error('Supabase connection error:', error.message);
            } else {
                console.log('Supabase connected! Profiles data:', data);
            }
        }

        testConnection();

    }, [])
    return (
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>Progress Page</ThemedText>
        </ThemedView>
    );
}

export default ProgressScreen;