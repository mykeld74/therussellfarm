<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { untrack } from 'svelte';

	let {
		value = $bindable(''),
		id = 'emailBody',
		placeholder = 'Write your note to guests…'
	}: {
		value?: string;
		id?: string;
		placeholder?: string;
	} = $props();

	let editorEl: HTMLDivElement | null = null;
	let isEmpty = $state(true);
	let linkOpen = $state(false);
	let linkUrl = $state('https://');
	let savedSelection: Range | null = null;
	let activeBold = $state(false);
	let activeItalic = $state(false);
	let activeUnderline = $state(false);

	function isEditorEmptyHtml(html: string): boolean {
		const trimmed = html.trim();
		return (
			trimmed === '' ||
			trimmed === '<br>' ||
			trimmed === '<p><br></p>' ||
			trimmed === '<div><br></div>'
		);
	}

	function updateFormatState() {
		if (!editorEl || !selectionIsInEditor()) {
			activeBold = false;
			activeItalic = false;
			activeUnderline = false;
			return;
		}
		activeBold = document.queryCommandState('bold');
		activeItalic = document.queryCommandState('italic');
		activeUnderline = document.queryCommandState('underline');
	}

	const editorAttachment: Attachment<HTMLDivElement> = (node) => {
		editorEl = node;
		// Read initial HTML once — do not subscribe to `value`, or every keystroke
		// re-runs this attachment, resets innerHTML, and jumps the cursor to the top.
		const initial = untrack(() => value ?? '');
		if (initial) {
			node.innerHTML = initial;
			isEmpty = isEditorEmptyHtml(initial);
		} else {
			node.innerHTML = '';
			isEmpty = true;
		}

		const onSelectionChange = () => updateFormatState();
		document.addEventListener('selectionchange', onSelectionChange);

		return () => {
			document.removeEventListener('selectionchange', onSelectionChange);
			if (editorEl === node) editorEl = null;
		};
	};

	function syncValue() {
		if (!editorEl) return;
		const html = editorEl.innerHTML;
		const empty = isEditorEmptyHtml(html);
		isEmpty = empty;
		value = empty ? '' : html;
		updateFormatState();
	}

	function focusEditor() {
		editorEl?.focus();
	}

	function selectionIsInEditor(): boolean {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || !editorEl) return false;
		const range = selection.getRangeAt(0);
		return editorEl.contains(range.commonAncestorContainer);
	}

	function saveSelection() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || !selectionIsInEditor()) {
			savedSelection = null;
			return;
		}
		savedSelection = selection.getRangeAt(0).cloneRange();
	}

	function restoreSelection(): boolean {
		if (!savedSelection || !editorEl) return false;
		focusEditor();
		const selection = window.getSelection();
		if (!selection) return false;
		selection.removeAllRanges();
		selection.addRange(savedSelection);
		return true;
	}

	function preserveSelection(handler: () => void) {
		return (event: MouseEvent) => {
			// Keep the contenteditable selection when clicking toolbar controls.
			event.preventDefault();
			handler();
		};
	}

	function run(command: string, commandValue?: string) {
		focusEditor();
		document.execCommand(command, false, commandValue);
		syncValue();
		updateFormatState();
	}

	function toggleLink() {
		saveSelection();
		if (!savedSelection || savedSelection.collapsed) {
			linkOpen = false;
			window.alert('Select the text you want to turn into a link first.');
			return;
		}
		linkOpen = true;
		linkUrl = 'https://';
	}

	function applyLink() {
		const url = linkUrl.trim();
		if (!url) {
			linkOpen = false;
			savedSelection = null;
			return;
		}
		const href = /^https?:\/\//i.test(url) || /^mailto:/i.test(url) ? url : `https://${url}`;
		if (!restoreSelection()) {
			linkOpen = false;
			savedSelection = null;
			window.alert('Select the text you want to turn into a link first.');
			return;
		}
		document.execCommand('createLink', false, href);
		syncValue();
		linkOpen = false;
		linkUrl = 'https://';
		savedSelection = null;
	}

	function removeLink() {
		saveSelection();
		restoreSelection();
		run('unlink');
		linkOpen = false;
		savedSelection = null;
	}

	function cancelLink() {
		linkOpen = false;
		linkUrl = 'https://';
		savedSelection = null;
		focusEditor();
	}

	function closestElement(node: Node | null, tagNames: string[]): HTMLElement | null {
		let current: Node | null = node;
		while (current && current !== editorEl) {
			if (current instanceof HTMLElement && tagNames.includes(current.tagName)) {
				return current;
			}
			current = current.parentNode;
		}
		return null;
	}

	function listItemIsEmpty(li: HTMLElement): boolean {
		const text = (li.textContent ?? '').replace(/\u00a0/g, ' ').trim();
		if (text.length > 0) return false;
		return !li.querySelector('img, table, iframe');
	}

	function placeCaretIn(element: HTMLElement) {
		const selection = window.getSelection();
		if (!selection) return;
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(true);
		selection.removeAllRanges();
		selection.addRange(range);
	}

	/** Enter on an empty list item exits the list and starts a paragraph after it. */
	function exitListIfEmptyItem(): boolean {
		if (!editorEl) return false;
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;

		const li = closestElement(selection.anchorNode, ['LI']);
		if (!li || !listItemIsEmpty(li)) return false;

		const list = closestElement(li, ['UL', 'OL']);
		if (!list || !editorEl.contains(list)) return false;

		const paragraph = document.createElement('p');
		paragraph.appendChild(document.createElement('br'));

		const isOnlyItem = list.children.length === 1;
		if (isOnlyItem) {
			list.replaceWith(paragraph);
		} else {
			list.after(paragraph);
			li.remove();
			if (list.children.length === 0) list.remove();
		}

		placeCaretIn(paragraph);
		syncValue();
		return true;
	}

	function handleEditorKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
		if (exitListIfEmptyItem()) {
			event.preventDefault();
		}
	}
</script>

<div class="emailEditor">
	<div class="toolbar" role="toolbar" aria-label="Formatting">
		<button
			type="button"
			class={['toolBtn', { isActive: activeBold }]}
			title="Bold"
			aria-label="Bold"
			aria-pressed={activeBold}
			onmousedown={preserveSelection(() => run('bold'))}
		>
			<span class="toolLabel bold">B</span>
		</button>
		<button
			type="button"
			class={['toolBtn', { isActive: activeItalic }]}
			title="Italic"
			aria-label="Italic"
			aria-pressed={activeItalic}
			onmousedown={preserveSelection(() => run('italic'))}
		>
			<span class="toolLabel italic">I</span>
		</button>
		<button
			type="button"
			class={['toolBtn', { isActive: activeUnderline }]}
			title="Underline"
			aria-label="Underline"
			aria-pressed={activeUnderline}
			onmousedown={preserveSelection(() => run('underline'))}
		>
			<span class="toolLabel underline">U</span>
		</button>
		<span class="toolDivider" aria-hidden="true"></span>
		<button
			type="button"
			class="toolBtn"
			title="Bullet list"
			aria-label="Bullet list"
			onmousedown={preserveSelection(() => run('insertUnorderedList'))}
		>
			<span class="bulletIcon" aria-hidden="true">
				<span></span>
				<span></span>
				<span></span>
			</span>
		</button>
		<button
			type="button"
			class="toolBtn"
			title="Numbered list"
			aria-label="Numbered list"
			onmousedown={preserveSelection(() => run('insertOrderedList'))}
		>
			1.
		</button>
		<span class="toolDivider" aria-hidden="true"></span>
		<button
			type="button"
			class="toolBtn"
			title="Add link"
			aria-label="Add link"
			onmousedown={preserveSelection(toggleLink)}
		>
			Link
		</button>
		<button
			type="button"
			class="toolBtn"
			title="Remove link"
			aria-label="Remove link"
			onmousedown={preserveSelection(removeLink)}
		>
			Unlink
		</button>
	</div>

	{#if linkOpen}
		<div class="linkRow">
			<input
				type="url"
				bind:value={linkUrl}
				placeholder="https://example.com"
				aria-label="Link URL"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						applyLink();
					}
					if (event.key === 'Escape') linkOpen = false;
				}}
			/>
			<button type="button" class="btn btnSecondary btnSm" onclick={applyLink}>Apply</button>
			<button type="button" class="btnText" onclick={cancelLink}>Cancel</button>
		</div>
	{/if}

	<div
		{id}
		class={['editorSurface', { isEmpty }]}
		contenteditable="true"
		role="textbox"
		tabindex="0"
		aria-multiline="true"
		aria-label="Message body"
		data-placeholder={placeholder}
		{@attach editorAttachment}
		onkeydown={handleEditorKeydown}
		onkeyup={updateFormatState}
		onmouseup={updateFormatState}
		oninput={syncValue}
		onblur={syncValue}
	></div>
</div>

<style>
	.emailEditor {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-white);
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.45rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-cream);
	}

	.toolBtn {
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.45rem;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: transparent;
		color: var(--color-text);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.toolBtn:hover {
		background: var(--color-white);
		border-color: var(--color-border);
	}

	.toolBtn.isActive {
		background: var(--color-forest);
		border-color: var(--color-forest);
		color: var(--color-cream);
	}

	.toolLabel.bold {
		font-weight: 700;
	}

	.toolLabel.italic {
		font-style: italic;
	}

	.toolLabel.underline {
		text-decoration: underline;
	}

	.bulletIcon {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		width: 0.85rem;
		height: 0.95rem;
	}

	.bulletIcon span {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: currentColor;
	}

	.toolDivider {
		width: 1px;
		align-self: stretch;
		margin: 0.2rem 0.25rem;
		background: var(--color-border);
	}

	.linkRow {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding: 0.55rem 0.65rem;
		border-bottom: 1px solid var(--color-border);
		background: #f7faf5;
	}

	.linkRow input {
		flex: 1;
		min-width: 12rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font: inherit;
	}

	.btnText {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-forest);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.editorSurface {
		min-height: 12rem;
		padding: 0.85rem 0.9rem;
		font: inherit;
		line-height: 1.55;
		color: var(--color-text);
		outline: none;
	}

	.editorSurface :global(p) {
		margin: 0 0 0.75rem;
	}

	.editorSurface :global(ul),
	.editorSurface :global(ol) {
		margin: 0 0 0.75rem;
		padding-left: 1.25rem;
	}

	.editorSurface :global(a) {
		color: var(--color-forest);
	}

	.editorSurface.isEmpty::before {
		content: attr(data-placeholder);
		color: var(--color-text-muted);
		pointer-events: none;
	}
</style>
