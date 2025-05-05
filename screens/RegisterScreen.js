import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { supabase } from "../constants/supabase";
import { useNavigation } from "@react-navigation/native";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const registrarYGuardar = async () => {
    console.log(">>> registrarYGuardar ejecutado");

    if (!email || !password || !name || !phone) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://expo.dev", // o tu URL real
        },
      });

      const { error: signUpError } = res;

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          console.log(">>> Usuario ya existe, intentando login...");
          const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({ email, password });

          if (loginError) throw loginError;
          await guardarUsuario();
          return;
        }
        throw signUpError;
      }

      console.log(">>> SignUp exitoso. Esperando para login...");
      await new Promise((res) => setTimeout(res, 1000));

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (loginError) throw loginError;

      await guardarUsuario();
    } catch (err) {
      console.error(">>> Error total:", err);
      Alert.alert("Error", err.message ?? "Algo salió mal");
    }
  };

  const guardarUsuario = async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      Alert.alert("Error", "No se pudo obtener el ID del usuario");
      return;
    }

    const { error: insertError } = await supabase
      .from("Users")
      .insert([{ id: userId, name, email, phone }]);

    if (insertError) {
      console.error(">>> Error al insertar en Users:", insertError.message);
      Alert.alert("Error al guardar usuario", insertError.message);
      return;
    }

    // ✅ Éxito: limpiar campos, mostrar mensaje y redirigir
    Alert.alert("Éxito", "Usuario registrado y datos guardados");
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");

    // 👉 Redirige a Home (necesitas useNavigation)
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash.png")}
        style={styles.logo}
      />
      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#999"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#999"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#999"
      />

      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        placeholderTextColor="#999"
      />
      <Pressable style={styles.button} onPress={registrarYGuardar}>
        <Text style={styles.buttonText}>Create Account</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f7f7f7",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RegisterScreen;
