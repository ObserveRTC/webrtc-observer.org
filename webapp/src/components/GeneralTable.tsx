import { For, Show } from 'solid-js';
import Table from '@suid/material/Table';
import TableBody from '@suid/material/TableBody';
import TableCell from '@suid/material/TableCell';
import TableContainer from '@suid/material/TableContainer';
import TableHead from '@suid/material/TableHead';
import TableRow from '@suid/material/TableRow';
import Paper from '@suid/material/Paper';
import JSONFormatter from 'json-formatter-js';

type GenericTableProps<T> = {
  data: T[];
};

const GenericTable = <T extends Record<string, any>>(props: GenericTableProps<T>) => {
	const headers = props.data.length > 0 ? Object.keys(props.data[0]) : [];

	return (
		<TableContainer component={Paper}>
			<Table>
				<TableHead>
					<TableRow>
						<For each={headers}>
							{(header) => <TableCell>{header}</TableCell>}
						</For>
					</TableRow>
				</TableHead>
				<TableBody>
					<For each={props.data}>
						{(row) => (
							<TableRow>
								<For each={headers}>
									{(header) => (
										<TableCell>
											<Show
												when={typeof row[header] !== 'object'}
												fallback={new JSONFormatter(row[header]).render()}
											>
												{row[header]}
											</Show>
										</TableCell>
									)}
								</For>
							</TableRow>
						)}
					</For>
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default GenericTable;
