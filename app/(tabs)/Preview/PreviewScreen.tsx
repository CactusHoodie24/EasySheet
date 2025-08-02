import React, { ChangeEvent, useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type Entry = {
  _id: string;
  fieldData: Record<string, string>;
  createdAt: string;
  process: {
    title: string;
  };
};

const PreviewScreen = () => {
  const { entries } = useLocalSearchParams();
  const [search, setSearch] = useState('')
  const [newEntries, setNewEntries] = useState<Entry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [token, setToken] = useState('')

  useEffect(() => {
        const fetchAndDecodeToken = async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
              const decoded = jwtDecode(token);
              setToken(token)
            }
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        };
    
        fetchAndDecodeToken();
      }, []);
 
  
  // Parse the JSON string back to array
  let parsedEntries: Entry[] = [];
  
  try {
    if (typeof entries === 'string') {
      parsedEntries = JSON.parse(entries);
    }
  } catch (error) {
    console.error('Error parsing entries:', error);
  }
  
  
  if (!parsedEntries || !Array.isArray(parsedEntries)) {
    console.warn('Entries are undefined or invalid:', parsedEntries);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No entries available.</Text>
        <Text style={styles.debugText}>
          Raw param: {typeof entries === 'string' ? entries.substring(0, 100) + '...' : 'undefined'}
        </Text>
      </View>
    );
  }

  if (parsedEntries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No entries to display.</Text>
      </View>
    );
  }

const handleChange = (text: string) => {
  setSearch(text);

  const matched = parsedEntries.filter(entry => {
    const values = Object.values(entry.fieldData);
    return values.some(value =>
      value.toLowerCase().includes(text.toLowerCase())
    );
  });

  setNewEntries(matched);
};

const handleEdit = (entry: Entry) => {
  setEditingId(entry._id);
  setEditedData(entry.fieldData); // load current data into editable state
};

const handleChangeField = (key: string, value: string) => {
  setEditedData(prev => ({ ...prev, [key]: value }));
};

const handleSave = async (entryId: string) => {
  try {
    const response = await fetch('http://192.168.1.171:5000/update-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: entryId,
        fieldData: editedData,
      }),
    });

    if (!response.ok) throw new Error('Failed to save');
    alert('Saved successfully!');
    setEditingId(null);
  } catch (err) {
    console.error(err);
    alert('Failed to save');
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Found {parsedEntries.length} entries</Text>
      <TextInput placeholder='search' value={search} onChangeText={handleChange} style={{ borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, marginBottom: 16 }} />
 {(search.length > 0 ? newEntries : parsedEntries).map((entry) => (
  <View key={entry._id} style={styles.card}>
    <Text style={styles.title}>{entry.process.title}</Text>
    <Text style={styles.date}>
      {new Date(entry.createdAt).toLocaleString()}
    </Text>

    {editingId === entry._id ? (
      <>
        {Object.entries(editedData).map(([key, value]) => (
          <View key={key} style={{ marginBottom: 8 }}>
            <Text style={styles.label}>{key}:</Text>
            <TextInput
              value={value}
              onChangeText={(text) => handleChangeField(key, text)}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
                padding: 6,
                marginTop: 4,
              }}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text
            onPress={() => handleSave(entry._id)}
            style={{ color: 'green', fontWeight: 'bold', marginTop: 10 }}>
            Save
          </Text>
          <Text
            onPress={() => setEditingId(null)}
            style={{ color: 'red', fontWeight: 'bold', marginTop: 10 }}>
            Cancel
          </Text>
        </View>
      </>
    ) : (
      <>
        {Object.entries(entry.fieldData).map(([key, value]) => (
          <Text key={key} style={styles.fieldText}>
            <Text style={styles.label}>{key}: </Text>
            {value}
          </Text>
        ))}
        <Text
          onPress={() => handleEdit(entry)}
          style={{ color: 'blue', fontWeight: 'bold', marginTop: 10 }}>
          Edit
        </Text>
      </>
    )}
  </View>
))}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  fieldText: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default PreviewScreen;