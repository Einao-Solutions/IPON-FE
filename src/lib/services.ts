export interface IPService {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string | ((ipType?: string) => string);
  category: 'filing' | 'agent' | 'payment';
  price?: string;
  isCommon?: boolean; // Services available across all IP types
}

// Common services available for all IP types
export const commonServices: IPService[] = [
  {
    id: 'pre-registration',
    name: 'PRE-REGISTRATION',
    description: 'File new applications',
    icon: 'mdi:file',
    route: (ipType?: string) => {
      switch (ipType) {
        case 'design':
          return '/application?type=1';
        case 'trademark':
          return '/application?type=2';
        case 'patent':
          return '/patent';
        default:
          return '/application';
      }
    },
    category: 'filing',
    isCommon: true
  },
  {
    id: 'status-search',
    name: 'STATUS SEARCH',
    description: 'Search file status',
    icon: 'mdi:magnify',
    route: '/statussearch',
    category: 'filing',
    price: '₦9,500',
    isCommon: true
  },
  {
    id: 'availability-search',
    name: 'AVAILABILITY SEARCH',
    description: 'Search file availability',
    icon: 'mdi:file-search-outline',
    route: '/availabilitysearch',
    category: 'filing',
    price: '₦2,500',
    isCommon: true
  },
  {
    id: 'pay-certificate',
    name: 'PAY FOR CERTIFICATE',
    description: 'Pay for Certificate',
    icon: 'mdi:cash-fast',
    route: '/home/payment',
    category: 'filing',
    isCommon: true
  },
  {
    id: 'verify-payment',
    name: 'VERIFY PAYMENT',
    description: 'Verify Payments using RRR',
    icon: 'mdi:cash-sync',
    route: '/home/payment/verify',
    category: 'payment',
    isCommon: true
  },
  {
    id: 'change-agent',
    name: 'CHANGE OF AGENT',
    description: 'Request change of agent',
    icon: 'mdi:account-switch',
    route: '/home/agent/change',
    category: 'agent',
    isCommon: true
  },
  {
    id: 'print-documents',
    name: 'PRINT DOCUMENTS',
    description: 'Print application documents',
    icon: 'mdi:printer-outline',
    route: '/home/dashboard',
    category: 'agent',
    isCommon: true
  },
  {
    id: 'update-file',
    name: 'UPDATE FILE',
    description: 'Edit/Update files with status "Awaiting Search"',
    icon: 'mdi:update',
    route: '/home/update-files',
    category: 'agent',
    isCommon: true
  },
  {
    id: 'appeal',
    name: 'APPEAL',
    description: 'File Appeals',
    icon: 'mdi:file-document-refresh',
    route: '/home/appeal',
    category: 'filing',
    isCommon: true
  },
  {
    id: 'claim-files',
    name: 'CLAIM FILES',
    description: 'Claim files from previous system',
    icon: 'mdi:file-download',
    route: '/home/claim-files',
    category: 'agent',
    isCommon: true
  },
  {
    id: 'file-withdrawal',
    name: 'FILE WITHDRAWAL',
    description: 'Withdrawal process for all file types',
    icon: 'mdi:file-remove-outline',
    route: '/home/file-withdrawal',
    category: 'filing',
    price: '₦3,500',
    isCommon: true
  }
];

// Trademark-specific services with prices
export const trademarkServices: IPService[] = [
  // FILING CATEGORY
  {
    id: 'new-registration',
    name: 'NEW REGISTRATION',
    description: 'File new Trademark applications',
    icon: 'mdi:file-plus-outline',
    route: '/application?type=2',
    category: 'filing',
    price: '₦16,750'
  },
  {
    id: 'renewal',
    name: 'RENEWAL',
    description: 'Renew your trademark',
    icon: 'mdi:refresh',
    route: '/home/renewal',
    category: 'filing',
    price: '₦15,500'
  },
  {
    id: 'withdrawal',
    name: 'WITHDRAWAL',
    description: 'File to withdraw your trademark applications',
    icon: 'mdi:file-remove-outline',
    route: '/home/file-withdrawal',
    category: 'filing',
    price: '₦3,500'
  },
  {
    id: 'appeal',
    name: 'APPEAL',
    description: 'File an appeal',
    icon: 'mdi:gavel',
    route: '/home/appeal',
    category: 'filing',
    price: ''
  },
  {
    id: 'change-agent',
    name: 'CHANGE OF AGENT',
    description: 'Update agent information',
    icon: 'mdi:account-switch',
    route: '/home/agent/change',
    category: 'agent'
  },
  {
    id: 'claim-files',
    name: 'CLAIM FILES',
    description: 'Claim files from previous system',
    icon: 'mdi:file-download',
    route: '/home/claim-files',
    category: 'agent'
  },


  // PREREGISTRATION CATEGORY (formerly management)
  {
    id: 'clerical-update',
    name: 'CLERICAL UPDATE',
    description: 'Edit/Update existing applications',
    icon: 'mdi:file-edit-outline',
    route: '/home/clerical-update',
    category: 'agent',
    price: '₦2,000'
  },
  {
    id: 'update-file',
    name: 'EDIT/UPDATE FILE IN AWAITING SEARCH',
    description: 'Update file information for files in awaiting search status',
    icon: 'mdi:update',
    route: '/home/update-files',
    category: 'filing',
    price: ''
  },
  {
    id: 'update-publication-status',
    name: 'UPDATE PUBLICATION STATUS',
    description: 'Update publication status for trademark files',
    icon: 'mdi:newspaper-variant-outline',
    route: '/home/publications/publicationstatusupdate',
    category: 'agent',
    price: '₦5,000'
  },


  // SEARCH CATEGORY (reordered)
  {
    id: 'availability-search',
    name: 'AVAILABILITY SEARCH',
    description: 'Check trademark availability',
    icon: 'mdi:file-search-outline',
    route: '/availabilitysearch',
    category: 'filing',
    price: '₦2,500'
  },
  {
    id: 'trademark-journal',
    name: 'TRADEMARK JOURNAL',
    description: 'View trademark journal',
    icon: 'mdi:book-open-variant',
    route: '/home/trademarkpubs',
    category: 'agent',
    price: ''
  },
  {
    id: 'status-search',
    name: 'STATUS SEARCH',
    description: 'Application for the status of a Trademark',
    icon: 'mdi:magnify',
    route: '/statussearch',
    category: 'filing',
    price: '₦9,500'
  },


  // RECORDALS CATEGORY (formerly administrative)
  {
    id: 'change-applicant-name',
    name: 'CHANGE OF APPLICANT NAME',
    description: 'Update applicant name',
    icon: 'mdi:account-edit',
    route: '/home/change-applicant-name',
    category: 'filing',
    price: '₦11,500'
  },
  {
    id: 'change-applicant-address',
    name: 'CHANGE OF APPLICANT ADDRESS',
    description: 'Update applicant address',
    icon: 'mdi:map-marker-radius',
    route: '/home/change-applicant-address',
    category: 'filing',
    price: '₦11,500'
  },
  {
    id: 'merger',
    name: 'MERGER',
    description: 'Merge trademark applications',
    icon: 'mdi:merge',
    route: '/home/merger',
    category: 'filing',
    price: '₦18,500'
  },
  {
    id: 'assignment',
    name: 'ASSIGNMENT',
    description: 'Assign trademark rights',
    icon: 'mdi:account-switch',
    route: '/home/assignment',
    category: 'filing',
    price: '₦18,500'
  },
  {
    id: 'registered-user',
    name: 'REGISTERED USER',
    description: 'Manage registered users',
    icon: 'mdi:account-group',
    route: '/home/registered-user',
    category: 'filing',
    price: '₦18,500'
  },


  // FINANCIAL CATEGORY
  {
    id: 'pay-certificate',
    name: 'PAY FOR CERTIFICATE',
    description: 'Pay for registration certificate',
    icon: 'mdi:cash-fast',
    route: '/home/payment',
    category: 'filing',
    price: '₦11,500'
  },
  {
    id: 'verify-payment',
    name: 'VERIFY PAYMENT',
    description: 'Verify payments using RRR',
    icon: 'mdi:cash-sync',
    route: '/home/payment/verify',
    category: 'payment'
  },
  {
    id: 'print-documents',
    name: 'PRINT DOCUMENTS',
    description: 'Print Trademark documents',
    icon: 'mdi:printer-outline',
    route: '/home/dashboard',
    category: 'agent'
  },

];

// Patent-specific services
export const patentServices: IPService[] = [
  // FILING CATEGORY
  {
    id: 'pre-registration',
    name: 'NEW REGISTRATION',
    description: 'File new Patent applications',
    icon: 'mdi:file-plus-outline',
    route: '/application?type=0',
    category: 'filing',
    price: '',
    isCommon: true
  },
  {
    id: 'renewal-patent',
    name: 'RENEWAL',
    description: 'File Patent Recordal Applications',
    icon: 'mdi:refresh',
    route: '/home/postregistration',
    category: 'filing',
    price: ''
  },
  {
    id: 'file-withdrawal',
    name: 'WITHDRAWAL',
    description: 'Withdrawal process for patent files',
    icon: 'mdi:file-remove-outline',
    route: '/home/file-withdrawal',
    category: 'filing',
    price: '₦3,500',
    isCommon: true
  },
  {
    id: 'appeal',
    name: 'APPEAL',
    description: 'File Appeals',
    icon: 'mdi:gavel',
    route: '/home/appeal',
    category: 'filing',
    isCommon: true
  },
  {
    id: 'change-agent',
    name: 'CHANGE OF AGENT',
    description: 'Update agent information',
    icon: 'mdi:account-switch',
    route: '/home/agent/change',
    category: 'agent'
  },
  {
    id: 'update-patent-files',
    name: 'UPDATE PATENT FILES',
    description: 'File updates for all files filed before 25th August, 2025',
    icon: 'mdi:update',
    route: '/home/editpatentfiles',
    category: 'agent'
  },
  {
    id: 'claim-files',
    name: 'CLAIM FILES',
    description: 'Claim files from previous system',
    icon: 'mdi:file-download',
    route: '/home/claim-files',
    category: 'agent'
  },

  // PRE-REGISTRATION CATEGORY
  {
    id: 'clerical-update',
    name: 'CLERICAL UPDATE',
    description: 'Edit/Update existing patent application',
    icon: 'mdi:file-edit-outline',
    route: '/home/clerical-update',
    category: 'agent',
    price: '₦4,100'
  },
  {
    id: 'update-attachments',
    name: 'UPDATE FILE ATTACHMENTS',
    description: 'Make attachment updates for Patent files',
    icon: 'mdi:attachment',
    route: '/home/editattachments',
    category: 'agent'
  },


  // SEARCH CATEGORY
  {
    id: 'availability-search',
    name: 'AVAILABILITY SEARCH',
    description: 'Search file availability',
    icon: 'mdi:file-search-outline',
    route: '/availabilitysearch',
    category: 'filing',
    price: '₦2,500',
    isCommon: true
  },
  {
    id: 'status-search',
    name: 'STATUS SEARCH',
    description: 'Search file status',
    icon: 'mdi:magnify',
    route: '/statussearch',
    category: 'filing',
    price: '₦9,500',
    isCommon: true
  },


  // RECORDALS CATEGORY
  // {
  //   id: 'renewal-recordals-patent',
  //   name: 'RENEWAL',
  //   description: 'Patent renewal recordals',
  //   icon: 'mdi:refresh',
  //   route: '/home/postregistration',
  //   category: 'filing',
  //   price: ''
  // },


  // FINANCIAL CATEGORY
  {
    id: 'verify-payment',
    name: 'VERIFY PAYMENT',
    description: 'Verify payments using RRR',
    icon: 'mdi:cash-sync',
    route: '/home/payment/verify',
    category: 'payment',
    isCommon: true
  },

    {
    id: 'print-documents',
    name: 'PRINT DOCUMENTS',
    description: 'Print patent documents',
    icon: 'mdi:printer-outline',
    route: '/home/dashboard',
    category: 'agent'
  },

];

// Design-specific services
export const designServices: IPService[] = [
  // FILING CATEGORY
  {
    id: 'pre-registration',
    name: 'NEW REGISTRATION',
    description: 'File new Design applications',
    icon: 'mdi:file-plus-outline',
    route: '/application?type=1',
    category: 'filing',
    price: '',
    isCommon: true
  },
  {
    id: 'file-withdrawal',
    name: 'WITHDRAWAL',
    description: 'Withdrawal process for design files',
    icon: 'mdi:file-remove-outline',
    route: '/home/file-withdrawal',
    category: 'filing',
    price: '₦3,500',
    isCommon: true
  },
  {
    id: 'appeal',
    name: 'APPEAL',
    description: 'File Appeals',
    icon: 'mdi:gavel',
    route: '/home/appeal',
    category: 'filing',
    isCommon: true
  },
  {
    id: 'change-agent',
    name: 'CHANGE OF AGENT',
    description: 'Update agent information',
    icon: 'mdi:account-switch',
    route: '/home/agent/change',
    category: 'agent'
  },
  {
    id: 'claim-files',
    name: 'CLAIM FILES',
    description: 'Claim files from previous system',
    icon: 'mdi:file-download',
    route: '/home/claim-files',
    category: 'agent'
  },

  // PRE-REGISTRATION CATEGORY
  {
    id: 'update-attachments',
    name: 'UPDATE FILE ATTACHMENTS',
    description: 'Make attachment updates for Design files',
    icon: 'mdi:attachment',
    route: '/home/editattachments',
    category: 'agent'
  },


  // SEARCH CATEGORY
  {
    id: 'availability-search',
    name: 'AVAILABILITY SEARCH',
    description: 'Search file availability',
    icon: 'mdi:file-search-outline',
    route: '/availabilitysearch',
    category: 'filing',
    price: '₦2,500',
    isCommon: true
  },
  {
    id: 'status-search',
    name: 'STATUS SEARCH',
    description: 'Search file status',
    icon: 'mdi:magnify',
    route: '/statussearch',
    category: 'filing',
    price: '₦9,500',
    isCommon: true
  },
  {
    id: 'print-documents',
    name: 'PRINT DOCUMENTS',
    description: 'Print Design documents',
    icon: 'mdi:printer-outline',
    route: '/home/dashboard',
    category: 'agent'
  },


  // RECORDALS CATEGORY


  // FINANCIAL CATEGORY
  {
    id: 'verify-payment',
    name: 'VERIFY PAYMENT',
    description: 'Verify payments using RRR',
    icon: 'mdi:cash-sync',
    route: '/home/payment/verify',
    category: 'payment',
    isCommon: true
  },

];

export function getServicesForIPType(ipType: 'trademark' | 'patent' | 'design'): IPService[] {
  switch (ipType) {
    case 'trademark':
      return trademarkServices;
    case 'patent':
      return patentServices;
    case 'design':
      return designServices;
    default:
      return commonServices;
  }
}

export function getServicesByCategory(services: IPService[]) {
  return services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, IPService[]>);
}

export function resolveServiceRoute(service: IPService, ipType?: string): string {
  if (typeof service.route === 'function') {
    return service.route(ipType);
  }
  return service.route;
}

export function getServiceCount(ipType: 'trademark' | 'patent' | 'design'): number {
  return getServicesForIPType(ipType).length;
}