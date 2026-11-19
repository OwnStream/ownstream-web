import {useEffect, useMemo, useState} from "react";
import {client} from "../../api/api.ts";
import {useParams} from "react-router-dom";
import type {EpisodeMetadata} from "../../api/types.ts";
import {DateInput, LanguageInput, NumberInput, StringInput, TextAreaInput} from "./MetadataInputs.tsx";
import {LanguagesIcon, RefreshCwIcon, SaveIcon} from "lucide-react";

type TranslationField = "translatedTitle" | "translatedSummary";

function setTranslationValue(
	episode: EpisodeMetadata,
	field: TranslationField,
	language: string,
	value: string,
): EpisodeMetadata {
	return {
		...episode,
		[field]: {
			...episode[field],
			[language]: value,
		},
	};
}

function addTranslationLanguage(episode: EpisodeMetadata, key: string): EpisodeMetadata {
	let language = key;
	let counter = 2;

	while (
		language in episode.translatedTitle ||
		language in episode.translatedSummary
		) {
		language = `${key}${counter}`;
		counter++;
	}

	return {
		...episode,
		translatedTitle: {
			...episode.translatedTitle,
			[language]: episode.title,
		},
		translatedSummary: {
			...episode.translatedSummary,
			[language]: episode.summary,
		},
	};
}

function renameTranslationLanguage(
	episode: EpisodeMetadata,
	oldLanguage: string,
	newLanguage: string,
): EpisodeMetadata {
	if (!newLanguage || oldLanguage === newLanguage) {
		return episode;
	}

	const renameRecordKey = (record: Record<string, string>) => {
		const {[oldLanguage]: oldValue, ...withoutOldLanguage} = record;

		return {
			...withoutOldLanguage,
			[newLanguage]: oldValue ?? record[newLanguage] ?? "",
		};
	};

	return {
		...episode,
		translatedTitle: renameRecordKey(episode.translatedTitle),
		translatedSummary: renameRecordKey(episode.translatedSummary),
	};
}

export default function MetadataEditorEpisodePage() {
	const [episode, setEpisode] = useState<EpisodeMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const {episodeId} = useParams();

	useEffect(() => {
		if (!episodeId) return;
		(async () => {
			try {
				setLoading(true);
				setEpisode(await client.getEpisodeMetadata(episodeId!));
			} catch (err) {
				setError("Failed to load episode info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [episodeId]);

	const allLocalizationKeys = useMemo(() => {
		if (!episode) return [];
		const keys = [];
		for (const key in episode.translatedTitle)
			if (episode.translatedTitle[key]) keys.push(key);
		for (const key in episode.translatedSummary)
			if (episode.translatedSummary[key]) keys.push(key);

		return [...new Set(keys)];
	}, [episode]);

	if (!episodeId) {
		return <div>Invalid URL</div>
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!episode) return <div>library is null!</div>;

	return (<>
		<div className={"titleWithButton"}>
			<h2>Edit Episode</h2>
			<button className={"settingsInput-button settingsInput-save"}
					style={{marginTop: "16px"}}
					onClick={() => {
						setLoading(true);
						client.refreshEpisodeMetadata(episodeId, false).then(x => {
							setEpisode(x);
							setLoading(false);
						})
					}}>
				<RefreshCwIcon/>
				<span>Refresh with plugins</span>
			</button>
		</div>

		<p>ID: <code>{episode.id}</code></p>
		<StringInput label={"Title"} value={episode.title} onChange={v => setEpisode({...episode, title: v})}/>
		<div className={"doubleRow"}>
			<NumberInput label={"Season"} value={episode.season} onChange={v => setEpisode({...episode, season: v})}/>
			<NumberInput label={"Episode"} value={episode.episode}
			             onChange={v => setEpisode({...episode, episode: v})}/>
		</div>
		<TextAreaInput label={"Summary"} value={episode.summary}
					   onChange={v => setEpisode({...episode, summary: v})}/>
		<StringInput label={"Thumbnail URL"} value={episode.thumbnail || ""}
					 onChange={v => setEpisode({...episode, thumbnail: v})} placeholder={"Leave blank to remove"}/>
		<DateInput label={"Release Date"} value={episode.releasedAt.substring(0, 16)}
				   onChange={v => setEpisode({...episode, releasedAt: v + ":00Z"})}/>

		<div className={"titleWithButton"}>
			<h3>Translations</h3>
			<button className={"settingsInput-button settingsInput-save"}
					onClick={() => {
						setEpisode(current => {
							if (current == null) return null;
							const key = prompt("Enter the key for the new translation: (e.g: en_US, fr)");
							if (key == null || key.length === 0) return current;
							return addTranslationLanguage(current, key);
						});
					}}>
				<LanguagesIcon/>
				<span>Add Translation</span>
			</button>
		</div>
		{allLocalizationKeys.map(language => (
			<details key={language}>
				<summary>
					<b>{language}</b>
				</summary>
				<LanguageInput
					label={"Language"}
					value={language}
					onChange={newLanguage => {
						setEpisode(current => {
							if (current == null) return null;
							return renameTranslationLanguage(current, language, newLanguage.trim());
						});
					}}
				/>
				<StringInput
					label={"Title"}
					value={episode.translatedTitle[language] ?? ""}
					onChange={value => {
						setEpisode(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedTitle", language, value);
						});
					}}
				/>
				<StringInput
					label={"Summary"}
					value={episode.translatedSummary[language] ?? ""}
					onChange={value => {
						setEpisode(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedSummary", language, value);
						});
					}}
				/>
			</details>
		))}

		<div style={{height: '32px'}}/>

		<button onClick={async () => {
			const result = await client.setEpisodeMetadata(episode);
			if (result.success && result.data)
				setEpisode(result.data);
			else
				alert(result.message);
		}} className={"settingsInput-button settingsInput-save"}>
			<SaveIcon/>
			<span>Save Content</span>
		</button>
	</>);
}