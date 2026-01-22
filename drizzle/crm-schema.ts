/**
 * Esquema de Base de Datos para CRM
 * Piano Emotion Manager
 * 
 * Gestión avanzada de clientes, segmentación y comunicaciones
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  tinyint,
  timestamp,
  date,
  
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

