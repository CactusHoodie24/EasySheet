import { useState, useEffect, } from "react";
import { View, Text, Button, TextInput } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import axios from "axios";

type Person = {
  email?: string;
  iat?: number;
  exp?: number;
};


export default function Create() {
  const [formSchema, setFormSchema] = useState<
    { field: string; type: string }[]
  >([]);
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const router = useRouter();
  const [user, setUser] = useState<Person | null>(null);

  useEffect(() => {
    const fetchAndDecodeToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode<Person>(token);
          setUser(decoded);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };

    fetchAndDecodeToken();
  }, []);

  const handleClick = () => {
    setFormSchema((prev) => [
      ...prev,
      { field: "", type: "text" }, // Add a new blank field
    ]);
  };

 const updateField = (index: number, key: "field" | "type", value: string) => {
  const updated = [...formSchema];
  updated[index][key] = value;
  setFormSchema(updated);
};

  const removeField = (index: number) => {
    setFormSchema((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSchemaToStorage = async () => {
  try {
    
    const payload = {
      title,
      formSchema,
      userEmail: user?.email,
    }
    console.log(payload)
    const res = await axios.post('http://192.168.1.171:5000/process', payload)
    await AsyncStorage.setItem('userFormSchema', JSON.stringify(formSchema));
    setSuccess(true)
    router.push('/(tabs)/edit')
  } catch (error) {
    console.error('Error saving schema:', error);
  }
};


  return (
    <View className="w-[80%] mx-8 mt-6">
      <Text className="text-xl font-bold mb-4">Create Fields</Text>
      <Button title="Add Field" onPress={handleClick} />
      <TextInput onChangeText={setTitle} placeholder="title"/>

      {formSchema.map((fieldObj, index) => (
        <View key={index} className="flex flex-row items-center gap-2 mt-4">
          <TextInput
            placeholder="Field Name"
            value={fieldObj.field}
            onChangeText={(text) => updateField(index, "field", text)}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 5,
              width: 250,
              flex: 1,
            }}
          />
          <FontAwesome5
            name="trash"
            size={22}
            color="red"
            onPress={() => removeField(index)}
          />
        </View>
      ))}
      {success && <Text>Saved the schema</Text>}
     {formSchema.length > 0 && (
  <Button title="Save Schema" onPress={saveSchemaToStorage} />
)}
    </View>
  );
}
