import {Film, Image} from "react-feather";
import {useEffect, useState} from "react";
import type {AudioPreset, Configuration, VideoPreset} from "../../api/configTypes.ts";
import {client} from "../../api/api.ts";
import {AddButton, DeleteButton, EnumInput, NumberInput, SaveButton, StringInput} from "./SharedInputs.tsx";

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
			<DeleteButton onClick={props.onDelete}/>
		</div>
	);
}

// you're telling me a trans coded these settings?
export default function TranscodingSettings() {
	const [config, setConfig] = useState<Configuration | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setConfig(await client.getConfig());
			} catch (err) {
				setError("Failed to load configuration: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!config) return <div>config is null!</div>;

	const saveSettings = async () => {
		try {
			setConfig(await client.updateConfig(config));
		} catch (e) {
			alert(`Failed to save settings\n${e}`);
		}
	}
	return (<>
		<h2>Transcoding</h2>
		<NumberInput
			icon={<Film/>}
			value={config.transcode.maxVideoStreams}
			onChange={value => {
				setConfig({
					...config,
					transcode: {...config.transcode, maxVideoStreams: value}
				})
			}}
			label="Max Video Streams"
		/>
		<p className={"settingsInput-info"}>
			To save on storage space, only encode the best {config.transcode.maxVideoStreams} video streams.
		</p>
		<EnumInput
			icon={<Image/>}
			value={config.transcode.pixelFormatHandling.toString()}
			onChange={value => setConfig({
				...config,
				transcode: {...config.transcode, pixelFormatHandling: parseInt(value, 10)}
			})}
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
			{config.transcode.videoPresets.map((preset, index) => (
				<VideoPreset
					key={index}
					preset={preset}
					onChange={(updatedPreset) => {
						const newPresets = [...config.transcode.videoPresets];
						newPresets[index] = updatedPreset;
						setConfig({
							...config,
							transcode: {...config.transcode, videoPresets: newPresets}
						});
					}}
					onDelete={() => {
						const newPresets = config.transcode.videoPresets.filter((_, i) => i !== index);
						setConfig({
							...config,
							transcode: {...config.transcode, videoPresets: newPresets}
						});
					}}
				/>
			))}
			<AddButton onClick={() => {
				setConfig({
					...config,
					transcode: {
						...config.transcode,
						videoPresets: [...config.transcode.videoPresets, {
							name: "New Preset",
							bitrate: 5000000,
							width: 1920,
							codec: "libx264"
						}]
					}
				});
			}}/>
		</div>
		<div style={{borderBottom: "1px solid #666", paddingBottom: "12px"}}>
			<h2>Audio Presets</h2>
			{config.transcode.audioPresets.map((preset, index) => (
				<AudioPreset
					key={index}
					preset={preset}
					onChange={(updatedPreset) => {
						const newPresets = [...config.transcode.audioPresets];
						newPresets[index] = updatedPreset;
						setConfig({
							...config,
							transcode: {...config.transcode, audioPresets: newPresets}
						});
					}}
					onDelete={() => {
						const newPresets = config.transcode.audioPresets.filter((_, i) => i !== index);
						setConfig({
							...config,
							transcode: {...config.transcode, audioPresets: newPresets}
						});
					}}
				/>
			))}
			<AddButton onClick={() => {
				const newPreset: AudioPreset = {
					bitrate: 192000,
					channels: 2,
					codec: "aac"
				};
				setConfig({
					...config,
					transcode: {...config.transcode, audioPresets: [...config.transcode.audioPresets, newPreset]}
				});
			}}/>
		</div>
		<SaveButton onClick={saveSettings}/>
	</>);
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