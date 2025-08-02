import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, AppState, AppStateStatus } from 'react-native';
import axios from 'axios';
import CardComponent from '@/components/card';

export default function HomePage() {
  const [details, setDetails] = useState([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://192.168.1.171:5000/entries');
      setDetails(res.data);
      setLastRefresh(new Date());
      setError(false);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up auto-refresh interval (e.g., every 10 minutes)
    intervalRef.current = setInterval(fetchData, 30000); // 600000 ms = 10 minutes

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App resumed — refreshing...');
        fetchData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchData]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      {loading && <Text>Loading...</Text>}
      {error && <Text style={{ color: 'red' }}>Failed to load data.</Text>}
      {lastRefresh && <Text style={{ fontSize: 12, color: 'gray' }}>Last updated: {lastRefresh.toLocaleTimeString()}</Text>}
      <CardComponent details={details} />
    </View>
  );
}
