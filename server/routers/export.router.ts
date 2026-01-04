/**
 * Export Router
 * 
 * API endpoints for exporting data to PDF and Excel
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { getDb } from '../db';
import * as pdfGen from '../_core/export/pdf-generator.js';
import * as excelGen from '../_core/export/excel-generator.js';

export const exportRouter = router({

  /**
   * Export clients list
   */
  exportClients: protectedProcedure
    .input(z.object({
      format: z.enum(['pdf', 'excel']),
      filters: z.object({
        search: z.string().optional(),
        status: z.enum(['active', 'inactive', 'all']).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get clients
      let query = db.selectFrom('clients').where('userId', '=', userId);

      if (input.filters?.search) {
        query = query.where((eb) =>
          eb.or([
            eb('name', 'like', `%${input.filters!.search}%`),
            eb('email', 'like', `%${input.filters!.search}%`),
          ])
        );
      }

      const clients = await query.selectAll().execute();

      // Generate file
      let buffer: Buffer;
      let filename: string;

      if (input.format === 'pdf') {
        buffer = await pdfGen.generateClientsPDF(clients);
        filename = `clientes_${Date.now()}.pdf`;
      } else {
        buffer = await excelGen.generateClientsExcel(clients);
        filename = `clientes_${Date.now()}.xlsx`;
      }

      return {
        success: true,
        filename,
        base64: buffer.toString('base64'),
        size: buffer.length,
      };
    }),

  /**
   * Export services list
   */
  exportServices: protectedProcedure
    .input(z.object({
      format: z.enum(['pdf', 'excel']),
      filters: z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        clientId: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get services with client info
      let query = db
        .selectFrom('services')
        .innerJoin('clients', 'services.clientId', 'clients.id')
        .where('services.userId', '=', userId)
        .select([
          'services.id',
          'services.serviceDate',
          'services.serviceType',
          'services.duration',
          'services.cost',
          'services.status',
          'services.notes',
          'clients.name as clientName',
        ]);

      if (input.filters?.dateFrom) {
        query = query.where('services.serviceDate', '>=', input.filters.dateFrom);
      }

      if (input.filters?.dateTo) {
        query = query.where('services.serviceDate', '<=', input.filters.dateTo);
      }

      if (input.filters?.clientId) {
        query = query.where('services.clientId', '=', input.filters.clientId);
      }

      const services = await query.execute();

      // Generate file
      let buffer: Buffer;
      let filename: string;

      if (input.format === 'pdf') {
        buffer = await pdfGen.generateServicesPDF(services);
        filename = `servicios_${Date.now()}.pdf`;
      } else {
        buffer = await excelGen.generateServicesExcel(services);
        filename = `servicios_${Date.now()}.xlsx`;
      }

      return {
        success: true,
        filename,
        base64: buffer.toString('base64'),
        size: buffer.length,
      };
    }),

  /**
   * Export invoices list
   */
  exportInvoices: protectedProcedure
    .input(z.object({
      format: z.enum(['pdf', 'excel']),
      filters: z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        status: z.enum(['paid', 'pending', 'overdue', 'all']).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get invoices with client info
      let query = db
        .selectFrom('invoices')
        .innerJoin('clients', 'invoices.clientId', 'clients.id')
        .where('invoices.userId', '=', userId)
        .select([
          'invoices.id',
          'invoices.invoiceNumber',
          'invoices.createdAt',
          'invoices.subtotal',
          'invoices.tax',
          'invoices.total',
          'invoices.status',
          'invoices.paidAt',
          'invoices.notes',
          'clients.name as clientName',
        ]);

      if (input.filters?.dateFrom) {
        query = query.where('invoices.createdAt', '>=', input.filters.dateFrom);
      }

      if (input.filters?.dateTo) {
        query = query.where('invoices.createdAt', '<=', input.filters.dateTo);
      }

      if (input.filters?.status && input.filters.status !== 'all') {
        query = query.where('invoices.status', '=', input.filters.status);
      }

      const invoices = await query.execute();

      // Generate file
      let buffer: Buffer;
      let filename: string;

      if (input.format === 'pdf') {
        buffer = await pdfGen.generateInvoicesPDF(invoices);
        filename = `facturas_${Date.now()}.pdf`;
      } else {
        buffer = await excelGen.generateInvoicesExcel(invoices);
        filename = `facturas_${Date.now()}.xlsx`;
      }

      return {
        success: true,
        filename,
        base64: buffer.toString('base64'),
        size: buffer.length,
      };
    }),

  /**
   * Export inventory
   */
  exportInventory: protectedProcedure
    .input(z.object({
      format: z.enum(['pdf', 'excel']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get inventory items
      const inventory = await db
        .selectFrom('inventory')
        .where('userId', '=', userId)
        .selectAll()
        .execute();

      // Generate file
      let buffer: Buffer;
      let filename: string;

      if (input.format === 'pdf') {
        buffer = await pdfGen.generateInventoryPDF(inventory);
        filename = `inventario_${Date.now()}.pdf`;
      } else {
        buffer = await excelGen.generateInventoryExcel(inventory);
        filename = `inventario_${Date.now()}.xlsx`;
      }

      return {
        success: true,
        filename,
        base64: buffer.toString('base64'),
        size: buffer.length,
      };
    }),

});

export type ExportRouter = typeof exportRouter;
