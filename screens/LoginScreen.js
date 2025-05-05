import { useEffect } from "react";
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
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const LoginScreen = () => {
  const navigation = useNavigation();

  const handleGoogleLogin = async () => {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        queryParams: {
          prompt: "select_account",
        },
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

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          console.log("Saving user to Supabase:", user);

          const { error: upsertError } = await supabase.from("Users").upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || "",
            phone: user.phone || "",
          });

          if (upsertError) {
            Toast.show({
              type: "error",
              text1: "Error saving user",
              text2: upsertError.message,
            });
          } else {
            Toast.show({
              type: "success",
              text1: "Welcome to FarmLand Deli",
              text2: user.email,
            });

            navigation.replace("Home");
          }
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

      {/* Aquí iría tu formulario tradicional si lo deseas */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="#999"
      />

      <Pressable
        style={styles.button}
        onPress={() =>
          Toast.show({
            type: "info",
            text1: "Usa Google para iniciar sesión ☝️",
          })
        }
      >
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
