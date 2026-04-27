import "./WatchScreen.css";
import {
	ChevronLeft,
	Headphones,
	Maximize, Minimize,
	Pause,
	Play,
	Settings,
	Type,
	Volume,
	Volume1,
	Volume2,
	VolumeX
} from "react-feather";
import {type JSX, type UIEventHandler, useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import type {Video} from "../api/types.ts";
import {client} from "../api/api.ts";
import Hls from "hls.js";

/*
import {useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import type {Video} from "../api/types.ts";
import {client} from "../api/api.ts";
import Hls from "hls.js";
*/


function PlayerButton(props: { icon: JSX.Element, tooltip: string, onclick: () => void }) {
	return (<div className={"videoPlayer-button"} title={props.tooltip} onClick={props.onclick}>
		{props.icon}
	</div>);
}

function toHhMmSs(timestamp: number) {
	const hours = Math.floor(timestamp / 3600);
	const minutes = Math.floor(timestamp / 60);
	const seconds = Math.floor(timestamp % 60);
	return hours > 0
		? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
		: `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function WatchScreen() {
	const navigate = useNavigate();
	const {videoId} = useParams();
	const [video, setVideo] = useState<Video | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);
	const [playing, setPlaying] = useState<boolean>(false);
	const [time, setTime] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);
	const [volume, setVolume] = useState<number>(1);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				setVideo(await client.getVideo(videoId!));
			} catch (e) {
				setError(e as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, [videoId]);

	useEffect(() => {
		if (!video) return;
		let hls: Hls | undefined = undefined;

		if (videoRef.current) {
			if (Hls.isSupported()) {
				hls = new Hls();
				hls.loadSource(client.getMediaUrl(videoId!));
				hls.attachMedia(videoRef.current);
				hls.on(Hls.Events.MANIFEST_PARSED, async () => {
					await videoRef.current?.play();
				});
			} else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
				// For Safari (native HLS support)
				videoRef.current.src = client.getMediaUrl(videoId!);
				videoRef.current.addEventListener('loadedmetadata', () => {
					videoRef.current?.play();
				});
			}
		}

		return () => {
			videoRef.current?.pause();
			if (hls) {
				hls.destroy();
			}
		};
	}, [video, videoId]);

	function togglePlay() {
		if (playing)
			videoRef.current?.pause();
		else
			videoRef.current?.play();
	}

	function toggleMuted() {
		if (videoRef.current)
			videoRef.current.muted = !videoRef.current.muted;

		if (videoRef.current?.muted) setVolume(0);
	}

	async function toggleFullscreen() {
		const playerParentElement = videoRef.current?.parentElement?.parentElement;
		if (document.fullscreenElement === playerParentElement)
			await document.exitFullscreen();
		else
			await playerParentElement?.requestFullscreen();
	}

	function adjustVolume(dir: number) {
		if (videoRef.current) {
			if (dir > 0) {
				try {
					videoRef.current.volume += .05;
				} catch (e) {
					videoRef.current.volume = 1;
				}
			} else {
				try {
					videoRef.current.volume -= .05;
				} catch (e) {
					videoRef.current.volume = 0;
				}
			}
		}
	}

	useEffect(() => {
		document.addEventListener("fullscreenchange", (_) => {
			setIsFullscreen(document.fullscreenElement === videoRef.current?.parentElement?.parentElement)
		});
	}, []);

	return (<div className={"videoPlayer"}>
		<div className={"videoPlayer-player"}
		     onClick={togglePlay}
		     onDoubleClick={toggleFullscreen}
		     onWheel={event => {
				 if (event.deltaY < 0)
					 adjustVolume(1)
				 else
					 adjustVolume(-1)
			 }}>
			<video
				ref={videoRef}
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
				onDurationChange={e => setDuration(e.currentTarget.duration)}
				onVolumeChange={e => setVolume(e.currentTarget.muted ? 0 : e.currentTarget.volume)}
			/>
			<canvas/>
		</div>
		<div className={"videoPlayer-info"}>
			<PlayerButton icon={<ChevronLeft/>} tooltip={"Go Back"} onclick={() => {
				navigate(-1);
			}}/>
			{loading
				? (<div className={"videoPlayer-meta"}>
					<div className={"videoPlayer-title"}>Loading...</div>
				</div>)
				: video
					? (<div className={"videoPlayer-meta"}>
						<div className={"videoPlayer-title"}>Video - kuylar you forgot to put the content title in the
							api response. lmao
						</div>
						<div
							className={"videoPlayer-subtitle"}>{video.episode && (`S${video.episode.seasonNumber.toString().padStart(2, '0')} E${video.episode.episodeNumber.toString().padStart(2, '0')}: ${video.episode.translatedTitle ?? video.episode.originalTitle}`)}
						</div>
					</div>)
					: (<div className={"videoPlayer-meta"}>
						<div className={"videoPlayer-title"}>Video</div>
					</div>)}
		</div>
		<div className={"videoPlayer-controls"}>
			<PlayerButton icon={playing ? <Pause/> : <Play/>}
			              tooltip={playing ? "Pause" : "Play"}
			              onclick={togglePlay}/>
			<PlayerButton
				icon={volume > .7 ? <Volume2/> : volume > .2 ? <Volume1/> : volume > 0 ? <Volume/> : <VolumeX/>}
				tooltip={"Mute"} onclick={toggleMuted}/>
			<div className={"videoPlayer-currentTime"}>{toHhMmSs(time)}</div>
			<span>/</span>
			<div className={"videoPlayer-duration"}>{toHhMmSs(duration)}</div>
			<div className={"flex-divider"}/>
			<PlayerButton icon={<Type/>} tooltip={"Subtitles"} onclick={() => {

			}}/>
			<PlayerButton icon={<Headphones/>} tooltip={"Audio Track"} onclick={() => {

			}}/>
			<PlayerButton icon={<Settings/>} tooltip={"Settings"} onclick={() => {

			}}/>
			<PlayerButton icon={isFullscreen ? <Minimize/> : <Maximize/>}
			              tooltip={isFullscreen ? "Exit Full Screen" : "Full Screen"} onclick={toggleFullscreen}/>
		</div>
	</div>)
}