import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-expo";
import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect, useMemo } from "react";
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
  AccessibilityInfo,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";

// Completar el flujo de OAuth en web
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

type AuthMode = "signIn" | "signUp" | "forgotPassword";

/**
 * Tipo para errores de Clerk
 * Clerk devuelve errores con una estructura específica
 */
interface ClerkError {
  errors?: Array<{
    code: string;
    message: string;
    longMessage?: string;
    meta?: Record<string, unknown>;
  }>;
  message?: string;
}

/**
 * Type guard para verificar si un error es de tipo ClerkError
 */
function isClerkError(error: unknown): error is ClerkError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("errors" in error || "message" in error)
  );
}

/**
 * Extrae el mensaje de error de forma segura
 */
function getErrorMessage(error: unknown): string {
  if (isClerkError(error)) {
    if (error.errors?.[0]?.message) {
      return translateClerkError(error.errors[0].message);
    }
    if (error.message) {
      return translateClerkError(error.message);
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.";
}

/**
 * Traduce mensajes de error comunes de Clerk al español
 */
function translateClerkError(message: string): string {
  const translations: Record<string, string> = {
    "Invalid email or password": "Email o contraseña incorrectos",
    "Password is incorrect": "La contraseña es incorrecta",
    "Identifier is invalid": "El email no es válido",
    "That email address is taken": "Este email ya está registrado",
    "Password is too short": "La contraseña es demasiado corta",
    "Password must be at least 8 characters": "La contraseña debe tener al menos 8 caracteres",
    "Verification code is incorrect": "El código de verificación es incorrecto",
    "Too many requests": "Demasiados intentos. Por favor, espera un momento.",
    "Session expired": "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
  };
  
  // Buscar traducción exacta o parcial
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return message;
}

// ============================================================================
// VALIDACIÓN
// ============================================================================

/**
 * Valida el formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Requisitos de contraseña
 */
interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    test: (p) => p.length >= 8,
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "Un número",
    test: (p) => /\d/.test(p),
  },
];

/**
 * Calcula la fortaleza de la contraseña (0-100)
 */
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  const requirements = PASSWORD_REQUIREMENTS.filter((r) => r.test(password));
  strength = (requirements.length / PASSWORD_REQUIREMENTS.length) * 80;
  
  // Bonus por longitud extra
  if (password.length > 12) strength += 10;
  if (password.length > 16) strength += 10;
  
  // Bonus por caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;
  
  return Math.min(100, strength);
}

/**
 * Obtiene el color según la fortaleza de la contraseña
 */
function getStrengthColor(strength: number): string {
  if (strength < 30) return "#dc2626"; // Rojo
  if (strength < 60) return "#f59e0b"; // Naranja
  if (strength < 80) return "#eab308"; // Amarillo
  return "#22c55e"; // Verde
}

/**
 * Obtiene el texto según la fortaleza de la contraseña
 */
function getStrengthText(strength: number): string {
  if (strength < 30) return "Muy débil";
  if (strength < 60) return "Débil";
  if (strength < 80) return "Aceptable";
  return "Fuerte";
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function LoginScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  // Estados del formulario
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  
  // Estados de validación
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validación de email
  const emailError = useMemo(() => {
    if (!emailTouched || !email) return null;
    if (!isValidEmail(email)) return "Introduce un email válido";
    return null;
  }, [email, emailTouched]);

  // Fortaleza de contraseña
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordRequirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((r) => r.test(password)),
    [password]
  );

  // Verificar si el formulario es válido
  const isFormValid = useMemo(() => {
    if (!email || !password) return false;
    if (!isValidEmail(email)) return false;
    if (mode === "signUp") {
      if (!name.trim()) return false;
      if (passwordStrength < 60) return false;
    }
    return true;
  }, [email, password, name, mode, passwordStrength]);

  // Verificar si está bloqueado por demasiados intentos
  const isLockedOut = useMemo(() => {
    if (!lockoutUntil) return false;
    return new Date() < lockoutUntil;
  }, [lockoutUntil]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn, router]);

  // Limpiar bloqueo cuando expire
  useEffect(() => {
    if (lockoutUntil) {
      const timeout = setTimeout(() => {
        setLockoutUntil(null);
        setAttemptCount(0);
      }, lockoutUntil.getTime() - Date.now());
      return () => clearTimeout(timeout);
    }
  }, [lockoutUntil]);

  /**
   * Maneja el rate limiting del lado del cliente
   */
  const handleRateLimit = useCallback(() => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    
    if (newAttemptCount >= 5) {
      const lockoutTime = new Date(Date.now() + 60000); // 1 minuto
      setLockoutUntil(lockoutTime);
      setError("Demasiados intentos. Por favor, espera 1 minuto.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [attemptCount]);

  /**
   * Inicio de sesión con email/contraseña
   */
  const handleEmailSignIn = useCallback(async () => {
    if (!isSignInLoaded || !signIn) return;
    if (isLockedOut) return;

    try {
      setLoading(true);
      setError(null);

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        setAttemptCount(0);
        await setSignInActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      } else {
        handleRateLimit();
        setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
      }
    } catch (err: unknown) {
      handleRateLimit();
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Anunciar error para lectores de pantalla
      AccessibilityInfo.announceForAccessibility(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [isSignInLoaded, signIn, email, password, setSignInActive, router, isLockedOut, handleRateLimit]);

  /**
   * Registro con email/contraseña
   */
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility("Se ha enviado un código de verificación a tu email");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      AccessibilityInfo.announceForAccessibility(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [isSignUpLoaded, signUp, email, password, name]);

  /**
   * Verificación de email
   */
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      } else {
        setError("Código de verificación incorrecto.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [isSignUpLoaded, signUp, verificationCode, setSignUpActive, router]);

  /**
   * Recuperación de contraseña
   */
  const handleForgotPassword = useCallback(async () => {
    if (!isSignInLoaded || !signIn) return;

    if (!email || !isValidEmail(email)) {
      setError("Por favor, introduce un email válido para recuperar tu contraseña.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility(
        "Se ha enviado un enlace de recuperación a tu email"
      );
      // Mostrar mensaje de éxito
      setMode("signIn");
      setError("Se ha enviado un enlace de recuperación a tu email.");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [isSignInLoaded, signIn, email]);

  /**
   * Inicio de sesión con Google
   */
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { createdSessionId, setActive, signIn: ssoSignIn, signUp: ssoSignUp } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
        return;
      }

      if (ssoSignUp?.createdSessionId && setActive) {
        await setActive({ session: ssoSignUp.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
        return;
      }

      if (ssoSignIn?.createdSessionId && setActive) {
        await setActive({ session: ssoSignIn.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
        return;
      }

    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router]);

  /**
   * Reenviar código de verificación
   */
  const handleResendCode = useCallback(async () => {
    if (!isSignUpLoaded || !signUp) return;

    try {
      setLoading(true);
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility("Se ha reenviado el código de verificación");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSignUpLoaded, signUp]);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  // Pantalla de verificación de email
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            Verificar Email
          </Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de verificación a {email}
          </Text>

          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Código de verificación"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            autoCapitalize="none"
            accessibilityLabel="Código de verificación"
            accessibilityHint="Introduce el código de 6 dígitos enviado a tu email"
            maxLength={6}
          />

          <Pressable
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleVerification}
            disabled={loading || verificationCode.length < 6}
            accessibilityRole="button"
            accessibilityLabel="Verificar código"
            accessibilityState={{ disabled: loading || verificationCode.length < 6 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verificar</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={handleResendCode}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Reenviar código"
          >
            <Text style={styles.linkText}>Reenviar código</Text>
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setPendingVerification(false);
              setVerificationCode("");
            }}
            accessibilityRole="button"
            accessibilityLabel="Volver al formulario de registro"
          >
            <Text style={styles.linkText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Pantalla de recuperación de contraseña
  if (mode === "forgotPassword") {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            Recuperar Contraseña
          </Text>
          <Text style={styles.subtitle}>
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </Text>

          {error && (
            <Text 
              style={[styles.error, error.includes("enviado") && styles.success]} 
              accessibilityRole="alert"
            >
              {error}
            </Text>
          )}

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailTouched(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Email"
            accessibilityHint="Introduce tu dirección de email"
          />
          {emailError && <Text style={styles.fieldError}>{emailError}</Text>}

          <Pressable
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading || !isValidEmail(email)}
            accessibilityRole="button"
            accessibilityLabel="Enviar enlace de recuperación"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar Enlace</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setMode("signIn");
              setError(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Volver a iniciar sesión"
          >
            <Text style={styles.linkText}>Volver a Iniciar Sesión</Text>
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
            <Text style={styles.logoText} accessibilityLabel="Logo de Piano Emotion Manager">
              🎹
            </Text>
            <Text style={styles.appName}>Piano Emotion Manager</Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {mode === "signIn" ? "Iniciar Sesión" : "Crear Cuenta"}
          </Text>

          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          {isLockedOut && (
            <Text style={styles.lockoutWarning} accessibilityRole="alert">
              Cuenta bloqueada temporalmente. Inténtalo de nuevo en 1 minuto.
            </Text>
          )}

          {/* Google Sign In */}
          <Pressable
            style={[styles.button, styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading || isLockedOut}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
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
            <View>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                accessibilityLabel="Nombre completo"
                accessibilityHint="Introduce tu nombre y apellidos"
              />
            </View>
          )}

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailTouched(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Email"
            accessibilityHint="Introduce tu dirección de email"
          />
          {emailError && <Text style={styles.fieldError}>{emailError}</Text>}

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setPasswordTouched(true)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              accessibilityLabel="Contraseña"
              accessibilityHint={
                mode === "signUp"
                  ? "Crea una contraseña segura con al menos 8 caracteres"
                  : "Introduce tu contraseña"
              }
            />
            <Pressable
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </Text>
            </Pressable>
          </View>

          {/* Indicador de fortaleza de contraseña (solo en registro) */}
          {mode === "signUp" && password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.strengthBarContainer}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width: `${passwordStrength}%`,
                      backgroundColor: getStrengthColor(passwordStrength),
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.strengthText, { color: getStrengthColor(passwordStrength) }]}
                accessibilityLabel={`Fortaleza de contraseña: ${getStrengthText(passwordStrength)}`}
              >
                {getStrengthText(passwordStrength)}
              </Text>
              
              {/* Requisitos de contraseña */}
              <View style={styles.requirementsContainer}>
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <View key={req.id} style={styles.requirementRow}>
                    <Text
                      style={[
                        styles.requirementIcon,
                        req.test(password) ? styles.requirementMet : styles.requirementNotMet,
                      ]}
                    >
                      {req.test(password) ? "✓" : "○"}
                    </Text>
                    <Text
                      style={[
                        styles.requirementText,
                        req.test(password) ? styles.requirementMet : styles.requirementNotMet,
                      ]}
                    >
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable
            style={[
              styles.button,
              styles.primaryButton,
              (!isFormValid || loading || isLockedOut) && styles.buttonDisabled,
            ]}
            onPress={mode === "signIn" ? handleEmailSignIn : handleEmailSignUp}
            disabled={!isFormValid || loading || isLockedOut}
            accessibilityRole="button"
            accessibilityLabel={mode === "signIn" ? "Iniciar sesión" : "Crear cuenta"}
            accessibilityState={{ disabled: !isFormValid || loading || isLockedOut }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "signIn" ? "Iniciar Sesión" : "Crear Cuenta"}
              </Text>
            )}
          </Pressable>

          {/* Olvidé mi contraseña (solo en login) */}
          {mode === "signIn" && (
            <Pressable
              style={styles.linkButton}
              onPress={() => {
                setMode("forgotPassword");
                setError(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="¿Olvidaste tu contraseña?"
            >
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          )}

          {/* Toggle Mode */}
          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
              setEmailTouched(false);
              setPasswordTouched(false);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              mode === "signIn"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"
            }
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
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
  },
  success: {
    color: "#16a34a",
    backgroundColor: "#f0fdf4",
  },
  fieldError: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  lockoutWarning: {
    color: "#f59e0b",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
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
  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 70,
  },
  showPasswordButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  showPasswordText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  passwordStrengthContainer: {
    marginBottom: 16,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: "#e5e5e5",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  requirementsContainer: {
    marginTop: 4,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementIcon: {
    fontSize: 12,
    marginRight: 8,
    width: 16,
  },
  requirementText: {
    fontSize: 12,
  },
  requirementMet: {
    color: "#22c55e",
  },
  requirementNotMet: {
    color: "#9ca3af",
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
  buttonDisabled: {
    opacity: 0.6,
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
