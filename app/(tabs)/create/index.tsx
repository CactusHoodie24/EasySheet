import { useState, useEffect, } from "react";
import { View, Text, TextInput, Animated, Dimensions, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import axios from "axios";
import { IconButton, Card, Surface } from "react-native-paper";


type Person = {
  email?: string;
  iat?: number;
  exp?: number;
};


export default function Create() {
  const [formSchema, setFormSchema] = useState<
    { field: string; type: string; options?: string[] }[]
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
      { field: "", type: "short", options: [] }, // Add a new blank field
    ]);
  };

 const updateField = (index: number, key: "field" | "type", value: string) => {
  const updated = [...formSchema];
  updated[index] = { ...updated[index], [key]: value } as typeof updated[number];
  // clear options if type changed to a non-option type
  if (key === 'type' && !(value === 'multiple' || value === 'checkbox')) {
    delete updated[index].options;
  } else if (key === 'type' && (value === 'multiple' || value === 'checkbox')) {
    updated[index].options = updated[index].options || [];
  }
  setFormSchema(updated);
};

const addOption = (fieldIndex: number) => {
  const updated = [...formSchema];
  const options = updated[fieldIndex].options || [];
  options.push('');
  updated[fieldIndex].options = options;
  setFormSchema(updated);
};

const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
  const updated = [...formSchema];
  if (!updated[fieldIndex].options) return;
  updated[fieldIndex].options![optionIndex] = value;
  setFormSchema(updated);
};

const removeOption = (fieldIndex: number, optionIndex: number) => {
  const updated = [...formSchema];
  if (!updated[fieldIndex].options) return;
  updated[fieldIndex].options = updated[fieldIndex].options!.filter((_, i) => i !== optionIndex);
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
    router.push('/edit')
  } catch (error) {
    console.error('Error saving schema:', error);
  }
};


  return (
    <View className="flex-1 bg-slate-50 p-6">
      <View className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <Text className="text-3xl font-bold mb-2 text-indigo-600">Create Fields</Text>
        <Text className="text-gray-600 mb-4">Design your custom form layout</Text>
        <View className="bg-gray-50 rounded-lg p-4 mb-4">
          <TextInput 
            onChangeText={setTitle} 
            placeholder="Enter Form Title"
            className="text-xl p-4 bg-white rounded-lg border-2 border-indigo-100 focus:border-indigo-500"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View className="flex flex-row justify-between">
        <IconButton 
          icon='plus-circle' 
          mode="contained"
          containerColor="#4f46e5"
          iconColor="white"
          size={30}
          onPress={handleClick}
          className="self-center"
        />

           <IconButton
            icon="send"
            mode="contained"
            size={30}
            containerColor="#4f46e5"
            iconColor="white"
            onPress={saveSchemaToStorage}
            className="self-center"
          />
          </View>
      </View>

      <View className="bg-white rounded-xl shadow-lg p-4">
        {formSchema.map((fieldObj, index) => (
          <View key={index} className="mb-4 bg-gray-50 p-3 rounded-lg">
            <View className="flex-row justify-between items-starrt">
              <TextInput
                placeholder="Field Name"
                value={fieldObj.field}
                onChangeText={(text) => updateField(index, "field", text)}
                className="flex-1 p-3 bg-white rounded-lg border-2 border-gray-100"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={() => removeField(index)} className="ml-3">
                <View className="bg-red-50 p-2 rounded-full">
                  <FontAwesome5 name="trash" size={18} color="#dc2626" />
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2 mt-3 flex-wrap">
              {[
                { label: 'Short', value: 'short' },
                { label: 'Number', value: 'number' },
                { label: 'Multiple', value: 'multiple' },
                { label: 'Checkbox', value: 'checkbox' },
                { label: 'Paragraph', value: 'paragraph' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => updateField(index, 'type', t.value)}
                  className={`px-3 py-1 rounded-full ${fieldObj.type === t.value ? 'bg-indigo-600' : 'bg-white'} ${fieldObj.type === t.value ? 'shadow-md' : 'border'}`}
                >
                  <Text className={`${fieldObj.type === t.value ? 'text-white' : 'text-gray-700'}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(fieldObj.type === 'multiple' || fieldObj.type === 'checkbox') && (
              <View className="mt-3">
                <Text className="text-sm text-gray-600 mb-2">Options</Text>
                {fieldObj.options?.map((opt, oi) => (
                  <View key={oi} className="flex-row items-center gap-2 mb-2">
                    <TextInput
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChangeText={(text) => updateOption(index, oi, text)}
                      className="flex-1 p-2 bg-white rounded border-2 border-gray-100"
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity onPress={() => removeOption(index, oi)}>
                      <View className="bg-red-50 p-2 rounded-full">
                        <FontAwesome5 name="trash" size={16} color="#dc2626" />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => addOption(index)} className="mt-2">
                  <Text className="text-indigo-600">+ Add option</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      {success && (
        <View className="bg-green-100 p-4 rounded-lg mb-4">
          <Text className="text-green-700 text-center">Schema saved successfully!</Text>
        </View>
      )}
      {formSchema.length > 0 && (
        <View className="mt-6">
          <Text className="text-center text-gray-600 mt-2">Save Form Schema</Text>
        </View>
      )}
    </View>
    </View>
  );
}
