import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../constants/supabase";
import Toast from "react-native-toast-message";
import * as AuthSession from "expo-auth-session";
import Icon from "react-native-vector-icons/Feather";
import { registerForPushNotificationsAsync } from "../lib/notifications";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const saveUserToSupabase = async (user) => {
    try {
      // const pushToken = await registerForPushNotificationsAsync();

      // Paso 1: consultar si ya existe
      const { data: existingUsers, error: fetchError } = await supabase
        .from("Users")
        .select("id, name")
        .eq("id", user.id)
        .limit(1);

      if (fetchError) {
        Toast.show({
          type: "error",
          text1: "Error consultando usuario",
          text2: fetchError.message,
        });
        return;
      }

      // Paso 2: Si ya existe, saludar con su nombre y navegar
      if (existingUsers && existingUsers.length > 0) {
        const userName = existingUsers[0].name || "user";

        Toast.show({
          type: "success",
          text1: `Welcome, ${userName}!`,
          text2: "Successful login 👋",
        });

        setTimeout(() => {
          navigation.replace("Home");
        }, 1200);
        return;
      }

      // Paso 3: si no existe, lo crea
      const upsertPayload = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || "",
        phone: user.phone || "",
        // ...(pushToken && { push_token: pushToken }),
      };

      const { error: upsertError } = await supabase
        .from("Users")
        .upsert(upsertPayload);

      if (upsertError) {
        Toast.show({
          type: "error",
          text1: "Error guardando usuario",
          text2: upsertError.message,
        });
      } else {
        const newUserName = upsertPayload.name || "user";

        Toast.show({
          type: "success",
          text1: `Welcome, ${newUserName}!`,
          text2: "Registro exitoso 🎉",
        });

        setTimeout(() => {
          navigation.replace("Home");
        }, 1200);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error inesperado",
        text2: err.message,
      });
    }
  };

  const handleGoogleLogin = async () => {
    const redirectUri =
      typeof window !== "undefined"
        ? window.location.origin
        : AuthSession.makeRedirectUri({ useProxy: true });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      Toast.show({
        type: "error",
        text1: "Google Login Failed",
        text2: error.message,
      });
    }
  };

  const handleEmailPasswordLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Todos los campos son obligatorios",
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Toast.show({
        type: "error",
        text1: "Error al iniciar sesión",
        text2: error.message,
      });
      return;
    }

    await saveUserToSupabase(data.user);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await saveUserToSupabase(session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Hello!</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#999"
          />
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={handleEmailPasswordLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Text style={styles.registerText}>
        Don’t have an account?{" "}
        <Text
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          Sign up
        </Text>
      </Text>

      <Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
        <Image
          source={require("../assets/images/google.png")}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  input: {
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    color: "#000",
  },
  button: {
    width: "90%",
    height: 50,
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  registerText: { marginTop: 15, color: "#666" },
  registerLink: { color: "#ff6347", fontWeight: "bold" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 16, color: "#333" },
});

export default LoginScreen;
