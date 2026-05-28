import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useUserData } from "../../../components/UserDataContext"
import FormRenderer from '@/components/FormRenderer'
import { useRouter } from 'expo-router'
import { Snackbar } from 'react-native-paper'
import { tabsTheme } from '@/theme/tabsTheme'

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
  }, [errorCode, router])

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[tabsTheme.colors.primaryDark, tabsTheme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Submit Form</Text>
        <Text style={styles.subtitle}>Choose a saved form and record a clean submission.</Text>
      </LinearGradient>
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
    backgroundColor: tabsTheme.colors.background,
  },
  header: {
    paddingBottom: 18,
    paddingHorizontal: tabsTheme.spacing.screen,
    paddingTop: 28,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#d7fffb",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
})
