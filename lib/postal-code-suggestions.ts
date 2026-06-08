export type PostalCodeSuggestion = {
  city: string;
  province: string;
  postalCodes: string[];
};

const suggestions: PostalCodeSuggestion[] = [
  { city: "A Coruna", province: "A Coruna", postalCodes: ["15001", "15002", "15003", "15004", "15005"] },
  { city: "Albacete", province: "Albacete", postalCodes: ["02001", "02002", "02003", "02004", "02005"] },
  { city: "Alicante", province: "Alicante", postalCodes: ["03001", "03002", "03003", "03004", "03005"] },
  { city: "Almeria", province: "Almeria", postalCodes: ["04001", "04002", "04003", "04004", "04005"] },
  { city: "Avila", province: "Avila", postalCodes: ["05001", "05002", "05003", "05004", "05005"] },
  { city: "Badajoz", province: "Badajoz", postalCodes: ["06001", "06002", "06003", "06004", "06005"] },
  { city: "Barcelona", province: "Barcelona", postalCodes: ["08001", "08002", "08003", "08004", "08005"] },
  { city: "Bilbao", province: "Bizkaia", postalCodes: ["48001", "48002", "48003", "48004", "48005"] },
  { city: "Burgos", province: "Burgos", postalCodes: ["09001", "09002", "09003", "09004", "09005"] },
  { city: "Caceres", province: "Caceres", postalCodes: ["10001", "10002", "10003", "10004", "10005"] },
  { city: "Cadiz", province: "Cadiz", postalCodes: ["11001", "11002", "11003", "11004", "11005"] },
  { city: "Castellon de la Plana", province: "Castellon", postalCodes: ["12001", "12002", "12003", "12004", "12005"] },
  { city: "Ceuta", province: "Ceuta", postalCodes: ["51001", "51002", "51003", "51004", "51005"] },
  { city: "Ciudad Real", province: "Ciudad Real", postalCodes: ["13001", "13002", "13003", "13004", "13005"] },
  { city: "Cordoba", province: "Cordoba", postalCodes: ["14001", "14002", "14003", "14004", "14005"] },
  { city: "Cuenca", province: "Cuenca", postalCodes: ["16001", "16002", "16003", "16004"] },
  { city: "Donostia", province: "Gipuzkoa", postalCodes: ["20001", "20002", "20003", "20004", "20005"] },
  { city: "Girona", province: "Girona", postalCodes: ["17001", "17002", "17003", "17004", "17005"] },
  { city: "Granada", province: "Granada", postalCodes: ["18001", "18002", "18003", "18004", "18005"] },
  { city: "Guadalajara", province: "Guadalajara", postalCodes: ["19001", "19002", "19003", "19004", "19005"] },
  { city: "Huelva", province: "Huelva", postalCodes: ["21001", "21002", "21003", "21004", "21005"] },
  { city: "Huesca", province: "Huesca", postalCodes: ["22001", "22002", "22003", "22004"] },
  { city: "Jaen", province: "Jaen", postalCodes: ["23001", "23002", "23003", "23004", "23005"] },
  { city: "Las Palmas de Gran Canaria", province: "Las Palmas", postalCodes: ["35001", "35002", "35003", "35004", "35005"] },
  { city: "Leon", province: "Leon", postalCodes: ["24001", "24002", "24003", "24004", "24005"] },
  { city: "Lleida", province: "Lleida", postalCodes: ["25001", "25002", "25003", "25004", "25005"] },
  { city: "Logrono", province: "La Rioja", postalCodes: ["26001", "26002", "26003", "26004", "26005"] },
  { city: "Lugo", province: "Lugo", postalCodes: ["27001", "27002", "27003", "27004"] },
  { city: "Madrid", province: "Madrid", postalCodes: ["28001", "28002", "28003", "28004", "28005"] },
  { city: "Malaga", province: "Malaga", postalCodes: ["29001", "29002", "29003", "29004", "29005"] },
  { city: "Melilla", province: "Melilla", postalCodes: ["52001", "52002", "52003", "52004", "52005"] },
  { city: "Murcia", province: "Murcia", postalCodes: ["30001", "30002", "30003", "30004", "30005"] },
  { city: "Ourense", province: "Ourense", postalCodes: ["32001", "32002", "32003", "32004", "32005"] },
  { city: "Oviedo", province: "Asturias", postalCodes: ["33001", "33002", "33003", "33004", "33005"] },
  { city: "Palencia", province: "Palencia", postalCodes: ["34001", "34002", "34003", "34004", "34005"] },
  { city: "Palma", province: "Illes Balears", postalCodes: ["07001", "07002", "07003", "07004", "07005"] },
  { city: "Pamplona", province: "Navarra", postalCodes: ["31001", "31002", "31003", "31004", "31005"] },
  { city: "Pontevedra", province: "Pontevedra", postalCodes: ["36001", "36002", "36003", "36004", "36005"] },
  { city: "Salamanca", province: "Salamanca", postalCodes: ["37001", "37002", "37003", "37004", "37005"] },
  { city: "Santa Cruz de Tenerife", province: "Santa Cruz de Tenerife", postalCodes: ["38001", "38002", "38003", "38004", "38005"] },
  { city: "Santander", province: "Cantabria", postalCodes: ["39001", "39002", "39003", "39004", "39005"] },
  { city: "Segovia", province: "Segovia", postalCodes: ["40001", "40002", "40003", "40004", "40005"] },
  { city: "Sevilla", province: "Sevilla", postalCodes: ["41001", "41002", "41003", "41004", "41005"] },
  { city: "Soria", province: "Soria", postalCodes: ["42001", "42002", "42003", "42004", "42005"] },
  { city: "Tarragona", province: "Tarragona", postalCodes: ["43001", "43002", "43003", "43004", "43005"] },
  { city: "Teruel", province: "Teruel", postalCodes: ["44001", "44002", "44003"] },
  { city: "Toledo", province: "Toledo", postalCodes: ["45001", "45002", "45003", "45004", "45005"] },
  { city: "Valencia", province: "Valencia", postalCodes: ["46001", "46002", "46003", "46004", "46005"] },
  { city: "Valladolid", province: "Valladolid", postalCodes: ["47001", "47002", "47003", "47004", "47005"] },
  { city: "Vitoria-Gasteiz", province: "Araba", postalCodes: ["01001", "01002", "01003", "01004", "01005"] },
  { city: "Zamora", province: "Zamora", postalCodes: ["49001", "49002", "49003", "49004", "49005"] },
  { city: "Zaragoza", province: "Zaragoza", postalCodes: ["50001", "50002", "50003", "50004", "50005"] },
  { city: "Alboraya", province: "Valencia", postalCodes: ["46120"] },
  { city: "Aldaia", province: "Valencia", postalCodes: ["46960"] },
  { city: "Alfafar", province: "Valencia", postalCodes: ["46910"] },
  { city: "Burjassot", province: "Valencia", postalCodes: ["46100"] },
  { city: "Catarroja", province: "Valencia", postalCodes: ["46470"] },
  { city: "Gandia", province: "Valencia", postalCodes: ["46701", "46702", "46730"] },
  { city: "Manises", province: "Valencia", postalCodes: ["46940"] },
  { city: "Mislata", province: "Valencia", postalCodes: ["46920"] },
  { city: "Paterna", province: "Valencia", postalCodes: ["46980"] },
  { city: "Torrent", province: "Valencia", postalCodes: ["46900"] },
  { city: "Xirivella", province: "Valencia", postalCodes: ["46950"] },
  { city: "Benidorm", province: "Alicante", postalCodes: ["03501", "03502", "03503"] },
  { city: "Elche", province: "Alicante", postalCodes: ["03201", "03202", "03203", "03204", "03205"] },
  { city: "Torrevieja", province: "Alicante", postalCodes: ["03181", "03182", "03183", "03184", "03185"] },
  { city: "Cartagena", province: "Murcia", postalCodes: ["30201", "30202", "30203", "30204", "30205"] },
  { city: "Lorca", province: "Murcia", postalCodes: ["30800"] },
  { city: "Molina de Segura", province: "Murcia", postalCodes: ["30500"] },
];

export function getPostalCodeSuggestions(city: string, province?: string) {
  const normalizedCity = normalizeLocation(city);
  const normalizedProvince = normalizeLocation(province ?? "");

  if (normalizedCity.length < 3) {
    return [];
  }

  const matches = suggestions.filter((suggestion) => normalizeLocation(suggestion.city) === normalizedCity);

  if (!normalizedProvince) {
    return matches;
  }

  const provinceMatches = matches.filter((suggestion) => normalizeLocation(suggestion.province) === normalizedProvince);
  return provinceMatches.length ? provinceMatches : matches;
}

export function normalizeLocation(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
