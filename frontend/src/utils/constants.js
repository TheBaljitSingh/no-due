export const siteAnalysis = [
    { name: "Faster Payment Recovery", data: "90%" },
    { name: "Return on Investment",    data: "10X" },
    { name: "Happy Customers",         data: "500+" },
];

export const PricingModel = [
    {
        name: 'Free',
        pricing: 0,
        description: 'Get an experience on what we have to offer',
        features: ["Up to 5 WhatsApp messages",  "Basic analytics" , "introduction"],
        current: true

    },
    {
        name: 'Starter',
        pricing: 499,
        description: 'Perfect for small businesses and freelancers',
        features: ["Up to 100 WhatsApp messages", "Basic voice call automation", "5 custom templates", "Email support", "Basic analytics"],
        current: false
    },
    {
        name: 'Growth',
        pricing: 999,
        description: 'Most popular for growing businesses',
        features: ["Up to 500 WhatsApp messages", "Advanced voice automation", "Unlimited custom templates","Priority support", "Advanced analytics","API integrations","Custom branding"],
        current: false
    },
    {
        name: 'Business',
        pricing: 1999,
        description: 'For established businesses with high volume',
        features: ["Up to 2,000 WhatsApp messages", "AI-powered voice calls", "Unlimited everything", "24/7 phone support", "Enterprise analytics", "CRM integrations", "White-label solution", "Dedicated account manager"],
        current: false
    },
    {
        name: 'Enterprise',
        description: 'Tailored solutions for large organizations',
        features: ["Unlimited messages", "Custom AI training", "Multi-language support", "On-premise deployment", "SLA guarantees", "Custom integrations", "Enterprise security", "Training & onboarding"],
        current: false
    }
]

export const getCurrentPlan = PricingModel.find(price => price.current === true)

export const reasons = [
    {
        reason: 'Manual follow-ups take hours',
        description: 'Your team spends countless hours chasing payments instead of growing your business'
    },
    {
        reason: 'Customers ignore reminders',
        description: 'Traditional emails and calls are easily overlooked or forgotten'
    },
    {
        reason: 'Staff costs increase',
        description: 'Hiring more people to handle payment follow-ups drains your resources'
    },
    {
        reason: 'Cash flow suffers',
        description: 'Late payments create cash flow issues that impact your business growth'
    }
]

export const features = [
    {
        feature: 'WhatsApp Reminders',
        description: 'Automated, personalized WhatsApp messages that customers actually read and respond to'
    },
    {
        feature: 'Voice Call Automation',
        description: 'AI-powered voice calls that follow up politely and professionally on your behalf'
    },
    {
        feature: 'Custom Templates',
        description: 'Pre-built message templates that you can customize for your business tone and style'
    },
    {
        feature: 'Dashboard & Reports',
        description: 'Real-time analytics showing payment recovery rates, customer responses, and ROI'
    }
]


export const SidebarFeatures = [
    // {
    //     name : "Dashboard",
    //     icon : 'DashboardIcon',
    //     path: "dashboard"
    // },
    {
        name : "Customer Master",
        icon : "CustomerIcon",
        path: "customer-master"
    },
    {
        name: "Upload Center",
        icon : "UploadIcon",
        path: "upload-center"
    },
    {
        name: "Reminder Management",
        icon : "ReminderIcon",
        path: "reminder-management"
    },
    {
        name: "Reminder History",
        icon : "HistoryIcon",
        path: "reminder-history"
    },
   
  ]

export const SideBarCTC = [
    {
        name: "Subscription & Billing",
        icon : "SubscriptionIcon",
        path: "subscriptions"
    },
    // {
    //     name: "Documentation",
    //     icon : "BookIcon",
    //     path: "documentaion"
    // },
    {
        name: "Help",
        icon : "HelpIcon",
        path: "help"
    },
  ]

export const TableHeaders = ["Customer Id", "Customer Name", "Company Name" ,  "Phone Number" , "Due", "LastReminder", "Status", "Actions"]

export const seedCustomers = [
  {
    id: "CUST-1001",
    name: "Arjun Mehta",
    company: "Mehta Traders",
    mobile: "+91 98765 43210",
    email: "arjun@mehtatraders.com",
    due: 75000,
    overdue: 75000,
    lastReminder: "2025-10-10",
    feedback: "Will pay in 3 days",
    status: "Overdue",
    gender: "male"
  },
  {
    id: "CUST-1002",
    name: "Tanmay Shah",
    company: "Tanmay Foods",
    mobile: "+91 99988 11223",
    email: "tanmay@tanmayfoods.in",
    due: 120000,
    overdue: 0,
    lastReminder: "2025-10-13",
    feedback: "Paid",
    status: "Paid",
    gender: "male"
  },
  {
    id: "CUST-1003",
    name: "Neha Agarwal",
    company: "Agarwal Logistics",
    mobile: "+91 98201 33445",
    email: "neha@agarwallogi.com",
    due: 54000,
    overdue: 12000,
    lastReminder: "2025-10-12",
    feedback: "No response",
    status: "Pending",
    gender: "female"
  },
  {
    id: "CUST-1004",
    name: "Karan Gupta",
    company: "KPG Retail",
    mobile: "+91 98101 77889",
    email: "karan@kpgretail.com",
    due: 22000,
    overdue: 0,
    lastReminder: "2025-10-09",
    feedback: "Requested invoice",
    status: "Pending",
    gender: "male"
  },
  {
    id: "CUST-1005",
    name: "Riya Verma",
    company: "Verma Chemicals",
    mobile: "+91 99000 11223",
    email: "riya@vermachem.com",
    due: 88000,
    overdue: 28000,
    lastReminder: "2025-10-15",
    feedback: "Call back tomorrow",
    status: "Overdue",
    gender: "female"
  }, 
];

export const MOCK_REMINDERS = [
  {
    id: "RM-101",
    customer: { id: "CUST-1001", name: "Arjun Mehta", company: "Mehta Traders" },
    channel: ["whatsapp"],
    dueAmount: 75000,
    status: "scheduled",
    sendAt: "2025-10-26T10:00:00+05:30",
    lastResult: null,
    template: "gentle_due_1",
  },
  {
    id: "RM-102",
    customer: { id: "CUST-1003", name: "Neha Agarwal", company: "Agarwal Logistics" },
    channel: ["voice", "whatsapp"],
    dueAmount: 54000,
    status: "sent",
    sendAt: "2025-10-20T17:00:00+05:30",
    lastResult: { delivered: true, response: "Will pay in 3 days" },
    template: "firm_overdue_call",
  },
  {
    id: "RM-103",
    customer: { id: "CUST-1005", name: "Riya Verma", company: "Verma Chemicals" },
    channel: ["voice"],
    dueAmount: 88000,
    status: "failed",
    sendAt: "2025-10-21T11:30:00+05:30",
    lastResult: { delivered: false, response: "No answer" },
    template: "gentle_due_1",
  },
  {
    id: "RM-104",
    customer: { id: "CUST-1002", name: "Tanmay Shah", company: "Tanmay Foods" },
    channel: ["whatsapp"],
    dueAmount: 120000,
    status: "scheduled",
    sendAt: "2025-10-27T14:00:00+05:30",
    lastResult: null,
    template: "gentle_due_1",
  },
  {
    id: "RM-105",
    customer: { id: "CUST-1004", name: "Karan Gupta", company: "KPG Retail" },
    channel: ["whatsapp", "voice"],
    dueAmount: 22000,
    status: "sent",
    sendAt: "2025-10-22T09:00:00+05:30",
    lastResult: { delivered: true, response: "Requested invoice" },
    template: "gentle_due_1",
  },
];

export const TEMPLATES = {
  gentle_due_1: {
    label: "Gentle Reminder (Due Soon)",
    body: "Hi {{name}}, just a kind reminder that your payment of ₹{{amount}} is due on {{due_date}}. You can pay here: {{payment_link}}. Thank you!",
    channels: ["whatsapp"],
  },
  firm_overdue_call: {
    label: "Firm Follow‑up (Overdue)",
    body: "Hello {{name}}, this is a quick follow‑up regarding your overdue payment of ₹{{amount}}. Please complete the payment today. Press 1 to receive the link via WhatsApp.",
    channels: ["voice", "whatsapp"],
  },
};


export const CustomerNames = seedCustomers.map(customer => ({
    id: customer.id,
    name: customer.name,
    gender: customer.gender
  }));
  
export const CustomerDetailsMap  = (name) =>  {
    return seedCustomers.find(customer => customer.name === name);
}

export const notificationData = [
    {
      name: "System Admin",
      msg: "Your subscription has been successfully renewed.",
      time: "a few moments ago",
      img: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
    },
    {
      name: "Accounts Department",
      msg: "New reminder added for invoice settlement due on Oct 25.",
      time: "10 minutes ago",
      img: "https://cdn-icons-png.flaticon.com/512/4359/4359963.png",
    },
    {
      name: "Document Manager",
      msg: "Uploaded file ‘Q3_Report.pdf’ verified successfully.",
      time: "44 minutes ago",
      img: "https://cdn-icons-png.flaticon.com/512/9131/9131546.png",
    },
    {
      name: "System Admin",
      msg: "Your password was changed successfully.",
      time: "1 hour ago",
      img: "https://cdn-icons-png.flaticon.com/512/9131/9131532.png",
    },
    {
      name: "Reminder Service",
      msg: "Upcoming reminder: Vendor Payment due tomorrow.",
      time: "3 hours ago",
      img: "https://cdn-icons-png.flaticon.com/512/4359/4359983.png",
    },
  ];
  