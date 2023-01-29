import * as Realm from 'realm-web';

export interface Env {
	REALM_APPID: string;
    REALM_API_KEY: string;
	MONGODB_CLUSTER_NAME: string;
	MONGODB_DATABASE: string;
	MONGODB_COLLECTION: string;
}

// Define type alias; available via `realm-web`
type Document = globalThis.Realm.Services.MongoDB.Document;

// Declare the interface for a "todos" document
interface Purchases extends Document {
    owner: string;
    done: boolean;
    todo: string;
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
		if (path !== '/api/ping') {
            return outputNothing();
        }

		const formData = await request.formData();
        const requestBody:any = {};
        for (const entry of formData.entries()) {
			requestBody[entry[0]] = entry[1];
        }

		const credentials = Realm.Credentials.apiKey(env.REALM_API_KEY);
		// Attempt to authenticate
		const user = await App.logIn(credentials);
		const client = user.mongoClient(env.MONGODB_CLUSTER_NAME);
		
		const collection = client.db(env.MONGODB_DATABASE).collection<Purchases>(env.MONGODB_COLLECTION);
		
		await collection.insertOne({
			...requestBody
		})

		return outputNothing();
	},
};

export default worker