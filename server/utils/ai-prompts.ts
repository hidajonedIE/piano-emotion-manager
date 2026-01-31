/**
 * Sistema de Prompts Multilenguaje para IA
 * Piano Emotion Manager
 * 
 * Organiza todos los prompts de IA por feature e idioma
 * para facilitar mantenimiento y traducción
 */

// ============================================================================
// TIPOS
// ============================================================================

export type AIFeature = 'serviceReport' | 'clientEmail' | 'chatAssistant' | 'churnRisk';
export type PromptType = 'user' | 'system';
export type SupportedLanguage = 'es' | 'en' | 'pt' | 'it' | 'fr' | 'de' | 'da' | 'no' | 'sv';

interface PromptSet {
  user: string;
  system: string;
}

type FeaturePrompts = Record<SupportedLanguage, PromptSet>;

// ============================================================================
// PROMPTS POR FEATURE
// ============================================================================

/**
 * Prompts para generación de informes de servicio
 */
const SERVICE_REPORT_PROMPTS: FeaturePrompts = {
  // ESPAÑOL
  es: {
    user: `Genera un informe profesional de servicio de piano:

Piano: {pianoBrand} {pianoModel}
Cliente: {clientName}
Tipo de servicio: {serviceType}
Notas del técnico: {technicianNotes}
Tareas completadas: {tasksCompleted}

El informe debe incluir:
1. Resumen ejecutivo (2-3 líneas)
2. Estado del piano antes del servicio
3. Trabajos realizados detallados
4. Recomendaciones para el cliente
5. Próximo mantenimiento sugerido

Formato: Profesional pero accesible para el cliente.`,
    system: 'Eres un experto técnico de pianos que redacta informes profesionales.'
  },

  // INGLÉS
  en: {
    user: `Generate a professional piano service report:

Piano: {pianoBrand} {pianoModel}
Client: {clientName}
Service type: {serviceType}
Technician notes: {technicianNotes}
Tasks completed: {tasksCompleted}

The report should include:
1. Executive summary (2-3 lines)
2. Piano condition before service
3. Detailed work performed
4. Recommendations for the client
5. Suggested next maintenance

Format: Professional but accessible to the client.`,
    system: 'You are an expert piano technician who writes professional reports.'
  },

  // PORTUGUÉS
  pt: {
    user: `Gere um relatório profissional de serviço de piano:

Piano: {pianoBrand} {pianoModel}
Cliente: {clientName}
Tipo de serviço: {serviceType}
Notas do técnico: {technicianNotes}
Tarefas concluídas: {tasksCompleted}

O relatório deve incluir:
1. Resumo executivo (2-3 linhas)
2. Estado do piano antes do serviço
3. Trabalhos realizados detalhados
4. Recomendações para o cliente
5. Próxima manutenção sugerida

Formato: Profissional mas acessível ao cliente.`,
    system: 'Você é um técnico especialista em pianos que redige relatórios profissionais.'
  },

  // ITALIANO
  it: {
    user: `Genera un rapporto professionale di servizio per pianoforte:

Pianoforte: {pianoBrand} {pianoModel}
Cliente: {clientName}
Tipo di servizio: {serviceType}
Note del tecnico: {technicianNotes}
Compiti completati: {tasksCompleted}

Il rapporto deve includere:
1. Riepilogo esecutivo (2-3 righe)
2. Condizione del pianoforte prima del servizio
3. Lavori eseguiti in dettaglio
4. Raccomandazioni per il cliente
5. Prossima manutenzione suggerita

Formato: Professionale ma accessibile al cliente.`,
    system: 'Sei un tecnico esperto di pianoforti che redige rapporti professionali.'
  },

  // FRANCÉS
  fr: {
    user: `Générez un rapport professionnel de service de piano :

Piano : {pianoBrand} {pianoModel}
Client : {clientName}
Type de service : {serviceType}
Notes du technicien : {technicianNotes}
Tâches accomplies : {tasksCompleted}

Le rapport doit inclure :
1. Résumé exécutif (2-3 lignes)
2. État du piano avant le service
3. Travaux effectués en détail
4. Recommandations pour le client
5. Prochain entretien suggéré

Format : Professionnel mais accessible au client.`,
    system: 'Vous êtes un technicien expert en pianos qui rédige des rapports professionnels.'
  },

  // ALEMÁN
  de: {
    user: `Erstellen Sie einen professionellen Klavierservice-Bericht:

Klavier: {pianoBrand} {pianoModel}
Kunde: {clientName}
Service-Typ: {serviceType}
Techniker-Notizen: {technicianNotes}
Erledigte Aufgaben: {tasksCompleted}

Der Bericht sollte enthalten:
1. Zusammenfassung (2-3 Zeilen)
2. Zustand des Klaviers vor dem Service
3. Detaillierte durchgeführte Arbeiten
4. Empfehlungen für den Kunden
5. Vorgeschlagene nächste Wartung

Format: Professionell aber für den Kunden verständlich.`,
    system: 'Sie sind ein erfahrener Klaviertechniker, der professionelle Berichte verfasst.'
  },

  // DANÉS
  da: {
    user: `Generer en professionel piano servicerapport:

Piano: {pianoBrand} {pianoModel}
Klient: {clientName}
Servicetype: {serviceType}
Teknikernoter: {technicianNotes}
Udførte opgaver: {tasksCompleted}

Rapporten skal indeholde:
1. Resumé (2-3 linjer)
2. Pianots tilstand før service
3. Detaljeret udført arbejde
4. Anbefalinger til klienten
5. Foreslået næste vedligeholdelse

Format: Professionelt men tilgængeligt for klienten.`,
    system: 'Du er en ekspert pianotekniker, der skriver professionelle rapporter.'
  },

  // NORUEGO
  no: {
    user: `Generer en profesjonell piano servicerapport:

Piano: {pianoBrand} {pianoModel}
Klient: {clientName}
Tjenestetype: {serviceType}
Teknikernotater: {technicianNotes}
Utførte oppgaver: {tasksCompleted}

Rapporten skal inkludere:
1. Sammendrag (2-3 linjer)
2. Pianots tilstand før service
3. Detaljert utført arbeid
4. Anbefalinger til klienten
5. Foreslått neste vedlikehold

Format: Profesjonelt men tilgjengelig for klienten.`,
    system: 'Du er en ekspert pianotekniker som skriver profesjonelle rapporter.'
  },

  // SUECO
  sv: {
    user: `Generera en professionell piano servicerapport:

Piano: {pianoBrand} {pianoModel}
Kund: {clientName}
Tjänstetyp: {serviceType}
Teknikeranteckningar: {technicianNotes}
Utförda uppgifter: {tasksCompleted}

Rapporten ska innehålla:
1. Sammanfattning (2-3 rader)
2. Pianots skick före service
3. Detaljerat utfört arbete
4. Rekommendationer till kunden
5. Föreslagen nästa underhåll

Format: Professionellt men tillgängligt för kunden.`,
    system: 'Du är en expert pianotekniker som skriver professionella rapporter.'
  }
};

/**
 * Prompts para generación de emails personalizados
 */
const CLIENT_EMAIL_PROMPTS: FeaturePrompts = {
  // ESPAÑOL
  es: {
    user: `Genera un email de {emailType} para:

Cliente: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Requisitos:
- Profesional pero cercano
- Máximo 150 palabras en el cuerpo
- Asunto atractivo y conciso

Responde en JSON: {"subject": "...", "body": "..."}`,
    system: 'Eres un experto en comunicación con clientes. Responde solo con JSON válido.'
  },

  // INGLÉS
  en: {
    user: `Generate a {emailType} email for:

Client: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Requirements:
- Professional but friendly
- Maximum 150 words in body
- Attractive and concise subject

Respond in JSON: {"subject": "...", "body": "..."}`,
    system: 'You are an expert in client communication. Respond only with valid JSON.'
  },

  // PORTUGUÉS
  pt: {
    user: `Gere um email de {emailType} para:

Cliente: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Requisitos:
- Profissional mas próximo
- Máximo 150 palavras no corpo
- Assunto atrativo e conciso

Responda em JSON: {"subject": "...", "body": "..."}`,
    system: 'Você é um especialista em comunicação com clientes. Responda apenas com JSON válido.'
  },

  // ITALIANO
  it: {
    user: `Genera un'email di {emailType} per:

Cliente: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Requisiti:
- Professionale ma cordiale
- Massimo 150 parole nel corpo
- Oggetto attraente e conciso

Rispondi in JSON: {"subject": "...", "body": "..."}`,
    system: 'Sei un esperto di comunicazione con i clienti. Rispondi solo con JSON valido.'
  },

  // FRANCÉS
  fr: {
    user: `Générez un email de {emailType} pour :

Client : {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Exigences :
- Professionnel mais chaleureux
- Maximum 150 mots dans le corps
- Objet attractif et concis

Répondez en JSON : {"subject": "...", "body": "..."}`,
    system: 'Vous êtes un expert en communication client. Répondez uniquement avec du JSON valide.'
  },

  // ALEMÁN
  de: {
    user: `Erstellen Sie eine {emailType}-E-Mail für:

Kunde: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Anforderungen:
- Professionell aber freundlich
- Maximal 150 Wörter im Text
- Attraktiver und prägnanter Betreff

Antworten Sie in JSON: {"subject": "...", "body": "..."}`,
    system: 'Sie sind ein Experte für Kundenkommunikation. Antworten Sie nur mit gültigem JSON.'
  },

  // DANÉS
  da: {
    user: `Generer en {emailType} email til:

Klient: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Krav:
- Professionel men venlig
- Maksimum 150 ord i brødteksten
- Attraktiv og kortfattet emne

Svar i JSON: {"subject": "...", "body": "..."}`,
    system: 'Du er en ekspert i kundekommunikation. Svar kun med gyldig JSON.'
  },

  // NORUEGO
  no: {
    user: `Generer en {emailType} e-post for:

Klient: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Krav:
- Profesjonell men vennlig
- Maksimum 150 ord i brødteksten
- Attraktiv og konsis emne

Svar i JSON: {"subject": "...", "body": "..."}`,
    system: 'Du er en ekspert i kundekommunikasjon. Svar kun med gyldig JSON.'
  },

  // SUECO
  sv: {
    user: `Generera ett {emailType} e-postmeddelande för:

Kund: {clientName}
{lastServiceLine}
{nextServiceLine}
{customContextLine}

Krav:
- Professionellt men vänligt
- Maximalt 150 ord i brödtexten
- Attraktivt och koncist ämne

Svara i JSON: {"subject": "...", "body": "..."}`,
    system: 'Du är en expert på kundkommunikation. Svara endast med giltig JSON.'
  }
};

/**
 * Prompts para el asistente de chat (PianoBot)
 */
const CHAT_ASSISTANT_PROMPTS: FeaturePrompts = {
  // ESPAÑOL
  es: {
    user: '{userMessage}',
    system: `Eres PianoBot, un asistente experto en gestión de servicios de afinación y mantenimiento de pianos.

Ayudas a técnicos de piano con:
- Programación de citas y recordatorios
- Consejos técnicos sobre afinación, regulación y reparación
- Gestión de clientes y comunicación
- Facturación y presupuestos
- Mejores prácticas del sector

{contextInfo}

Responde de forma concisa, profesional y útil.
Si no sabes algo específico del negocio del usuario, sugiere dónde encontrar esa información en la app.`
  },

  // INGLÉS
  en: {
    user: '{userMessage}',
    system: `You are PianoBot, an expert assistant in piano tuning and maintenance service management.

You help piano technicians with:
- Appointment scheduling and reminders
- Technical advice on tuning, regulation and repair
- Client management and communication
- Billing and quotes
- Industry best practices

{contextInfo}

Respond concisely, professionally and helpfully.
If you don't know something specific about the user's business, suggest where to find that information in the app.`
  },

  // PORTUGUÉS
  pt: {
    user: '{userMessage}',
    system: `Você é o PianoBot, um assistente especialista em gestão de serviços de afinação e manutenção de pianos.

Você ajuda técnicos de piano com:
- Agendamento de compromissos e lembretes
- Conselhos técnicos sobre afinação, regulação e reparação
- Gestão de clientes e comunicação
- Faturamento e orçamentos
- Melhores práticas do setor

{contextInfo}

Responda de forma concisa, profissional e útil.
Se não souber algo específico sobre o negócio do usuário, sugira onde encontrar essa informação no app.`
  },

  // ITALIANO
  it: {
    user: '{userMessage}',
    system: `Sei PianoBot, un assistente esperto nella gestione dei servizi di accordatura e manutenzione di pianoforti.

Aiuti i tecnici di pianoforte con:
- Programmazione di appuntamenti e promemoria
- Consigli tecnici su accordatura, regolazione e riparazione
- Gestione clienti e comunicazione
- Fatturazione e preventivi
- Migliori pratiche del settore

{contextInfo}

Rispondi in modo conciso, professionale e utile.
Se non sai qualcosa di specifico sull'attività dell'utente, suggerisci dove trovare quell'informazione nell'app.`
  },

  // FRANCÉS
  fr: {
    user: '{userMessage}',
    system: `Vous êtes PianoBot, un assistant expert en gestion de services d'accordage et de maintenance de pianos.

Vous aidez les techniciens de piano avec :
- Planification de rendez-vous et rappels
- Conseils techniques sur l'accordage, la régulation et la réparation
- Gestion des clients et communication
- Facturation et devis
- Meilleures pratiques du secteur

{contextInfo}

Répondez de manière concise, professionnelle et utile.
Si vous ne savez pas quelque chose de spécifique sur l'activité de l'utilisateur, suggérez où trouver cette information dans l'app.`
  },

  // ALEMÁN
  de: {
    user: '{userMessage}',
    system: `Sie sind PianoBot, ein Expertenassistent für Klavierstimmungs- und Wartungsdienstleistungen.

Sie helfen Klaviertechnikern bei:
- Terminplanung und Erinnerungen
- Technische Beratung zu Stimmung, Regulierung und Reparatur
- Kundenverwaltung und Kommunikation
- Abrechnung und Angebote
- Best Practices der Branche

{contextInfo}

Antworten Sie prägnant, professionell und hilfreich.
Wenn Sie etwas Spezifisches über das Geschäft des Benutzers nicht wissen, schlagen Sie vor, wo diese Information in der App zu finden ist.`
  },

  // DANÉS
  da: {
    user: '{userMessage}',
    system: `Du er PianoBot, en ekspertassistent i klaverstemnings- og vedligeholdelsestjenester.

Du hjælper klaverteknikere med:
- Aftaleplanlægning og påmindelser
- Teknisk rådgivning om stemning, regulering og reparation
- Klienthåndtering og kommunikation
- Fakturering og tilbud
- Branchens bedste praksis

{contextInfo}

Svar kort, professionelt og hjælpsomt.
Hvis du ikke ved noget specifikt om brugerens forretning, foreslå hvor man kan finde den information i appen.`
  },

  // NORUEGO
  no: {
    user: '{userMessage}',
    system: `Du er PianoBot, en ekspertassistent i administrasjon av pianostemming og vedlikeholdstjenester.

Du hjelper pianoteknikere med:
- Avtaleplanlegging og påminnelser
- Tekniske råd om stemming, regulering og reparasjon
- Kundehåndtering og kommunikasjon
- Fakturering og tilbud
- Beste praksis i bransjen

{contextInfo}

Svar kortfattet, profesjonelt og nyttig.
Hvis du ikke vet noe spesifikt om brukerens virksomhet, foreslå hvor man kan finne den informasjonen i appen.`
  },

  // SUECO
  sv: {
    user: '{userMessage}',
    system: `Du är PianoBot, en expertassistent i hantering av pianostämning och underhållstjänster.

Du hjälper pianotekniker med:
- Tidsbokning och påminnelser
- Tekniska råd om stämning, reglering och reparation
- Kundhantering och kommunikation
- Fakturering och offerter
- Bästa praxis i branschen

{contextInfo}

Svara koncist, professionellt och hjälpsamt.
Om du inte vet något specifikt om användarens verksamhet, föreslå var man kan hitta den informationen i appen.`
  }
};

/**
 * Prompts para análisis de riesgo de pérdida de clientes (churn)
 */
const CHURN_RISK_PROMPTS: FeaturePrompts = {
  // ESPAÑOL
  es: {
    user: `Analiza el riesgo de pérdida de este cliente de servicios de piano:

Cliente: {clientName}
Días desde último servicio: {daysSinceLastService}
Total de servicios: {totalServices}
Intervalo promedio entre servicios: {averageInterval} días
Total gastado: {totalSpent}€

Proporciona:
1. Nivel de riesgo: "low", "medium" o "high"
2. Análisis breve (2-3 líneas)
3. 3 recomendaciones específicas para retenerlo

Responde en JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Eres un analista de CRM especializado en retención de clientes. Responde solo con JSON válido.'
  },

  // INGLÉS
  en: {
    user: `Analyze the churn risk for this piano service client:

Client: {clientName}
Days since last service: {daysSinceLastService}
Total services: {totalServices}
Average interval between services: {averageInterval} days
Total spent: {totalSpent}€

Provide:
1. Risk level: "low", "medium" or "high"
2. Brief analysis (2-3 lines)
3. 3 specific recommendations to retain them

Respond in JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'You are a CRM analyst specialized in customer retention. Respond only with valid JSON.'
  },

  // PORTUGUÉS
  pt: {
    user: `Analise o risco de perda deste cliente de serviços de piano:

Cliente: {clientName}
Dias desde o último serviço: {daysSinceLastService}
Total de serviços: {totalServices}
Intervalo médio entre serviços: {averageInterval} dias
Total gasto: {totalSpent}€

Forneça:
1. Nível de risco: "low", "medium" ou "high"
2. Análise breve (2-3 linhas)
3. 3 recomendações específicas para retê-lo

Responda em JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Você é um analista de CRM especializado em retenção de clientes. Responda apenas com JSON válido.'
  },

  // ITALIANO
  it: {
    user: `Analizza il rischio di perdita di questo cliente di servizi per pianoforte:

Cliente: {clientName}
Giorni dall'ultimo servizio: {daysSinceLastService}
Servizi totali: {totalServices}
Intervallo medio tra i servizi: {averageInterval} giorni
Totale speso: {totalSpent}€

Fornisci:
1. Livello di rischio: "low", "medium" o "high"
2. Analisi breve (2-3 righe)
3. 3 raccomandazioni specifiche per trattenerlo

Rispondi in JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Sei un analista CRM specializzato nella fidelizzazione dei clienti. Rispondi solo con JSON valido.'
  },

  // FRANCÉS
  fr: {
    user: `Analysez le risque de perte de ce client de services de piano :

Client : {clientName}
Jours depuis le dernier service : {daysSinceLastService}
Services totaux : {totalServices}
Intervalle moyen entre les services : {averageInterval} jours
Total dépensé : {totalSpent}€

Fournissez :
1. Niveau de risque : "low", "medium" ou "high"
2. Analyse brève (2-3 lignes)
3. 3 recommandations spécifiques pour le fidéliser

Répondez en JSON : {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Vous êtes un analyste CRM spécialisé dans la fidélisation client. Répondez uniquement avec du JSON valide.'
  },

  // ALEMÁN
  de: {
    user: `Analysieren Sie das Abwanderungsrisiko für diesen Klavierservice-Kunden:

Kunde: {clientName}
Tage seit dem letzten Service: {daysSinceLastService}
Gesamtservices: {totalServices}
Durchschnittliches Intervall zwischen Services: {averageInterval} Tage
Gesamtausgaben: {totalSpent}€

Geben Sie an:
1. Risikoniveau: "low", "medium" oder "high"
2. Kurze Analyse (2-3 Zeilen)
3. 3 spezifische Empfehlungen zur Kundenbindung

Antworten Sie in JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Sie sind ein CRM-Analyst, der auf Kundenbindung spezialisiert ist. Antworten Sie nur mit gültigem JSON.'
  },

  // DANÉS
  da: {
    user: `Analyser frafaldsrisikoen for denne klaverserviceklient:

Klient: {clientName}
Dage siden sidste service: {daysSinceLastService}
Samlede services: {totalServices}
Gennemsnitligt interval mellem services: {averageInterval} dage
Total brugt: {totalSpent}€

Angiv:
1. Risikoniveau: "low", "medium" eller "high"
2. Kort analyse (2-3 linjer)
3. 3 specifikke anbefalinger til at fastholde dem

Svar i JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Du er en CRM-analytiker specialiseret i kundefastholdelse. Svar kun med gyldig JSON.'
  },

  // NORUEGO
  no: {
    user: `Analyser frafallsrisikoen for denne pianotjenesteklienten:

Klient: {clientName}
Dager siden siste service: {daysSinceLastService}
Totale tjenester: {totalServices}
Gjennomsnittlig intervall mellom tjenester: {averageInterval} dager
Totalt brukt: {totalSpent}€

Oppgi:
1. Risikonivå: "low", "medium" eller "high"
2. Kort analyse (2-3 linjer)
3. 3 spesifikke anbefalinger for å beholde dem

Svar i JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Du er en CRM-analytiker spesialisert i kundefastholdelse. Svar kun med gyldig JSON.'
  },

  // SUECO
  sv: {
    user: `Analysera avhoppsrisken för denna pianotjänstkund:

Kund: {clientName}
Dagar sedan senaste service: {daysSinceLastService}
Totala tjänster: {totalServices}
Genomsnittligt intervall mellan tjänster: {averageInterval} dagar
Totalt spenderat: {totalSpent}€

Ange:
1. Riskivå: "low", "medium" eller "high"
2. Kort analys (2-3 rader)
3. 3 specifika rekommendationer för att behålla dem

Svara i JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`,
    system: 'Du är en CRM-analytiker specialiserad på kundbehållning. Svara endast med giltig JSON.'
  }
};

// ============================================================================
// TRADUCCIONES DE TIPOS DE EMAIL
// ============================================================================

const EMAIL_TYPE_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    reminder: 'recordatorio de mantenimiento de piano',
    followup: 'seguimiento después del servicio',
    promotion: 'oferta especial de servicios',
    thank_you: 'agradecimiento por confiar en nosotros'
  },
  en: {
    reminder: 'piano maintenance reminder',
    followup: 'follow-up after service',
    promotion: 'special service offer',
    thank_you: 'thank you for trusting us'
  },
  pt: {
    reminder: 'lembrete de manutenção de piano',
    followup: 'acompanhamento após o serviço',
    promotion: 'oferta especial de serviços',
    thank_you: 'obrigado por confiar em nós'
  },
  it: {
    reminder: 'promemoria di manutenzione del pianoforte',
    followup: 'follow-up dopo il servizio',
    promotion: 'offerta speciale di servizi',
    thank_you: 'grazie per la fiducia'
  },
  fr: {
    reminder: 'rappel d\'entretien de piano',
    followup: 'suivi après le service',
    promotion: 'offre spéciale de services',
    thank_you: 'merci de votre confiance'
  },
  de: {
    reminder: 'Klavierwartungserinnerung',
    followup: 'Nachverfolgung nach dem Service',
    promotion: 'Sonderangebot für Services',
    thank_you: 'Danke für Ihr Vertrauen'
  },
  da: {
    reminder: 'klavervedligeholdelsesPåmindelse',
    followup: 'opfølgning efter service',
    promotion: 'særligt servicetilbud',
    thank_you: 'tak for din tillid'
  },
  no: {
    reminder: 'pianovedlikeholdspåminnelse',
    followup: 'oppfølging etter service',
    promotion: 'spesialtilbud på tjenester',
    thank_you: 'takk for at du stoler på oss'
  },
  sv: {
    reminder: 'pianounterhållspåminnelse',
    followup: 'uppföljning efter service',
    promotion: 'specialerbjudande på tjänster',
    thank_you: 'tack för att du litar på oss'
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene el prompt para una feature específica en un idioma
 */
export function getAIPrompt(
  feature: AIFeature,
  language: string,
  type: PromptType = 'user'
): string {
  // Normalizar idioma
  const lang = (language.toLowerCase().slice(0, 2)) as SupportedLanguage;
  
  // Seleccionar el conjunto de prompts según la feature
  let prompts: FeaturePrompts;
  switch (feature) {
    case 'serviceReport':
      prompts = SERVICE_REPORT_PROMPTS;
      break;
    case 'clientEmail':
      prompts = CLIENT_EMAIL_PROMPTS;
      break;
    case 'chatAssistant':
      prompts = CHAT_ASSISTANT_PROMPTS;
      break;
    case 'churnRisk':
      prompts = CHURN_RISK_PROMPTS;
      break;
    default:
      throw new Error(`Unknown AI feature: ${feature}`);
  }
  
  // Obtener el prompt en el idioma solicitado, con fallback a español
  const langPrompts = prompts[lang] || prompts['es'];
  return langPrompts[type] || '';
}

/**
 * Interpola variables en un template de prompt
 */
export function interpolatePrompt(
  template: string,
  vars: Record<string, any>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

/**
 * Obtiene la traducción del tipo de email
 */
export function getEmailTypeTranslation(
  emailType: 'reminder' | 'followup' | 'promotion' | 'thank_you',
  language: string
): string {
  const lang = (language.toLowerCase().slice(0, 2)) as SupportedLanguage;
  const translations = EMAIL_TYPE_TRANSLATIONS[lang] || EMAIL_TYPE_TRANSLATIONS['es'];
  return translations[emailType] || emailType;
}

/**
 * Prepara el prompt completo para generación de email
 * (maneja las líneas condicionales)
 */
export function prepareEmailPrompt(
  language: string,
  emailType: 'reminder' | 'followup' | 'promotion' | 'thank_you',
  clientName: string,
  lastService?: string,
  nextServiceDate?: string,
  customContext?: string
): { userPrompt: string; systemPrompt: string } {
  const lang = (language.toLowerCase().slice(0, 2)) as SupportedLanguage;
  
  // Obtener traducciones
  const emailTypeTranslated = getEmailTypeTranslation(emailType, lang);
  
  // Preparar líneas condicionales según el idioma
  let lastServiceLine = '';
  let nextServiceLine = '';
  let customContextLine = '';
  
  if (lastService) {
    const labels: Record<SupportedLanguage, string> = {
      es: 'Último servicio',
      en: 'Last service',
      pt: 'Último serviço',
      it: 'Ultimo servizio',
      fr: 'Dernier service',
      de: 'Letzter Service',
      da: 'Sidste service',
      no: 'Siste service',
      sv: 'Senaste service'
    };
    lastServiceLine = `${labels[lang] || labels['es']}: ${lastService}`;
  }
  
  if (nextServiceDate) {
    const labels: Record<SupportedLanguage, string> = {
      es: 'Próximo servicio sugerido',
      en: 'Suggested next service',
      pt: 'Próximo serviço sugerido',
      it: 'Prossimo servizio suggerito',
      fr: 'Prochain service suggéré',
      de: 'Vorgeschlagener nächster Service',
      da: 'Foreslået næste service',
      no: 'Foreslått neste service',
      sv: 'Föreslagen nästa service'
    };
    nextServiceLine = `${labels[lang] || labels['es']}: ${nextServiceDate}`;
  }
  
  if (customContext) {
    const labels: Record<SupportedLanguage, string> = {
      es: 'Contexto',
      en: 'Context',
      pt: 'Contexto',
      it: 'Contesto',
      fr: 'Contexte',
      de: 'Kontext',
      da: 'Kontekst',
      no: 'Kontekst',
      sv: 'Kontext'
    };
    customContextLine = `${labels[lang] || labels['es']}: ${customContext}`;
  }
  
  // Obtener template base
  const userTemplate = getAIPrompt('clientEmail', lang, 'user');
  const systemPrompt = getAIPrompt('clientEmail', lang, 'system');
  
  // Interpolar variables
  const userPrompt = interpolatePrompt(userTemplate, {
    emailType: emailTypeTranslated,
    clientName,
    lastServiceLine,
    nextServiceLine,
    customContextLine
  });
  
  return { userPrompt, systemPrompt };
}

/**
 * Prepara el prompt completo para el chat assistant
 */
export function prepareChatAssistantPrompt(
  language: string,
  userMessage: string,
  context?: {
    userName?: string;
    clientCount?: number;
    pendingServices?: number;
  }
): { userPrompt: string; systemPrompt: string } {
  const lang = (language.toLowerCase().slice(0, 2)) as SupportedLanguage;
  
  // Preparar información de contexto según el idioma
  let contextInfo = '';
  if (context) {
    const lines: string[] = [];
    
    if (context.userName) {
      const labels: Record<SupportedLanguage, string> = {
        es: 'El usuario se llama',
        en: 'The user is called',
        pt: 'O usuário se chama',
        it: 'L\'utente si chiama',
        fr: 'L\'utilisateur s\'appelle',
        de: 'Der Benutzer heißt',
        da: 'Brugeren hedder',
        no: 'Brukeren heter',
        sv: 'Användaren heter'
      };
      lines.push(`${labels[lang] || labels['es']} ${context.userName}.`);
    }
    
    if (context.clientCount !== undefined) {
      const labels: Record<SupportedLanguage, string> = {
        es: 'Tiene',
        en: 'Has',
        pt: 'Tem',
        it: 'Ha',
        fr: 'A',
        de: 'Hat',
        da: 'Har',
        no: 'Har',
        sv: 'Har'
      };
      const clientLabels: Record<SupportedLanguage, string> = {
        es: 'clientes registrados',
        en: 'registered clients',
        pt: 'clientes registrados',
        it: 'clienti registrati',
        fr: 'clients enregistrés',
        de: 'registrierte Kunden',
        da: 'registrerede klienter',
        no: 'registrerte klienter',
        sv: 'registrerade kunder'
      };
      lines.push(`${labels[lang] || labels['es']} ${context.clientCount} ${clientLabels[lang] || clientLabels['es']}.`);
    }
    
    if (context.pendingServices !== undefined) {
      const labels: Record<SupportedLanguage, string> = {
        es: 'Tiene',
        en: 'Has',
        pt: 'Tem',
        it: 'Ha',
        fr: 'A',
        de: 'Hat',
        da: 'Har',
        no: 'Har',
        sv: 'Har'
      };
      const serviceLabels: Record<SupportedLanguage, string> = {
        es: 'servicios pendientes',
        en: 'pending services',
        pt: 'serviços pendentes',
        it: 'servizi in sospeso',
        fr: 'services en attente',
        de: 'ausstehende Services',
        da: 'afventende services',
        no: 'ventende tjenester',
        sv: 'väntande tjänster'
      };
      lines.push(`${labels[lang] || labels['es']} ${context.pendingServices} ${serviceLabels[lang] || serviceLabels['es']}.`);
    }
    
    contextInfo = lines.join('\n');
  }
  
  // Obtener templates
  const userTemplate = getAIPrompt('chatAssistant', lang, 'user');
  const systemTemplate = getAIPrompt('chatAssistant', lang, 'system');
  
  // Interpolar variables
  const userPrompt = interpolatePrompt(userTemplate, { userMessage });
  const systemPrompt = interpolatePrompt(systemTemplate, { contextInfo });
  
  return { userPrompt, systemPrompt };
}
