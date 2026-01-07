import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useUserData } from "../../../components/UserDataContext";
import FormRenderer from '@/components/FormRenderer';

export default function index() {
  
  return (
    <View style={styles.container}>
      <FormRenderer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
