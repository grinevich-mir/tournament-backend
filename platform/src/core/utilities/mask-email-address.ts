export function maskEmailAddress(email: string): string {
    if (!email || email.indexOf('@') < 0)
        return email;

    const [prefix, domain] = email.split('@');
    const mask = '*'.repeat(prefix.length - 2);

    return `${prefix[0]}${mask}${prefix[prefix.length - 1]}@${domain}`;
}