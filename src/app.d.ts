import type { User, Session } from 'better-auth/minimal';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare namespace YT {
	interface PlayerOptions {
		host?: string;
		videoId?: string;
		width?: string | number;
		height?: string | number;
		playerVars?: Record<string, string | number>;
		events?: {
			onStateChange?: (event: OnStateChangeEvent) => void;
		};
	}

	interface OnStateChangeEvent {
		data: number;
	}

	class Player {
		constructor(element: HTMLElement | string, options: PlayerOptions);
		destroy(): void;
	}

	const enum PlayerState {
		ENDED = 0,
		PLAYING = 1,
		PAUSED = 2
	}
}

declare global {
	interface Window {
		YT?: typeof YT;
		onYouTubeIframeAPIReady?: () => void;
	}

	namespace App {
		interface Locals {
			user?: User | null;
			session?: Session | null;
			role?: 'user' | 'admin' | 'super_admin' | null;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
