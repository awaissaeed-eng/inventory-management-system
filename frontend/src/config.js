const raw = process.env.REACT_APP_API_URL;

function normalizeApiUrl(rawUrl) {
	if (!rawUrl) return 'http://localhost:5000';
	// If already has scheme, return without trailing slash
	if (/^https?:\/\//i.test(rawUrl)) return rawUrl.replace(/\/$/, '');
	// Otherwise assume http and prepend
	return `http://${rawUrl.replace(/\/$/, '')}`;
}

export const API_URL = normalizeApiUrl(raw);
