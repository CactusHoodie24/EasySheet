"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button, Text, View, AppState } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { TextInput } from "react-native-paper"
import axios from "axios"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { jwtDecode } from "jwt-decode"


type FieldSchema = {
  field: string
  type: string
}

type Person = {
  email?: string
  iat?: number
  exp?: number
}

export default function Edit() {
  const [formSchema, setFormSchema] = useState<FieldSchema[]>([])
  const [formValues, setFormValues] = useState<{ [key: string]: string }>({})
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [user, setUser] = useState<Person | null>(null)
  const [title, setTitle] = useState("")
  const [processId, setProcessId] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const intervalRef = useRef<number | null>(null)
  const navigation = useNavigation()

  // Decode JWT token on component mount
  useEffect(() => {
    const fetchAndDecodeToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        if (token) {
          const decoded = jwtDecode<Person>(token)
          setUser(decoded)
        }
      } catch (error) {
        console.error("Error decoding token:", error)
        setError(true)
      }
    }
    fetchAndDecodeToken()
  }, [])

  // Combined data fetching function
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      // Fetch schema from AsyncStorage
      const savedSchema = await AsyncStorage.getItem("userFormSchema")
      if (savedSchema !== null) {
        const parsed = JSON.parse(savedSchema)
        setFormSchema(parsed)
        const initialValues: { [key: string]: string } = {}
        parsed.forEach((field: FieldSchema) => {
          initialValues[field.field] = ""
        })
        setFormValues(initialValues)
      }

      // Fetch process data from API if user exists
      if (user?.email) {
        const res = await axios.get(`http://192.168.1.171:5000/process/${user.email}`)
        setTitle(res.data.title)
        setProcessId(res.data._id)
      }

      setLastRefresh(new Date())
      console.log("Data refreshed automatically at:", new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  // Auto-refresh on screen focus with interval
  useFocusEffect(
    useCallback(() => {
      // Initial fetch when screen comes into focus
      fetchAllData()

      // Set up auto-refresh interval (every 30 seconds)
      intervalRef.current = setInterval(() => {
        fetchAllData()
      }, 600000) // 30 seconds

      // Cleanup interval when screen loses focus
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, [fetchAllData]),
  )

  // Auto-refresh when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        console.log("App came to foreground, refreshing data...")
        fetchAllData()
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => subscription?.remove()
  }, [fetchAllData])

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleChange = (fieldName: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleClick = async () => {
    if (!processId) {
      setError(true)
      return
    }

    try {
      const payload = {
        process: processId,
        fieldData: formValues,
      }
      console.log("Submitting payload:", payload)

      const res = await axios.post("http://192.168.1.171:5000/entries", payload)

      if (res.status === 201) {
        setError(false)
        setSuccess(true)

        // Clear form and reset success after 2 seconds
        setTimeout(() => {
          setFormValues({})
          setSuccess(false)
        }, 2000)
      } else {
        setError(true)
        setSuccess(false)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError(true)
      setSuccess(false)
    }
  }

  const clearClick = async () => {
    try {
      await AsyncStorage.removeItem("userFormSchema")
      console.log("Local storage cleared!")
      setFormSchema([])
      setFormValues({})
      setTitle("")
      setProcessId("")
    } catch (error) {
      console.error("Failed to clear local storage:", error)
      setError(true)
    }
  }

  // Manual refresh function (backup)
  const handleManualRefresh = () => {
    console.log("Manual refresh triggered")
    fetchAllData()
  }

  return (
    <View className="gap-4 p-4">
      {/* Status indicators */}
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-gray-600">Auto-refresh: Every 30s</Text>
        {lastRefresh && <Text className="text-xs text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</Text>}
      </View>

      {/* Manual refresh button */}
      <Button title={loading ? "Refreshing..." : "Manual Refresh"} onPress={handleManualRefresh} disabled={loading} />

      {/* Title display */}
      {title && <Text className="text-lg font-semibold text-center">{title}</Text>}

      {/* Error display */}
      {error && <Text className="text-red-500 text-center">An error occurred. Data will auto-refresh shortly.</Text>}

      {/* Loading indicator */}
      {loading && <Text className="text-blue-500 text-center">Loading...</Text>}

      {/* Dynamic form fields */}
      {formSchema.length > 0
        ? formSchema.map((schema, index) => (
            <TextInput
              key={`${schema.field}-${index}`}
              label={schema.field}
              value={formValues[schema.field] || ""}
              onChangeText={(text) => handleChange(schema.field, text)}
              mode="outlined"
                theme={{
    colors: {
      background: 'white',
      text: 'black',
      placeholder: 'gray',
      primary: '#0057D9',
    },
  }}
            />
          ))
        : !loading && (
            <Text className="text-gray-500 text-center">
              No form schema available. Data will refresh automatically.
            </Text>
          )}

      {/* Submit button */}
      <Button title="Insert" onPress={handleClick} disabled={loading || !processId || formSchema.length === 0} />

      {/* Success message */}
      {success && <Text className="text-green-500 font-medium text-center">Inserted Successfully! ✅</Text>}

      {/* Clear button */}
      <Button title="Clear Local Storage" onPress={clearClick} color="#ff6b6b" />
    </View>
  )
}
