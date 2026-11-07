function normalizeHost(hostname: string): string {
    return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function isLoopbackHost(hostname: string): boolean {
    const host = normalizeHost(hostname);
    return host === "localhost" || host === "::1" || host.startsWith("127.");
}

function isPrivateHost(hostname: string): boolean {
    const host = normalizeHost(hostname);
    return (
        isLoopbackHost(host) ||
        host === "10.0.2.2" ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
        host.endsWith(".local")
    );
}

export function resolveConvexUrl(
    rawUrl: string,
    devServerHostUri: string | undefined,
    isDevelopment: boolean,
): string {
    if (!isDevelopment) return rawUrl;

    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        return rawUrl;
    }

    if (!isLoopbackHost(url.hostname)) return rawUrl;

    if (!devServerHostUri) return rawUrl;

    let devServer: URL;
    try {
        devServer = new URL(`http://${devServerHostUri}`);
    } catch {
        return rawUrl;
    }

    if (!isPrivateHost(devServer.hostname) || isLoopbackHost(devServer.hostname)) {
        return rawUrl;
    }

    url.hostname = devServer.hostname;
    return url.toString().replace(/\/$/, "");
}
