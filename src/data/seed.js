export const ACCOUNTS = [
  {
    "id": "1000",
    "name": "Business bank",
    "type": "asset"
  },
  {
    "id": "1100",
    "name": "Accounts receivable",
    "type": "asset"
  },
  {
    "id": "1200",
    "name": "GST input tax credits",
    "type": "asset"
  },
  {
    "id": "2000",
    "name": "Accounts payable",
    "type": "liability"
  },
  {
    "id": "2100",
    "name": "GST payable",
    "type": "liability"
  },
  {
    "id": "2110",
    "name": "PST payable",
    "type": "liability"
  },
  {
    "id": "3000",
    "name": "Owner equity",
    "type": "equity"
  },
  {
    "id": "3100",
    "name": "Owner draws",
    "type": "equity"
  },
  {
    "id": "4000",
    "name": "Contracting revenue",
    "type": "revenue"
  },
  {
    "id": "4010",
    "name": "Sauna revenue",
    "type": "revenue"
  },
  {
    "id": "5000",
    "name": "Materials",
    "type": "expense"
  },
  {
    "id": "5010",
    "name": "Subcontractors",
    "type": "expense"
  },
  {
    "id": "5020",
    "name": "Fuel & auto",
    "type": "expense"
  },
  {
    "id": "5030",
    "name": "Tools & supplies",
    "type": "expense"
  },
  {
    "id": "5040",
    "name": "Travel",
    "type": "expense"
  },
  {
    "id": "5050",
    "name": "Insurance",
    "type": "expense"
  },
  {
    "id": "5060",
    "name": "Office & software",
    "type": "expense"
  },
  {
    "id": "5070",
    "name": "Other business expense",
    "type": "expense"
  }
];

export const SEED = {
  "schemaVersion": 2,
  "activeBrandId": "jfe",
  "brands": [
    {
      "id": "jfe",
      "legalName": "John Forsyth Enterprises",
      "displayName": "J. Forsyth Enterprises",
      "division": "Contracting",
      "email": "",
      "phone": "",
      "website": "customcedarsaunas.com",
      "gstNumber": "",
      "pstNumber": "",
      "logoUri": null,
      "defaultPaymentTerms": "Due on receipt",
      "defaultPaymentInstructions": ""
    },
    {
      "id": "sauna",
      "legalName": "John Forsyth Enterprises",
      "displayName": "Custom Cedar Saunas",
      "division": "Custom Cedar Saunas",
      "email": "",
      "phone": "",
      "website": "customcedarsaunas.com",
      "gstNumber": "",
      "pstNumber": "",
      "logoUri": null,
      "defaultPaymentTerms": "50% deposit to begin procurement. Balance due before delivery unless otherwise stated.",
      "defaultPaymentInstructions": ""
    }
  ],
  "settings": {
    "labourRate": 0,
    "helperRate": 0,
    "mileageRate": 0,
    "defaultMaterialMarkupPct": 20,
    "estimateValidityDays": 30,
    "invoicePrefix": "INV",
    "estimatePrefix": "EST",
    "changePrefix": "CO",
    "requireReviewBeforeSend": true,
    "currency": "CAD",
    "gstRate": 0.05,
    "pstRate": 0.07
  },
  "customers": [],
  "jobs": [],
  "catalog": [],
  "vendors": [],
  "documents": [],
  "expenses": [],
  "mileage": [],
  "ledger": [],
  "bankTransactions": [],
  "receipts": [],
  "activity": []
};
