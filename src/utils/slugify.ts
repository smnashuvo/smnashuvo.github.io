export const slugify = (text: any): string => {
	// Defensive Guard: Return empty string if value is missing or not a string
	if (!text || typeof text !== 'string') return ""; 
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')     // Replace spaces with -
		.replace(/[^\w-]+/g, '')  // Remove all non-word chars
		.replace(/--+/g, '-');    // Replace multiple - with single -
};

const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

export const withBase = (path: string) => {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${base}${normalized}`;
};