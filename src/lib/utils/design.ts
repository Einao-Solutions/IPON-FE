import { writable } from 'svelte/store';

// Step names for design registration
export const steps = [
  'Design Information',
  'Applicants Information',
  'Creators Information',
  'Priority Information',
  'Correspondence Information',
  'Attachments',
  'Review and Submit'
];

// Store for current step index
export const currentStep = writable(0);

// Initial form data structure for design registration
export const designForm = writable({
  designInformation: {
    fileOrigin: '', // Local, Foreign
    applicationType: '', // Textile, Non-Textile, Label, Container, Others, Sachets
    title: '',
    statementOfNovelty: ''
  },
  applicants: [
    {
      name: '',
      email: '',
      phone: '',
      nationality: '',
      state: '',
      address: '',
      city: ''
    }
  ],
  creators: [
    {
      name: '',
      email: '',
      phone: '',
      nationality: '',
      state: '',
      address: '',
      city: ''
    }
  ],
  priorities: [
    {
      applicationNumber: '',
      country: '',
      date: ''
    }
  ],
  correspondence: {
    name: '',
    email: '',
    phone: '',
    nationality: 'Nigeria',
    state: '',
    address: ''
  },
  attachments: {
    powerOfAttorney: null, // required
    designRepresentation: null, // required
    priorityDocument: null, // required if priority info provided
    otherDocuments: [] // up to 4
  }
});
