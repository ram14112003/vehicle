import axios from 'axios';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY!;
const TWOFACTOR_SENDER_ID = process.env.TWOFACTOR_SENDER_ID!; // 6-char DLT sender ID

export async function sendTransactionalSms(to: string, message: string) {
  const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/ADDON_SERVICES/SEND/TSMS`;
  const payload = { From: TWOFACTOR_SENDER_ID, To: to, Msg: message };
  const { data } = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
  return data; // throws on network/axios error; otherwise returns 2Factor response
}
