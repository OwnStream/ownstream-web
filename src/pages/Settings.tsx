import "./Settings.css";
import {type ChangeEvent, type ReactElement, useCallback, useEffect, useState} from "react";
import {client} from "../api/api.ts";
import {
	AlertOctagon,
	Check, Clock,
	Film,
	Image,
	Play,
	PlayCircle,
	Plus,
	Save, Slash,
	StopCircle,
	Trash2,
	Video,
	Zap
} from "react-feather";
import type {AudioPreset, Configuration, VideoPreset} from "../api/configTypes.ts";


interface StringInputProps {
	icon?: ReactElement;
	value: string;
	onChange: (value: string) => void;
	label: string;
	min?: number;
	max?: number;
}

function StringInput({icon, value, onChange, label, min, max}: StringInputProps) {
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className={"settingsInput"}>
			{icon && (
				<span className="settingsInput-icon">
					{icon}
				</span>
			)}
			<label className={"settingsInput-text"}>
				{label}
			</label>
			<input
				type="text"
				value={value}
				onChange={handleInputChange}
				min={min}
				max={max}
				className={"settingsInput-string"}
			/>
		</div>
	);
}

interface NumberInputProps {
	icon?: ReactElement;
	value: number;
	onChange: (value: number) => void;
	label: string;
	min?: number;
	max?: number;
}

function NumberInput({icon, value, onChange, label, min, max}: NumberInputProps) {
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newValue = parseInt(e.target.value, 10);
		if (!isNaN(newValue)) {
			onChange(newValue);
		}
	};

	return (
		<div className={"settingsInput"}>
			{icon && (
				<span className="settingsInput-icon">
					{icon}
				</span>
			)}
			<label className={"settingsInput-text"}>
				{label}
			</label>
			<input
				type="number"
				value={value}
				onChange={handleInputChange}
				min={min}
				max={max}
				className={"settingsInput-number"}
			/>
		</div>
	);
}

interface EnumInputProps {
	icon?: ReactElement;
	value: string;
	values: Record<string, string>;
	onChange: (value: string) => void;
	label: string;
}

function EnumInput({icon, value, values, onChange, label}: EnumInputProps) {
	const handleInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className={"settingsInput"}>
			{icon && (
				<span className="settingsInput-icon">
					{icon}
				</span>
			)}
			<label className={"settingsInput-text"}>
				{label}
			</label>
			<select onChange={handleInputChange} className={"settingsInput-select"}>
				{Object.entries(values).map(([key, label]) => (
					<option key={key} value={key} selected={value === key}>{label}</option>
				))}
			</select>
		</div>
	);
}

interface ButtonProps {
	onClick: () => void;
}

function SaveButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-save"}>
			<Save/>
			<span>Save changes</span>
		</button>
	)
}

function DeleteButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-delete"}>
			<Trash2/>
			<span>Delete</span>
		</button>
	)
}

function AddButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-save"}>
			<Plus/>
			<span>Add</span>
		</button>
	)
}

function StartBenchmarkButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-save"}>
			<Play/>
			<span>Start Benchmark</span>
		</button>
	)
}

function StopBenchmarkButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-delete"}>
			<StopCircle/>
			<span>Stop Benchmark</span>
		</button>
	)
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
	if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function calculateFileSize(bitratePerSecond: number, minutes: number): number {
	return (bitratePerSecond / 8) * (minutes * 60);
}

function VideoPreset(props: { preset: VideoPreset; onChange: (preset: VideoPreset) => void; onDelete: () => void }) {
	const preset = props.preset;
	return (
		<div className={"settingsPreset"}>
			<StringInput value={preset.name} onChange={(value) => {
				props.onChange({...preset, name: value});
			}} label={"Name"}/>
			<p className={"settingsInput-info"}>
				Displayed in the format selectors.
			</p>
			<NumberInput value={preset.bitrate} onChange={(value) => {
				props.onChange({...preset, bitrate: value});
			}} label={"Bitrate"}/>
			<p className={"settingsInput-info"}>
				Estimated file sizes: 24 min: {formatBytes(calculateFileSize(preset.bitrate, 24))}, 40
				min: {formatBytes(calculateFileSize(preset.bitrate, 40))}, 90
				min: {formatBytes(calculateFileSize(preset.bitrate, 90))}
			</p>
			<NumberInput value={preset.width} onChange={(value) => {
				props.onChange({...preset, width: value});
			}} label={"Width"}/>
			<p className={"settingsInput-info"}>
				Video resolution is based on the width. Input aspect ratios will be kept as is. For your input,
				16:9 → {preset.width}x{Math.round(preset.width / 16 * 9)},
				4:3 → {preset.width}x{Math.round(preset.width / 4 * 3)},
				2.40:1 → {preset.width}x{Math.round(preset.width / 2.40)}
			</p>
			<EnumInput value={preset.codec} values={{
				"libx264": "H.264 (Software)",
				"h264_amf": "H.264 (AMD AMF)",
				"h264_nvenc": "H.264 (NVIDIA NVENC)",
				"h264_qsv": "H.264 (Intel Quick Sync)",
				"h264_vaapi": "H.264 (Linux VAAPI)",
				"h264_vulkan": "H.264 (Vulkan)",

				"libx265": "H.265/HEVC (Software)",
				"hevc_amf": "H.265/HEVC (AMD AMF)",
				"hevc_nvenc": "H.265/HEVC (NVIDIA NVENC)",
				"hevc_qsv": "H.265/HEVC (Intel Quick Sync)",
				"hevc_vaapi": "H.265/HEVC (Linux VAAPI)",
				"hevc_vulkan": "H.265/HEVC (Vulkan)",

				"libvpx-vp9": "VP9 (Software)",
				"vp9_vaapi": "VP9 (VAAPI)",
				"vp9_qsv": "VP9 (Intel Quick Sync)",

				"libsvtav1": "AV1 (Software, SVT-AV1)",
				"librav1e": "AV1 (Software, librav1e)",
				"av1_amf": "AV1 (AMD AMF)",
				"av1_nvenc": "AV1 (NVIDIA NVENC)",
				"av1_qsv": "AV1 (Intel Quick Sync)",
				"av1_vaapi": "AV1 (Linux VAAPI)",
				"av1_vulkan": "AV1 (Vulkan)",
			}} onChange={(value) => {
				props.onChange({...preset, codec: value});
			}} label={"Codec"}/>
			<p className={"settingsInput-info"}>
				Not all encoders may be available. Please run a benchmark, and only use the encoders that pass the test.
			</p>
			<DeleteButton onClick={props.onDelete}/>
		</div>
	);
}

function AudioPreset(props: { preset: AudioPreset; onChange: (preset: AudioPreset) => void; onDelete: () => void }) {
	const preset = props.preset;
	return (
		<div className={"settingsPreset"}>
			<NumberInput value={preset.bitrate} onChange={(value) => {
				props.onChange({...preset, bitrate: value});
			}} label={"Bitrate"}/>
			<EnumInput value={preset.channels.toString()} values={{
				"1": "Mono",
				"2": "Stereo",
				"6": "5.1 Surround",
				"8": "7.1 Surround"
			}} onChange={(value) => {
				props.onChange({...preset, channels: parseInt(value, 10)});
			}} label={"Channels"}/>
			{preset.channels > 2 &&
				<p className={"settingsInput-info"}>
					If the input is Stereo (2 channels), this preset will be skipped. Make sure that you also have a
					Stereo preset.
				</p>
			}
			<EnumInput value={preset.codec} values={{
				"aac": "AAC",
				"flac": "FLAC"
			}} onChange={(value) => {
				props.onChange({...preset, codec: value});
			}} label={"Codec"}/>
		</div>
	);
}

function TranscodeSettings(props: { settings: Configuration; setSettings: (settings: Configuration) => void }) {
	const settings = props.settings.transcode;

	const handleMaxVideoStreamsChange = useCallback((value: number) => {
		props.setSettings({
			...props.settings,
			transcode: {...settings, maxVideoStreams: value}
		});
	}, [props, settings]);

	const handlePixelFormatChange = useCallback((value: string) => {
		props.setSettings({
			...props.settings,
			transcode: {...settings, pixelFormatHandling: parseInt(value, 10)}
		});
	}, [props, settings]);

	const handleVideoPresetChange = useCallback((index: number, preset: VideoPreset) => {
		const newPresets = [...settings.videoPresets];
		newPresets[index] = preset;
		props.setSettings({
			...props.settings,
			transcode: {...settings, videoPresets: newPresets}
		});
	}, [props, settings]);

	const handleVideoPresetDelete = useCallback((index: number) => {
		const newPresets = settings.videoPresets.filter((_, i) => i !== index);
		props.setSettings({
			...props.settings,
			transcode: {...settings, videoPresets: newPresets}
		});
	}, [props, settings]);

	const handleVideoPresetAdd = useCallback(() => {
		const newPreset: VideoPreset = {
			name: "New Preset",
			bitrate: 5000000,
			width: 1920,
			codec: "libx264"
		};
		props.setSettings({
			...props.settings,
			transcode: {...settings, videoPresets: [...settings.videoPresets, newPreset]}
		});
	}, [props, settings]);

	const handleAudioPresetChange = useCallback((index: number, preset: AudioPreset) => {
		const newPresets = [...settings.audioPresets];
		newPresets[index] = preset;
		props.setSettings({
			...props.settings,
			transcode: {...settings, audioPresets: newPresets}
		});
	}, [props, settings]);

	const handleAudioPresetDelete = useCallback((index: number) => {
		const newPresets = settings.audioPresets.filter((_, i) => i !== index);
		props.setSettings({
			...props.settings,
			transcode: {...settings, audioPresets: newPresets}
		});
	}, [props, settings]);

	const handleAudioPresetAdd = useCallback(() => {
		const newPreset: AudioPreset = {
			bitrate: 192000,
			channels: 2,
			codec: "aac"
		};
		props.setSettings({
			...props.settings,
			transcode: {...settings, audioPresets: [...settings.audioPresets, newPreset]}
		});
	}, [props, settings]);

	const saveSettings = async () => {
		try {
			props.setSettings(await client.updateConfig(props.settings));
		} catch (e) {
			alert(`Failed to save settings\n${e}`);
		}
	}

	return (<>
		<h2>Transcoding</h2>
		<NumberInput
			icon={<Film/>}
			value={settings.maxVideoStreams}
			onChange={handleMaxVideoStreamsChange}
			label="Max Video Streams"
		/>
		<p className={"settingsInput-info"}>
			To save on storage space, only encode the best {settings.maxVideoStreams} video streams.
		</p>
		<EnumInput
			icon={<Image/>}
			value={settings.pixelFormatHandling.toString()}
			onChange={handlePixelFormatChange}
			label="10-bit handling"
			values={{
				1: "Always downsample",
				0: "Downsample if unsupported by the encoder",
				2: "Use software encoding if unsupported by the encoder",
				3: "Skip preset if unsupported by the encoder"
			}}
		/>
		<p className={"settingsInput-info"}>
			Not all clients or encoders might support 10-bit color.
		</p>
		<div style={{borderBottom: "1px solid #666", paddingBottom: "12px"}}>
			<h2>Video Presets</h2>
			{settings.videoPresets.map((preset, index) => (
				<VideoPreset
					key={index}
					preset={preset}
					onChange={(updatedPreset) => handleVideoPresetChange(index, updatedPreset)}
					onDelete={() => handleVideoPresetDelete(index)}
				/>
			))}
			<AddButton onClick={handleVideoPresetAdd}/>
		</div>
		<div style={{borderBottom: "1px solid #666", paddingBottom: "12px"}}>
			<h2>Audio Presets</h2>
			{settings.audioPresets.map((preset, index) => (
				<AudioPreset
					key={index}
					preset={preset}
					onChange={(updatedPreset) => handleAudioPresetChange(index, updatedPreset)}
					onDelete={() => handleAudioPresetDelete(index)}
				/>
			))}
			<AddButton onClick={handleAudioPresetAdd}/>
		</div>
		<SaveButton onClick={saveSettings}/>
	</>);
}

function EncoderRow(props: {
	encoder: string,
	label: string,
	state: "RUNNING" | "FAIL" | "COMPLETE" | "WAITING",
	score?: number
}) {
	let icon = <Clock/>
	let className = "encoderBenchmarkItem-icon_waiting"
	switch (props.state) {
		case "RUNNING":
			icon = <PlayCircle/>
			className = "encoderBenchmarkItem-icon_running"
			break;
		case "FAIL":
			icon = <Slash/>
			className = "encoderBenchmarkItem-icon_failed"
			break;
		case "COMPLETE":
			icon = <Check/>
			className = "encoderBenchmarkItem-icon_complete"
			break;
		case "WAITING":
			icon = <Clock/>
			className = "encoderBenchmarkItem-icon_waiting"
			break;
	}
	return (<div className={"encoderBenchmarkItem"}>
		<div className={`encoderBenchmarkItem-icon ${className}`}>{icon}</div>
		<div className={"encoderBenchmarkItem-info"}>
			<span className={"encoderBenchmarkItem-label"}>{props.label}</span>
			<span className={"encoderBenchmarkItem-stats"}>
				<code>{props.encoder}</code> &bull; {props.score == -1
				? <>Unsupported</>
				: props.score != null
					? (<>{(30000 / props.score).toFixed(2)}x</>)
					: props.state == "WAITING"
						? (<>Waiting...</>)
						: props.state == "FAIL"
							? (<>Skipped</>)
							: (<>Running...</>)}
			</span>
		</div>
	</div>);
}

function BenchmarkTab() {
	const [running, setRunning] = useState(false);
	const [encoders, setEncoders] = useState<Record<string, string>>({});
	const [encoderStates, setEncoderStates] = useState<Record<string, "RUNNING" | "FAIL" | "COMPLETE" | "WAITING">>({});
	const [results, setResults] = useState<Record<string, number | undefined>>({});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!running) {
			return;
		}

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setError(null);

		const eventSource = new EventSource(`${client.baseUrl}/api/settings/benchmark?access_token=${client.token}`, {});

		eventSource.addEventListener("encoders", (event) => {
			const encoders: Record<string, string> = JSON.parse(event.data);
			console.log("[Benchmark] Got encoders", encoders)
			setEncoders(encoders);
			const encoderStates: Record<string, "RUNNING" | "FAIL" | "COMPLETE" | "WAITING"> = {};
			Object.entries(encoders).forEach(([encoder]) => {
				encoderStates[encoder] = "WAITING";
			})
			setEncoderStates(encoderStates);
		});

		eventSource.addEventListener("results", (event) => {
			const results = JSON.parse(event.data);
			console.log("[Benchmark] Results were updated", results)
			setResults(results);
		});

		eventSource.addEventListener("state", (event) => {
			const data = JSON.parse(event.data);
			console.log(`[Benchmark] ${data.encoder}: ${data.state}`)
			setEncoderStates((prev) => ({...prev, [data.encoder]: data.state}));
		});

		eventSource.addEventListener("done", () => {
			console.log(`[Benchmark] Complete`)
			setRunning(false);
			eventSource.close();
		});

		eventSource.onerror = () => {
			console.log(`[Benchmark] Failed`)
			setError("Benchmark stream disconnected.");
			setRunning(false);
			eventSource.close();
		};

		return () => {
			eventSource.close();
		};
	}, [running]);

	const all = Object.entries(encoders).length;
	const complete = Object.entries(encoderStates).filter(([_, state]) => state === "FAIL" || state === "COMPLETE").length;

	return (<>
		<h2>Benchmark</h2>
		{running ?
			<StopBenchmarkButton onClick={() => {
				setEncoderStates((prev) => {
					const updated = {...prev};
					Object.entries(updated).forEach(([encoder, state]) => {
						if (state === "RUNNING" || state === "WAITING") {
							updated[encoder] = "FAIL";
						}
					});
					return updated;
				});
				setRunning(false);
			}}/>
			:
			<StartBenchmarkButton onClick={() => {
				setRunning(true);
			}}/>
		}

		{running && <div>{complete} / {all} benchmarks complete.</div>}

		{error && <div>{error}</div>}

		<div className={"encoderBenchmark"}>
			{Object.entries(encoders)
				.sort(([encoderA], [encoderB]) => {
					const stateA = encoderStates[encoderA] || "WAITING";
					const stateB = encoderStates[encoderB] || "WAITING";
					const scoreA = results[encoderA];
					const scoreB = results[encoderB];
					if (stateA === "RUNNING" && stateB !== "RUNNING") return -1;
					if (stateA !== "RUNNING" && stateB === "RUNNING") return 1;
					if (stateA === "WAITING" && stateB !== "WAITING") return 1;
					if (stateA !== "WAITING" && stateB === "WAITING") return -1;
					if (stateA === "FAIL" && stateB !== "FAIL" && stateB !== "WAITING") return 1;
					if (stateA !== "FAIL" && stateB === "FAIL" && stateA !== "WAITING") return -1;
					if (stateA === "COMPLETE" && stateB === "COMPLETE") {
						if (scoreA === -1 && scoreB === -1) return 0;
						if (scoreA === -1) return 1;
						if (scoreB === -1) return -1;
						// @ts-expect-error If both are complete, scores should never be null.
						return scoreA - scoreB;
					}

					return 0;
				})
				.map(([encoder, label]) => (
					<EncoderRow encoder={encoder} label={label} state={encoderStates[encoder] || "WAITING"}
					            score={results[encoder]}/>
				))}
		</div>
	</>);
}

export default function Settings() {
	const [settings, setSettings] = useState<Configuration | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState<string>("transcode");

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setSettings(await client.getConfig());
			} catch (err) {
				setError("Failed to load shelves: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!settings) return <div>settings is null!</div>;

	return (
		<>
			<div className={"settingsPage"}>
				<div className={"settingsCategories"}>
					<div tabIndex={0} className={`settingsCategory ${tab == "transcode" && "active"}`}
					     onClick={() => setTab("transcode")}><Video/><span>Transcoding</span></div>
					<div tabIndex={0} className={`settingsCategory ${tab == "benchmark" && "active"}`}
					     onClick={() => setTab("benchmark")}><Zap/><span>Benchmark</span></div>
				</div>
				<div className={"settingsItems"}>
					{tab === "transcode" && (<TranscodeSettings settings={settings} setSettings={setSettings}/>)}
					{tab === "benchmark" && (<BenchmarkTab/>)}
				</div>
			</div>
		</>
	);
}