import { For, Switch, Match, Show, createSignal, Accessor, onCleanup } from 'solid-js';

export type ShowObjectAccessor = () => Omit<ShowObjectProps, 'level' | 'parentExpandedKey' | 'isExpanded'>;
export type ShowObjectAccessorArrayItem = {
	key: string;
	accessor: ShowObjectAccessor;
}

export type ShowObjectProperties = Record<string, unknown 
| ShowObjectAccessor
| ShowObjectAccessorArrayItem[]
> | string | number | boolean | null | undefined;

export interface ShowObjectProps {
	data?: any;
	properties: Accessor<ShowObjectProperties>;
	// iterableNavigations: IterableNavigationItem[];
	// functions: Record<string, () => JSXElement>;
	level?: number;
	cleanup?: () => void;

	parentExpandedKey?: string;
	isExpanded?: ReturnType<typeof createSignal<string[]>>;
}

const stringColor = "#e3116c";         // Pink for strings
const numberColor = "#0366d6";         // Blue for numbers
const booleanColor = "#d73a49";        // Red for booleans
const nullColor = "#6a737d";           // Gray for null
const undefinedColor = "#6a737d";      // Gray for undefined (similar to null)
const functionColor = "#005cc5";       // Blue for functions
const rotateTime = "100ms";            // Rotation time
const togglerOpacity = 0.6;            // Opacity for toggler icons
const togglerColor = "#586069";        // Gray for toggler icons
const bracketColor = "#d1d5da";        // Light gray for brackets
const keyColor = "#032f62";            // Dark blue for keys
const urlColor = "#0366d6";            // GitHub blue for URLs


function ShowObject(props: ShowObjectProps) {
	const [isExpanded, setIsExpanded] = props?.isExpanded ?? createSignal<string[]>([]);

	onCleanup(() => props.cleanup?.());

	const isArray = Array.isArray;
	const expandKeyPrefix = props.parentExpandedKey ? `${props.parentExpandedKey}-${props.level}` : '';
	// console.warn('created', props.level, props.properties(), isExpanded());
	return (
		<Show when={props.properties()} keyed>{(fields) => {
			// console.warn('expnded', isExpanded(), props.level);

			return (
				<div style={{ 'margin-left': `${props.level ?? 0}rem`, 'font-family': 'monospace' }}>
					<div style={{ 'margin-left': '1rem' }}>
						<Switch>
							<Match when={typeof fields === 'string'}>
								<span style={{ color: stringColor }}>"{fields as string}"</span>
							</Match>
							<Match when={typeof fields === 'number' || typeof fields === 'bigint'}>
								<span style={{ color: numberColor }}>{fields as number}</span>
							</Match>
							<Match when={typeof fields === 'boolean'}>
								<span style={{ color: booleanColor }}>{(fields as boolean) ? 'true' : 'false'}</span>
							</Match>
							<Match when={fields === null}>
								<span style={{ color: nullColor }}>null</span>
							</Match>
							<Match when={fields === undefined}>
								<span style={{ color: undefinedColor }}>undefined</span>
							</Match>
							<Match when={typeof fields === 'object'}>
								<For each={Object.entries(fields)}>{([key, value], index) => (
								<div id={`item-${props.level}-${index()}`}>
									<Switch>
										<Match when={typeof value === 'function'} keyed>{() => {
											const expKey = `${expandKeyPrefix}-${key}`;
											const expanded = isExpanded().includes(expKey);

												// console.warn('Function', key);
												return (
													<>
													<div>
														<span
															style={{ 'cursor': 'pointer', 'color': functionColor }}
															onClick={() => {
																if (expanded) {
																	setIsExpanded(isExpanded().filter((k) => k !== expKey));
																} else {
																	setIsExpanded([...isExpanded(), expKey]);
																}
															}}
														>
															{expanded ? '▼' : '▶'}{' '}
															{`${key}${expanded ? "() {" : "(...)"}`} 
															{/* {expanded ? isArray(value) ? '[' : '{' : ''} */}
															
														</span>
														<Show when={expanded}>{() => {
															const result = ((value as ShowObjectAccessor))();

															return (
																<ShowObject {...result} 
																	level={(props.level ?? 0) + 1} 
																	isExpanded={[isExpanded, setIsExpanded]}
																	parentExpandedKey={expKey}
																/>
															)
														}}
														</Show>
													</div>
													{/* <span>{expanded ? isArray(value) ? ']' : '}' : ''}</span> */}
													<span>{expanded ? '}' : ''}</span>
													</>
												);
											}}
											</Match>
											<Match when={isArray(value)} keyed>{() => {
												const expanded = isExpanded().includes(key);

												return (
													<>
														<div>
															<span
																style={{ 'cursor': 'pointer', 'color': keyColor }}
																onClick={() => {
																	if (expanded) {
																		setIsExpanded(isExpanded().filter((k) => k !== key));
																	} else {
																		setIsExpanded([...isExpanded(), key]);
																	}
																}}
															>
																{expanded ? '▼' : '▶'}{' '}
																{`"${key}"`}:
																{expanded ? '[' : ''} 
															</span>
														
														<Show when={expanded}>
															<For each={value as ShowObjectAccessorArrayItem[]}>{(item, itemIndex) => {
																const expKey = `${expandKeyPrefix}-${key}-${item.key}`;
																const itemExpanded = isExpanded().includes(expKey);
																	return (
																		<div style={{ 'margin-left': '1rem' }}>
																			<span
																				style={{ 'cursor': 'pointer', 'color': keyColor }}
																				onClick={() => {
																					if (itemExpanded) {
																						setIsExpanded(isExpanded().filter((k) => k !== expKey));
																					} else {
																						setIsExpanded([...isExpanded(), expKey]);
																					}
																				}}
																			>
																				{itemExpanded ? '▼' : '▶'}{' '}
																				{itemIndex()}: 
																			</span>
																			<Show when={itemExpanded}>
																				<ShowObject 
																					{...item.accessor()} 
																					level={(props.level ?? 0) + 1} 
																					isExpanded={[isExpanded, setIsExpanded]}
																					parentExpandedKey={expKey}
																				/>
																			</Show>
																		</div>
																		
																	);
																}}
															</For>
														</Show>
														</div>
														<span>{expanded ? ']' : ''}</span>
													</>
													
												)
											}}</Match>
											<Match when={typeof value === 'object'} keyed>{() => {
												const [subProps] = createSignal(value as Record<string, unknown>);
												return (
													<>
														<div>
															<span
																style={{ 'cursor': 'pointer', 'color': keyColor }}
															>
																{`"${key}": {`} 
																{/* {expanded ? isArray(value) ? '[' : '{' : ''} */}
															
															</span>
															<ShowObject 
																properties={subProps} 
																level={(props.level ?? 0) + 1} 
																isExpanded={[isExpanded, setIsExpanded]}
																parentExpandedKey={`${expandKeyPrefix}-${key}`}
															/>
														</div>
														<span>{'}'}</span>
													</>
												);
											}}
											</Match>
											<Match when={value === undefined }>
												<span style={{ color: keyColor }}>
													{key}
												</span>: 
												<span style={{ color: undefinedColor }}>undefined</span>
											</Match>
											<Match when={value === null }>
												<span style={{ color: keyColor }}>
													{key}
												</span>: 
												<span style={{ color: nullColor }}>null</span>
											</Match>
											<Match when={typeof value === 'string'}>
												<span style={{ color: keyColor }}>{key}</span>: 
												<span style={{ color: stringColor }}>"{value as string}"</span>
											</Match>
											<Match when={typeof value === 'number' || typeof value === 'bigint'}>
												<span style={{ color: keyColor }}>{key}</span>: 
												<span style={{ color: numberColor }}>{value as number}</span>
											</Match>
											<Match when={typeof value === 'boolean'}>
												<span style={{ color: keyColor }}>{key}</span>: 
												<span style={{ color: booleanColor }}>{(value as boolean) ? 'true' : 'false'}</span>
											</Match>
										</Switch>
									</div>
								)}
								</For>
							</Match>
						</Switch>
					</div>
				</div>
			);
		}}
		</Show>
		
	);
}

export default ShowObject;