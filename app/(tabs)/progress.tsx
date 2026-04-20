import { Text, View } from 'react-native';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Progress Page</Text>
        </View>
    );
}

export default ProgressScreen;