import type { PageLoad } from '../files/$types';
import { type UsersType, UserTypes } from '$lib/helpers';
import { faker } from '@faker-js/faker';

export const load:PageLoad = ()=>{
	let users:UsersType[]=[];
	for (let i =0;i<40;i++)
	{
		users.push({
			type:faker.helpers.enumValue(UserTypes),
			name:faker.person.fullName(),
			email:faker.internet.email(),
			id:faker.system.semver()
		})
	}
	return {
		isAdmin:true,
		usersList:users
	}
}