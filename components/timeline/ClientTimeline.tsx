/**
 * Client Timeline Component
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { trpc } from '../../utils/trpc';
import { TimelineItem } from './TimelineItem';
import { TimelineFilters } from './TimelineFilters';

interface ClientTimelineProps {
  clientId: string;
}

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const [filters, setFilters] = useState<any>({});

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.timeline.getClientTimeline.useInfiniteQuery(
    {
      clientId,
      limit: 20,
      filters,
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.events.length : undefined,
    }
  );

  const { data: stats } = trpc.timeline.getTimelineStats.useQuery({ clientId });

  const events = data?.pages.flatMap((page) => page.events) || [];

  const renderEvent = ({ item }: { item: any }) => (
    <TimelineItem event={item} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Historial de Actividad</Text>
      {stats && (
        <Text style={styles.headerSubtitle}>
          {stats.totalEvents} eventos registrados
        </Text>
      )}
      <TimelineFilters filters={filters} onFiltersChange={setFilters} />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No hay eventos para mostrar</Text>
    </View>
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={renderEvent}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.list}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => refetch()} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
