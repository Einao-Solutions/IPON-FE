import type { PageLoad } from './$types';
import { applicationData, applicationMode } from '$lib/store';
import { get } from 'svelte/store';
import { ApplicationStatuses, FilingType, FormApplicationTypes } from '$lib/helpers';
export const prerender = true;


export const load: PageLoad=()=>{
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
					id: "asfasdf",
					titleOfInvention:"",
					patentAbstract:"",
					applicants: [],
					priorityInfo: [],
					inventors:[],
					correspondence:null,
					patentType: null,
					fileNumber: null,
					formApplicationType: FormApplicationTypes.NewApplication,
					status: ApplicationStatuses.AwaitingPayment,
					type: FilingType.Patent,
					attachments:[]
				}
			);

			return {
				fileData: null
			}
		}
	}
}
