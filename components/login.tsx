import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest, saveAuthTokens } from '@/lib/api';

export default function MobileLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOTP = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message?: string }, { email: string }>({
        method: 'POST',
        url: '/api/request',
        data: { email },
        auth: false,
      });
      if (res.success) {
        Alert.alert('Success', 'Check your email for the code');
        setStep('otp'); // show OTP input
      } else {
        Alert.alert('Error', res.message);
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
      const res = await apiRequest<{
        success: boolean;
        message?: string;
        token?: string;
        accessToken?: string;
        authToken?: string;
        idToken?: string;
        customToken?: string;
        refreshToken?: string;
        refresh_token?: string;
        data?: {
          token?: string;
          accessToken?: string;
          authToken?: string;
          idToken?: string;
          customToken?: string;
          refreshToken?: string;
          refresh_token?: string;
        };
        session?: {
          token?: string;
          accessToken?: string;
          authToken?: string;
          idToken?: string;
          customToken?: string;
          refreshToken?: string;
          refresh_token?: string;
        };
        user?: {
          token?: string;
          accessToken?: string;
          authToken?: string;
          idToken?: string;
          customToken?: string;
          refreshToken?: string;
          refresh_token?: string;
        };
      }, { email: string; code: string }>({
        method: 'POST',
        url: '/api/mobile',
        data: { email, code },
        auth: false,
      });
      if (res.success) {
        await saveAuthTokens(res);
        await queryClient.invalidateQueries({ queryKey: ['forms'] });
        Alert.alert('Success', 'You are logged in!');
        router.replace('/(tabs)/(home)'); // navigate to home screen
      } else {
        Alert.alert('Error', res.message || 'Invalid code');
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
