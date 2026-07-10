// Simplified location-utils without offline caching
import { getStates, getCities } from '@/lib/actions';

export interface StateOption {
    id: string;
    name: string;
    abbreviation?: string;
}

export interface CityOption {
    id: string;
    name: string;
    state_id?: string;
    zip_codes?: string[];
}

export async function getStatesForForm(): Promise<StateOption[]> {
    try {
        const response = await getStates(1, 1000);
        const raw: any[] = Array.isArray(response) ? response : response?.data || [];
        return raw.map((s: any) => ({
            id: String(s.id),
            name: s.state_name || s.name,
            abbreviation: s.abbreviation,
        }));
    } catch (error) {
        console.error('Failed to fetch states:', error);
        return [];
    }
}

export async function getCitiesForForm(stateId?: string): Promise<CityOption[]> {
    try {
        const response = await getCities(undefined, undefined, undefined, undefined, stateId);
        const raw: any[] = Array.isArray(response) ? response : response?.data || [];
        return raw.map((c: any) => ({
            id: String(c.id),
            name: c.city_name || c.name,
            state_id: c.state_id ? String(c.state_id) : undefined,
        }));
    } catch (error) {
        console.error('Failed to fetch cities:', error);
        return [];
    }
}
