import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useUserData } from "../../../components/UserDataContext"
import FormRenderer from '@/components/FormRenderer'
import { useRouter } from 'expo-router'
import { Snackbar } from 'react-native-paper'

export default function Index() {
  const { errorCode } = useUserData()
  const router = useRouter()
  const [snackbarVisible, setSnackbarVisible] = React.useState(false)

  useEffect(() => {
    if (errorCode === 'PROFILE_INCOMPLETE') {
      console.log('[Index] Profile incomplete detected, redirecting...')
      
      setSnackbarVisible(true) // optional feedback to user

      // Clear profile-related cache if needed
      AsyncStorage.removeItem('cachedUserProfile')

      // Redirect after short delay
      const timer = setTimeout(() => {
        router.replace('/verifyProfile')
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [errorCode])

  return (
    <View style={styles.container}>
      <FormRenderer />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        Please complete your profile first
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
