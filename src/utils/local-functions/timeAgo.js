export const getTimeAgo = (createdAt) => {
    const now = new Date();
    const diffMs = now - new Date(createdAt);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return diffMinutes <= 1 ? "a minute ago" : `${diffMinutes} minutes ago`;
        }
        return diffHours === 1 ? "an hour ago" : `${diffHours} hours ago`;
    }

    if (diffDays < 7) return diffDays === 1 ? "a day ago" : `${diffDays} days ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? "a month ago" : `${months} months ago`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "a year ago" : `${years} years ago`;
};
