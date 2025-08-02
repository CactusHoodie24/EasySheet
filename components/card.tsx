import * as React from 'react';
import { useState } from 'react';
import { Card, Text, Button } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import { exportToExcel } from '@/exportToExcel';
import { ScrollView, Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { router } from 'expo-router';

// Define your navigation param types
type RootStackParamList = {
  Preview: { entries: Entry[] };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

interface ProcessInfo {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Entry {
  _id: string;
  __v: number;
  process: ProcessInfo; // now an object, not just a string
  createdAt: string;
  updatedAt: string;
  fieldData: Record<string, string>;
}

interface Application {
  details: Entry[];
}

const CardComponent = ({ details }: Application) => {
 const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string>('')
    const navigation = useNavigation<NavigationProp>();

  const handleClick = async (entry: Entry) => {
  try {
    setSelectedId(entry._id);

    // Filter only the entries that belong to this process
    const filteredEntries = details.filter(
      (e) => e.process._id === entry.process._id
    );

    const fileUri = await exportToExcel(filteredEntries); // Pass filtered list

    setSuccessMap((prev) => ({ ...prev, [entry._id]: true }));
    setTimeout(() => {
      setSuccessMap((prev) => ({ ...prev, [entry._id]: false }));
    }, 3000);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Sharing not available', `File saved at:\n${fileUri}`);
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to create or share Excel file.');
  }
};

const handleClick2 = (entry: Entry) => {
    try {
      // Filter only the entries that belong to this process
      const filteredEntries = details.filter(
        (e) => e.process._id === entry.process._id
      );
         
      if (filteredEntries.length === 0) {
        Alert.alert('No entries', 'No entries found for this process.');
        return;
      }
      
      // Expo Router navigation with parameters
      router.push({
        pathname: '/(tabs)/Preview',
        params: { 
          entries: JSON.stringify(filteredEntries) // Serialize the data
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to preview.');
    }
  };

const latestEntriesMap = details.reduce((acc, curr) => {
  const title = curr.process.title;
  if (!acc[title] || new Date(curr.createdAt) > new Date(acc[title].createdAt)) {
    acc[title] = curr;
  }
  return acc;
}, {} as Record<string, Entry>);

const uniqueLatestEntries = Object.values(latestEntriesMap);

  return (
    <>
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {uniqueLatestEntries.map((i) => (
        <Card
          key={i._id}
          style={{
            marginBottom: 10,
            width: 350,
            backgroundColor: '#06b6d4',
          }}
        >
          <Card.Content>
            <Text variant="titleLarge">{i.process.title}</Text>
            <Text variant="bodyMedium">
              {new Date(i.process.createdAt).toLocaleString()}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => handleClick2(i)}>Preview</Button>
            <Button mode="contained"  onPress={() => handleClick(i)}>
              Convert and Share Excel
            </Button>
          </Card.Actions>
         {successMap[i._id] && (
              <Text style={{ color: 'green', marginTop: 10 }}>Exported successfully!</Text>
            )}
        </Card>
      ))}
      </ScrollView>
    </>
  );
};

export default CardComponent;
