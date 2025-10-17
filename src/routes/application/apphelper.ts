import pkg from 'deep-diff';
const diff = { pkg };
import { get } from 'svelte/store';
import { adjustmentsMade, applicationData, formsData, newDataApp } from '$lib/store';
import {
	type Applicant,
	ApplicationStatuses,
	type AttachmentType,
	type BasicFormType,
	type CorrespondenceType,
	FilingType,
	FormApplicationTypes,
	type Inventor, type PatentCreationData,
	type PatentData,
	type Priority
} from '$lib/helpers';
import { redirect } from '@sveltejs/kit';
import { set } from 'zod';
import { faker } from '@faker-js/faker';
import { getLocalTimeZone, today } from '@internationalized/date';
import { DesignTypes, mapDesignAttIntToString, mapPatentAttInToString, mapTradeAttInToString } from '$lib/designutils';
export function FindDeepDiff(saveDiff: boolean) {

	const data = get(formsData);
	const originalData = get(applicationData);
	const originalCopy: PatentData = { ...originalData };
	if (originalData?.type===0) {
		if (originalData != null && data != null) {
			// basic section
			const basic = data.filter((x) => x.name === 'basic')[0].data as BasicFormType;
			const inventors: Inventor[] | null =
				(data.find((x) => x.name === 'inventors')?.data as Inventor[]) ?? null;
			const applicants: Applicant[] | null =
				(data.find((x) => x.name === 'applicant')?.data as Applicant[]) ?? null;
			const correspondence: CorrespondenceType | null =
				(data.find((x) => x.name === 'correspondence')?.data as CorrespondenceType) ?? null;
			const priority: Priority[] | null =
				(data.find((x) => x.name === 'priority')?.data as Priority[]) ?? null;
			const parsedAtt: { name: string; url: string[] }[] = [];
			const attachments: AttachmentType[] | null =
				(data.find((x) => x.name === 'attachments')?.data as AttachmentType[]) ?? null;
			attachments?.forEach((x) => {
				const { type, data } = x;
				parsedAtt.push({ name: mapPatentAttInToString(type), url: data.map(x=>x.url) ! });
			});
			parsedAtt.sort((a, b) => a.name.localeCompare(b.name));
			originalCopy.attachments.sort((a, b) => a.name.localeCompare(b.name));
			originalCopy.inventors = inventors ?? originalCopy.inventors;
			originalCopy.applicants = applicants ?? originalCopy.applicants;
			const tempCorrId= originalCopy.correspondence.id;
			originalCopy.correspondence = correspondence ?? originalCopy.correspondence;
			originalCopy.correspondence.id=tempCorrId;
			originalCopy.priorityInfo = priority ?? originalCopy.priorityInfo;
			originalCopy.titleOfInvention = basic.title;
			originalCopy.patentType = basic.patentType;
			originalCopy.patentApplicationType = basic.patentApplicationType;
			originalCopy.patentAbstract = basic.abstract;
			originalCopy.attachments = parsedAtt.length >= 1 ? parsedAtt : originalCopy.attachments;

			const difference = diff.pkg(get(applicationData), originalCopy);
			if (difference) {
				console.log('the differneces are ', difference)
				const changesPosition: string[] = [];
				difference.forEach((y) => {
					if (y.path) {
						const groupKey = y.path[0];
						if (!changesPosition.find((x) => x === groupKey)) {
							changesPosition.push(groupKey);
						}
					}
				});
				newDataApp.set(originalCopy);
				adjustmentsMade.set(changesPosition);
				return changesPosition;
			} else {
				return false;
			}
		}
	}

	if(originalData?.type===1)
	{
		// design data
		if (originalData != null && data != null) {
			// basic section
			const basic = data.filter((x) => x.name === 'basic')[0].data as BasicFormType;
			const inventors: Inventor[] | null =
				(data.find((x) => x.name === 'inventors')?.data as Inventor[]) ?? null;
			const applicants: Applicant[] | null =
				(data.find((x) => x.name === 'applicant')?.data as Applicant[]) ?? null;
			const correspondence: CorrespondenceType | null =
				(data.find((x) => x.name === 'correspondence')?.data as CorrespondenceType) ?? null;
			const parsedAtt: { name: string; url: string[] }[] = [];
			const attachments: AttachmentType[] | null =
				(data.find((x) => x.name === 'attachments')?.data as AttachmentType[]) ?? null;
			attachments?.forEach((x) => {
				const { type, data } = x;
				parsedAtt.push({ name: mapDesignAttIntToString(type), url: data.map(x=>x.url) ! });
			});
			parsedAtt.sort((a, b) => a.name.localeCompare(b.name));
			originalCopy.attachments.sort((a, b) => a.name.localeCompare(b.name));
			originalCopy.designCreators = inventors ?? originalCopy.designCreators;
			originalCopy.applicants = applicants ?? originalCopy.applicants;
			const tempCorrId= originalCopy.correspondence.id;
			originalCopy.correspondence = correspondence ?? originalCopy.correspondence;
			originalCopy.correspondence.id=tempCorrId;
			originalCopy.titleOfDesign = basic.title;
			originalCopy.statementOfNovelty = basic.statementOfNovelty;
			originalCopy.designType = basic.designType;
			originalCopy.attachments = parsedAtt.length >= 1 ? parsedAtt : originalCopy.attachments;
			const difference = diff.pkg(get(applicationData), originalCopy);
			if (difference) {
				const changesPosition: string[] = [];
				difference.forEach((y) => {
					if (y.path) {
						const groupKey = y.path[0];
						if (!changesPosition.find((x) => x === groupKey)) {
							changesPosition.push(groupKey);
						}
					}
				});
				newDataApp.set(originalCopy);
				adjustmentsMade.set(changesPosition);
				return changesPosition;
			} else {
				return false;
			}
		}
	}
	if(originalData?.type===2)
	{
		// trademark data
		if (originalData != null && data != null) {
			// basic section
			const basic = data.filter((x) => x.name === 'basic')[0].data as BasicFormType;
			const applicants: Applicant[] | null =
				(data.find((x) => x.name === 'applicant')?.data as Applicant[]) ?? null;
			const correspondence: CorrespondenceType | null =
				(data.find((x) => x.name === 'correspondence')?.data as CorrespondenceType) ?? null;
			const parsedAtt: { name: string; url: string[] }[] = [];
			const attachments: AttachmentType[] | null =
				(data.find((x) => x.name === 'attachments')?.data as AttachmentType[]) ?? null;
			attachments?.forEach((x) => {
				const { type, data } = x;
				parsedAtt.push({ name: mapTradeAttInToString(type), url: data.map(x=>x.url) ! });
			});
			parsedAtt.sort((a, b) => a.name.localeCompare(b.name));
			originalCopy.attachments.sort((a, b) => a.name.localeCompare(b.name));
			originalCopy.applicants = applicants ?? originalCopy.applicants;
			const tempCorrId= originalCopy.correspondence.id;
			originalCopy.correspondence = correspondence ?? originalCopy.correspondence;
			originalCopy.correspondence.id=tempCorrId;
			originalCopy.titleOfTradeMark = basic.title;
			originalCopy.trademarkClass = basic.class;
			originalCopy.trademarkClassDescription = basic.description;
			originalCopy.trademarkLogo = basic.logo;
			originalCopy.trademarkType = basic.type;
			originalCopy.trademarkDisclaimer = basic.disclaimer;
			originalCopy.attachments = parsedAtt.length >= 1 ? parsedAtt : originalCopy.attachments;
			const difference = diff.pkg(get(applicationData), originalCopy);
			if (difference) {
				const changesPosition: string[] = [];
				difference.forEach((y) => {
					if (y.path) {
						const groupKey = y.path[0];
						if (!changesPosition.find((x) => x === groupKey)) {
							changesPosition.push(groupKey);
						}
					}
				});
				newDataApp.set(originalCopy);
				adjustmentsMade.set(changesPosition);
				return changesPosition;
			} else {
				return false;
			}
		}
	}
}

export function objsHasDiff(lhs: unknown, rhs: unknown) {
	return diff.pkg(lhs, rhs) !== undefined;
}

export function attachmentDiffs(lhs: unknown, rhs: unknown) {
	lhs=lhs.sort((a, b) => a.name.localeCompare(b.name));
	rhs=rhs.sort((a, b) => a.name.localeCompare(b.name));
	const diffs = diff.pkg(lhs, rhs);
	const names: string[] = [];
	if (diffs !== undefined) {
		diffs.forEach((x) => {
			names.push(lhs[x?.path[0]]?.name);
		});
	}
	return names;
}

export function mapAttToString(name: string): string {
	switch (name) {
		case 'patentDrawing':
			return 'Patent Drawing';
		case 'pdoc':
			return 'Priority Doc';
		case 'cs':
			return 'Claims and Specifications';
		case 'pct':
			return 'PCT Document';
		case 'any':
			return 'Other document';
		case 'form2':
			return 'Power of Attorney';
		case 'nov':return 'Novelty Statement';
		default:
			return '';
	}
}


export function FetchData(type:number) {
	const inventors:Inventor[] = [],
		applicants:Applicant[] = [],
		priority = [];
	for (let i = 0; i <= 10; i += 2) {
		inventors.push({
			id: 'Sample id',
			name: faker.person.fullName(),
			country: faker.location.country(),
			address:faker.location.streetAddress(),
			email:faker.internet.email(),
			phone:faker.phone.number(),
		});
		applicants.push({
			id: 'dasda',
			name: faker.company.name(),
			country: faker.location.country(),
			address:faker.location.streetAddress(),
			email:faker.internet.email(),
			phone:faker.phone.number(),
		});
		priority.push({
			id: 'sdasd',
			country: faker.location.country(),
			number: '1234,456',
			date: today(getLocalTimeZone()).toString()
		});
	}
	if (type===0) {
		const patentData: PatentCreationData = {
			type: FilingType.Patent,
			formApplicationType: FormApplicationTypes.NewApplication,
			status: ApplicationStatuses.AwaitingPayment,
			attachments: [
				{
					name: 'pct',
					url: [faker.internet.url()]
				},
				{
					name: 'cs',
					url: [faker.internet.url()]
				},
				{
					url: [faker.internet.url()],
					name: 'any'
				},
				{
					name: 'form2',
					url: [faker.internet.url()]
				},
				{
					name: 'pdoc',
					url: ['https://hacktest7184409098.blob.core.windows.net/fillings/gu1zcbmi.pdf']
				},
				{
					name: 'patentDrawing',
					url: ['https://hacktest7184409098.blob.core.windows.net/fillings/uh0m3p3g.png']
				}
			],
			inventors: inventors,
			patentType: 2,
			titleOfInvention: faker.lorem.lines(7),
			patentAbstract: faker.lorem.paragraph(20),
			correspondence: {
				id:"3425235435243543543",
				name: faker.company.name(),
				address: faker.location.streetAddress(),
				email: faker.internet.email(),
				phone: faker.phone.number(),
				state: faker.location.state()
			},
			priorityInfo: priority,
			applicants: applicants,

		};
		return patentData;
	}

	if (type===1)
	{
		const designData: PatentData = {
			type: FilingType.Design,
			formApplicationType: FormApplicationTypes.NewApplication,
			fileStatus: ApplicationStatuses.AwaitingPayment,
			designCreators: inventors,
			designType: DesignTypes.Textile,
			titleOfDesign: faker.lorem.lines(7),
			statementOfNovelty: faker.lorem.paragraph(20),
			correspondence: {
				id:"sample id",
				name: faker.company.name(),
				address: faker.location.streetAddress(),
				email: faker.internet.email(),
				phone: faker.phone.number(),
				state: faker.location.state()
			},
			applicants: applicants,
			attachments: [
				{
					name: 'pdoc',
					url: [faker.internet.url()]
				},
				{
					name: 'designs',
					url: [faker.internet.url(), faker.internet.url(), faker.internet.url()]
				},
				{
					url: [faker.internet.url()],
					name: 'nov'
				},
				{
					name: 'form2',
					url: [faker.internet.url()]
				}
			],
		};
		return designData;
	}
}

export function mapFieldToString(name:string)
{
	return name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
