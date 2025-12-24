import { EInvoice, EInvoiceStatus, IEInvoicingService, SendResult, SupportedCountry, InvoicingSystem } from '../types';
import { BaseEInvoicingService } from '../base.service';
import { toXML } from 'jstoxml';

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

    console.log(`Envoi de la facture PEPPOL pour la Belgique: ${invoice.invoiceId}`);
    // TODO: Implémenter la logique d'envoi à un Access Point PEPPOL
    // Exemple: const response = await this.peppolClient.send(xml, recipientId);
    return {
      success: true,
      message: 'Facture envoyée avec succès au réseau PEPPOL.',
      transactionId: `peppol-be-${Date.now()}`,
    };
  }

  /**
   * Récupère le statut d'une facture envoyée.
   * @param invoiceId ID de la facture.
   * @returns Le statut de la facture.
   */
  async getStatus(invoiceId: string): Promise<EInvoiceStatus> {
    console.log(`Vérification du statut de la facture PEPPOL: ${invoiceId}`);
    // TODO: Implémenter la logique de récupération de statut
    return EInvoiceStatus.SENT;
  }

  /**
   * Valide la facture par rapport aux règles belges (PEPPOL BIS 3.0).
   * @param invoice Données de la facture.
   * @returns Un objet indiquant si la facture est valide et les erreurs éventuelles.
   */
  async validate(invoice: EInvoice): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!invoice.customer.vatNumber || !invoice.customer.vatNumber.startsWith('BE')) {
      errors.push('Le numéro de TVA du client est manquant ou invalide pour la Belgique.');
    }
    if (invoice.currency !== 'EUR') {
      errors.push('La devise doit être EUR pour la Belgique.');
    }
    // TODO: Ajouter d'autres règles de validation spécifiques à PEPPOL BIS 3.0
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
  private mapToUbl(invoice: EInvoice): any {
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
            // TODO: Détailler les sous-totaux par taux de TVA
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

  private mapAddress(address: any): any {
    return {
      'cbc:StreetName': address.street,
      'cbc:CityName': address.city,
      'cbc:PostalZone': address.zip,
      'cac:Country': { 'cbc:IdentificationCode': address.countryCode },
    };
  }
}
