/**
 * Utilidad de autocompletado de código postal español
 * Devuelve ciudad y provincia basándose en el código postal
 */

// Mapeo de prefijos de código postal a provincias españolas
const POSTAL_CODE_PROVINCES: Record<string, string> = {
  '01': 'Álava',
  '02': 'Albacete',
  '03': 'Alicante',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Islas Baleares',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'A Coruña',
  '16': 'Cuenca',
  '17': 'Girona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Guipúzcoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lleida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia',
  '47': 'Valladolid',
  '48': 'Vizcaya',
  '49': 'Zamora',
  '50': 'Zaragoza',
  '51': 'Ceuta',
  '52': 'Melilla',
};

// Mapeo de códigos postales específicos a ciudades principales
const POSTAL_CODE_CITIES: Record<string, string> = {
  // Madrid
  '28001': 'Madrid',
  '28002': 'Madrid',
  '28003': 'Madrid',
  '28004': 'Madrid',
  '28005': 'Madrid',
  '28006': 'Madrid',
  '28007': 'Madrid',
  '28008': 'Madrid',
  '28009': 'Madrid',
  '28010': 'Madrid',
  '28011': 'Madrid',
  '28012': 'Madrid',
  '28013': 'Madrid',
  '28014': 'Madrid',
  '28015': 'Madrid',
  '28016': 'Madrid',
  '28017': 'Madrid',
  '28018': 'Madrid',
  '28019': 'Madrid',
  '28020': 'Madrid',
  '28021': 'Madrid',
  '28022': 'Madrid',
  '28023': 'Madrid',
  '28024': 'Madrid',
  '28025': 'Madrid',
  '28026': 'Madrid',
  '28027': 'Madrid',
  '28028': 'Madrid',
  '28029': 'Madrid',
  '28030': 'Madrid',
  '28031': 'Madrid',
  '28032': 'Madrid',
  '28033': 'Madrid',
  '28034': 'Madrid',
  '28035': 'Madrid',
  '28036': 'Madrid',
  '28037': 'Madrid',
  '28038': 'Madrid',
  '28039': 'Madrid',
  '28040': 'Madrid',
  '28041': 'Madrid',
  '28042': 'Madrid',
  '28043': 'Madrid',
  '28044': 'Madrid',
  '28045': 'Madrid',
  '28046': 'Madrid',
  '28047': 'Madrid',
  '28048': 'Madrid',
  '28049': 'Madrid',
  '28050': 'Madrid',
  '28051': 'Madrid',
  '28052': 'Madrid',
  '28053': 'Madrid',
  '28054': 'Madrid',
  '28055': 'Madrid',
  // Barcelona
  '08001': 'Barcelona',
  '08002': 'Barcelona',
  '08003': 'Barcelona',
  '08004': 'Barcelona',
  '08005': 'Barcelona',
  '08006': 'Barcelona',
  '08007': 'Barcelona',
  '08008': 'Barcelona',
  '08009': 'Barcelona',
  '08010': 'Barcelona',
  '08011': 'Barcelona',
  '08012': 'Barcelona',
  '08013': 'Barcelona',
  '08014': 'Barcelona',
  '08015': 'Barcelona',
  '08016': 'Barcelona',
  '08017': 'Barcelona',
  '08018': 'Barcelona',
  '08019': 'Barcelona',
  '08020': 'Barcelona',
  '08021': 'Barcelona',
  '08022': 'Barcelona',
  '08023': 'Barcelona',
  '08024': 'Barcelona',
  '08025': 'Barcelona',
  '08026': 'Barcelona',
  '08027': 'Barcelona',
  '08028': 'Barcelona',
  '08029': 'Barcelona',
  '08030': 'Barcelona',
  '08031': 'Barcelona',
  '08032': 'Barcelona',
  '08033': 'Barcelona',
  '08034': 'Barcelona',
  '08035': 'Barcelona',
  '08036': 'Barcelona',
  '08037': 'Barcelona',
  '08038': 'Barcelona',
  '08039': 'Barcelona',
  '08040': 'Barcelona',
  '08041': 'Barcelona',
  '08042': 'Barcelona',
  // Valencia
  '46001': 'Valencia',
  '46002': 'Valencia',
  '46003': 'Valencia',
  '46004': 'Valencia',
  '46005': 'Valencia',
  '46006': 'Valencia',
  '46007': 'Valencia',
  '46008': 'Valencia',
  '46009': 'Valencia',
  '46010': 'Valencia',
  '46011': 'Valencia',
  '46012': 'Valencia',
  '46013': 'Valencia',
  '46014': 'Valencia',
  '46015': 'Valencia',
  '46016': 'Valencia',
  '46017': 'Valencia',
  '46018': 'Valencia',
  '46019': 'Valencia',
  '46020': 'Valencia',
  '46021': 'Valencia',
  '46022': 'Valencia',
  '46023': 'Valencia',
  '46024': 'Valencia',
  '46025': 'Valencia',
  '46026': 'Valencia',
  // Sevilla
  '41001': 'Sevilla',
  '41002': 'Sevilla',
  '41003': 'Sevilla',
  '41004': 'Sevilla',
  '41005': 'Sevilla',
  '41006': 'Sevilla',
  '41007': 'Sevilla',
  '41008': 'Sevilla',
  '41009': 'Sevilla',
  '41010': 'Sevilla',
  '41011': 'Sevilla',
  '41012': 'Sevilla',
  '41013': 'Sevilla',
  '41014': 'Sevilla',
  '41015': 'Sevilla',
  '41016': 'Sevilla',
  '41017': 'Sevilla',
  '41018': 'Sevilla',
  '41019': 'Sevilla',
  '41020': 'Sevilla',
  // Zaragoza
  '50001': 'Zaragoza',
  '50002': 'Zaragoza',
  '50003': 'Zaragoza',
  '50004': 'Zaragoza',
  '50005': 'Zaragoza',
  '50006': 'Zaragoza',
  '50007': 'Zaragoza',
  '50008': 'Zaragoza',
  '50009': 'Zaragoza',
  '50010': 'Zaragoza',
  '50011': 'Zaragoza',
  '50012': 'Zaragoza',
  '50013': 'Zaragoza',
  '50014': 'Zaragoza',
  '50015': 'Zaragoza',
  '50016': 'Zaragoza',
  '50017': 'Zaragoza',
  '50018': 'Zaragoza',
  // Málaga
  '29001': 'Málaga',
  '29002': 'Málaga',
  '29003': 'Málaga',
  '29004': 'Málaga',
  '29005': 'Málaga',
  '29006': 'Málaga',
  '29007': 'Málaga',
  '29008': 'Málaga',
  '29009': 'Málaga',
  '29010': 'Málaga',
  '29011': 'Málaga',
  '29012': 'Málaga',
  '29013': 'Málaga',
  '29014': 'Málaga',
  '29015': 'Málaga',
  '29016': 'Málaga',
  '29017': 'Málaga',
  '29018': 'Málaga',
  // Bilbao
  '48001': 'Bilbao',
  '48002': 'Bilbao',
  '48003': 'Bilbao',
  '48004': 'Bilbao',
  '48005': 'Bilbao',
  '48006': 'Bilbao',
  '48007': 'Bilbao',
  '48008': 'Bilbao',
  '48009': 'Bilbao',
  '48010': 'Bilbao',
  '48011': 'Bilbao',
  '48012': 'Bilbao',
  '48013': 'Bilbao',
  '48014': 'Bilbao',
  '48015': 'Bilbao',
  // San Sebastián
  '20001': 'San Sebastián',
  '20002': 'San Sebastián',
  '20003': 'San Sebastián',
  '20004': 'San Sebastián',
  '20005': 'San Sebastián',
  '20006': 'San Sebastián',
  '20007': 'San Sebastián',
  '20008': 'San Sebastián',
  '20009': 'San Sebastián',
  '20010': 'San Sebastián',
  '20011': 'San Sebastián',
  '20012': 'San Sebastián',
  '20013': 'San Sebastián',
  '20014': 'San Sebastián',
  '20015': 'San Sebastián',
  '20016': 'San Sebastián',
  '20017': 'San Sebastián',
  '20018': 'San Sebastián',
  // Otras ciudades importantes
  '03001': 'Alicante',
  '04001': 'Almería',
  '06001': 'Badajoz',
  '09001': 'Burgos',
  '10001': 'Cáceres',
  '11001': 'Cádiz',
  '12001': 'Castellón de la Plana',
  '13001': 'Ciudad Real',
  '14001': 'Córdoba',
  '15001': 'A Coruña',
  '16001': 'Cuenca',
  '17001': 'Girona',
  '18001': 'Granada',
  '19001': 'Guadalajara',
  '21001': 'Huelva',
  '22001': 'Huesca',
  '23001': 'Jaén',
  '24001': 'León',
  '25001': 'Lleida',
  '26001': 'Logroño',
  '27001': 'Lugo',
  '30001': 'Murcia',
  '31001': 'Pamplona',
  '32001': 'Ourense',
  '33001': 'Oviedo',
  '34001': 'Palencia',
  '35001': 'Las Palmas de Gran Canaria',
  '36001': 'Pontevedra',
  '37001': 'Salamanca',
  '38001': 'Santa Cruz de Tenerife',
  '39001': 'Santander',
  '40001': 'Segovia',
  '42001': 'Soria',
  '43001': 'Tarragona',
  '44001': 'Teruel',
  '45001': 'Toledo',
  '47001': 'Valladolid',
  '49001': 'Zamora',
  '01001': 'Vitoria-Gasteiz',
  '07001': 'Palma de Mallorca',
  '51001': 'Ceuta',
  '52001': 'Melilla',
};

export interface PostalCodeResult {
  city: string | null;
  province: string | null;
  isValid: boolean;
}

/**
 * Busca la ciudad y provincia basándose en un código postal español
 * @param postalCode Código postal de 5 dígitos
 * @returns Objeto con ciudad, provincia y validez
 */
export function lookupPostalCode(postalCode: string): PostalCodeResult {
  // Limpiar y validar el código postal
  const cleanCode = postalCode.replace(/\s/g, '');
  
  if (!/^\d{5}$/.test(cleanCode)) {
    return { city: null, province: null, isValid: false };
  }
  
  const prefix = cleanCode.substring(0, 2);
  const province = POSTAL_CODE_PROVINCES[prefix];
  
  if (!province) {
    return { city: null, province: null, isValid: false };
  }
  
  // Buscar ciudad específica
  const city = POSTAL_CODE_CITIES[cleanCode] || null;
  
  return {
    city,
    province,
    isValid: true,
  };
}

/**
 * Valida si un código postal español es válido
 * @param postalCode Código postal a validar
 * @returns true si es válido
 */
export function isValidSpanishPostalCode(postalCode: string): boolean {
  const cleanCode = postalCode.replace(/\s/g, '');
  
  if (!/^\d{5}$/.test(cleanCode)) {
    return false;
  }
  
  const prefix = cleanCode.substring(0, 2);
  return prefix in POSTAL_CODE_PROVINCES;
}

/**
 * Obtiene todas las provincias españolas
 * @returns Array de provincias ordenadas alfabéticamente
 */
export function getSpanishProvinces(): string[] {
  return [...new Set(Object.values(POSTAL_CODE_PROVINCES))].sort();
}

/**
 * Obtiene el prefijo de código postal para una provincia
 * @param province Nombre de la provincia
 * @returns Prefijo de código postal o null
 */
export function getPostalCodePrefix(province: string): string | null {
  const normalizedProvince = province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [prefix, prov] of Object.entries(POSTAL_CODE_PROVINCES)) {
    const normalizedProv = prov.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalizedProv === normalizedProvince) {
      return prefix;
    }
  }
  
  return null;
}
