import * as errors from 'balena-errors';
import * as BalenaSdk from '../../typings/balena-sdk';
import { InjectedDependenciesParam, InjectedOptionsParam } from '../balena';

type BalenaBuilderRequestError = errors.BalenaError & {
	body: BuilderBuildFromUrlErrorResponse;
};

interface BuilderBuildFromUrlResponse {
	started: true;
	releaseId: number;
}

interface BuilderBuildFromUrlErrorResponse {
	started: false;
	error: string;
	message: string;
}

const isBuilderError = (error: any): error is BalenaBuilderRequestError =>
	error.code === 'BalenaRequestError' &&
	typeof error.body === 'object' &&
	!!error.body.error;

export class BuilderHelper {
	constructor(
		private deps: InjectedDependenciesParam,
		private opts: InjectedOptionsParam,
	) {}

	public buildFromUrl(
		owner: string,
		appName: string,
		urlDeployOptions: BalenaSdk.BuilderUrlDeployOptions,
	) {
		return this.deps.request
			.send<BuilderBuildFromUrlResponse>({
				method: 'POST',
				url: `/v3/buildFromUrl?headless=true&owner=${owner}&app=${appName}`,
				baseUrl: this.opts.builderUrl,
				body: Object.assign(
					{
						shouldFlatten: true,
					},
					urlDeployOptions,
				),
			})
			.then(resp => {
				return resp.body.releaseId;
			})
			.catch(isBuilderError, (err: BalenaBuilderRequestError) => {
				err.message = err.body.message || err.body.error;
				throw err;
			});
	}
}
