import { Component, JSX } from 'solid-js';

type SectionProps = {
	title?: string;
	logo?: string;
	children?: JSX.Element;
	subsection?: boolean;
}

const Section: Component<SectionProps> = (props) => {
	const divClass = [
		'mt-8 mx-4 sm:mx-auto',
		'max-w-4xl',
		// 'sm:w-full',
	].join(' ');
	const h1Class = [
		'text-left',
		props.subsection ? 'text-lg' : 'text-3xl',
		'font-semibold',
		'text-gray-700',
		'antialiased',
		'font-sans',
	].join(' ');
	// sm:max-w-sm
	return (
		<div class={divClass}>
			<div class='flex flex-col bg-white p-4 gap-2'>
				<h1 class={h1Class}>{ props.title }</h1>
				<hr />
				{ props.children }
			</div>
		</div>
	);
};

export default Section;
