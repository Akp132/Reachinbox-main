import { ChromaClient } from 'chromadb';

const chroma = new ChromaClient();

async function seedChroma() {
  const collection = await chroma.getOrCreateCollection({
    name: 'reply-prompts',
  });

  const examples = [
    {
      id: '1',
      document: 'Hi, Your resume has been shortlisted. When will be a good time for you to attend the technical interview?',
      metadata: {
        intent: 'interview',
        reply: 'Thank you for shortlisting my resume. I’m happy to attend the technical interview. Please feel free to book a time that suits you here: https://cal.com/example',
      },
    },
    {
      id: '2',
      document: 'We received your application. We\'ll get back to you soon.',
      metadata: {
        intent: 'waiting',
        reply: 'Thank you for the update. Looking forward to hearing from you soon.',
      },
    },
    {
      id: '3',
      document: 'Can you send your updated resume and availability?',
      metadata: {
        intent: 'follow-up',
        reply: 'Sure! I’ve attached my updated resume. I’m available this week on Tuesday and Thursday afternoons.',
      },
    },
    {
      id: '4',
      document: 'Let’s connect for a quick chat regarding your background.',
      metadata: {
        intent: 'connect',
        reply: 'Happy to connect and discuss further. Let me know what time works for you or use this link to book directly: https://cal.com/example',
      },
    },
    {
      id: '5',
      document: 'This is a promotional offer from our company about Summer Shred Program.',
      metadata: {
        intent: 'spam',
        reply: 'No reply necessary.',
      },
    },
    {
      id: '6',
      document: 'Out of office reply: I am on vacation until next week.',
      metadata: {
        intent: 'ooo',
        reply: 'Noted, thank you for the update. I\'ll follow up once you\'re back.',
      },
    },
    {
      id: '7',
      document: 'Your application for the Technical Content Intern role has been submitted via Naukri.com.',
      metadata: {
        intent: 'job-portal-confirmation',
        reply: 'Thank you for confirming my application. I look forward to the next steps.',
      },
    },
    {
      id: '8',
      document: 'You have new job matches for software developer roles from LinkedIn.',
      metadata: {
        intent: 'job-alert',
        reply: 'Thanks for the job update. I’ll review the matches and apply to relevant ones.',
      },
    },
    {
      id: '9',
      document: 'Reminder: Upcoming campus placement drive for 2025 graduates.',
      metadata: {
        intent: 'campus-placement',
        reply: 'Thanks for the reminder. I’ll ensure my documents are ready for the placement drive.',
      },
    },
    {
      id: '10',
      document: 'IIITD: Final semester result declared. Check your portal for grades.',
      metadata: {
        intent: 'university-info',
        reply: 'Thank you for the update. I’ll check my grades and follow up if needed.',
      },
    },
    {
      id: '11',
      document: 'IIITD Admin: Last date to register for thesis presentation is 24th May.',
      metadata: {
        intent: 'academic-deadline',
        reply: 'Thank you for notifying me. I’ll complete my registration before the deadline.',
      },
    },
    {
      id: '12',
      document: 'New jobs posted from Capgemini Group. Explore and apply now.',
      metadata: {
        intent: 'job-portal-promotion',
        reply: 'Thanks for sharing. I’ll take a look and apply to roles that fit my interests.',
      },
    },
    {
      id: '13',
      document: 'Urgent Requirement for the role of Technical Content Developer, Intern – based on your Naukri profile',
      metadata: {
        intent: 'job-promo-naukri',
        reply: 'Thanks for the opportunity update. Please let me know if additional details or resume re-submission is required.',
      },
    },
    {
      id: '14',
      document: 'Explore 10+ Matching Jobs from Top IT/Tech Companies – Hirist',
      metadata: {
        intent: 'job-promo-hirist',
        reply: 'Appreciate the job matches. I’ll explore the options and apply accordingly.',
      },
    },
    {
      id: '15',
      document: 'Your LinkedIn job alert: “Software Engineer Intern” matches just posted',
      metadata: {
        intent: 'job-promo-linkedin',
        reply: 'Thanks for the alert. I’ll check out the new postings.',
      },
    },
  ];

  await collection.add({
    ids: examples.map((e) => e.id),
    documents: examples.map((e) => e.document),
    metadatas: examples.map((e) => e.metadata),
  });

  console.log('✅ Chroma collection created and seeded with job portal and university contexts.');
}

seedChroma();
