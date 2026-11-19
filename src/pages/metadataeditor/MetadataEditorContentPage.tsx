import {useEffect, useMemo, useState} from "react";
import {client} from "../../api/api.ts";
import {useParams} from "react-router-dom";
import type {ContentMetadata} from "../../api/types.ts";
import {DateInput, LanguageInput, StringInput, TextAreaInput} from "./MetadataInputs.tsx";
import {LanguagesIcon, RefreshCwIcon, SaveIcon} from "lucide-react";

type TranslationField = "translatedTitle" | "translatedTagline" | "translatedDescription";

function setTranslationValue(
	content: ContentMetadata,
	field: TranslationField,
	language: string,
	value: string,
): ContentMetadata {
	return {
		...content,
		[field]: {
			...content[field],
			[language]: value,
		},
	};
}

function addTranslationLanguage(content: ContentMetadata, key: string): ContentMetadata {
	let language = key;
	let counter = 2;

	while (
		language in content.translatedTitle ||
		language in content.translatedTagline ||
		language in content.translatedDescription
		) {
		language = `${key}${counter}`;
		counter++;
	}

	return {
		...content,
		translatedTitle: {
			...content.translatedTitle,
			[language]: content.title,
		},
		translatedTagline: {
			...content.translatedTagline,
			[language]: content.tagline,
		},
		translatedDescription: {
			...content.translatedDescription,
			[language]: content.description,
		},
	};
}

function renameTranslationLanguage(
	content: ContentMetadata,
	oldLanguage: string,
	newLanguage: string,
): ContentMetadata {
	if (!newLanguage || oldLanguage === newLanguage) {
		return content;
	}

	const renameRecordKey = (record: Record<string, string>) => {
		const {[oldLanguage]: oldValue, ...withoutOldLanguage} = record;

		return {
			...withoutOldLanguage,
			[newLanguage]: oldValue ?? record[newLanguage] ?? "",
		};
	};

	return {
		...content,
		translatedTitle: renameRecordKey(content.translatedTitle),
		translatedTagline: renameRecordKey(content.translatedTagline),
		translatedDescription: renameRecordKey(content.translatedDescription),
	};
}

export default function MetadataEditorContentPage() {
	const [content, setContent] = useState<ContentMetadata | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const {contentId} = useParams();

	useEffect(() => {
		if (!contentId) return;
		(async () => {
			try {
				setLoading(true);
				setContent(await client.getContentMetadata(contentId!));
			} catch (err) {
				setError("Failed to load library info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [contentId]);

	const allLocalizationKeys = useMemo(() => {
		if (!content) return [];
		const keys = [];
		for (const key in content.translatedTitle)
			if (content.translatedTitle[key]) keys.push(key);
		for (const key in content.translatedTagline)
			if (content.translatedTagline[key]) keys.push(key);
		for (const key in content.translatedDescription)
			if (content.translatedDescription[key]) keys.push(key);

		return [...new Set(keys)];
	}, [content]);

	if (!contentId) {
		return <div>Invalid URL</div>
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!content) return <div>library is null!</div>;

	return (<>
		<div className={"titleWithButton"}>
			<h2>Edit Content</h2>
			<button className={"settingsInput-button settingsInput-save"}
					style={{marginTop: "16px"}}
					onClick={() => {
						setLoading(true);
						client.refreshContentMetadata(contentId, false).then(x => {
							setContent(x);
							setLoading(false);
						})
					}}>
				<RefreshCwIcon/>
				<span>Refresh with plugins</span>
			</button>
		</div>
		<p>ID: <code>{content.id}</code></p>
		<StringInput label={"Title"} value={content.title} onChange={v => setContent({...content, title: v})}/>
		<StringInput label={"Tagline"} value={content.tagline} onChange={v => setContent({...content, tagline: v})}/>
		<TextAreaInput label={"Description"} value={content.description}
					   onChange={v => setContent({...content, description: v})}/>
		<StringInput label={"Poster URL"} value={content.poster || ""}
					 onChange={v => setContent({...content, poster: v})} placeholder={"Leave blank to remove"}/>
		<StringInput label={"Banner URL"} value={content.banner || ""}
					 onChange={v => setContent({...content, banner: v})} placeholder={"Leave blank to remove"}/>
		<StringInput label={"Logo URL"} value={content.logo || ""} onChange={v => setContent({...content, logo: v})}
					 placeholder={"Leave blank to remove"}/>
		<StringInput label={"Backdrop URL"} value={content.backdrop || ""}
					 onChange={v => setContent({...content, backdrop: v})} placeholder={"Leave blank to remove"}/>
		<StringInput label={"Thumbnail URL"} value={content.thumbnail || ""}
					 onChange={v => setContent({...content, thumbnail: v})} placeholder={"Leave blank to remove"}/>
		<div className={"doubleRow"}>
			<DateInput label={"Release Date"} value={content.releasedAt.substring(0, 16)}
					   onChange={v => setContent({...content, releasedAt: v + ":00Z"})}/>
			<DateInput label={"End Date"} value={content.finishedStreamingAt?.substring(0, 16) ?? ""}
					   onChange={v => setContent({...content, finishedStreamingAt: v && (v + ":00Z")})}/>
		</div>

		<div className={"titleWithButton"}>
			<h3>Translations</h3>
			<button className={"settingsInput-button settingsInput-save"}
					onClick={() => {
						setContent(current => {
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
						setContent(current => {
							if (current == null) return null;
							return renameTranslationLanguage(current, language, newLanguage.trim());
						});
					}}
				/>
				<StringInput
					label={"Title"}
					value={content.translatedTitle[language] ?? ""}
					onChange={value => {
						setContent(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedTitle", language, value);
						});
					}}
				/>
				<StringInput
					label={"Tagline"}
					value={content.translatedTagline[language] ?? ""}
					onChange={value => {
						setContent(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedTagline", language, value);
						});
					}}
				/>
				<TextAreaInput
					label={"Description"}
					value={content.translatedDescription[language] ?? ""}
					onChange={value => {
						setContent(current => {
							if (current == null) return null;
							return setTranslationValue(current, "translatedDescription", language, value);
						});
					}}
				/>
			</details>
		))}

		<div style={{height: '32px'}}/>

		<button onClick={async () => {
			const result = await client.setContentMetadata(content);
			if (result.success && result.data)
				setContent(result.data);
			else
				alert(result.message);
		}} className={"settingsInput-button settingsInput-save"}>
			<SaveIcon/>
			<span>Save Content</span>
		</button>
	</>);
}