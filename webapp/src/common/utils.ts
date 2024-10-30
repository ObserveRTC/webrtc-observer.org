function b64DecodeUnicode(str: string) {
	return decodeURIComponent(
		atob(str).replace(/(.)/g, (m, p) => {
			let code = (p as string).charCodeAt(0).toString(16).toUpperCase();
			if (code.length < 2) {
				code = '0' + code;
			}
			return '%' + code;
		}),
	);
}

export function base64UrlDecode(str: string) {
	let output = str.replace(/-/g, '+').replace(/_/g, '/');
	switch (output.length % 4) {
	case 0:
		break;
	case 2:
		output += '==';
		break;
	case 3:
		output += '=';
		break;
	default:
		throw new Error('base64 string is not of the correct length');
	}

	try {
		return b64DecodeUnicode(output);
	} catch (err) {
		return atob(output);
	}
}

export async function timeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
	let timeoutHandle: ReturnType<typeof setTimeout>;

	const timeoutPromise = new Promise<T>((_, reject) =>
		timeoutHandle = setTimeout(() => reject(new Error('Promise timed out')), timeout));

	return Promise.race([ promise, timeoutPromise ]).then((result) => {
		clearTimeout(timeoutHandle);

		return result;
	});
}

const names: string[] = [
	// Action/Adventure
	'Indiana Jones',
	'James Bond',
	'Ethan Hunt',
	'John McClane',
	'Lara Croft',
	'Jack Sparrow',
	'Han Solo',
	'Neo',
	'Jason Bourne',
    
	// Sci-Fi/Fantasy
	'Luke Skywalker',
	'Frodo Baggins',
	'Harry Potter',
	'Hermione Granger',
	'Katniss Everdeen',
	'Darth Vader',
	'Gandalf',
	'Optimus Prime',
	'Yoda',
    
	// Animation
	'Woody',
	'Buzz Lightyear',
	'Elsa',
	'Simba',
	'Mulan',
	'Po (Kung Fu Panda)',
	'Shrek',
	'Nemo',
	'Stitch',
    
	// Superhero
	'Spider-Man',
	'Iron Man',
	'Batman',
	'Superman',
	'Wonder Woman',
	'Captain America',
	'Hulk',
	'Black Panther',
	'Thor',
    
	// Horror
	'Michael Myers',
	'Freddy Krueger',
	'Jason Voorhees',
	'Samara Morgan',
	'Regan MacNeil',
	'Jack Torrance',
	'Norman Bates',
	'Carrie White',
	'Pennywise',
    
	// Drama
	'Forrest Gump',
	'Andy Dufresne',
	'Vito Corleone',
	'Tony Montana',
	'Rocky Balboa',
	'Atticus Finch',
	'Jack Dawson',
	'Rose DeWitt Bukater',
	'Scarlett O\'Hara',
    
	// Comedy
	'Ace Ventura',
	'Ferris Bueller',
	'Ron Burgundy',
	'Dr. Emmett Brown',
	'Marty McFly',
	'Austin Powers',
	'Napoleon Dynamite',
	'Elle Woods',
	'Alan Garner',
    
	// Romance
	'Noah Calhoun',
	'Allie Hamilton',
	'Sally Albright',
	'Harry Burns',
	'Edward Lewis',
	'Vivian Ward',
	'Westley',
	'Buttercup',
	'Mr. Darcy',
    
	// Animated Classics
	'Snow White',
	'Cinderella',
	'Aurora',
	'Ariel',
	'Belle',
	'Aladdin',
	'Jasmine',
	'Pocahontas',
	'Simba',
    
	// Miscellaneous
	'Maximus Decimus Meridius',
	'William Wallace',
	'John Wick',
	'Tyler Durden',
	'Rick Blaine',
	'Clarice Starling',
	'Marge Gunderson',
	'Amélie Poulain',
	'Alex DeLarge'
];


export function getRandomUserId(): string {
	const randomIndex = Math.floor(Math.random() * names.length);
	return names[randomIndex];
}
  