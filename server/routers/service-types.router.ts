import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { getDb } from '../db.js';
import { serviceTypes } from '../../drizzle/service-types-schema.js';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Router para gestionar tipos de servicio personalizados
 * Permite a los usuarios crear, editar y eliminar sus propios tipos de servicio
 */

const serviceTypeSchema = z.object({
  code: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  defaultTasks: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const serviceTypesRouter = router({
  /**
   * Obtener todos los tipos de servicio del usuario
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const userId = ctx.user.id;
    
    // Obtener tipos personalizados del usuario
    const customTypes = await db
      .select()
      .from(serviceTypes)
      .where(
        and(
          eq(serviceTypes.userId, userId),
          eq(serviceTypes.isActive, 1)
        )
      )
      .orderBy(desc(serviceTypes.sortOrder), serviceTypes.label);

    // Tipos por defecto del sistema
    const defaultTypes = [
      {
        id: -1,
        code: 'tuning',
        label: 'Afinación',
        description: 'Afinación completa del piano',
        icon: 'tuningfork',
        color: '#10B981',
        isDefault: true,
        isActive: true,
        sortOrder: 100,
        defaultTasks: JSON.stringify([
          'Verificar estado general del piano',
          'Comprobar si el piano es afinable',
          'Verificar afinación inicial (diapasón)',
          'Ajustar clavijas si es necesario',
          'Afinar octava central (La 440Hz)',
          'Afinar registro grave',
          'Afinar registro agudo',
          'Verificar afinación final',
          'Probar pedales',
          'Recomendar próxima afinación',
        ]),
      },
      {
        id: -2,
        code: 'repair',
        label: 'Reparación',
        description: 'Reparación de componentes del piano',
        icon: 'wrench.and.screwdriver.fill',
        color: '#EF4444',
        isDefault: true,
        isActive: true,
        sortOrder: 90,
        defaultTasks: JSON.stringify([
          'Diagnosticar problema',
          'Evaluar si el piano será afinable tras reparación',
          'Identificar piezas a reparar/reemplazar',
          'Realizar reparación',
          'Verificar funcionamiento',
          'Probar todas las teclas afectadas',
          'Actualizar estado del piano',
        ]),
      },
      {
        id: -3,
        code: 'regulation',
        label: 'Regulación',
        description: 'Ajuste del mecanismo del piano',
        icon: 'slider.horizontal.3',
        color: '#3B82F6',
        isDefault: true,
        isActive: true,
        sortOrder: 80,
        defaultTasks: JSON.stringify([
          'Ajustar altura de teclas',
          'Regular escape de macillos',
          'Ajustar repetición',
          'Verificar caída de macillos',
          'Ajustar apagadores',
          'Regular pedales',
          'Verificar uniformidad del tacto',
          'Probar dinámica (pp a ff)',
        ]),
      },
      {
        id: -4,
        code: 'maintenance',
        label: 'Mantenimiento',
        description: 'Mantenimiento preventivo del piano',
        icon: 'checkmark.shield.fill',
        color: '#8B5CF6',
        isDefault: true,
        isActive: true,
        sortOrder: 70,
        defaultTasks: JSON.stringify([
          'Ver tareas según nivel seleccionado',
        ]),
      },
      {
        id: -5,
        code: 'inspection',
        label: 'Inspección',
        description: 'Inspección completa del estado del piano',
        icon: 'magnifyingglass',
        color: '#F59E0B',
        isDefault: true,
        isActive: true,
        sortOrder: 60,
        defaultTasks: JSON.stringify([
          'Revisar estado de cuerdas',
          'Revisar fieltros de macillos',
          'Revisar apagadores',
          'Revisar estado de clavijas',
          'Revisar tabla armónica (grietas)',
          'Revisar puentes',
          'Revisar pedales y mecanismo',
          'Evaluar estado general',
          'Determinar si es afinable',
          'Recomendar servicios necesarios',
        ]),
      },
      {
        id: -6,
        code: 'other',
        label: 'Otro',
        description: 'Otro tipo de servicio',
        icon: 'ellipsis.circle.fill',
        color: '#6B7280',
        isDefault: true,
        isActive: true,
        sortOrder: 10,
        defaultTasks: JSON.stringify([
          'Describir tarea realizada',
        ]),
      },
    ];

    // Combinar tipos por defecto y personalizados
    const allTypes = [
      ...defaultTypes,
      ...customTypes.map(t => ({
        ...t,
        isDefault: false,
        defaultTasks: t.defaultTasks || '[]',
      })),
    ];

    return allTypes.sort((a, b) => b.sortOrder - a.sortOrder);
  }),

  /**
   * Crear un nuevo tipo de servicio personalizado
   */
  create: protectedProcedure
    .input(serviceTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userId = ctx.user.id;

      // Verificar que el código no exista ya
      const existing = await db
        .select()
        .from(serviceTypes)
        .where(
          and(
            eq(serviceTypes.userId, userId),
            eq(serviceTypes.code, input.code)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('Ya existe un tipo de servicio con ese código');
      }

      // Crear el nuevo tipo de servicio
      const result = await db.insert(serviceTypes).values({
        userId,
        partnerId: 1,
        code: input.code,
        label: input.label,
        description: input.description,
        icon: input.icon,
        color: input.color,
        defaultTasks: input.defaultTasks ? JSON.stringify(input.defaultTasks) : null,
        isActive: input.isActive ? 1 : 0,
        isDefault: 0,
        sortOrder: input.sortOrder,
      });

      return { success: true, id: result[0].insertId };
    }),

  /**
   * Actualizar un tipo de servicio personalizado
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: serviceTypeSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userId = ctx.user.id;

      // Verificar que el tipo de servicio pertenece al usuario
      const existing = await db
        .select()
        .from(serviceTypes)
        .where(
          and(
            eq(serviceTypes.id, input.id),
            eq(serviceTypes.userId, userId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error('Tipo de servicio no encontrado');
      }

      // Permitir edición de tipos por defecto (solo se protege contra eliminación)

      // Actualizar
      const updateData: any = {};
      if (input.data.code !== undefined) updateData.code = input.data.code;
      if (input.data.label !== undefined) updateData.label = input.data.label;
      if (input.data.description !== undefined) updateData.description = input.data.description;
      if (input.data.icon !== undefined) updateData.icon = input.data.icon;
      if (input.data.color !== undefined) updateData.color = input.data.color;
      if (input.data.defaultTasks !== undefined) {
        updateData.defaultTasks = JSON.stringify(input.data.defaultTasks);
      }
      if (input.data.isActive !== undefined) updateData.isActive = input.data.isActive ? 1 : 0;
      if (input.data.sortOrder !== undefined) updateData.sortOrder = input.data.sortOrder;

      await db
        .update(serviceTypes)
        .set(updateData)
        .where(
          and(
            eq(serviceTypes.id, input.id),
            eq(serviceTypes.userId, userId)
          )
        );

      return { success: true };
    }),

  /**
   * Eliminar (desactivar) un tipo de servicio personalizado
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userId = ctx.user.id;

      // Verificar que el tipo de servicio pertenece al usuario
      const existing = await db
        .select()
        .from(serviceTypes)
        .where(
          and(
            eq(serviceTypes.id, input.id),
            eq(serviceTypes.userId, userId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error('Tipo de servicio no encontrado');
      }

      // No se pueden eliminar tipos por defecto
      if (existing[0].isDefault === 1) {
        throw new Error('No se pueden eliminar tipos de servicio por defecto');
      }

      // Desactivar en lugar de eliminar
      await db
        .update(serviceTypes)
        .set({ isActive: 0 })
        .where(
          and(
            eq(serviceTypes.id, input.id),
            eq(serviceTypes.userId, userId)
          )
        );

      return { success: true };
    }),

  /**
   * Reordenar tipos de servicio
   */
  reorder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.number().int(),
            sortOrder: z.number().int(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userId = ctx.user.id;

      // Actualizar el orden de cada item
      for (const item of input.items) {
        // Solo actualizar si no es un tipo por defecto (id negativo)
        if (item.id > 0) {
          await db
            .update(serviceTypes)
            .set({ sortOrder: item.sortOrder })
            .where(
              and(
                eq(serviceTypes.id, item.id),
                eq(serviceTypes.userId, userId)
              )
            );
        }
      }

      return { success: true };
    }),
});
