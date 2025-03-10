import { EChartsAutoSize } from 'echarts-solid';
import { GetCallConnectionsResponse } from '../../utils/MessageProtocol';

export type IceConnectionsGraphProps = {
	connections: GetCallConnectionsResponse['connections'];
};

export function IceConnectionsGraph(props: IceConnectionsGraphProps) {
	// eslint-disable-next-line solid/reactivity
	const mediaServerNodes = [...new Set<string>(props.connections.map(c => c.mediaServerIp))].map((ip, i) => ({
		name: ip,
		x: 600,
		y: 150 + i * 100,
		itemStyle: {
			color: '#40E0D0'
		}
	}));
	const clientNodes = props.connections.map((c, i) => ({
		name: c.userId ?? c.clientId,
		x: 200,
		y: 100 + i * 100,
		itemStyle: {
			color: '#007FFF'
		}
		
	}));
	const turnNodes = [{
		name: 'STUNner',
		x: 400,
		y: 250,
	}];
	const links = [
		...props.connections.map((c) => ({
			source: c.userId ?? c.clientId,
			target: c.mediaServerIp,
			symbolSize: [5, 20],
			// label: {
			// 	show: true
			// },
			lineStyle: {
				width: 5,
				curveness: 0.2,
				type: 'dashed',
				color: '#d0d0d0',
			},
		})),
		...props.connections.map((c) => ({
			source: c.userId ?? c.clientId,
			target: 'STUNner',
			symbolSize: [5, 10],
			lineStyle: {
				color: '#031273',
			},
		})),
		...props.connections.map((c) => ({
			source: 'STUNner',
			target: c.mediaServerIp,
			symbolSize: [5, 10],
			lineStyle: {
				color: '#031273',
			},
		})),
	];
	// console.warn('mediaServerNodes', mediaServerNodes, clientNodes);
	return (
		<div class='h-64'>
			<EChartsAutoSize option={{
				title: {
					// text: 'ICE connections'
				},
				tooltip: {},
				animationDurationUpdate: 1500,
				animationEasingUpdate: 'quinticInOut',
				// legend: [
				// 	{
				// 		// selectedMode: 'single',
				// 		data: ['STUNner', 'Media Server', 'Client']
				// 	}
				// ],
				series: [
					{
						type: 'graph',
						layout: 'none',
						symbolSize: 50,
						roam: true,
						label: {
							show: true
						},
						edgeSymbol: ['circle', 'arrow'],
						edgeSymbolSize: [4, 10],
						edgeLabel: {
							fontSize: 20
						},
						// categories: [
						// 	{
						// 		name: 'Media Server'
						// 	},
						// 	{
						// 		name: 'Client'
						// 	},
						// 	{
						// 		name: 'STUNner'
						// 	}
						// ],
						data: [
							...mediaServerNodes,
							...clientNodes,
							...turnNodes,
						],
						links,
						// links: [
						// 	{
						// 		source: 'Node 0',
						// 		target: 'Node 1',
						// 		lineStyle: {
						// 			type: 'dashed',
						// 			color: '#696969',
						// 		}
						// 	}
						// ],
						// links: [
						// 	{
						// 		source: 0,
						// 		target: 1,
						// 		symbolSize: [5, 20],
						// 		label: {
						// 			show: true
						// 		},
						// 		lineStyle: {
						// 			width: 5,
						// 			curveness: 0.2
						// 		}
						// 	},
						// 	{
						// 		source: 'Node 2',
						// 		target: 'Node 1',
						// 		label: {
						// 			show: true
						// 		},
						// 		lineStyle: {
						// 			curveness: 0.2
						// 		}
						// 	},
						// 	{
						// 		source: 'Node 1',
						// 		target: 'Node 3'
						// 	},
						// 	{
						// 		source: 'Node 2',
						// 		target: 'Node 3'
						// 	},
						// 	{
						// 		source: 'Node 2',
						// 		target: 'Node 4'
						// 	},
						// 	{
						// 		source: 'Node 1',
						// 		target: 'Node 4'
						// 	}
						// ],
						lineStyle: {
							opacity: 0.9,
							width: 2,
							curveness: 0
						}
					}
				]
			}} />
		</div>
	);
}