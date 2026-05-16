import { getServices } from '@/lib/appwrite-admin';
import { ID, Query, OAuthProvider } from 'appwrite';
import { USERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { upsertUserProfile } from '@/lib/users-db';

function getAccount() { return getServices().account; }
function getDatabases() { return getServices().databases; }
const account = { 
  listSessions: () => getAccount().listSessions(),
  deleteSession: (id: string) => getAccount().deleteSession(id),
  createEmailPasswordSession: (e: string, p: string) => getAccount().createEmailPasswordSession(e, p),
  create: (id: string, e: string, p: string, n: string) => getAccount().create(id, e, p, n),
  get: () => getAccount().get(),
  updateName: (n: string) => getAccount().updateName(n),
  createRecovery: (e: string, u: string) => getAccount().createRecovery(e, u),
  createOAuth2Session: (p: any, s: string, f: string) => getAccount().createOAuth2Session(p, s, f),
};
const databases = {
  createDocument: (dbId: string, col: string, id: string, data: any) => getDatabases().createDocument(dbId, col, id, data),
  listDocuments: (dbId: string, col: string, queries?: any[]) => getDatabases().listDocuments(dbId, col, queries),
  updateDocument: (dbId: string, col: string, id: string, data: any) => getDatabases().updateDocument(dbId, col, id, data),
};

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  // Limpiar todas las sesiones activas
  static async clearAllSessions(): Promise<void> {
    try {
      // Obtener todas las sesiones y eliminarlas
      const sessions = await account.listSessions();
      for (const session of sessions.sessions) {
        await account.deleteSession(session.$id);
      }
    } catch (error) {
      // Si no hay sesiones, continuar
      console.log('No sessions to clear or error clearing sessions:', error);
    }
  }

  // Login con email y contraseña
  static async login(email: string, password: string) {
    try {
      // Limpiar todas las sesiones existentes
      await this.clearAllSessions();

      // Crear nueva sesión
      const session = await account.createEmailPasswordSession(email, password);
      
      // Obtener datos del usuario directamente desde Appwrite Auth
      const currentUser = await account.get();
      
      // Crear objeto de usuario con datos de Auth
      const user: User = {
        id: currentUser.$id,
        email: currentUser.email,
        name: currentUser.name || 'Usuario',
        phone: currentUser.phone || undefined,
        createdAt: currentUser.$createdAt || new Date().toISOString(),
        updatedAt: currentUser.$updatedAt || new Date().toISOString()
      };

      try {
        await upsertUserProfile({
          userId: currentUser.$id,
          email: currentUser.email,
          name: currentUser.name || 'Usuario',
          phone: currentUser.phone || '',
        });
      } catch (dbError) {
        console.log('No se pudo sincronizar perfil en users:', dbError);
      }

      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      };
    }
  }

  // Registro de nuevo usuario
  static async register(email: string, password: string, name: string, phone?: string, rut?: string, birthDate?: string) {
    try {
      // Limpiar todas las sesiones existentes
      await this.clearAllSessions();

      // Crear cuenta en Appwrite
      const user = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      // Crear sesión automáticamente
      await account.createEmailPasswordSession(email, password);

      // Guardar phone, rut y fecha de nacimiento en preferencias del usuario
      if (phone || rut || birthDate) {
        try {
          const prefs: Record<string, string> = {};
          if (phone) prefs.phone = phone;
          if (rut) prefs.rut = rut;
          if (birthDate) prefs.birthDate = birthDate;
          await getAccount().updatePrefs(prefs);
        } catch (prefError) {
          console.log('Error saving prefs:', prefError);
        }
      }

      // Crear objeto de usuario con datos de Auth
      const userObj: User = {
        id: user.$id,
        email: user.email,
        name: user.name || name,
        phone: phone,
        createdAt: user.$createdAt || new Date().toISOString(),
        updatedAt: user.$updatedAt || new Date().toISOString()
      };

      try {
        await upsertUserProfile({
          userId: user.$id,
          email: user.email,
          name: user.name || name,
          phone: phone || '',
        });
      } catch (dbError) {
        console.log('No se pudo sincronizar perfil en users:', dbError);
      }

      return { success: true, user: userObj };
    } catch (error: any) {
      console.error('Register error:', error);
      const msg = error?.message || '';
      // Handle "user already exists" specifically
      if (msg.includes('already exists') || error?.code === 409 || error?.type === 'user_already_exists') {
        return {
          success: false,
          error: 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.'
        };
      }
      return {
        success: false,
        error: msg || 'Error al registrarse'
      };
    }
  }

  // Crear documento de usuario en la base de datos
  private static async createUserDocument(user: any): Promise<User> {
    try {
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '67f1dc940037b3d367bb';
      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      const doc = await databases.createDocument(
        databaseId,
        USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          email: user.email,
          name: user.name,
          phone: user.phone || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        id: doc.$id,
        email: doc.email,
        name: doc.name,
        phone: doc.phone || undefined,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
      };
    } catch (error: any) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  // Cerrar sesión
  static async logout() {
    try {
      await this.clearAllSessions();
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message || 'Error al cerrar sesión'
      };
    }
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<User | null> {
    try {
      const currentUser = await account.get();
      
      // Crear objeto de usuario con datos de Auth
      const user: User = {
        id: currentUser.$id,
        email: currentUser.email,
        name: currentUser.name || 'Usuario',
        phone: currentUser.phone || undefined,
        createdAt: currentUser.$createdAt || new Date().toISOString(),
        updatedAt: currentUser.$updatedAt || new Date().toISOString()
      };

      return user;
    } catch (error: any) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Verificar si está logueado
  static async isLoggedIn(): Promise<boolean> {
    try {
      await account.get();
      return true;
    } catch (error) {
      // Si hay error, no intentar limpiar sesiones (ya no hay sesión válida)
      return false;
    }
  }

  // Actualizar perfil
  static async updateProfile(updates: Partial<User>) {
    try {
      // Actualizar en Appwrite Auth si es necesario
      if (updates.name) {
        await account.updateName(updates.name);
      }

      // Actualizar documento en la base de datos
      const currentUser = await account.get();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '67f1dc940037b3d367bb';
      if (!databaseId) {
        return { success: false, error: 'Database ID not configured' };
      }

      const userDoc = await databases.listDocuments(
        databaseId,
        USERS_COLLECTION_ID,
        [Query.equal('userId', currentUser.$id)]
      );

      if (userDoc.documents.length > 0) {
        const docId = userDoc.documents[0].$id;
        const updatedDoc = await databases.updateDocument(
          databaseId,
          USERS_COLLECTION_ID,
          docId,
          {
            name: updates.name,
            phone: updates.phone || '',
            updatedAt: new Date().toISOString()
          }
        );

        const user: User = {
          id: updatedDoc.$id,
          email: updatedDoc.email,
          name: updatedDoc.name,
          phone: updatedDoc.phone || undefined,
          createdAt: updatedDoc.$createdAt,
          updatedAt: updatedDoc.$updatedAt
        };

        return { success: true, user };
      }

      return { success: false, error: 'Usuario no encontrado' };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar perfil'
      };
    }
  }

  // Recuperar contraseña
  static async forgotPassword(email: string) {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      );
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar correo de recuperación'
      };
    }
  }

  // Login con Google (OAuth)
  static async loginWithGoogle() {
    try {
      await account.createOAuth2Session(
        OAuthProvider.Google,
        `${window.location.origin}/success`,
        `${window.location.origin}/failure`
      );
      return { success: true };
    } catch (error: any) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión con Google'
      };
    }
  }
}
