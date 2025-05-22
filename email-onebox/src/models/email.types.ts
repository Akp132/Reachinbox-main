export type EmailCategory =
  | "Interested"
  | "Meeting Booked"
  | "Not Interested"
  | "Spam"
  | "Out of Office"
  | "Unlabelled";

  export interface EmailDoc {
    id: string;
    account: string;
    folder: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    text: string;
    labels: {
      ai: EmailCategory;
    };
  }
