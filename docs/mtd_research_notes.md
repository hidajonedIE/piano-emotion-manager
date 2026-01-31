# Making Tax Digital (MTD) UK - Research Notes

## API Information

**Base URLs:**
- Sandbox: `https://test-api.service.hmrc.gov.uk`
- Production: `https://api.service.hmrc.gov.uk`

**API Version:** 1.0 (beta)
**Last Updated:** 24 November 2025

## Key Endpoints

### 1. Retrieve VAT Obligations
- **Method:** GET
- **Path:** `/organisations/vat/{vrn}/obligations`
- **Parameters:**
  - `vrn` (required): VAT Registration Number (9 digits)
  - `from`: Date from (YYYY-MM-DD)
  - `to`: Date to (YYYY-MM-DD)
  - `status`: O=Open, F=Fulfilled

### 2. Submit VAT Return
- **Method:** POST
- **Path:** `/organisations/vat/{vrn}/returns`
- **Required Fields:**
  - `periodKey`: 4 alphanumeric characters
  - `vatDueSales`: VAT due on sales (2 decimal places)
  - `vatDueAcquisitions`: VAT due on acquisitions
  - `totalVatDue`: Sum of above
  - `vatReclaimedCurrPeriod`: VAT reclaimed
  - `netVatDue`: Absolute difference (always positive)
  - `totalValueSalesExVAT`: Total sales excluding VAT
  - `totalValuePurchasesExVAT`: Total purchases excluding VAT
  - `totalValueGoodsSuppliedExVAT`: Total goods supplied to EU
  - `totalAcquisitionsExVAT`: Total acquisitions from EU
  - `finalised`: Boolean - true to finalize

### 3. View VAT Return
- **Method:** GET
- **Path:** `/organisations/vat/{vrn}/returns/{periodKey}`

### 4. Retrieve VAT Liabilities
- **Method:** GET
- **Path:** `/organisations/vat/{vrn}/liabilities`

### 5. Retrieve VAT Payments
- **Method:** GET
- **Path:** `/organisations/vat/{vrn}/payments`

## Authentication

- **Type:** OAuth 2.0 (User Restricted)
- **Scopes:** read:vat, write:vat
- Required headers for fraud prevention

## Fraud Prevention Headers (Required by Law)

Must submit header data including:
- Device information
- Connection method
- User identifiers
- Timestamps

## UK VAT Rates (2024-2025)

- Standard rate: 20%
- Reduced rate: 5%
- Zero rate: 0%

## Key Dates

- **MTD for VAT:** Mandatory since April 2019 for businesses above VAT threshold
- **VAT Threshold:** £90,000 (from April 2024)
- **Mandatory B2B e-invoicing:** From April 2029

## VRN Format

- 9 digits
- Format: GB123456789 (with GB prefix for international use)
- Validation: Modulus 97 check

## Company Number Format

- 8 characters
- Can include letters for certain company types
- Example: 12345678 or SC123456 (Scotland)
