import { View, Text, TextInput, Button, } from "react-native";
import axios from 'axios'
import { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";


export default function login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  const payload = {
    email,
    password
  }

  const handleClick = () => {
    const sendData = async () => {
      try {
        const res = await axios.post('http://192.168.1.171:5000/api/login', payload)
        if(res.status === 200) {
          setSuccess(true)
          setError(false)
          await AsyncStorage.setItem('token', res.data);
          setEmail('')
          setPassword('')
          router.replace('/(tabs)/(home)')
          console.log(res.data)
        } else {
        setSuccess(false)
        setError(true)
        }
      } catch (error) {
       console.error(error);
      }
    }
    sendData()
  }
    return(
<View className="flex-1 justify-center items-center gap-3">
          <TextInput onChangeText={setEmail} placeholder="email" className="w-[300px] border-2 border-gray-400 rounded-2xl" />
          <TextInput onChangeText={setPassword} className="w-[300px] border-2 border-gray-400 rounded-2xl"
            placeholder="Password"
          />
          <Button title="Login" onPress={handleClick} />
          {error && <Text>There was an Error</Text>}
          {success && <Text>Login is a Success</Text>}
</View>
    )
}

