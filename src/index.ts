import * as Realm from 'realm-web';

export interface Env {
	REALM_APPID: string;
    REALM_API_KEY: string;
	MONGODB_CLUSTER_NAME: string;
	MONGODB_DATABASE: string;
	MONGODB_COLLECTION: string;
	API_ENDPOINT: string;
}

type RequestBody = {
	[key:string]: string
}

let App: Realm.App;

const outputNothing = () => new Response(`Nothing here...`);

export const worker = {
	async fetch(
		request: Request,
		env: Env
	): Promise<Response> {

		const url = new URL(request.url);
        App = App || new Realm.App(env.REALM_APPID);

		const method = request.method;
		if (method === 'GET') {
			return outputNothing();
		}

        const path = url.pathname.replace(/[/]$/, '');
		if (path !== env.API_ENDPOINT) {
            return outputNothing();
        }

		const formData = await request.formData();
        const requestBody:RequestBody = {};
        for (const entry of formData.entries()) {
			const key = entry[0] as string
			requestBody[key] = entry[1] as string;
        }

		const credentials = Realm.Credentials.apiKey(env.REALM_API_KEY);
		// Attempt to authenticate
		const user = await App.logIn(credentials);
		const client = user.mongoClient(env.MONGODB_CLUSTER_NAME);
		
		const collection = client.db(env.MONGODB_DATABASE).collection(env.MONGODB_COLLECTION);
		
		await collection.insertOne({
			...requestBody
		})

		return outputNothing();
	},
};

export default worker