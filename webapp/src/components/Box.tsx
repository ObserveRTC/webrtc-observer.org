import { Typography, Popover, SvgIcon } from '@suid/material';
import { Component, createSignal, JSX, Show } from 'solid-js';

type BoxProps = {
	title?: string;
	logo?: string;
	children?: JSX.Element;
	full?: boolean;
	popoverText?: string,
}

const Box: Component<BoxProps> = (props) => {
	const [anchorEl, setAnchorEl] = createSignal<Element | null>(null);
	const handlePopoverOpen = (event: { currentTarget: Element }) => {
		setAnchorEl(event.currentTarget);
	};
	const handlePopoverClose = () => {
		setAnchorEl(null);
	};
	const open = () => Boolean(anchorEl());
	
	const divClass = [
		'mt-8 mx-4 sm:mx-auto',
		props.full ? 'sm:w-full' : 'sm:max-w-sm',
	].join(' ');
	// sm:max-w-sm
	return (
		<div class={divClass}>
			<div class='flex flex-col bg-white p-4 shadow-md rounded-lg gap-2'>
				<Show when={props.popoverText} fallback={
					<h2 class='text-center text-2xl font-bold text-gray-900'>
						{ props.title }
					</h2>
				}>
					<div class="flex items-center justify-between w-full">
						<h2 class='text-center text-2xl font-bold text-gray-900'>
							{ props.title }
						</h2>
						<SvgIcon 
							height="24px" 
							viewBox="0 -960 960 960" 
							width="24px" 
							fill="#e8eaed"
							aria-owns={open() ? 'mouse-over-popover' : undefined}
							aria-haspopup="true"
							onMouseEnter={handlePopoverOpen}
							onMouseLeave={handlePopoverClose}
						>
							<path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
						</SvgIcon>
						<Popover
							id="mouse-over-popover"
							sx={{ pointerEvents: 'none' }}
							open={open()}
							anchorEl={anchorEl()}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'left',
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'left',
							}}
							onClose={handlePopoverClose}
							disableRestoreFocus
						>
							<Typography sx={{ p: 1 }}>{props.popoverText}</Typography>
						</Popover>
					</div>
				</Show>	
				{ props.children }
			</div>
		</div>
	);
};

export default Box;
