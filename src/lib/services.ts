export interface IPService {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string | ((ipType?: string) => string);
  category: 'filing' | 'search' | 'management' | 'financial' | 'administrative';
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
    category: 'search',
    isCommon: true
  },
  {
    id: 'availability-search',
    name: 'AVAILABILITY SEARCH',
    description: 'Search file availability',
    icon: 'mdi:file-search-outline',
    route: '/availabilitysearch',
    category: 'search',
    isCommon: true
  },
  {
    id: 'pay-certificate',
    name: 'PAY FOR CERTIFICATE',
    description: 'Pay for Certificate',
    icon: 'mdi:cash-fast',
    route: '/home/payment',
    category: 'financial',
    isCommon: true
  },
  {
    id: 'verify-payment',
    name: 'VERIFY PAYMENT',
    description: 'Verify Payments using RRR',
    icon: 'mdi:cash-sync',
    route: '/home/payment/verify',
    category: 'financial',
    isCommon: true
  },
  {
    id: 'change-agent',
    name: 'CHANGE OF AGENT',
    description: 'Request change of agent',
    icon: 'mdi:account-switch',
    route: '/home/agent/change',
    category: 'administrative',
    isCommon: true
  },
  {
    id: 'print-documents',
    name: 'PRINT DOCUMENTS',
    description: 'Print application documents',
    icon: 'mdi:printer-outline',
    route: '/home/documents/print',
    category: 'administrative',
    isCommon: true
  },
  {
    id: 'update-file',
    name: 'UPDATE FILE',
    description: 'Edit/Update files with status "Awaiting Search"',
    icon: 'mdi:update',
    route: '/home/update-files',
    category: 'management',
    isCommon: true
  },
  {
    id: 'appeal',
    name: 'APPEAL',
    description: 'File Appeals',
    icon: 'mdi:file-document-refresh',
    route: '/home/appeal',
    category: 'management',
    isCommon: true
  },
  {
    id: 'claim-files',
    name: 'CLAIM FILES',
    description: 'Claim files from previous system',
    icon: 'mdi:file-download',
    route: '/home/claim-files',
    category: 'administrative',
    isCommon: true
  },
  {
    id: 'file-withdrawal',
    name: 'FILE WITHDRAWAL',
    description: 'Withdrawal process for all file types',
    icon: 'mdi:file-remove-outline',
    route: '/home/file-withdrawal',
    category: 'management',
    isCommon: true
  }
];

// Trademark-specific services
export const trademarkServices: IPService[] = [
  ...commonServices,
  {
    id: 'clerical-update',
    name: 'CLERICAL UPDATE',
    description: 'Edit/Update existing trademark application',
    icon: 'mdi:file-edit-outline',
    route: '/home/clerical-update',
    category: 'management'
  },
  {
    id: 'trademark-journal',
    name: 'TRADEMARK JOURNAL',
    description: 'View trademarks in publication',
    icon: 'mdi:file',
    route: '/home/trademarkpubs',
    category: 'search'
  },
  {
    id: 'post-registration',
    name: 'POST-REGISTRATION',
    description: 'File Recordal Applications',
    icon: 'mdi:file',
    route: '/home/postregistration',
    category: 'filing'
  },
  {
    id: 'publication-status-update',
    name: 'PUBLICATION STATUS UPDATE',
    description: 'File for publication status updates for Trademark files in Publication',
    icon: 'mdi:newspaper-variant-outline',
    route: '/home/publications/publicationstatusupdate',
    category: 'management'
  }
];

// Patent-specific services
export const patentServices: IPService[] = [
  ...commonServices,
  {
    id: 'clerical-update',
    name: 'CLERICAL UPDATE',
    description: 'Edit/Update existing patent application',
    icon: 'mdi:file-edit-outline',
    route: '/home/clerical-update',
    category: 'management'
  },
  {
    id: 'post-registration',
    name: 'POST-REGISTRATION',
    description: 'File Patent Recordal Applications',
    icon: 'mdi:file',
    route: '/home/postregistration',
    category: 'filing'
  },
  {
    id: 'update-patent-files',
    name: 'UPDATE PATENT FILES',
    description: 'File updates for all files filed before 25th August, 2025',
    icon: 'mdi:update',
    route: '/home/editpatentfiles',
    category: 'management'
  },
  {
    id: 'update-attachments',
    name: 'UPDATE FILE ATTACHMENTS',
    description: 'Make attachment updates for Patent files',
    icon: 'mdi:update',
    route: '/home/editattachments',
    category: 'management'
  }
];

// Design-specific services
export const designServices: IPService[] = [
  ...commonServices,
  {
    id: 'clerical-update',
    name: 'CLERICAL UPDATE',
    description: 'Edit/Update existing design application',
    icon: 'mdi:file-edit-outline',
    route: '/home/clerical-update',
    category: 'management'
  },
  {
    id: 'post-registration',
    name: 'POST-REGISTRATION',
    description: 'File Design Recordal Applications',
    icon: 'mdi:file',
    route: '/home/postregistration',
    category: 'filing'
  },
  {
    id: 'update-attachments',
    name: 'UPDATE FILE ATTACHMENTS',
    description: 'Make attachment updates for Design files',
    icon: 'mdi:update',
    route: '/home/editattachments',
    category: 'management'
  }
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