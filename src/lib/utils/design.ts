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

function getInitialDesignForm() {
  return {
    designInformation: {
      fileOrigin: '',
      applicationType: '',
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
      powerOfAttorney: null,
      designRepresentation: null,
      priorityDocument: null,
      noveltyStatement: null,
      otherDocuments: []
    }
  };
}

// Initial form data structure for design registration
export const designForm = writable(getInitialDesignForm());

export function resetDesignForm() {
  designForm.set(getInitialDesignForm());
  currentStep.set(0);
}
