import {useEffect, useState} from "react";
import {client} from "../api/api";
import type {User, LoginResponse} from "../api/types";
import {
	clearLastUsedAccountId,
	loadAccounts,
	loadLastUsedAccountId,
	saveAccounts,
	saveLastUsedAccountId,
} from "./authStorage";

type AuthStatus = "loading" | "loggedIn" | "loggedOut";

export function useAuthLogic() {
	const [status, setStatus] = useState<AuthStatus>("loading");
	const [user, setUser] = useState<User | null>(null);
	const [accounts, setAccounts] = useState(() => loadAccounts());

	useEffect(() => {
		const savedAccounts = loadAccounts();
		const activeUserId = loadLastUsedAccountId();

		const activeAccount =
			savedAccounts.find((account) => account.user.id === activeUserId) ??
			savedAccounts[0];

		if (!activeAccount) {
			setStatus("loggedOut");
			return;
		}

		client.setToken(activeAccount.token);

		client
			.whoAmI()
			.then((me) => {
				setUser(me);
				setStatus("loggedIn");
			})
			.catch(() => {
				const remaining = savedAccounts.filter(
					(account) => account.user.id !== activeAccount.user.id,
				);
				saveAccounts(remaining);
				clearLastUsedAccountId();
				setAccounts(remaining);
				setUser(null);
				setStatus("loggedOut");
			});
	}, []);

	const login = async (username: string, password: string) => {
		const response: LoginResponse = await client.login(username, password);

		if (!response.success) {
			throw new Error(response.message);
		}

		client.setToken(response.accessToken);

		const me = await client.whoAmI();
		const nextAccounts = [
			...accounts.filter((account) => account.user.id !== me.id),
			{user: me, token: response.accessToken},
		];

		setAccounts(nextAccounts);
		saveAccounts(nextAccounts);
		saveLastUsedAccountId(me.id);

		setUser(me);
		setStatus("loggedIn");
	};

	const switchAccount = async (userId: string) => {
		const account = accounts.find((a) => a.user.id === userId);
		if (!account) return;

		client.setToken(account.token);
		saveLastUsedAccountId(userId);

		const me = await client.whoAmI();
		setUser(me);
		setStatus("loggedIn");
	};

	const logout = () => {
		setUser(null);
		setStatus("loggedOut");
		clearLastUsedAccountId();
	};

	const removeAccount = (userId: string) => {
		if (user?.id === userId) {
			setUser(null);
			setStatus("loggedOut");
			clearLastUsedAccountId();
		}

		const newAccounts = accounts.filter(x => x.user.id !== userId);
		setAccounts(newAccounts);
		saveAccounts(newAccounts);
	}

	return {status, user, accounts, login, logout, switchAccount, removeAccount};
}