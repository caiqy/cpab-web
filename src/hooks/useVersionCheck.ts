import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/config';

interface VersionInfo {
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    releaseUrl: string;
    commit: string;
    buildDate: string;
    checkError?: string;
}

interface VersionState {
    loading: boolean;
    error: string | null;
    data: VersionInfo | null;
}

export function useVersionCheck(): VersionState {
    const [state, setState] = useState<VersionState>({
        loading: true,
        error: null,
        data: null,
    });

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/v0/version`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const json = await response.json();
                setState({
                    loading: false,
                    error: null,
                    data: {
                        currentVersion: json.current_version,
                        latestVersion: json.latest_version || '',
                        hasUpdate: json.has_update,
                        releaseUrl: json.release_url || '',
                        commit: json.commit || '',
                        buildDate: json.build_date || '',
                        checkError: json.check_error,
                    },
                });
            } catch (err) {
                setState({
                    loading: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                    data: null,
                });
            }
        };

        checkVersion();
    }, []);

    return state;
}
