import type { PageServerLoad } from '../../../../.svelte-kit/types/src/routes/$types';
import { type TicketMessage, TicketStates, type TicketSummary, type TicketType } from '$lib/helpers';
import { faker } from '@faker-js/faker';

export const load: PageServerLoad = () => {
	const tickets: TicketSummary[] = [];
	for (let i = 0; i < 50; i++) {
		tickets.push({
			id: faker.internet.ip(),
			closer: null,
			creationDate: faker.date.soon().toString().split('GMT')[0],
			lastInteraction: faker.date.soon().toString().split('GMT')[0],
			status: faker.helpers.arrayElement(Object.values(TicketStates)),
			creator: {
				id:"creator",
				name:faker.person.fullName()
			},
			// messages:[
			// 	{
			// 		date:faker.date.soon().toString().split('GMT')[0],
			// 		attachmentUrl:faker.internet.url(),
			// 		content:faker.lorem.paragraph(5),
			// 		id:faker.internet.ip(),
			// 		sender: {
			// 			id:"creator",
			// 			name:faker.person.fullName()
			// 		},
			// 	},
			// 	{
			// 		date:faker.date.soon().toString().split('GMT')[0],
			// 		attachmentUrl:null,
			// 		content:faker.lorem.paragraph(5),
			// 		id:faker.internet.ip(),
			// 		sender: {
			// 			id:"staff",
			// 			name:faker.person.fullName()
			// 		},
			// 	}
			// ],
			title:faker.lorem.sentences(2)
		});
	}
	return {
		tickets: tickets,
		isAdmin: false
	};
};
