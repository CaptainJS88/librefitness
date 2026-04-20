import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthProps = {
    session: Session | null;
    initialized: boolean;
};

export const AuthContext = createContext<AuthProps>({
    session: null,
    initialized: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children} : {children: React.ReactNode}) => {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({data : {session}}) => {
            setSession(session);
            setInitialized(true);
        })
        // Listen to session changes such as logout 
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        })

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, initialized }}>
          {children}
        </AuthContext.Provider>
      );
}