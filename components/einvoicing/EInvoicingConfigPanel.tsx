/**
 * Panel de Configuración de Facturación Electrónica Multi-País
 * Piano Emotion Manager
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Tipos
type SupportedCountry = 'ES' | 'IT' | 'DE' | 'FR' | 'PT' | 'DK';

interface CountryConfig {
  enabled: boolean;
  environment: 'test' | 'production';
  // España
  verifactu?: {
    certificatePath?: string;
    certificatePassword?: string;
  };
  // Italia
  sdi?: {
    codiceDestinatario?: string;
    pecDestinatario?: string;
    regimeFiscale: string;
  };
  // Alemania
  zugferd?: {
    profile: 'BASIC' | 'EN16931' | 'EXTENDED' | 'XRECHNUNG';
    leitwegId?: string;
  };
  // Francia
  facturx?: {
    siret?: string;
    profile: 'MINIMUM' | 'BASIC' | 'EN16931' | 'EXTENDED';
    chorusProEnabled: boolean;
  };
  // Portugal
  ciuspt?: {
    atSoftwareCertificateNumber?: string;
    serieDocumento: string;
  };
  // Dinamarca
  oioubl?: {
    cvr?: string;
    ean?: string;
    nemhandelEnabled: boolean;
  };
}

interface EInvoicingConfigPanelProps {
  country: SupportedCountry;
  config: CountryConfig;
  onSave: (config: CountryConfig) => Promise<void>;
  onTest: () => Promise<{ success: boolean; message: string }>;
}

// Información de cada país
const COUNTRY_INFO: Record<SupportedCountry, {
  name: string;
  flag: string;
  system: string;
  mandatory: string;
  currency: string;
  vatRates: number[];
}> = {
  ES: {
    name: 'España',
    flag: '🇪🇸',
    system: 'Verifactu (AEAT)',
    mandatory: 'B2B obligatorio 2025',
    currency: 'EUR',
    vatRates: [21, 10, 4, 0],
  },
  IT: {
    name: 'Italia',
    flag: '🇮🇹',
    system: 'SDI / FatturaPA',
    mandatory: 'Obligatorio desde 2019',
    currency: 'EUR',
    vatRates: [22, 10, 5, 4, 0],
  },
  DE: {
    name: 'Alemania',
    flag: '🇩🇪',
    system: 'ZUGFeRD / XRechnung',
    mandatory: 'B2B obligatorio 2025',
    currency: 'EUR',
    vatRates: [19, 7, 0],
  },
  FR: {
    name: 'Francia',
    flag: '🇫🇷',
    system: 'Factur-X / Chorus Pro',
    mandatory: 'B2B obligatorio 2026-27',
    currency: 'EUR',
    vatRates: [20, 10, 5.5, 2.1, 0],
  },
  PT: {
    name: 'Portugal',
    flag: '🇵🇹',
    system: 'CIUS-PT / SAF-T',
    mandatory: 'ATCUD obligatorio 2022',
    currency: 'EUR',
    vatRates: [23, 13, 6, 0],
  },
  DK: {
    name: 'Dinamarca',
    flag: '🇩🇰',
    system: 'OIOUBL / NemHandel',
    mandatory: 'B2G obligatorio 2005',
    currency: 'DKK',
    vatRates: [25, 0],
  },
};

// Regímenes fiscales italianos
const ITALIAN_REGIMES = [
  { value: 'RF01', label: 'RF01 - Ordinario' },
  { value: 'RF02', label: 'RF02 - Contribuyentes mínimos' },
  { value: 'RF04', label: 'RF04 - Agricultura' },
  { value: 'RF19', label: 'RF19 - Forfait (simplificado)' },
];

export const EInvoicingConfigPanel: React.FC<EInvoicingConfigPanelProps> = ({
  country,
  config,
  onSave,
  onTest,
}) => {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState<CountryConfig>(config);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const countryInfo = COUNTRY_INFO[country];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (updates: Partial<CountryConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="einvoicing-config-panel">
      {/* Cabecera del país */}
      <div className="country-header">
        <span className="country-flag">{countryInfo.flag}</span>
        <div className="country-info">
          <h3>{countryInfo.name}</h3>
          <p className="system-name">{countryInfo.system}</p>
          <span className="mandatory-badge">{countryInfo.mandatory}</span>
        </div>
      </div>

      {/* Toggle de activación */}
      <div className="config-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
          />
          <span>{t('einvoicing.enableForCountry', { country: countryInfo.name })}</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          {/* Entorno */}
          <div className="config-section">
            <label>{t('einvoicing.environment')}</label>
            <select
              value={localConfig.environment}
              onChange={(e) => updateConfig({ environment: e.target.value as 'test' | 'production' })}
            >
              <option value="test">{t('einvoicing.testEnvironment')}</option>
              <option value="production">{t('einvoicing.productionEnvironment')}</option>
            </select>
            {localConfig.environment === 'production' && (
              <p className="warning-text">{t('einvoicing.productionWarning')}</p>
            )}
          </div>

          {/* Configuración específica por país */}
          {country === 'ES' && (
            <SpainConfig
              config={localConfig.verifactu}
              onChange={(verifactu) => updateConfig({ verifactu })}
            />
          )}

          {country === 'IT' && (
            <ItalyConfig
              config={localConfig.sdi}
              onChange={(sdi) => updateConfig({ sdi })}
            />
          )}

          {country === 'DE' && (
            <GermanyConfig
              config={localConfig.zugferd}
              onChange={(zugferd) => updateConfig({ zugferd })}
            />
          )}

          {country === 'FR' && (
            <FranceConfig
              config={localConfig.facturx}
              onChange={(facturx) => updateConfig({ facturx })}
            />
          )}

          {country === 'PT' && (
            <PortugalConfig
              config={localConfig.ciuspt}
              onChange={(ciuspt) => updateConfig({ ciuspt })}
            />
          )}

          {country === 'DK' && (
            <DenmarkConfig
              config={localConfig.oioubl}
              onChange={(oioubl) => updateConfig({ oioubl })}
            />
          )}

          {/* Información de IVA */}
          <div className="config-section vat-info">
            <h4>{t('einvoicing.vatRates')}</h4>
            <div className="vat-rates">
              {countryInfo.vatRates.map((rate) => (
                <span key={rate} className="vat-badge">
                  {rate}%
                </span>
              ))}
            </div>
            <p className="currency-info">
              {t('einvoicing.currency')}: <strong>{countryInfo.currency}</strong>
            </p>
          </div>

          {/* Resultado del test */}
          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <span className="icon">{testResult.success ? '✓' : '✗'}</span>
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="config-actions">
            <button
              className="btn-test"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? t('common.testing') : t('einvoicing.testConnection')}
            </button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .einvoicing-config-panel {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .country-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }

        .country-flag {
          font-size: 48px;
        }

        .country-info h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .system-name {
          color: #666;
          margin: 4px 0;
        }

        .mandatory-badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .config-section {
          margin-bottom: 20px;
        }

        .config-section label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .toggle-label input {
          width: 20px;
          height: 20px;
        }

        select, input[type="text"], input[type="password"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .warning-text {
          color: #f57c00;
          font-size: 0.9rem;
          margin-top: 8px;
        }

        .vat-info {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
        }

        .vat-info h4 {
          margin: 0 0 12px 0;
        }

        .vat-rates {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vat-badge {
          background: #4caf50;
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.9rem;
        }

        .currency-info {
          margin-top: 12px;
          color: #666;
        }

        .test-result {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .test-result.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .test-result.error {
          background: #ffebee;
          color: #c62828;
        }

        .config-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-test, .btn-save {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-test {
          background: #f5f5f5;
          color: #333;
        }

        .btn-test:hover {
          background: #e0e0e0;
        }

        .btn-save {
          background: #1976d2;
          color: white;
        }

        .btn-save:hover {
          background: #1565c0;
        }

        .btn-test:disabled, .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

// Componentes de configuración específicos por país

const SpainConfig: React.FC<{
  config?: CountryConfig['verifactu'];
  onChange: (config: CountryConfig['verifactu']) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="country-specific-config">
      <h4>🇪🇸 {t('einvoicing.spain.title')}</h4>
      <div className="config-field">
        <label>{t('einvoicing.spain.certificatePath')}</label>
        <input
          type="text"
          value={config?.certificatePath || ''}
          onChange={(e) => onChange({ ...config, certificatePath: e.target.value })}
          placeholder="/path/to/certificate.p12"
        />
      </div>
      <div className="config-field">
        <label>{t('einvoicing.spain.certificatePassword')}</label>
        <input
          type="password"
          value={config?.certificatePassword || ''}
          onChange={(e) => onChange({ ...config, certificatePassword: e.target.value })}
        />
      </div>
      <p className="help-text">{t('einvoicing.spain.helpText')}</p>
    </div>
  );
};

const ItalyConfig: React.FC<{
  config?: CountryConfig['sdi'];
  onChange: (config: CountryConfig['sdi']) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="country-specific-config">
      <h4>🇮🇹 {t('einvoicing.italy.title')}</h4>
      <div className="config-field">
        <label>{t('einvoicing.italy.regimeFiscale')}</label>
        <select
          value={config?.regimeFiscale || 'RF01'}
          onChange={(e) => onChange({ ...config, regimeFiscale: e.target.value })}
        >
          {ITALIAN_REGIMES.map((regime) => (
            <option key={regime.value} value={regime.value}>
              {regime.label}
            </option>
          ))}
        </select>
      </div>
      <div className="config-field">
        <label>{t('einvoicing.italy.codiceDestinatario')}</label>
        <input
          type="text"
          value={config?.codiceDestinatario || ''}
          onChange={(e) => onChange({ ...config, codiceDestinatario: e.target.value })}
          placeholder="0000000"
          maxLength={7}
        />
        <p className="help-text">{t('einvoicing.italy.codiceHelp')}</p>
      </div>
      <div className="config-field">
        <label>{t('einvoicing.italy.pecDestinatario')}</label>
        <input
          type="text"
          value={config?.pecDestinatario || ''}
          onChange={(e) => onChange({ ...config, pecDestinatario: e.target.value })}
          placeholder="email@pec.it"
        />
      </div>
    </div>
  );
};

const GermanyConfig: React.FC<{
  config?: CountryConfig['zugferd'];
  onChange: (config: CountryConfig['zugferd']) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="country-specific-config">
      <h4>🇩🇪 {t('einvoicing.germany.title')}</h4>
      <div className="config-field">
        <label>{t('einvoicing.germany.profile')}</label>
        <select
          value={config?.profile || 'EN16931'}
          onChange={(e) => onChange({ ...config, profile: e.target.value as any })}
        >
          <option value="BASIC">BASIC</option>
          <option value="EN16931">EN16931 (Comfort)</option>
          <option value="EXTENDED">EXTENDED</option>
          <option value="XRECHNUNG">XRechnung (B2G)</option>
        </select>
      </div>
      {config?.profile === 'XRECHNUNG' && (
        <div className="config-field">
          <label>{t('einvoicing.germany.leitwegId')}</label>
          <input
            type="text"
            value={config?.leitwegId || ''}
            onChange={(e) => onChange({ ...config, leitwegId: e.target.value })}
            placeholder="04011000-12345-67"
          />
          <p className="help-text">{t('einvoicing.germany.leitwegHelp')}</p>
        </div>
      )}
    </div>
  );
};

const FranceConfig: React.FC<{
  config?: CountryConfig['facturx'];
  onChange: (config: CountryConfig['facturx']) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="country-specific-config">
      <h4>🇫🇷 {t('einvoicing.france.title')}</h4>
      <div className="config-field">
        <label>{t('einvoicing.france.siret')}</label>
        <input
          type="text"
          value={config?.siret || ''}
          onChange={(e) => onChange({ ...config, siret: e.target.value })}
          placeholder="12345678901234"
          maxLength={14}
        />
      </div>
      <div className="config-field">
        <label>{t('einvoicing.france.profile')}</label>
        <select
          value={config?.profile || 'EN16931'}
          onChange={(e) => onChange({ ...config, profile: e.target.value as any })}
        >
          <option value="MINIMUM">MINIMUM</option>
          <option value="BASIC">BASIC</option>
          <option value="EN16931">EN16931</option>
          <option value="EXTENDED">EXTENDED</option>
        </select>
      </div>
      <div className="config-field">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={config?.chorusProEnabled || false}
            onChange={(e) => onChange({ ...config, chorusProEnabled: e.target.checked })}
          />
          <span>{t('einvoicing.france.chorusProEnabled')}</span>
        </label>
        <p className="help-text">{t('einvoicing.france.chorusHelp')}</p>
      </div>
    </div>
  );
};

const PortugalConfig: React.FC<{
  config?: CountryConfig['ciuspt'];
  onChange: (config: CountryConfig['ciuspt']) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="country-specific-config">
      <h4>🇵🇹 {t('einvoicing.portugal.title')}</h4>
      <div className="config-field">
        <label>{t('einvoicing.portugal.serieDocumento')}</label>
        <input
          type="text"
          value={config?.serieDocumento || 'A'}
          onChange={(e) => onChange({ ...config, serieDocumento: e.target.value.toUpperCase() })}
          placeholder="A"
          maxLength={10}
        />
      </div>
      <div className="config-field">
        <label>{t('einvoicing.portugal.atCertificateNumber')}</label>
        <input
          type="text"
          value={config?.atSoftwareCertificateNumber || ''}
          onChange={(e) => onChange({ ...config, atSoftwareCertificateNumber: e.target.value })}
          placeholder="0000"
        />
        <p className="help-text">{t('einvoicing.portugal.atHelp')}</p>
      </div>
    </div>
  );
};

const DenmarkConfig: React.FC<{
  config?: CountryConfig['oioubl'];
  onChange: (config: CountryConfig['oioubl']) => void;
}> = ({ config, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="country-specific-config">
      <h4>🇩🇰 {t('einvoicing.denmark.title')}</h4>
      <div className="config-field">
        <label>{t('einvoicing.denmark.cvr')}</label>
        <input
          type="text"
          value={config?.cvr || ''}
          onChange={(e) => onChange({ ...config, cvr: e.target.value })}
          placeholder="12345678"
          maxLength={8}
        />
      </div>
      <div className="config-field">
        <label>{t('einvoicing.denmark.ean')}</label>
        <input
          type="text"
          value={config?.ean || ''}
          onChange={(e) => onChange({ ...config, ean: e.target.value })}
          placeholder="5798000000001"
          maxLength={13}
        />
        <p className="help-text">{t('einvoicing.denmark.eanHelp')}</p>
      </div>
      <div className="config-field">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={config?.nemhandelEnabled || false}
            onChange={(e) => onChange({ ...config, nemhandelEnabled: e.target.checked })}
          />
          <span>{t('einvoicing.denmark.nemhandelEnabled')}</span>
        </label>
        <p className="help-text">{t('einvoicing.denmark.nemhandelHelp')}</p>
      </div>
    </div>
  );
};

export default EInvoicingConfigPanel;
