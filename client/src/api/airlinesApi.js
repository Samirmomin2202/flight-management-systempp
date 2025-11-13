import axios from 'axios';

const BASE = 'http://localhost:5000/api/airlines';

export async function listAirlines() {
  const res = await axios.get(BASE);
  return res.data.airlines || [];
}

export async function createAirline({ name, iataCode, country, logoFile, tailLogoFile, logoUrl, tailLogoUrl }) {
  const fd = new FormData();
  if (name) fd.append('name', name);
  if (iataCode) fd.append('iataCode', iataCode);
  if (country) fd.append('country', country);
  if (logoUrl) fd.append('logoUrl', logoUrl);
  if (tailLogoUrl) fd.append('tailLogoUrl', tailLogoUrl);
  if (logoFile) fd.append('logo', logoFile);
  if (tailLogoFile) fd.append('tailLogo', tailLogoFile);
  const res = await axios.post(BASE, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}
