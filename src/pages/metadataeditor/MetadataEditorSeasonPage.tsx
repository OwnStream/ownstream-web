import "../settings/ProgressBar.css"
import {useEffect, useMemo, useState} from "react";
import {client} from "../../api/api.ts";
import {useParams} from "react-router-dom";
import type {SeasonMetadata} from "../../api/types.ts";
import {LanguageInput, StringInput, TextAreaInput} from "./MetadataInputs.tsx";
import {LanguagesIcon, RefreshCwIcon, SaveIcon} from "lucide-react";

type TranslationField = "translatedTitle" | "translatedDescription";

function setTranslationValue(
	episode: SeasonMetadata,
	field: TranslationField,
	language: string,
	value: string,
): SeasonMetadata {
	return {
		...episode,
		[field]: {
			...episode[field],
			[language]: value,
		},
	};
}

function addTranslationLanguage(episode: SeasonMetadata, key: string): SeasonMetadata {
	let language = key;
	let counter = 2;

	while (
		language in episode.translatedTitle ||
		language in episode.translatedDescription
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
		translatedDescription: {
			...episode.translatedDescription,
			[language]: episode.description,
		},
	};
}

function renameTranslationLanguage(
	episode: SeasonMetadata,
	oldLanguage: string,
	newLanguage: string,
): SeasonMetadata {
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
		translatedDescription: renameRecordKey(episode.translatedDescription),
	};
}

export default function MetadataEditorSeasonPage() {
	const [season, setSeason] = useState<SeasonMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const {contentId, seasonIndex} = useParams();

	useEffect(() => {
		if (!contentId || !seasonIndex) return;
		(async () => {
			try {
				setLoading(true);
				setSeason(await client.getSeasonMetadata(contentId, Number.parseInt(seasonIndex)));
			} catch (err) {
				setError("Failed to load season info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [contentId, seasonIndex]);

	const allLocalizationKeys = useMemo(() => {
		if (!season) return [];
		const keys = [];
		for (const key in season.translatedTitle)
			if (season.translatedTitle[key]) keys.push(key);
		for (const key in season.translatedDescription)
			if (season.translatedDescription[key]) keys.push(key);

		return [...new Set(keys)];
	}, [season]);

	if (!contentId || !seasonIndex) {
		return <div>Invalid URL</div>
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!season) return <div>library is null!</div>;

	return (<>
		<div className={"titleWithButton"}>
			<h2>Season Information</h2>
			<button className={"settingsInput-button settingsInput-save"}
					style={{marginTop: "16px"}}
					onClick={() => {
						setLoading(true);
						client.refreshSeasonMetadata(contentId, Number.parseInt(seasonIndex), false).then(x => {
							setSeason(x);
							setLoading(false);
						})
					}}>
				<RefreshCwIcon/>
				<span>Refresh with plugins</span>
			</button>
		</div>


		<StringInput label={"Title"} value={season.title}
					 onChange={v => setSeason({...season, title: v || `Season ${seasonIndex}`})}
					 placeholder={`Season ${seasonIndex}`}/>
		<TextAreaInput label={"Description"} value={season.description || ""}
					   onChange={v => setSeason({...season, description: v})} placeholder={""}/>
		<StringInput label={"Poster URL"} value={season.poster || ""}
					 onChange={v => setSeason({...season, poster: v})} placeholder={"Leave blank to remove"}/>

		<div className={"titleWithButton"}>
			<h3>Translations</h3>
			<button className={"settingsInput-button settingsInput-save"}
					onClick={() => {
						setSeason(current => {
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
						setSeason(current => {
							if (current == null) return null;
							return renameTranslationLanguage(current, language, newLanguage.trim());
						});
					}}
				/>
				<StringInput
					label={"Title"}
					value={season.translatedTitle[language] ?? ""}
					onChange={value => {
						setSeason(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedTitle", language, value);
						});
					}}
				/>
				<StringInput
					label={"Summary"}
					value={season.translatedDescription[language] ?? ""}
					onChange={value => {
						setSeason(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedDescription", language, value);
						});
					}}
				/>
			</details>
		))}

		<div style={{height: '32px'}}/>

		<button onClick={async () => {
			const result = await client.setSeasonMetadata(season);
			if (result.success && result.data)
				setSeason(result.data);
			else
				alert(result.message);
		}} className={"settingsInput-button settingsInput-save"}>
			<SaveIcon/>
			<span>Save Content</span>
		</button>
	</>);
}