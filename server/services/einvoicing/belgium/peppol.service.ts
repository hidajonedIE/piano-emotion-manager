import { EInvoice, EInvoiceStatus, IEInvoicingService, SendResult, SupportedCountry, InvoicingSystem } from '../types';
import { BaseEInvoicingService } from '../base.service';
import { toXML } from 'jstoxml';

// Tipos UBL para PEPPOL
interface UBLAddress {
  StreetName?: string;
  CityName?: string;
  PostalZone?: string;
  CountrySubentity?: string;
  Country: { IdentificationCode: string };
}

interface TaxSubtotal {
  TaxableAmount: { _: string; currencyID: string };
  TaxAmount: { _: string; currencyID: string };
  TaxCategory: {
    ID: string;
    Percent: string;
    TaxScheme: { ID: string };
  };
}

interface UBLInvoice {
  Invoice: Record<string, unknown>;
}

interface AddressInput {
  street?: string;
  city?: string;
  postalCode?: string;
  region?: string;
  country: string;
}

/**
 * Service pour la facturation électronique en Belgique via PEPPOL.
 * Conforme à la norme PEPPOL BIS Billing 3.0.
 */
export class BelgiumPeppolService extends BaseEInvoicingService implements IEInvoicingService {
  country: SupportedCountry = 'BE';
  system: InvoicingSystem = 'PEPPOL';

  constructor() {
    super();
    // Initialiser le client API PEPPOL Access Point ici
  }

  /**
   * Génère le XML de la facture au format PEPPOL BIS Billing 3.0 (UBL).
   * @param invoice Données de la facture.
   * @returns Le XML de la facture sous forme de chaîne de caractères.
   */
  async generateXML(invoice: EInvoice): Promise<string> {
    const ublJson = this.mapToUbl(invoice);
    const xmlOptions = {
      header: true,
      indent: '  ',
      namespace: {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      }
    };
    return toXML(ublJson, xmlOptions);
  }

  /**
   * Envoie la facture via le réseau PEPPOL.
   * @param invoice Données de la facture.
   * @returns Le résultat de l'envoi.
   */
  async send(invoice: EInvoice): Promise<SendResult> {
    const xml = await this.generateXML(invoice);
    const validation = await this.validate(invoice);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation échouée: ${validation.errors.join(', ')}`,
        transactionId: '',
      };
    }

    
    // Envoi à l'Access Point PEPPOL
    try {
      const accessPointUrl = process.env.PEPPOL_ACCESS_POINT_URL;
      const accessPointApiKey = process.env.PEPPOL_API_KEY;
      
      if (!accessPointUrl || !accessPointApiKey) {
        console.warn('PEPPOL Access Point non configuré, simulation d\'envoi');
        return {
          success: true,
          message: 'Facture envoyée avec succès au réseau PEPPOL (mode simulation).',
          transactionId: `peppol-be-sim-${Date.now()}`,
        };
      }
      
      // Construire l'identifiant PEPPOL du destinataire
      const recipientId = this.buildPeppolId(invoice.customer.vatNumber);
      
      // Envoyer via l'API de l'Access Point
      const response = await fetch(`${accessPointUrl}/api/v1/outbound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${accessPointApiKey}`,
          'X-PEPPOL-Recipient': recipientId,
          'X-PEPPOL-Document-Type': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1',
          'X-PEPPOL-Process': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        },
        body: xml,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur Access Point: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        message: 'Facture envoyée avec succès au réseau PEPPOL.',
        transactionId: result.transactionId || `peppol-be-${Date.now()}`,
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi PEPPOL:', error);
      return {
        success: false,
        message: `Erreur d'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        transactionId: '',
      };
    }
  }
  
  /**
   * Construit l'identifiant PEPPOL à partir du numéro de TVA
   */
  private buildPeppolId(vatNumber: string): string {
    // Format: scheme::identifier
    // Pour la Belgique: 0208 (numéro d'entreprise) ou 9925 (numéro de TVA)
    if (vatNumber.startsWith('BE')) {
      const cleanVat = vatNumber.replace(/[^0-9]/g, '');
      return `0208:${cleanVat}`;
    }
    return `9925:${vatNumber}`;
  }

  /**
   * Récupère le statut d'une facture envoyée.
   * @param invoiceId ID de la facture.
   * @returns Le statut de la facture.
   */
  async getStatus(invoiceId: string): Promise<EInvoiceStatus> {
    
    try {
      const accessPointUrl = process.env.PEPPOL_ACCESS_POINT_URL;
      const accessPointApiKey = process.env.PEPPOL_API_KEY;
      
      if (!accessPointUrl || !accessPointApiKey) {
        console.warn('PEPPOL Access Point non configuré');
        return EInvoiceStatus.SENT;
      }
      
      // Consulter le statut via l'API de l'Access Point
      const response = await fetch(`${accessPointUrl}/api/v1/status/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessPointApiKey}`,
        },
      });
      
      if (!response.ok) {
        console.error(`Erreur lors de la récupération du statut: ${response.status}`);
        return EInvoiceStatus.SENT;
      }
      
      const result = await response.json();
      
      // Mapper le statut de l'Access Point au statut interne
      switch (result.status?.toLowerCase()) {
        case 'delivered':
          return EInvoiceStatus.DELIVERED;
        case 'accepted':
          return EInvoiceStatus.ACCEPTED;
        case 'rejected':
          return EInvoiceStatus.REJECTED;
        case 'pending':
          return EInvoiceStatus.PENDING;
        case 'sent':
          return EInvoiceStatus.SENT;
        case 'error':
        case 'failed':
          return EInvoiceStatus.ERROR;
        default:
          return EInvoiceStatus.SENT;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      return EInvoiceStatus.SENT;
    }
  }

  /**
   * Valide la facture par rapport aux règles belges (PEPPOL BIS 3.0).
   * @param invoice Données de la facture.
   * @returns Un objet indiquant si la facture est valide et les erreurs éventuelles.
   */
  async validate(invoice: EInvoice): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Validation du numéro de TVA client
    if (!invoice.customer.vatNumber || !invoice.customer.vatNumber.startsWith('BE')) {
      errors.push('Le numéro de TVA du client est manquant ou invalide pour la Belgique.');
    } else {
      // Valider le format du numéro de TVA belge (BE + 10 chiffres)
      const vatRegex = /^BE[0-9]{10}$/;
      if (!vatRegex.test(invoice.customer.vatNumber.replace(/\s/g, ''))) {
        errors.push('Le format du numéro de TVA belge est invalide (format attendu: BE0123456789).');
      }
    }
    
    // Validation du numéro de TVA fournisseur
    if (!invoice.supplier.vatNumber) {
      errors.push('Le numéro de TVA du fournisseur est obligatoire.');
    }
    
    // Validation de la devise
    if (invoice.currency !== 'EUR') {
      errors.push('La devise doit être EUR pour la Belgique.');
    }
    
    // Validation des dates
    if (!invoice.issueDate) {
      errors.push('La date d\'émission est obligatoire.');
    }
    if (!invoice.dueDate) {
      errors.push('La date d\'échéance est obligatoire.');
    }
    if (invoice.issueDate && invoice.dueDate && invoice.dueDate < invoice.issueDate) {
      errors.push('La date d\'échéance ne peut pas être antérieure à la date d\'émission.');
    }
    
    // Validation de l'identifiant de facture
    if (!invoice.invoiceId || invoice.invoiceId.length === 0) {
      errors.push('L\'identifiant de la facture est obligatoire.');
    }
    
    // Validation des lignes de facture
    if (!invoice.lines || invoice.lines.length === 0) {
      errors.push('La facture doit contenir au moins une ligne.');
    } else {
      invoice.lines.forEach((line, index) => {
        if (!line.description || line.description.trim().length === 0) {
          errors.push(`Ligne ${index + 1}: La description est obligatoire.`);
        }
        if (line.quantity <= 0) {
          errors.push(`Ligne ${index + 1}: La quantité doit être supérieure à zéro.`);
        }
        if (line.unitPrice < 0) {
          errors.push(`Ligne ${index + 1}: Le prix unitaire ne peut pas être négatif.`);
        }
        if (line.vatRate < 0 || line.vatRate > 100) {
          errors.push(`Ligne ${index + 1}: Le taux de TVA doit être entre 0 et 100.`);
        }
      });
    }
    
    // Validation des montants
    if (invoice.subtotal < 0) {
      errors.push('Le sous-total ne peut pas être négatif.');
    }
    if (invoice.taxAmount < 0) {
      errors.push('Le montant de TVA ne peut pas être négatif.');
    }
    if (invoice.totalAmount < 0) {
      errors.push('Le montant total ne peut pas être négatif.');
    }
    
    // Vérification de la cohérence des montants
    const calculatedSubtotal = invoice.lines?.reduce((sum, line) => sum + line.total, 0) || 0;
    if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
      errors.push('Le sous-total ne correspond pas à la somme des lignes.');
    }
    
    // Validation de l'adresse du client
    if (!invoice.customer.address) {
      errors.push('L\'adresse du client est obligatoire.');
    } else {
      if (!invoice.customer.address.street) {
        errors.push('La rue de l\'adresse du client est obligatoire.');
      }
      if (!invoice.customer.address.city) {
        errors.push('La ville de l\'adresse du client est obligatoire.');
      }
      if (!invoice.customer.address.zip) {
        errors.push('Le code postal de l\'adresse du client est obligatoire.');
      }
      if (!invoice.customer.address.countryCode) {
        errors.push('Le code pays de l\'adresse du client est obligatoire.');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mappe les données de la facture interne au format UBL 2.1 pour PEPPOL.
   * @param invoice Données de la facture.
   * @returns Objet JSON représentant la facture UBL.
   */
  private mapToUbl(invoice: EInvoice): UBLInvoice {
    return {
      _name: 'Invoice',
      _attrs: {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      },
      _content: [
        { 'cbc:UBLVersionID': '2.1' },
        { 'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:01:1.0' },
        { 'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0' },
        { 'cbc:ID': invoice.invoiceId },
        { 'cbc:IssueDate': invoice.issueDate.toISOString().split('T')[0] },
        { 'cbc:DueDate': invoice.dueDate.toISOString().split('T')[0] },
        { 'cbc:InvoiceTypeCode': '380' },
        { 'cbc:DocumentCurrencyCode': invoice.currency },
        {
          _name: 'cac:AccountingSupplierParty',
          _content: {
            _name: 'cac:Party',
            _content: [
              { 'cac:PartyName': { 'cbc:Name': invoice.supplier.name } },
              { 'cac:PostalAddress': this.mapAddress(invoice.supplier.address) },
              { 'cac:PartyTaxScheme': { 'cbc:CompanyID': invoice.supplier.vatNumber, 'cac:TaxScheme': { 'cbc:ID': 'VAT' } } },
              { 'cac:PartyLegalEntity': { 'cbc:RegistrationName': invoice.supplier.name } },
            ]
          }
        },
        {
          _name: 'cac:AccountingCustomerParty',
          _content: {
            _name: 'cac:Party',
            _content: [
              { 'cac:PartyName': { 'cbc:Name': invoice.customer.name } },
              { 'cac:PostalAddress': this.mapAddress(invoice.customer.address) },
              { 'cac:PartyTaxScheme': { 'cbc:CompanyID': invoice.customer.vatNumber, 'cac:TaxScheme': { 'cbc:ID': 'VAT' } } },
              { 'cac:PartyLegalEntity': { 'cbc:RegistrationName': invoice.customer.name } },
            ]
          }
        },
        {
          _name: 'cac:TaxTotal',
          _content: [
            { 'cbc:TaxAmount': { _attrs: { currencyID: invoice.currency }, _content: invoice.taxAmount } },
            // Détail des sous-totaux par taux de TVA
            ...this.groupTaxSubtotals(invoice),
          ]
        },
        {
          _name: 'cac:LegalMonetaryTotal',
          _content: [
            { 'cbc:LineExtensionAmount': { _attrs: { currencyID: invoice.currency }, _content: invoice.subtotal } },
            { 'cbc:TaxExclusiveAmount': { _attrs: { currencyID: invoice.currency }, _content: invoice.subtotal } },
            { 'cbc:TaxInclusiveAmount': { _attrs: { currencyID: invoice.currency }, _content: invoice.totalAmount } },
            { 'cbc:PayableAmount': { _attrs: { currencyID: invoice.currency }, _content: invoice.totalAmount } },
          ]
        },
        ...invoice.lines.map((line, index) => ({
          _name: 'cac:InvoiceLine',
          _content: [
            { 'cbc:ID': index + 1 },
            { 'cbc:InvoicedQuantity': { _attrs: { unitCode: 'C62' }, _content: line.quantity } }, // C62 = one
            { 'cbc:LineExtensionAmount': { _attrs: { currencyID: invoice.currency }, _content: line.total } },
            {
              _name: 'cac:Item',
              _content: [
                { 'cbc:Name': line.description },
                {
                  _name: 'cac:ClassifiedTaxCategory',
                  _content: {
                    'cbc:ID': 'S', // Standard rate
                    'cbc:Percent': line.vatRate,
                    'cac:TaxScheme': { 'cbc:ID': 'VAT' },
                  }
                }
              ]
            },
            {
              _name: 'cac:Price',
              _content: {
                'cbc:PriceAmount': { _attrs: { currencyID: invoice.currency }, _content: line.unitPrice },
              }
            }
          ]
        }))
      ]
    };
  }

  /**
   * Groupe les lignes par taux de TVA et calcule les sous-totaux
   */
  private groupTaxSubtotals(invoice: EInvoice): TaxSubtotal[] {
    // Grouper les lignes par taux de TVA
    const taxGroups = new Map<number, { taxableAmount: number; taxAmount: number }>();
    
    for (const line of invoice.lines || []) {
      const vatRate = line.vatRate || 0;
      const existing = taxGroups.get(vatRate) || { taxableAmount: 0, taxAmount: 0 };
      existing.taxableAmount += line.total;
      existing.taxAmount += line.total * (vatRate / 100);
      taxGroups.set(vatRate, existing);
    }
    
    // Convertir en éléments XML
    return Array.from(taxGroups.entries()).map(([vatRate, amounts]) => ({
      _name: 'cac:TaxSubtotal',
      _content: [
        { 'cbc:TaxableAmount': { _attrs: { currencyID: invoice.currency }, _content: amounts.taxableAmount.toFixed(2) } },
        { 'cbc:TaxAmount': { _attrs: { currencyID: invoice.currency }, _content: amounts.taxAmount.toFixed(2) } },
        {
          _name: 'cac:TaxCategory',
          _content: [
            { 'cbc:ID': vatRate === 0 ? 'Z' : 'S' }, // Z = Zero rate, S = Standard rate
            { 'cbc:Percent': vatRate },
            { 'cac:TaxScheme': { 'cbc:ID': 'VAT' } },
          ]
        }
      ]
    }));
  }

  private mapAddress(address: AddressInput): UBLAddress {
    return {
      'cbc:StreetName': address.street,
      'cbc:CityName': address.city,
      'cbc:PostalZone': address.zip,
      'cac:Country': { 'cbc:IdentificationCode': address.countryCode },
    };
  }
}
