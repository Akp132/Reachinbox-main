import { Groq } from "groq-sdk";
import { logger } from "./logger";
import { EmailCategory } from "../models/email.types";
import { env } from "../config/env";

const groq = new Groq({
  apiKey: env.groqApiKey, // Ensure this is set in your .env file
});

export async function categorizeEmail(text: string): Promise<EmailCategory> {
  try {
    // Trim header noise and keep only subject + top content
    const cleanedText = text
      .split("\r\n\r\n") // Split header and body
      .slice(1) // Drop header
      .join("\n")
      .slice(0, 1000); // Limit to 1000 chars for performance

    const prompt = `
    
    You are a highly accurate AI email classification model. Your task is to read the preview of an email and classify it into exactly one of the following categories:

- **Interested**: The sender is positively engaged, shows willingness to proceed, or expresses interest in the opportunity.
- **Meeting Booked**: The sender confirms a specific time or link for a scheduled meeting, interview, or call.
- **Not Interested**: The sender politely declines or expresses disinterest in continuing the conversation.
- **Spam**: The email is promotional, irrelevant, unsolicited, or bulk marketing content.
- **Out of Office**: The email is an automated reply or informs the sender is temporarily unavailable due to vacation, leave, or travel.

Always respond with one **and only one** of the above labels.

### Examples:

**Email Preview:**  
"Hi, this sounds great. Lets discuss further. Can we speak this week?"  
**Label:** Interested

**Email Preview:**  
"Ive scheduled a call for Tuesday at 3 PM. Heres the link: meet.google.com/abc-defg."  
**Label:** Meeting Booked

**Email Preview:**  
"Thanks for reaching out, but Im not looking for new opportunities at this time."  
**Label:** Not Interested

**Email Preview:**  
"Big discounts on jobs! Apply to 100+ roles from top companies like Amazon & Paytm now!"  
**Label:** Spam

**Email Preview:**  
"I am currently out of the office and will return on Monday, May 27. Please contact my colleague in the meantime."  
**Label:** Out of Office

Now, based on the following email preview, provide only the correct **label** from the list:

`.trim();

    logger.info({ preview: cleanedText }, "🧠 Categorizing email...");

    const response = await groq.chat.completions.create({
      model: "llama3-70b-8192", // Default free Groq model
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nMessage:\n${cleanedText}`,
        },
      ],
    });

    const labelRaw = response.choices?.[0]?.message?.content?.trim();

    logger.info({ response: labelRaw }, "✅ Raw model response");

    const label = (labelRaw ?? "").toLowerCase();

    await new Promise((res) => setTimeout(res, 1200)); // ⏳ throttle here

    if (label.includes("interested")) return "Interested";
    if (label.includes("not interested")) return "Not Interested";
    if (label.includes("spam")) return "Spam";
    if (label.includes("out of office")) return "Out of Office";
    if (label.includes("meeting booked")) return "Meeting Booked";

    return "Unlabelled";
  } catch (err: any) {
    logger.error({ err }, "❌ Error during email categorization");
    return "Unlabelled";
  }
}