
import axios from "axios";

const metaToken = process.env.META_WHATSAPP_TOKEN;
const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID;

export async function sendWhatsAppMessageMeta(toNumber: string, message: string) {
  try {
    const formattedNumber = toNumber.startsWith("+") ? toNumber : `+91${toNumber}`;

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ WhatsApp (Meta) sent to", formattedNumber, "ID:", response.data.messages[0].id);
  } catch (error: any) {
    console.error("❌ Meta WhatsApp error:", error.response?.data || error.message);
  }
}
