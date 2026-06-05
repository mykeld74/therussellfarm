<script lang="ts">
	import { onDestroy, tick } from 'svelte';

	type YoutubeVideo = {
		kind: 'youtube';
		id: string;
		title: string;
	};

	type FileVideo = {
		kind: 'file';
		src: string;
		title: string;
		thumbnail: string;
	};

	type Props = YoutubeVideo | FileVideo;

	let props: Props = $props();

	let playing = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let youtubeContainer = $state<HTMLDivElement | null>(null);
	let youtubePlayer = $state<YT.Player | null>(null);

	const thumbnail = $derived(
		props.kind === 'youtube'
			? `https://i.ytimg.com/vi/${props.id}/hqdefault.jpg`
			: props.thumbnail
	);

	function resetPoster() {
		playing = false;
		destroyYoutubePlayer();
	}

	function destroyYoutubePlayer() {
		youtubePlayer?.destroy();
		youtubePlayer = null;
	}

	function ensureYoutubeApi(): Promise<void> {
		if (window.YT?.Player) {
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			const previousReady = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				previousReady?.();
				resolve();
			};

			if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
				const script = document.createElement('script');
				script.src = 'https://www.youtube.com/iframe_api';
				script.async = true;
				document.head.appendChild(script);
			}
		});
	}

	async function initYoutubePlayer() {
		if (props.kind !== 'youtube' || !youtubeContainer) return;

		await ensureYoutubeApi();
		destroyYoutubePlayer();

		youtubePlayer = new window.YT!.Player(youtubeContainer, {
			host: 'https://www.youtube-nocookie.com',
			videoId: props.id,
			width: '100%',
			height: '100%',
			playerVars: {
				autoplay: 1,
				modestbranding: 1,
				rel: 0,
				iv_load_policy: 3,
				playsinline: 1,
				enablejsapi: 1,
				origin: window.location.origin
			},
			events: {
				onStateChange: (event: YT.OnStateChangeEvent) => {
					if (
						event.data === window.YT!.PlayerState.PAUSED ||
						event.data === window.YT!.PlayerState.ENDED
					) {
						resetPoster();
					}
				}
			}
		});
	}

	async function play() {
		playing = true;
		await tick();

		if (props.kind === 'file') {
			void videoEl?.play();
		} else {
			await initYoutubePlayer();
		}
	}

	onDestroy(() => {
		destroyYoutubePlayer();
	});
</script>

<div class="videoEmbed">
	{#if !playing}
		<button type="button" class="videoPoster" onclick={play} aria-label="Play {props.title}">
			<img class="posterImage" src={thumbnail} alt="" />
			<span class="playButton" aria-hidden="true">
				<svg class="playButtonSvg" viewBox="0 0 68 48" width="80" height="56">
					<rect class="playButtonBg" width="68" height="48" rx="10" />
					<path class="playButtonIcon" d="M45 24 27 14v20z" />
				</svg>
			</span>
		</button>
	{:else if props.kind === 'youtube'}
		<div class="youtubePlayer" bind:this={youtubeContainer} title={props.title}></div>
	{:else}
		<video
			bind:this={videoEl}
			controls
			playsinline
			title={props.title}
			onpause={resetPoster}
			onended={resetPoster}
		>
			<source src={props.src} type="video/mp4" />
		</video>
	{/if}
</div>

<style>
	.videoEmbed {
		aspect-ratio: 16 / 9;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-forest-dk);
		box-shadow: var(--shadow-md);
	}

	.videoPoster {
		display: block;
		position: relative;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		cursor: pointer;
		background: var(--color-forest-dk);
	}

	.videoPoster:focus-visible {
		outline: 2px solid var(--color-forest-lt);
		outline-offset: 2px;
	}

	.posterImage {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.playButton {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.15);
		transition: background 0.2s;
	}

	.videoPoster:hover .playButton,
	.videoPoster:focus-visible .playButton {
		background: rgba(0, 0, 0, 0.25);
	}

	.playButtonSvg {
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35));
		transition: transform 0.2s;
	}

	.videoPoster:hover .playButtonSvg,
	.videoPoster:focus-visible .playButtonSvg {
		transform: scale(1.08);
	}

	.playButtonBg {
		fill: #f00;
		transition: fill 0.2s;
	}

	.videoPoster:hover .playButtonBg,
	.videoPoster:focus-visible .playButtonBg {
		fill: #c00;
	}

	.playButtonIcon {
		fill: #fff;
	}

	.youtubePlayer,
	.videoEmbed video {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.youtubePlayer :global(iframe) {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
