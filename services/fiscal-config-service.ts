/**
 * Servicio de Configuración Fiscal Multi-País
 * Soporte para: España, Alemania, Francia, Italia, Portugal, UK, México, Argentina, Colombia, Chile
 */

// Códigos de país ISO 3166-1 alpha-2
export type CountryCode = 
  | 'ES' // España
  | 'DE' // Alemania
  | 'FR' // Francia
  | 'IT' // Italia
  | 'PT' // Portugal
  | 'GB' // Reino Unido
  | 'MX' // México
  | 'AR' // Argentina
  | 'CO' // Colombia
  | 'CL'; // Chile

// Tipo de impuesto
export interface TaxRate {
  name: string;
  rate: number;
  description: string;
  isDefault?: boolean;
}

// Modelo fiscal (declaración)
export interface FiscalModel {
  code: string;
  name: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  deadline: string; // Descripción del plazo
  fields: FiscalModelField[];
}

export interface FiscalModelField {
  id: string;
  label: string;
  type: 'currency' | 'percentage' | 'number' | 'text';
  calculation?: string; // Fórmula de cálculo
}

// Configuración fiscal de un país
export interface CountryFiscalConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  taxName: string; // Nombre del impuesto (IVA, VAT, MwSt, etc.)
  taxRates: TaxRate[];
  fiscalModels: FiscalModel[];
  fiscalIdName: string; // Nombre del identificador fiscal (NIF, USt-IdNr, etc.)
  fiscalIdFormat: string; // Formato/regex del identificador
  invoiceRequirements: string[]; // Requisitos legales de facturación
}

// Configuraciones fiscales por país
export const FISCAL_CONFIGS: Record<CountryCode, CountryFiscalConfig> = {
  // ==================== ESPAÑA ====================
  ES: {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'es-ES',
    taxName: 'IVA',
    taxRates: [
      { name: 'General', rate: 21, description: 'Tipo general', isDefault: true },
      { name: 'Reducido', rate: 10, description: 'Tipo reducido (alimentos, transporte, hostelería)' },
      { name: 'Superreducido', rate: 4, description: 'Tipo superreducido (pan, leche, libros, medicamentos)' },
      { name: 'Exento', rate: 0, description: 'Operaciones exentas' },
    ],
    fiscalModels: [
      {
        code: '303',
        name: 'Modelo 303',
        description: 'Autoliquidación trimestral del IVA',
        frequency: 'quarterly',
        deadline: 'Hasta el día 20 del mes siguiente al trimestre (abril, julio, octubre, enero)',
        fields: [
          { id: 'base_21', label: 'Base imponible 21%', type: 'currency' },
          { id: 'cuota_21', label: 'Cuota IVA 21%', type: 'currency', calculation: 'base_21 * 0.21' },
          { id: 'base_10', label: 'Base imponible 10%', type: 'currency' },
          { id: 'cuota_10', label: 'Cuota IVA 10%', type: 'currency', calculation: 'base_10 * 0.10' },
          { id: 'base_4', label: 'Base imponible 4%', type: 'currency' },
          { id: 'cuota_4', label: 'Cuota IVA 4%', type: 'currency', calculation: 'base_4 * 0.04' },
          { id: 'total_devengado', label: 'Total IVA devengado', type: 'currency' },
          { id: 'total_deducible', label: 'Total IVA deducible', type: 'currency' },
          { id: 'resultado', label: 'Resultado liquidación', type: 'currency' },
        ],
      },
      {
        code: '130',
        name: 'Modelo 130',
        description: 'Pago fraccionado IRPF (autónomos en estimación directa)',
        frequency: 'quarterly',
        deadline: 'Hasta el día 20 del mes siguiente al trimestre',
        fields: [
          { id: 'ingresos', label: 'Ingresos del período', type: 'currency' },
          { id: 'gastos', label: 'Gastos deducibles', type: 'currency' },
          { id: 'rendimiento', label: 'Rendimiento neto', type: 'currency' },
          { id: 'pago_fraccionado', label: 'Pago fraccionado (20%)', type: 'currency', calculation: 'rendimiento * 0.20' },
          { id: 'retenciones', label: 'Retenciones soportadas', type: 'currency' },
          { id: 'resultado', label: 'Resultado', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'NIF/CIF',
    fiscalIdFormat: '^[A-Z]?[0-9]{7,8}[A-Z]?$',
    invoiceRequirements: [
      'Número de factura correlativo',
      'Fecha de emisión',
      'NIF del emisor y receptor',
      'Descripción de los servicios',
      'Base imponible, tipo y cuota de IVA',
      'Importe total',
    ],
  },

  // ==================== ALEMANIA ====================
  DE: {
    code: 'DE',
    name: 'Alemania',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    taxName: 'MwSt (Mehrwertsteuer)',
    taxRates: [
      { name: 'Normal', rate: 19, description: 'Regelsteuersatz', isDefault: true },
      { name: 'Ermäßigt', rate: 7, description: 'Ermäßigter Steuersatz (Lebensmittel, Bücher, Kultur)' },
      { name: 'Befreit', rate: 0, description: 'Steuerbefreit' },
    ],
    fiscalModels: [
      {
        code: 'UStVA',
        name: 'Umsatzsteuervoranmeldung',
        description: 'Declaración anticipada del IVA',
        frequency: 'monthly',
        deadline: 'Hasta el día 10 del mes siguiente (con Dauerfristverlängerung: día 10 del segundo mes)',
        fields: [
          { id: 'umsaetze_19', label: 'Umsätze 19%', type: 'currency' },
          { id: 'steuer_19', label: 'Steuer 19%', type: 'currency' },
          { id: 'umsaetze_7', label: 'Umsätze 7%', type: 'currency' },
          { id: 'steuer_7', label: 'Steuer 7%', type: 'currency' },
          { id: 'vorsteuer', label: 'Abziehbare Vorsteuer', type: 'currency' },
          { id: 'zahllast', label: 'Verbleibende Zahllast', type: 'currency' },
        ],
      },
      {
        code: 'EÜR',
        name: 'Einnahmen-Überschuss-Rechnung',
        description: 'Cuenta de resultados simplificada para autónomos',
        frequency: 'annual',
        deadline: 'Hasta el 31 de julio del año siguiente',
        fields: [
          { id: 'einnahmen', label: 'Betriebseinnahmen', type: 'currency' },
          { id: 'ausgaben', label: 'Betriebsausgaben', type: 'currency' },
          { id: 'gewinn', label: 'Gewinn/Verlust', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'USt-IdNr / Steuernummer',
    fiscalIdFormat: '^DE[0-9]{9}$',
    invoiceRequirements: [
      'Vollständiger Name und Anschrift',
      'Steuernummer oder USt-IdNr',
      'Fortlaufende Rechnungsnummer',
      'Leistungsdatum',
      'Nettobetrag, Steuersatz und Steuerbetrag',
    ],
  },

  // ==================== FRANCIA ====================
  FR: {
    code: 'FR',
    name: 'Francia',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    taxName: 'TVA (Taxe sur la Valeur Ajoutée)',
    taxRates: [
      { name: 'Normal', rate: 20, description: 'Taux normal', isDefault: true },
      { name: 'Intermédiaire', rate: 10, description: 'Taux intermédiaire (restauration, transports)' },
      { name: 'Réduit', rate: 5.5, description: 'Taux réduit (alimentation, livres, énergie)' },
      { name: 'Particulier', rate: 2.1, description: 'Taux particulier (médicaments, presse)' },
      { name: 'Exonéré', rate: 0, description: 'Exonéré de TVA' },
    ],
    fiscalModels: [
      {
        code: 'CA3',
        name: 'Déclaration CA3',
        description: 'Déclaration mensuelle ou trimestrielle de TVA',
        frequency: 'monthly',
        deadline: 'Entre le 15 et le 24 du mois suivant',
        fields: [
          { id: 'ca_20', label: 'CA taxable 20%', type: 'currency' },
          { id: 'tva_20', label: 'TVA collectée 20%', type: 'currency' },
          { id: 'ca_10', label: 'CA taxable 10%', type: 'currency' },
          { id: 'tva_10', label: 'TVA collectée 10%', type: 'currency' },
          { id: 'tva_deductible', label: 'TVA déductible', type: 'currency' },
          { id: 'tva_nette', label: 'TVA nette à payer', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'Numéro de TVA intracommunautaire',
    fiscalIdFormat: '^FR[0-9A-Z]{2}[0-9]{9}$',
    invoiceRequirements: [
      'Numéro SIREN/SIRET',
      'Numéro de TVA intracommunautaire',
      'Numéro de facture unique',
      'Date de la facture',
      'Montant HT, taux et montant de TVA',
    ],
  },

  // ==================== ITALIA ====================
  IT: {
    code: 'IT',
    name: 'Italia',
    flag: '🇮🇹',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'it-IT',
    taxName: 'IVA (Imposta sul Valore Aggiunto)',
    taxRates: [
      { name: 'Ordinaria', rate: 22, description: 'Aliquota ordinaria', isDefault: true },
      { name: 'Ridotta', rate: 10, description: 'Aliquota ridotta (turismo, edilizia)' },
      { name: 'Super ridotta', rate: 5, description: 'Aliquota super ridotta' },
      { name: 'Minima', rate: 4, description: 'Aliquota minima (alimentari, editoria)' },
      { name: 'Esente', rate: 0, description: 'Operazioni esenti' },
    ],
    fiscalModels: [
      {
        code: 'LIPE',
        name: 'Liquidazione IVA Periodica',
        description: 'Comunicazione trimestrale delle liquidazioni IVA',
        frequency: 'quarterly',
        deadline: 'Entro l\'ultimo giorno del secondo mese successivo al trimestre',
        fields: [
          { id: 'iva_esigibile', label: 'IVA esigibile', type: 'currency' },
          { id: 'iva_detratta', label: 'IVA detratta', type: 'currency' },
          { id: 'iva_dovuta', label: 'IVA dovuta/credito', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'Partita IVA',
    fiscalIdFormat: '^IT[0-9]{11}$',
    invoiceRequirements: [
      'Fatturazione elettronica obbligatoria (SDI)',
      'Partita IVA emittente e destinatario',
      'Codice destinatario o PEC',
      'Numero progressivo fattura',
      'Imponibile, aliquota e imposta',
    ],
  },

  // ==================== PORTUGAL ====================
  PT: {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'pt-PT',
    taxName: 'IVA (Imposto sobre o Valor Acrescentado)',
    taxRates: [
      { name: 'Normal', rate: 23, description: 'Taxa normal', isDefault: true },
      { name: 'Intermédia', rate: 13, description: 'Taxa intermédia (restauração, alimentação)' },
      { name: 'Reduzida', rate: 6, description: 'Taxa reduzida (bens essenciais)' },
      { name: 'Isento', rate: 0, description: 'Isento de IVA' },
    ],
    fiscalModels: [
      {
        code: 'DP-IVA',
        name: 'Declaração Periódica de IVA',
        description: 'Declaração mensal ou trimestral de IVA',
        frequency: 'monthly',
        deadline: 'Até ao dia 10 do segundo mês seguinte',
        fields: [
          { id: 'base_23', label: 'Base tributável 23%', type: 'currency' },
          { id: 'iva_23', label: 'IVA liquidado 23%', type: 'currency' },
          { id: 'iva_dedutivel', label: 'IVA dedutível', type: 'currency' },
          { id: 'iva_apurado', label: 'IVA apurado', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'NIF (Número de Identificação Fiscal)',
    fiscalIdFormat: '^[0-9]{9}$',
    invoiceRequirements: [
      'Software de facturação certificado pela AT',
      'NIF do emitente e adquirente',
      'Número sequencial da fatura',
      'ATCUD (código único de documento)',
      'QR Code obrigatório',
    ],
  },

  // ==================== REINO UNIDO ====================
  GB: {
    code: 'GB',
    name: 'Reino Unido',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    taxName: 'VAT (Value Added Tax)',
    taxRates: [
      { name: 'Standard', rate: 20, description: 'Standard rate', isDefault: true },
      { name: 'Reduced', rate: 5, description: 'Reduced rate (energy, children car seats)' },
      { name: 'Zero', rate: 0, description: 'Zero rate (food, books, children clothing)' },
    ],
    fiscalModels: [
      {
        code: 'VAT-Return',
        name: 'VAT Return',
        description: 'Quarterly VAT return submitted via Making Tax Digital',
        frequency: 'quarterly',
        deadline: 'One month and 7 days after the end of the VAT period',
        fields: [
          { id: 'vat_due_sales', label: 'VAT due on sales', type: 'currency' },
          { id: 'vat_due_acquisitions', label: 'VAT due on acquisitions', type: 'currency' },
          { id: 'total_vat_due', label: 'Total VAT due', type: 'currency' },
          { id: 'vat_reclaimed', label: 'VAT reclaimed', type: 'currency' },
          { id: 'net_vat', label: 'Net VAT to pay/reclaim', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'VAT Registration Number',
    fiscalIdFormat: '^GB[0-9]{9}$',
    invoiceRequirements: [
      'Unique invoice number',
      'Date of issue',
      'VAT registration number',
      'Description of goods/services',
      'Net amount, VAT rate and VAT amount',
      'Total amount including VAT',
    ],
  },

  // ==================== MÉXICO ====================
  MX: {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    currency: 'MXN',
    currencySymbol: '$',
    locale: 'es-MX',
    taxName: 'IVA (Impuesto al Valor Agregado)',
    taxRates: [
      { name: 'General', rate: 16, description: 'Tasa general', isDefault: true },
      { name: 'Frontera', rate: 8, description: 'Tasa región fronteriza norte' },
      { name: 'Exento', rate: 0, description: 'Tasa 0% (alimentos, medicinas, exportaciones)' },
    ],
    fiscalModels: [
      {
        code: 'DIOT',
        name: 'DIOT',
        description: 'Declaración Informativa de Operaciones con Terceros',
        frequency: 'monthly',
        deadline: 'A más tardar el día 17 del mes siguiente',
        fields: [
          { id: 'iva_trasladado', label: 'IVA trasladado', type: 'currency' },
          { id: 'iva_retenido', label: 'IVA retenido', type: 'currency' },
          { id: 'iva_acreditable', label: 'IVA acreditable', type: 'currency' },
          { id: 'iva_por_pagar', label: 'IVA por pagar', type: 'currency' },
        ],
      },
      {
        code: 'ISR',
        name: 'Pago provisional ISR',
        description: 'Pago provisional del Impuesto Sobre la Renta',
        frequency: 'monthly',
        deadline: 'A más tardar el día 17 del mes siguiente',
        fields: [
          { id: 'ingresos', label: 'Ingresos acumulados', type: 'currency' },
          { id: 'deducciones', label: 'Deducciones autorizadas', type: 'currency' },
          { id: 'utilidad', label: 'Utilidad fiscal', type: 'currency' },
          { id: 'isr_causado', label: 'ISR causado', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'RFC (Registro Federal de Contribuyentes)',
    fiscalIdFormat: '^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$',
    invoiceRequirements: [
      'CFDI (Comprobante Fiscal Digital por Internet)',
      'Timbrado por PAC autorizado',
      'RFC del emisor y receptor',
      'Folio fiscal (UUID)',
      'Código QR y sello digital',
    ],
  },

  // ==================== ARGENTINA ====================
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    currencySymbol: '$',
    locale: 'es-AR',
    taxName: 'IVA (Impuesto al Valor Agregado)',
    taxRates: [
      { name: 'General', rate: 21, description: 'Alícuota general', isDefault: true },
      { name: 'Reducida', rate: 10.5, description: 'Alícuota reducida (construcción, transporte)' },
      { name: 'Incrementada', rate: 27, description: 'Alícuota incrementada (telecomunicaciones, energía)' },
      { name: 'Exento', rate: 0, description: 'Exento de IVA' },
    ],
    fiscalModels: [
      {
        code: 'DJ-IVA',
        name: 'Declaración Jurada IVA',
        description: 'Declaración jurada mensual de IVA',
        frequency: 'monthly',
        deadline: 'Según terminación de CUIT (entre el 13 y 19 del mes siguiente)',
        fields: [
          { id: 'debito_fiscal', label: 'Débito fiscal', type: 'currency' },
          { id: 'credito_fiscal', label: 'Crédito fiscal', type: 'currency' },
          { id: 'saldo', label: 'Saldo a pagar/favor', type: 'currency' },
        ],
      },
      {
        code: 'Monotributo',
        name: 'Monotributo',
        description: 'Régimen simplificado para pequeños contribuyentes',
        frequency: 'monthly',
        deadline: 'Hasta el día 20 de cada mes',
        fields: [
          { id: 'categoria', label: 'Categoría', type: 'text' },
          { id: 'cuota_mensual', label: 'Cuota mensual', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'CUIT (Clave Única de Identificación Tributaria)',
    fiscalIdFormat: '^[0-9]{2}-[0-9]{8}-[0-9]$',
    invoiceRequirements: [
      'Factura electrónica obligatoria (AFIP)',
      'CAE (Código de Autorización Electrónico)',
      'CUIT del emisor y receptor',
      'Punto de venta autorizado',
      'Código QR con datos fiscales',
    ],
  },

  // ==================== COLOMBIA ====================
  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencySymbol: '$',
    locale: 'es-CO',
    taxName: 'IVA (Impuesto al Valor Agregado)',
    taxRates: [
      { name: 'General', rate: 19, description: 'Tarifa general', isDefault: true },
      { name: 'Reducida', rate: 5, description: 'Tarifa reducida (algunos alimentos, medicina prepagada)' },
      { name: 'Exento', rate: 0, description: 'Bienes y servicios exentos' },
    ],
    fiscalModels: [
      {
        code: 'Form-300',
        name: 'Formulario 300',
        description: 'Declaración bimestral de IVA',
        frequency: 'quarterly',
        deadline: 'Según último dígito del NIT (entre el 8 y 22 del mes siguiente al bimestre)',
        fields: [
          { id: 'iva_generado', label: 'IVA generado', type: 'currency' },
          { id: 'iva_descontable', label: 'IVA descontable', type: 'currency' },
          { id: 'saldo_favor', label: 'Saldo a favor período anterior', type: 'currency' },
          { id: 'saldo_pagar', label: 'Saldo a pagar', type: 'currency' },
        ],
      },
      {
        code: 'Retefuente',
        name: 'Retención en la Fuente',
        description: 'Declaración mensual de retenciones',
        frequency: 'monthly',
        deadline: 'Según último dígito del NIT',
        fields: [
          { id: 'base_retencion', label: 'Base de retención', type: 'currency' },
          { id: 'retencion_renta', label: 'Retención por renta', type: 'currency' },
          { id: 'retencion_iva', label: 'Retención de IVA', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'NIT (Número de Identificación Tributaria)',
    fiscalIdFormat: '^[0-9]{9}-[0-9]$',
    invoiceRequirements: [
      'Factura electrónica obligatoria (DIAN)',
      'CUFE (Código Único de Factura Electrónica)',
      'NIT del emisor y adquirente',
      'Resolución de facturación vigente',
      'Código QR de validación',
    ],
  },

  // ==================== CHILE ====================
  CL: {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    currencySymbol: '$',
    locale: 'es-CL',
    taxName: 'IVA (Impuesto al Valor Agregado)',
    taxRates: [
      { name: 'General', rate: 19, description: 'Tasa general', isDefault: true },
      { name: 'Exento', rate: 0, description: 'Exento de IVA' },
    ],
    fiscalModels: [
      {
        code: 'F29',
        name: 'Formulario 29',
        description: 'Declaración mensual de IVA y PPM',
        frequency: 'monthly',
        deadline: 'Hasta el día 12 del mes siguiente (o 20 si es por internet)',
        fields: [
          { id: 'debito_fiscal', label: 'Débito fiscal', type: 'currency' },
          { id: 'credito_fiscal', label: 'Crédito fiscal', type: 'currency' },
          { id: 'iva_determinado', label: 'IVA determinado', type: 'currency' },
          { id: 'ppm', label: 'PPM (Pago Provisional Mensual)', type: 'currency' },
          { id: 'total_pagar', label: 'Total a pagar', type: 'currency' },
        ],
      },
    ],
    fiscalIdName: 'RUT (Rol Único Tributario)',
    fiscalIdFormat: '^[0-9]{7,8}-[0-9Kk]$',
    invoiceRequirements: [
      'Factura electrónica obligatoria (SII)',
      'Timbre electrónico del SII',
      'RUT del emisor y receptor',
      'Folio autorizado',
      'Código de barras bidimensional',
    ],
  },
};

/**
 * Obtiene la configuración fiscal de un país
 */
export function getFiscalConfig(countryCode: CountryCode): CountryFiscalConfig {
  return FISCAL_CONFIGS[countryCode];
}

/**
 * Obtiene todos los países disponibles
 */
export function getAvailableCountries(): { code: CountryCode; name: string; flag: string }[] {
  return Object.values(FISCAL_CONFIGS).map(config => ({
    code: config.code,
    name: config.name,
    flag: config.flag,
  }));
}

/**
 * Obtiene el tipo de IVA por defecto de un país
 */
export function getDefaultTaxRate(countryCode: CountryCode): TaxRate {
  const config = FISCAL_CONFIGS[countryCode];
  return config.taxRates.find(rate => rate.isDefault) || config.taxRates[0];
}

/**
 * Formatea un importe según el locale del país
 */
export function formatCurrencyForCountry(amount: number, countryCode: CountryCode): string {
  const config = FISCAL_CONFIGS[countryCode];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

/**
 * Formatea una fecha según el locale del país
 */
export function formatDateForCountry(date: Date | string, countryCode: CountryCode): string {
  const config = FISCAL_CONFIGS[countryCode];
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(config.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Valida un identificador fiscal según el país
 */
export function validateFiscalId(fiscalId: string, countryCode: CountryCode): boolean {
  const config = FISCAL_CONFIGS[countryCode];
  const regex = new RegExp(config.fiscalIdFormat);
  return regex.test(fiscalId);
}

/**
 * Obtiene el período fiscal actual según el país
 */
export function getCurrentFiscalPeriod(countryCode: CountryCode): { period: string; year: number } {
  const config = FISCAL_CONFIGS[countryCode];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Determinar el período según la frecuencia del modelo principal
  const mainModel = config.fiscalModels[0];
  
  if (mainModel.frequency === 'monthly') {
    return { period: `M${month + 1}`, year };
  } else if (mainModel.frequency === 'quarterly') {
    const quarter = Math.floor(month / 3) + 1;
    return { period: `${quarter}T`, year };
  } else {
    return { period: 'Anual', year };
  }
}
