export function mapTicketStateToString(input:number):string{
	input=parseInt(input);
	switch(input){
		case 0:return "Awaiting User";
		case 1:return "Awaiting Staff";
		case 2:return "Closed";
	}
}