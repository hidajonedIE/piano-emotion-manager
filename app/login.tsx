import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-expo";
import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";

// Completar el flujo de OAuth en web
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

type AuthMode = "signIn" | "signUp";

export default function LoginScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn, router]);

  const handleEmailSignIn = useCallback(async () => {
    if (!isSignInLoaded || !signIn) return;

    try {
      setLoading(true);
      setError(null);

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
      }
    } catch (err: any) {
      console.error("[Login] Sign in error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("Error al iniciar sesión. Verifica tus credenciales.");
      }
    } finally {
      setLoading(false);
    }
  }, [isSignInLoaded, signIn, email, password, setSignInActive, router]);

  const handleEmailSignUp = useCallback(async () => {
    if (!isSignUpLoaded || !signUp) return;

    try {
      setLoading(true);
      setError(null);

      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });

      // Enviar código de verificación
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("[Login] Sign up error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("Error al crear la cuenta. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, [isSignUpLoaded, signUp, email, password, name]);

  const handleVerification = useCallback(async () => {
    if (!isSignUpLoaded || !signUp) return;

    try {
      setLoading(true);
      setError(null);

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setError("Código de verificación incorrecto.");
      }
    } catch (err: any) {
      console.error("[Login] Verification error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("Error al verificar el código.");
      }
    } finally {
      setLoading(false);
    }
  }, [isSignUpLoaded, signUp, verificationCode, setSignUpActive, router]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new useSSO hook for Google OAuth
      const { createdSessionId, setActive, signIn: ssoSignIn, signUp: ssoSignUp } = await startSSOFlow({
        strategy: "oauth_google",
      });

      // If we have a created session, set it as active
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
        return;
      }

      // Check if we need to complete sign up (user doesn't exist yet)
      if (ssoSignUp?.createdSessionId && setActive) {
        await setActive({ session: ssoSignUp.createdSessionId });
        router.replace("/");
        return;
      }

      // Check if sign in was successful
      if (ssoSignIn?.createdSessionId && setActive) {
        await setActive({ session: ssoSignIn.createdSessionId });
        router.replace("/");
        return;
      }

    } catch (err: any) {
      console.error("[Login] Google sign in error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Error al iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router]);

  // Pantalla de verificación de email
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Verificar Email</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de verificación a {email}
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Código de verificación"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verificar</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setPendingVerification(false);
              setVerificationCode("");
            }}
          >
            <Text style={styles.linkText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎹</Text>
            <Text style={styles.appName}>Piano Emotion Manager</Text>
          </View>

          <Text style={styles.title}>
            {mode === "signIn" ? "Iniciar Sesión" : "Crear Cuenta"}
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          {/* Google Sign In */}
          <Pressable
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>
              {loading ? "Cargando..." : "Continuar con Google"}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email/Password Form */}
          {mode === "signUp" && (
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={mode === "signIn" ? handleEmailSignIn : handleEmailSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "signIn" ? "Iniciar Sesión" : "Crear Cuenta"}
              </Text>
            )}
          </Pressable>

          {/* Toggle Mode */}
          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
          >
            <Text style={styles.linkText}>
              {mode === "signIn"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
  },
  error: {
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
  },
  linkButton: {
    padding: 8,
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
});
