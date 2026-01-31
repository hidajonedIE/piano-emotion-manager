/**
 * ServiceTypeCard Component
 * Tarjeta para mostrar y editar un tipo de servicio con sus tareas
 */
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { ServiceType, ServiceTask } from '@/types/onboarding';

interface ServiceTypeCardProps {
  service: ServiceType;
  onUpdate: (service: ServiceType) => void;
  onDelete: () => void;
}

export function ServiceTypeCard({ service, onUpdate, onDelete }: ServiceTypeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service);
  
  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const error = useThemeColor({}, 'error');

  const handleSave = () => {
    onUpdate(editedService);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedService(service);
    setIsEditing(false);
  };

  const handleAddTask = () => {
    const newTask: ServiceTask = {
      id: `task-${Date.now()}`,
      description: '',
      completed: false,
    };
    setEditedService({
      ...editedService,
      tasks: [...editedService.tasks, newTask],
    });
  };

  const handleUpdateTask = (taskId: string, description: string) => {
    setEditedService({
      ...editedService,
      tasks: editedService.tasks.map(t =>
        t.id === taskId ? { ...t, description } : t
      ),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setEditedService({
      ...editedService,
      tasks: editedService.tasks.filter(t => t.id !== taskId),
    });
  };

  if (isEditing) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {/* Header en modo edición */}
        <View style={styles.header}>
          <TextInput
            style={[styles.nameInput, { color: accent }]}
            value={editedService.name}
            onChangeText={(text) => setEditedService({ ...editedService, name: text })}
            placeholder="Nombre del servicio"
            placeholderTextColor={textSecondary}
          />
          <View style={styles.actions}>
            <Pressable onPress={handleSave} style={styles.iconButton}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={accent} />
            </Pressable>
            <Pressable onPress={handleCancel} style={styles.iconButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color={error} />
            </Pressable>
          </View>
        </View>

        {/* Precio y duración */}
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Precio (€)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: accent }]}
              value={editedService.price.toString()}
              onChangeText={(text) => setEditedService({ ...editedService, price: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholder="80"
            />
          </View>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Duración (h)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: accent }]}
              value={editedService.duration.toString()}
              onChangeText={(text) => setEditedService({ ...editedService, duration: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholder="1.5"
            />
          </View>
        </View>

        {/* Tareas */}
        <ThemedText style={styles.sectionTitle}>Tareas ({editedService.tasks.length})</ThemedText>
        {editedService.tasks.map((task, index) => (
          <View key={task.id} style={styles.taskRow}>
            <ThemedText style={styles.taskNumber}>{index + 1}.</ThemedText>
            <TextInput
              style={[styles.taskInput, { borderColor }]}
              value={task.description}
              onChangeText={(text) => handleUpdateTask(task.id, text)}
              placeholder="Descripción de la tarea"
              placeholderTextColor={textSecondary}
            />
            <Pressable onPress={() => handleDeleteTask(task.id)} style={styles.iconButton}>
              <IconSymbol name="trash" size={18} color={error} />
            </Pressable>
          </View>
        ))}
        
        <Pressable onPress={handleAddTask} style={styles.addTaskButton}>
          <IconSymbol name="plus.circle" size={20} color={accent} />
          <ThemedText style={[styles.addTaskText, { color: accent }]}>Agregar tarea</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // Modo vista
  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.name}>{service.name}</ThemedText>
          <ThemedText style={[styles.meta, { color: textSecondary }]}>
            €{service.price} • {service.duration}h
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => setIsEditing(true)} style={styles.iconButton}>
            <IconSymbol name="pencil" size={20} color={accent} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.iconButton}>
            <IconSymbol name="trash" size={20} color={error} />
          </Pressable>
        </View>
      </View>

      {/* Tareas */}
      <ThemedText style={styles.sectionTitle}>Tareas ({service.tasks.length})</ThemedText>
      {service.tasks.map((task, index) => (
        <View key={task.id} style={styles.taskItem}>
          <ThemedText style={styles.taskBullet}>•</ThemedText>
          <ThemedText style={styles.taskText}>{task.description}</ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  meta: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  taskNumber: {
    fontSize: 14,
    fontWeight: '500',
    width: 20,
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 14,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  taskBullet: {
    fontSize: 16,
    marginTop: 2,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
