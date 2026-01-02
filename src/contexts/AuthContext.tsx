// ============================================================================
// CONTEXTO DE AUTENTICACIÓN - SUPABASE AUTH
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// MOCK USERS - COMENTADOS PARA REFERENCIA FUTURA
// ============================================================================
// const mockUsers: Record<string, { password: string; user: User }> = {
//   'researcher@smyeg.com': {
//     password: 'demo123',
//     user: {
//       id: 'user-1',
//       name: 'Dr. Ana García',
//       email: 'researcher@smyeg.com',
//       role: 'RESEARCHER',
//       institution: 'Universidad Central de Venezuela',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
//     },
//   },
//   'manager@smyeg.com': {
//     password: 'demo123',
//     user: {
//       id: 'user-2',
//       name: 'Carlos Mendoza',
//       email: 'manager@smyeg.com',
//       role: 'RISK_MANAGER',
//       institution: 'INPARQUES',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
//     },
//   },
//   'monitor@smyeg.com': {
//     password: 'demo123',
//     user: {
//       id: 'user-3',
//       name: 'María González',
//       email: 'monitor@smyeg.com',
//       role: 'COMMUNITY_MONITOR',
//       community: 'Comunidad La Paragua',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
//     },
//   },
//   'public@smyeg.com': {
//     password: 'demo123',
//     user: {
//       id: 'user-4',
//       name: 'Usuario Público',
//       email: 'public@smyeg.com',
//       role: 'PUBLIC',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Public',
//     },
//   },
// };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene el perfil del usuario desde la tabla 'users' de Supabase
 * @param userId - ID del usuario autenticado
 * @param email - Email del usuario autenticado
 * @returns User object con toda la información del perfil
 */
const getUserProfile = async (userId: string, email: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('No se pudo obtener el perfil del usuario');
  }

  if (!data) {
    throw new Error('Perfil de usuario no encontrado');
  }

  // Mapear los datos de la base de datos al tipo User
  return {
    id: data.id,
    name: data.name || data.email.split('@')[0],
    email: data.email,
    role: data.role as UserRole,
    institution: data.institution || undefined,
    community: data.community || undefined,
    avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
  };
};

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // VERIFICAR SESIÓN INICIAL Y CONFIGURAR LISTENER
  // ============================================================================
  useEffect(() => {
    // Verificar si hay sesión existente
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // Cargar perfil del usuario
          const userProfile = await getUserProfile(session.user.id, session.user.email!);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const userProfile = await getUserProfile(session.user.id, session.user.email!);
            setUser(userProfile);
          } catch (error) {
            console.error('Error loading user profile:', error);
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // La sesión se refrescó, no necesitamos hacer nada aquí
          console.log('Token refreshed successfully');
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Recargar el perfil si hay actualizaciones
          try {
            const userProfile = await getUserProfile(session.user.id, session.user.email!);
            setUser(userProfile);
          } catch (error) {
            console.error('Error updating user profile:', error);
          }
        }
      }
    );

    // Cleanup: cancelar suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // FUNCIÓN DE LOGIN
  // ============================================================================
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Autenticar con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Credenciales inválidas');
      }

      if (!data.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      // Obtener el perfil del usuario desde la tabla 'users'
      const userProfile = await getUserProfile(data.user.id, data.user.email!);
      setUser(userProfile);
      
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // FUNCIÓN DE LOGOUT
  // ============================================================================
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw new Error('Error al cerrar sesión');
      }
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Incluso si hay error, limpiamos el estado local
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK PERSONALIZADO
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
