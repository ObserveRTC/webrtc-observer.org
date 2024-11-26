import { EChartsAutoSize } from 'echarts-solid';
import { ObservedScorePayload } from '../../utils/MessageProtocol';

export type CalculatedScoresChartProps = {
	title?: string,
	// xAxisName: string,
	scores: ObservedScorePayload[],
};

export function CalculatedScoresChart(props: CalculatedScoresChartProps) {
	// eslint-disable-next-line solid/reactivity
	const getLinks = () => props.scores.map((item, i) => {
		return {
			source: i,
			target: i + 1
		};
	});

	return (
		<div class='h-64'>
			<EChartsAutoSize option={{
				tooltip: {
					trigger: 'axis',
					// eslint-disable-next-line no-unused-vars
					formatter: function(params: unknown) {
						const dataItem = params as { dataIndex: number }[];
						const score = props.scores[dataItem[0].dataIndex].score;
						const remarks = props.scores[dataItem[0].dataIndex].remarks;
						const date = new Date(props.scores[dataItem[0].dataIndex].timestamp);
						// const value = Math.round(props.values[dataItem[0].dataIndex] * 100) / 100;
						
						return `At ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} Score: ${score} <br /> ${remarks.map(r => r.text).join('<br />')}`;
					}
				},
				title: {
					text: props.title,
				},
				xAxis: {
					type: 'category',
					boundaryGap: false,
					data: props.scores.map(s => {
						const d = new Date(s.timestamp);

						return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
					}),
				},
				yAxis: {
					type: 'value'
				},
				series: [
					{
						type: 'graph',
						layout: 'none',
						coordinateSystem: 'cartesian2d',
						symbolSize: 20,
						label: {
							show: true,
							formatter: function(params: unknown) {
								const dataIndex = (params as { dataIndex: number }).dataIndex;
								const score = props.scores[dataIndex].score;
								
								return score;
							},
						},
						edgeSymbol: ['circle', 'arrow'],
						edgeSymbolSize: [2, 5],
						data: props.scores.map(s => s.score),
						links: getLinks(),
						lineStyle: {
							color: '#2f4554'
						}
					}
				]
			}} />
		</div>
	);
}