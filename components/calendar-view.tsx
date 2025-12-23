import { useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

interface CalendarEvent {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  status?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
  onDatePress?: (date: string) => void;
  initialDate?: string;
}

type ViewMode = 'month' | 'week';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function CalendarView({ events, onEventPress, onDatePress, initialDate }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialDate) return new Date(initialDate);
    return new Date();
  });

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');

  // Usar fecha local en lugar de UTC para evitar desfase de zona horaria
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Obtener eventos por fecha
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    });
    return map;
  }, [events]);

  // Helper para formatear fecha local sin problemas de zona horaria
  const formatLocalDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Generar días del mes
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    
    // Días del mes anterior para completar la primera semana
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: formatLocalDate(d),
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = formatLocalDate(d);
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: dateStr === today,
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: formatLocalDate(d),
        day: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  }, [currentDate, today]);

  // Generar días de la semana actual
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days: { date: string; day: number; dayName: string; isToday: boolean }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = formatLocalDate(d);
      days.push({
        date: dateStr,
        day: d.getDate(),
        dayName: DAYS_SHORT[i],
        isToday: dateStr === today,
      });
    }
    
    return days;
  }, [currentDate, today]);

  const navigatePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentDate(new Date());
  };

  const toggleViewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(viewMode === 'month' ? 'week' : 'month');
  };

  const handleDatePress = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDatePress?.(date);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const startOfWeek = weekDays[0];
      const endOfWeek = weekDays[6];
      if (startOfWeek && endOfWeek) {
        return `${startOfWeek.day} - ${endOfWeek.day} ${MONTHS[currentDate.getMonth()]}`;
      }
      return '';
    }
  };

  const renderMonthView = () => (
    <View style={styles.monthGrid}>
      {/* Cabecera de días */}
      <View style={styles.weekHeader}>
        {DAYS_SHORT.map((day) => (
          <View key={day} style={styles.weekHeaderCell}>
            <ThemedText style={[styles.weekHeaderText, { color: textSecondary }]}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>
      
      {/* Días del mes */}
      <View style={styles.daysGrid}>
        {monthDays.map((day, index) => {
          const dayEvents = eventsByDate[day.date] || [];
          const hasEvents = dayEvents.length > 0;
          
          return (
            <Pressable
              key={`${day.date}-${index}`}
              style={[
                styles.dayCell,
                day.isToday && [styles.todayCell, { borderColor: accent }],
              ]}
              onPress={() => handleDatePress(day.date)}
            >
              <ThemedText
                style={[
                  styles.dayText,
                  !day.isCurrentMonth && { color: textSecondary, opacity: 0.5 },
                  day.isToday && { color: accent, fontWeight: '700' },
                ]}
              >
                {day.day}
              </ThemedText>
              {hasEvents && (
                <View style={styles.eventDots}>
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventDot,
                        { backgroundColor: event.status === 'completed' ? success : accent },
                      ]}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderWeekView = () => (
    <View style={styles.weekView}>
      {/* Cabecera de días de la semana */}
      <View style={styles.weekDaysHeader}>
        {weekDays.map((day) => (
          <Pressable
            key={day.date}
            style={[
              styles.weekDayColumn,
              day.isToday && [styles.todayColumn, { backgroundColor: `${accent}15` }],
            ]}
            onPress={() => handleDatePress(day.date)}
          >
            <ThemedText style={[styles.weekDayName, { color: textSecondary }]}>
              {day.dayName}
            </ThemedText>
            <ThemedText
              style={[
                styles.weekDayNumber,
                day.isToday && { color: accent, fontWeight: '700' },
              ]}
            >
              {day.day}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      
      {/* Eventos de la semana */}
      <ScrollView style={styles.weekEventsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.weekEventsGrid}>
          {weekDays.map((day) => {
            const dayEvents = eventsByDate[day.date] || [];
            
            return (
              <View key={day.date} style={styles.weekEventColumn}>
                {dayEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    style={[styles.weekEventCard, { backgroundColor: `${accent}20`, borderLeftColor: accent }]}
                    onPress={() => onEventPress?.(event)}
                  >
                    <ThemedText style={styles.weekEventTime}>{event.startTime}</ThemedText>
                    <ThemedText style={styles.weekEventTitle} numberOfLines={2}>
                      {event.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor }]}>
      {/* Cabecera del calendario */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={navigatePrevious} style={styles.navButton}>
            <IconSymbol name="chevron.left" size={20} color={accent} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{getHeaderTitle()}</ThemedText>
          <Pressable onPress={navigateNext} style={styles.navButton}>
            <IconSymbol name="chevron.right" size={20} color={accent} />
          </Pressable>
        </View>
        
        <View style={styles.headerRight}>
          <Pressable
            onPress={goToToday}
            style={[styles.todayButton, { borderColor: accent }]}
          >
            <ThemedText style={[styles.todayButtonText, { color: accent }]}>Hoy</ThemedText>
          </Pressable>
          <Pressable
            onPress={toggleViewMode}
            style={[styles.viewModeButton, { backgroundColor: `${accent}15` }]}
          >
            <IconSymbol
              name={viewMode === 'month' ? 'list.bullet' : 'square.grid.2x2.fill'}
              size={18}
              color={accent}
            />
          </Pressable>
        </View>
      </View>
      
      {/* Vista del calendario */}
      {viewMode === 'month' ? renderMonthView() : renderWeekView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  navButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 150,
    textAlign: 'center',
  },
  todayButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewModeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  
  // Vista mensual
  monthGrid: {
    padding: Spacing.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  todayCell: {
    borderWidth: 2,
    borderRadius: BorderRadius.full,
  },
  dayText: {
    fontSize: 14,
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  
  // Vista semanal
  weekView: {
    minHeight: 300,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  todayColumn: {
    borderRadius: BorderRadius.sm,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '600',
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  weekEventsScroll: {
    maxHeight: 250,
  },
  weekEventsGrid: {
    flexDirection: 'row',
    padding: Spacing.xs,
  },
  weekEventColumn: {
    flex: 1,
    padding: 2,
    gap: 4,
  },
  weekEventCard: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
  },
  weekEventTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  weekEventTitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
