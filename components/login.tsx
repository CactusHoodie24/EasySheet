import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MobileLogin() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOTP = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://192.168.1.171:3000/api/request', { email });
      if (res.data.success) {
        Alert.alert('Success', 'Check your email for the code');
        setStep('otp'); // show OTP input
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (err: any) {
     console.error('Full error:', err);

  if (err.response) {
    // Server responded with a status code != 2xx
    console.error('Response data:', err.response.data);
    console.error('Response status:', err.response.status);
    Alert.alert('Error', err.response.data?.message || 'Server error');
  } else if (err.request) {
    // Request was made but no response
    console.error('No response:', err.request);
    Alert.alert('Error', 'No response from server');
  } else {
    // Something else
    console.error('Error message:', err.message);
    Alert.alert('Error', err.message);
  }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://192.168.1.171:3000/api/mobile', { email, code });
      if (res.data.success && res.data.token) {
        // save token securely
         AsyncStorage.setItem('authToken', res.data.token);
        Alert.alert('Success', 'You are logged in!');
        router.replace('/(tabs)/(home)'); // navigate to home screen
      } else {
        Alert.alert('Error', res.data.message || 'Invalid code');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {step === 'email' && (
        <>
          <Text>Enter your email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button title={loading ? 'Sending...' : 'Send Code'} onPress={requestOTP} />
        </>
      )}

      {step === 'otp' && (
        <>
          <Text>Enter the 6-digit code sent to {email}</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="OTP code"
            maxLength={6}
          />
          <Button title={loading ? 'Verifying...' : 'Verify'} onPress={verifyOTP} />
        </>
      )}
    </View>
  );
}
