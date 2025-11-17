import type { PageLoad } from './$types';
import { applicationData, applicationMode, newApplicationType } from '$lib/store';
import { get } from 'svelte/store';
import { ApplicationStatuses, FilingType, FormApplicationTypes } from '$lib/helpers';
export const prerender = false;


export const load: PageLoad=({ url })=>{
	// Get the type parameter from URL
	const typeParam = url.searchParams.get('type');
	const applicationType = typeParam ? parseInt(typeParam) : null;
	
	// Set the application type in store
	if (applicationType !== null) {
		newApplicationType.set(applicationType);
	}
	
	// Set application mode to 2 for new applications (mode 1 is for editing)
	applicationMode.set(2);
	
	const appMode=get(applicationMode);
	if (appMode)
	{
		if (appMode===1)
		{
			// editing existing data
			const data=get(applicationData);
			return {
				fileData:data
			};
		}
		else {
			// creating new data
			applicationData.set(
				{
					id: "new-application",
					titleOfTradeMark: null,
					trademarkClass: null,
					trademarkClassDescription: null,
					filingCountry: null,
					fileOrigin: null,
					trademarkLogo: null,
					trademarkType: null,
					trademarkDisclaimer: null,
					lastRequestDate: null,
					lastRequest: null,
					titleOfDesign: null,
					type: applicationType || 1,
					fileStatus: null,
					statementOfNovelty: null,
					titleOfInvention: "",
					patentAbstract: "",
					applicants: [],
					priorityInfo: [],
					firstPriorityInfo: null,
					inventors: [],
					designCreators: null,
					correspondence: null,
					patentApplicationType: null,
					patentType: null,
					patentBaseType: null,
					designType: null,
					fileId: null,
					formApplicationType: FormApplicationTypes.NewApplication,
					attachments: [],
					creatorAccount: null,
					dateCreated: null,
					fieldStatus: null,
					registeredUsers: null,
					oppositions: null,
					applicationHistory: null
				}
			);

			return {
				fileData: null
			}
		}
	}
}
