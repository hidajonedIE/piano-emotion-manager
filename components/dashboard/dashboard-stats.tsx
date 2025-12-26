/**
 * Dashboard Stats Component
 * Muestra las estadísticas del mes con navegación
 */
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Accordion } from '@/components/accordion';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useResponsive } from '@/hooks/use-responsive';
import { Spacing, BorderRadius } from '@/constants/theme';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

interface DashboardStatsProps {
  stats: {
    totalClients: number;
    totalPianos: number;
    monthlyServices: number;
    monthlyRevenue: number;
  };
  selectedMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToCurrentMonth: () => void;
}

export function DashboardStats({
  stats,
  selectedMonth,
  onPreviousMonth,
  onNextMonth,
  onGoToCurrentMonth,
}: DashboardStatsProps) {
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsive();
  const accent = useThemeColor({}, 'accent');

  const getMonthTitle = () => {
    const now = new Date();
    const isCurrentMonth = selectedMonth.getMonth() === now.getMonth() && 
                          selectedMonth.getFullYear() === now.getFullYear();
    if (isCurrentMonth) {
      return 'Este Mes';
    }
    const monthName = isMobile ? MONTHS_SHORT[selectedMonth.getMonth()] : MONTHS[selectedMonth.getMonth()];
    return `${monthName} ${selectedMonth.getFullYear()}`;
  };

  return (
    <Accordion 
      title={getMonthTitle()} 
      defaultOpen={false}
      icon="calendar"
      iconColor="#10B981"
      centerContent
      rightAction={
        <View style={styles.monthNavigation}>
          <Pressable onPress={onPreviousMonth} style={styles.monthNavButton}>
            <IconSymbol name="chevron.left" size={18} color={accent} />
          </Pressable>
          <Pressable onPress={onGoToCurrentMonth} style={[styles.todayButton, { borderColor: accent }]}>
            <ThemedText style={[styles.todayButtonText, { color: accent }]}>Hoy</ThemedText>
          </Pressable>
          <Pressable onPress={onNextMonth} style={styles.monthNavButton}>
            <IconSymbol name="chevron.right" size={18} color={accent} />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/(tabs)/agenda' as any)} 
            style={[styles.calendarButton, { backgroundColor: accent }]}
          >
            <IconSymbol name="calendar" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      }
    >
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        <StatCard 
          icon="wrench.fill"
          value={stats.monthlyServices}
          label="Servicios"
          bgColor="#FEF3C7"
          borderColor="#F59E0B"
          iconBgColor="#F59E0B"
          valueColor="#92400E"
          labelColor="#B45309"
        />
        <StatCard 
          icon="eurosign.circle.fill"
          value={`€${stats.monthlyRevenue.toFixed(0)}`}
          label="Ingresos"
          bgColor="#D1FAE5"
          borderColor="#10B981"
          iconBgColor="#10B981"
          valueColor="#065F46"
          labelColor="#047857"
        />
        <StatCard 
          icon="person.2.fill"
          value={stats.totalClients}
          label="Clientes"
          bgColor="#DBEAFE"
          borderColor="#3B82F6"
          iconBgColor="#3B82F6"
          valueColor="#1E40AF"
          labelColor="#1D4ED8"
        />
        <StatCard 
          icon="pianokeys"
          value={stats.totalPianos}
          label="Pianos"
          bgColor="#EDE9FE"
          borderColor="#8B5CF6"
          iconBgColor="#8B5CF6"
          valueColor="#5B21B6"
          labelColor="#6D28D9"
        />
      </View>
    </Accordion>
  );
}

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  valueColor: string;
  labelColor: string;
}

function StatCard({ icon, value, label, bgColor, borderColor, iconBgColor, valueColor, labelColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.statIconBg, { backgroundColor: iconBgColor }]}>
        <IconSymbol name={icon as any} size={20} color="#FFFFFF" />
      </View>
      <ThemedText style={[styles.statValue, { color: valueColor }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: labelColor }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    padding: 8,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  statsGridDesktop: {
    maxWidth: 600,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: 4,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
});
