import {
	CurrentGatewayDownload,
	CurrentService,
	Device,
	DeviceWithImageInstalls,
	DeviceWithServiceDetails,
	GatewayDownload,
	Image,
	ImageInstall,
	PineOptionsFor,
	Release,
	Service,
} from '../../typings/balena-sdk';

// Pine options necessary for getting raw service data for a device
export const getCurrentServiceDetailsPineOptions = (expandRelease: boolean) => {
	const pineOptions: PineOptionsFor<DeviceWithImageInstalls> = {
		$expand: {
			image_install: {
				$select: ['id', 'download_progress', 'status', 'install_date'],
				$filter: {
					status: {
						$ne: 'deleted',
					},
				},
				$expand: {
					image: {
						$select: ['id'],
						$expand: {
							is_a_build_of__service: {
								$select: ['id', 'service_name'],
							},
						},
					},
					...(expandRelease && {
						is_provided_by__release: {
							$select: ['id', 'commit'],
						},
					}),
				},
			},
			gateway_download: {
				$select: ['id', 'download_progress', 'status'],
				$filter: {
					status: {
						$ne: 'deleted',
					},
				},
				$expand: {
					image: {
						$select: ['id'],
						$expand: {
							is_a_build_of__service: {
								$select: ['id', 'service_name'],
							},
						},
					},
				},
			},
		},
	};

	return pineOptions;
};

interface WithServiceName {
	service_name: string;
}

function getSingleInstallSummary(
	rawData: ImageInstall,
): CurrentService & WithServiceName;
function getSingleInstallSummary(
	rawData: GatewayDownload,
): CurrentGatewayDownload & WithServiceName;
function getSingleInstallSummary(
	rawData: ImageInstall | GatewayDownload,
): (CurrentService | CurrentGatewayDownload) & WithServiceName {
	const image = (rawData.image as Image[])[0];
	const service = (image.is_a_build_of__service as Service[])[0];

	let releaseInfo: { commit?: string } = {};
	if (
		'is_provided_by__release' in rawData &&
		rawData.is_provided_by__release != null
	) {
		const release = (rawData.is_provided_by__release as Release[])[0];
		releaseInfo = {
			commit: release != null ? release.commit : undefined,
		};
	}

	// prefer over omit for performance reasons
	delete rawData.image;
	if ('is_provided_by__release' in rawData) {
		delete rawData.is_provided_by__release;
	}

	return Object.assign(
		rawData,
		{
			service_id: service.id,
			// add this extra property to make grouping the services easier
			service_name: service.service_name,
			image_id: image.id,
		},
		releaseInfo,
	);
}

export const generateCurrentServiceDetails = (
	rawDevice: DeviceWithImageInstalls,
): DeviceWithServiceDetails => {
	const installs = rawDevice.image_install!.map(ii =>
		getSingleInstallSummary(ii),
	);

	const downloads = rawDevice.gateway_download!.map(gd =>
		getSingleInstallSummary(gd),
	);

	// prefer over omit for performance reasons
	delete rawDevice.image_install;
	delete rawDevice.gateway_download;

	const device = (rawDevice as Device) as DeviceWithServiceDetails;

	// Essentially a groupBy(installs, 'service_name')
	// but try making it a bit faster for the sake of large fleets
	const currentServicesGroupedByName: Record<string, CurrentService[]> = {};
	installs.forEach(container => {
		let serviceContainerGroup =
			currentServicesGroupedByName[container.service_name];
		if (!serviceContainerGroup) {
			serviceContainerGroup = currentServicesGroupedByName[
				container.service_name
			] = [];
		}

		// remove the extra property that we added for the grouping
		delete container.service_name;
		serviceContainerGroup.push(container);
	});

	for (const serviceName in currentServicesGroupedByName) {
		if (currentServicesGroupedByName.hasOwnProperty(serviceName)) {
			currentServicesGroupedByName[serviceName].sort((a, b) => {
				return b.install_date.localeCompare(a.install_date);
			});
		}
	}

	device.current_services = currentServicesGroupedByName;
	device.current_gateway_downloads = downloads;
	return device;
};
