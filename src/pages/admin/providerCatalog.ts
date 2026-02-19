export interface AdminProviderCatalogItem {
    id: string;
    label: string;
    category: string;
    supports_models: boolean;
}

export interface AdminProviderCatalogResponse {
    providers: AdminProviderCatalogItem[];
}

export interface ProviderDropdownOption {
    label: string;
    value: string;
}

type TranslateFn = (key: string) => string;

export function toProviderDropdownOptions(
    items: AdminProviderCatalogItem[],
    translate?: TranslateFn
): ProviderDropdownOption[] {
    const out: ProviderDropdownOption[] = [];
    const seen = new Set<string>();

    for (const item of items || []) {
        const id = item?.id?.trim().toLowerCase();
        if (!id || seen.has(id)) {
            continue;
        }
        seen.add(id);

        const rawLabel = item?.label?.trim() || id;
        const label = translate ? translate(rawLabel) : rawLabel;
        out.push({ value: id, label });
    }

    return out;
}
