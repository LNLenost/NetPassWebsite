function escapeHtml(s) {
	return s.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function doRequest(method, url, data, callback, error) {
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.withCredentials = true;
	xmlHttp.onreadystatechange = () => {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200) {
				callback(xmlHttp.responseText);
			} else if (error) {
				error(xmlHttp);
			}
		}
	};
	xmlHttp.open(method, url, true);
	if (data) {
		xmlHttp.setRequestHeader("Content-Type", "application/json");
		xmlHttp.send(JSON.stringify(data));
	} else {
		xmlHttp.send(null);
	}
}
function reload() {
	location.reload();
}

const permission_map = [
	{
		level: 0,
		name: "Regular user",
	},
	{
		level: 10,
		name: "Basic Donator",
	},
	{
		level: 100,
		name: "Moderator",
	},
	{
		level: 1000,
		name: "Fox",
	},
];

const BASE_URL = "https://api.netpass.cafe";

function getRoleName(level) {
	let role_name = "";
	for (const p of permission_map) {
		if (p.level >= level) {
			role_name = p.name;
		}
	}
	return role_name;
}

doRequest("GET", `${BASE_URL}/account/me`, null, (text) => {
	const account_data = JSON.parse(text);
	document.getElementById("username").innerHTML = escapeHtml(account_data.username);
	// build the change username stuffs
	document.getElementById("change-username-form").elements["username"].value = account_data.username;
	document.getElementById("change-username-form").addEventListener("submit", (e) => {
		e.preventDefault();
		const username = document.getElementById("change-username-form").elements["username"].value;
		doRequest("PUT", `${BASE_URL}/account/me/username`, { username }, reload, reload);
		return false;
	});
	
	// build the current role and subscriptions stuffs
	document.getElementById("current-role").innerText = getRoleName(account_data.permission);
	doRequest("GET", `${BASE_URL}/subscriptions`, null, (text) => {
		const available_subs = JSON.parse(text);
		doRequest("GET", `${BASE_URL}/account/me/subscriptions/list`, null, (text) => {
			const current_subs = JSON.parse(text);
			let html = "";
			for (const sub of available_subs.subscriptions) {
				const cur_sub = current_subs.subscriptions.find((x) => x.price_id == sub.price_id);
				html += "<li>";
				html += `<strong>${escapeHtml(sub.name)}</strong><br>`;
				if (cur_sub) {
					html += "You are currently subscribed<br>";
					html += `<a class="cancel-sub" href="${BASE_URL}/account/me/subscriptions/${escapeHtml(cur_sub.id)}">Cancel Subscription</a><br>`;
				} else {
					html += `<a href="${BASE_URL}/account/me/create/${escapeHtml(sub.price_id)}">Subsribe</a><br>`;
				}
				html += `Grants role ${escapeHtml(getRoleName(sub.permission))}`;
				html += "</li>";
			}
			document.getElementById("subscriptions-list").innerHTML = html;
			for (const ele of document.getElementsByClassName("cancel-sub")) {
				ele.addEventListener("click", (e) => {
					e.preventDefault();
					doRequest("DELETE", ele.getAttribute("href"), null, reload, reload);
				});
			}
		});
	});
	
	// build the console html
	let html = "";
	for (const console of account_data.consoles) {
		html += '<li><form class="console-edit-form">';
		html += `<input type="hidden" name="mac" value="${escapeHtml(console.mac.toString())}" />`;
		html += `Name: <input name="name" type="text" maxlength="50" value="${escapeHtml(console.name || "")}" /><br>`;
		if (account_data.permission >= 10) html += `Set mii to special: <input name="special_mii" type="checkbox" ${console.special_mii ? "checked" : ""} /><br>`;
		if (account_data.permission >= 20) html += `Set mii country: <input name="mii_country" type="text" maxlength="15" value="${escapeHtml(console.mii_country || "")}" /><br>`;
		if (account_data.permission >= 20) html += `Set mii region: <input name="mii_region" type="text" maxlength="15" value="${escapeHtml(console.mii_region || "")}" /><br>`;
		html += '<input type="submit" value="save" />';
		html += '</form></li>';
	}
	document.getElementById("link_consoles").innerHTML = html;
	for (const form of document.getElementsByClassName("console-edit-form")) {
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			let post_data = {
				mac: parseInt(form.elements["mac"].value, 10),
			};
			for (const key of ["name", "mii_country", "mii_region"]) {
				if (form.elements[key].value) post_data[key] = form.elements[key].value;
			}
			post_data.special_mii = form.elements["special_mii"].checked;
			doRequest("PUT", `${BASE_URL}/account/me/console/${form.elements["mac"].value}`, post_data, reload, reload);
			return false;
		});
	}
	
	// add new console callback
	document.getElementById("link_new_console").addEventListener("click", (e) => {
		e.preventDefault();
		doRequest("GET", `${BASE_URL}/auth/methods/add_console`, null, (text) => {
			const data = JSON.parse(text);
			location.replace(data.methods[0].url);
		});
	});
	
	// build the 3pid html
	doRequest("GET", `${BASE_URL}/auth/methods/add_third_party`, null, (text) => {
		const data = JSON.parse(text);
		let html = "";
		for (const method of data.methods) {
			if (!account_data.ext_auth.includes(method.slug)) {
				html += `<li><a href="${escapeHtml(method.url)}">Login with ${escapeHtml(method.name)}</a></li>`;
			} else {
				html += `<li>${escapeHtml(method.name)}: Already linked. <a class="account-3pid-unlink" href="${BASE_URL}/account/me/auth/${escapeHtml(method.slug)}">Unlink</a></li>`;
			}
		}
		document.getElementById("link_methods").innerHTML = html;
		for (const ele of document.getElementsByClassName("account-3pid-unlink")) {
			ele.addEventListener("click", (e) => {
				e.preventDefault();
				doRequest("DELETE", ele.getAttribute("href"), null, reload, reload);
			});
		}
	});
}, (err) => {
	location.replace("/");
});
